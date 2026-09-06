import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Doctor, Visit, Product, UserProfile, ActiveTab, DailyTask } from '../types';
import { DailyTasksSection } from './DailyTasksSection';
import {
  Sparkles,
  MapPin,
  Stethoscope,
  Plus,
  CheckCircle2,
  CalendarCheck,
  ClipboardCopy,
  MoreVertical,
  Edit2,
  Trash2,
  UserMinus,
  Gift,
  Search,
  X,
  ExternalLink,
  Clock,
  Check,
  UserPlus,
  ArrowUpDown,
  ListOrdered,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  getCurrentArabicWorkDay,
  getCurrentMonthWeek,
  generateChatGptPrompt,
} from '../utils/planHelper';
import { useBackAction } from '../utils/backNavigation';
import { CustomSelectBottomSheet } from './CustomSelectBottomSheet';
import { ReorderVisitsModal, getClassBadgeClass } from './ReorderVisitsModal';

interface HomeScreenViewProps {
  doctors: Doctor[];
  visits: Visit[];
  products: Product[];
  userProfile: UserProfile;
  todayDoctorIds: string[];
  onAddDoctorToToday: (doctorId: string | string[]) => void;
  onRemoveDoctorFromToday: (doctorId: string) => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onOpenAddVisitForDoctor: (doctor: Doctor) => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctorId: string) => void;
  requestConfirmDelete?: (title: string, message: string, onConfirm: () => void) => void;
  setActiveTab: (tab: ActiveTab) => void;
  showToast: (message: string) => void;
  dailyTasks: DailyTask[];
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearCompletedTasks: () => void;
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  doctors,
  visits,
  products,
  userProfile,
  todayDoctorIds,
  onAddDoctorToToday,
  onRemoveDoctorFromToday,
  onSelectDoctor,
  onOpenAddVisitForDoctor,
  onEditDoctor,
  onDeleteDoctor,
  requestConfirmDelete,
  setActiveTab,
  showToast,
  dailyTasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearCompletedTasks,
}) => {
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [selectedDoctorIdsToAdd, setSelectedDoctorIdsToAdd] = useState<string[]>([]);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [activeMenuDoctorId, setActiveMenuDoctorId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortMode, setSortMode] = useState<'custom' | 'status' | 'name' | 'class' | 'territory' | 'time'>('custom');

  // Dedicated Reorder Visits Modal state
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Accordion drop-down expanded state for doctor cards
  const [expandedDoctorIds, setExpandedDoctorIds] = useState<Record<string, boolean>>({});

  const toggleDoctorExpanded = (doctorId: string) => {
    setExpandedDoctorIds((prev) => ({
      ...prev,
      [doctorId]: !prev[doctorId],
    }));
  };

  // Custom manual ordering IDs persisted locally per day
  const [customOrderIds, setCustomOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dm_today_custom_order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCustomOrder = (newOrder: string[]) => {
    setCustomOrderIds(newOrder);
    localStorage.setItem('dm_today_custom_order', JSON.stringify(newOrder));
  };

  // -------------------------------------------------------------
  // Precise Back Button Navigation (No exit confirmation prompt at root)
  // -------------------------------------------------------------
  // 1. If Reorder modal is open -> close it
  useBackAction(isReorderModalOpen, 'home-reorder-modal', () => {
    setIsReorderModalOpen(false);
  });

  // 2. If any doctor card is expanded -> collapse open cards (keeps scroll position intact!)
  const hasExpandedDoctors = Object.values(expandedDoctorIds).some(Boolean);
  useBackAction(hasExpandedDoctors, 'home-expanded-cards', () => {
    setExpandedDoctorIds({});
  });

  // 3. If context menu is open -> close it
  useBackAction(Boolean(activeMenuDoctorId), 'home-context-menu', () => {
    setActiveMenuDoctorId(null);
  });

  // 4. If Add Doctor modal is open -> close it
  useBackAction(showAddDoctorModal, 'home-add-doctor-modal', () => {
    setShowAddDoctorModal(false);
  });

  const currentWorkDay = getCurrentArabicWorkDay();
  const currentWeek = getCurrentMonthWeek();
  const todayStr = new Date().toISOString().split('T')[0];

  // Determine list of doctors scheduled for today:
  // 1. Doctors whose planDay and planWeeks match today
  // 2. Doctors explicitly added to todayDoctorIds
  const scheduledDoctors = doctors.filter((doc) => {
    // If explicitly added for today
    if ((todayDoctorIds || []).includes(doc.id)) return true;

    // Or planned according to planDay & planWeeks
    if (currentWorkDay && doc.planDay === currentWorkDay) {
      if (!doc.planWeeks || doc.planWeeks.length === 0) return true;
      return (doc.planWeeks || []).includes(currentWeek);
    }

    return false;
  });

  // Calculate visits done today
  const todayVisits = useMemo(() => visits.filter((v) => v.date === todayStr), [visits, todayStr]);
  const visitedDoctorIdsArray = useMemo(() => todayVisits.map((v) => v.doctorId), [todayVisits]);
  const visitedDoctorIdsToday = useMemo(() => new Set(visitedDoctorIdsArray), [visitedDoctorIdsArray]);

  const totalCount = scheduledDoctors.length;
  const completedCount = scheduledDoctors.filter((doc) => visitedDoctorIdsToday.has(doc.id)).length;
  const pendingCount = Math.max(0, totalCount - completedCount);
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  // Filtered and sorted doctors based on active filterMode and sortMode
  const displayedDoctors = [...scheduledDoctors]
    .filter((doc) => {
      const isVisited = visitedDoctorIdsToday.has(doc.id);
      if (filterMode === 'pending') return !isVisited;
      if (filterMode === 'completed') return isVisited;
      return true;
    })
    .sort((a, b) => {
      // 1. If sortMode is custom manual arrangement
      if (sortMode === 'custom') {
        const aVisited = visitedDoctorIdsToday.has(a.id);
        const bVisited = visitedDoctorIdsToday.has(b.id);
        // Completed visits always gracefully sit at the bottom in 'all' mode
        if (filterMode === 'all' && aVisited !== bVisited) {
          return aVisited ? 1 : -1;
        }

        const idxA = customOrderIds.indexOf(a.id);
        const idxB = customOrderIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      }

      // 2. Automated Sorting rules selected by user
      if (sortMode === 'status') {
        const aVisited = visitedDoctorIdsToday.has(a.id);
        const bVisited = visitedDoctorIdsToday.has(b.id);
        if (aVisited !== bVisited) {
          return aVisited ? 1 : -1; // Unvisited first at top, visited dropped to bottom
        }
      } else if (sortMode === 'name') {
        const cmp = a.name.localeCompare(b.name, 'ar');
        if (cmp !== 0) return cmp;
      } else if (sortMode === 'class') {
        const getClassWeight = (cls?: string) => {
          if (!cls) return 0;
          const c = cls.trim().toUpperCase();
          if (c === 'A+' || c.includes('VIP') || c.includes('*')) return 100;
          if (c === 'A' || c.startsWith('A')) return 80;
          if (c === 'B' || c.startsWith('B')) return 60;
          if (c === 'C' || c.startsWith('C')) return 40;
          return 20;
        };
        const weightDiff = getClassWeight(b.classification) - getClassWeight(a.classification);
        if (weightDiff !== 0) return weightDiff;
      } else if (sortMode === 'territory') {
        const cmp = (a.territory || '').localeCompare(b.territory || '', 'ar');
        if (cmp !== 0) return cmp;
      } else if (sortMode === 'time') {
        const timeA = a.bestVisitTime || '99:99';
        const timeB = b.bestVisitTime || '99:99';
        const cmp = timeA.localeCompare(timeB);
        if (cmp !== 0) return cmp;
      }

      // Secondary fallback: if sortMode is not 'status', still keep unvisited on top when filterMode is 'all'
      const aVisited = visitedDoctorIdsToday.has(a.id);
      const bVisited = visitedDoctorIdsToday.has(b.id);
      if (aVisited !== bVisited) {
        return aVisited ? 1 : -1;
      }

      return 0;
    });

  // Reorder helper when a doctor is moved up or down or dropped
  const handleMoveDoctorOrder = (doctorId: string, direction: 'up' | 'down') => {
    setSortMode('custom');
    const currentList = displayedDoctors.map((d) => d.id);
    const fromIndex = currentList.indexOf(doctorId);
    if (fromIndex === -1) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentList.length) return;

    const updated = [...currentList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Merge with full scheduled list to keep all doctor IDs
    const allIds = scheduledDoctors.map((d) => d.id);
    const finalOrder = [
      ...updated,
      ...allIds.filter((id) => !updated.includes(id)),
    ];
    saveCustomOrder(finalOrder);
    showToast('تم تحديث ترتيب الطبيب بنجاح! ↕️');
  };

  // Handle ChatGPT prompt copy
  const handleCopyPrompt = async (doctor: Doctor, e: React.MouseEvent) => {
    e.stopPropagation();
    const docVisits = visits.filter((v) => v.doctorId === doctor.id);
    const promptText = generateChatGptPrompt(doctor, userProfile, products, docVisits);

    try {
      await navigator.clipboard.writeText(promptText);
      showToast(`تم نسخ برومبت ChatGPT للطبيب: ${doctor.name} بنجاح! جاهز للصق 🚀`);
    } catch (err) {
      // Fallback
      showToast('تم تجهيز البرومبت للنسخ.');
    }
  };

  // Doctors available to add to today (not yet in scheduled list)
  const query = (searchDoctorQuery || '').toLowerCase();
  const availableToAdd = doctors.filter(
    (d) =>
      !scheduledDoctors.some((sd) => sd.id === d.id) &&
      ((d.name || '').toLowerCase().includes(query) ||
        (d.territory || '').toLowerCase().includes(query) ||
        (d.specialty || '').toLowerCase().includes(query))
  );

  return (
    <div id="home-screen-container" className="space-y-4 pb-24 max-w-4xl mx-auto px-1">
      {/* 1. Daily Tasks Section (مهام ومتابعات اليوم) */}
      <DailyTasksSection
        tasks={dailyTasks}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onClearCompletedTasks={onClearCompletedTasks}
      />

      {/* 2. Top Status & Daily Summary Card with Filters */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] p-3 sm:p-3.5 shadow-xs space-y-2.5">
        {/* Row 1: Title, Counts, Add Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-black dark:text-[#F5F7FA] truncate">
              زيارات اليوم ({totalCount} أطباء)
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
              {completedCount} من {totalCount} منجزة ({progressPercent}%)
            </span>
          </div>

          <button
            id="btn-add-doctor-today-inline"
            onClick={() => setShowAddDoctorModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
            title="إضافة طبيب لزيارات اليوم"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>إضافة طبيب</span>
          </button>
        </div>

        {/* Row 2: Sorting Selector (Right side in RTL) and Filter Buttons (Left side) */}
        {totalCount > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            {/* Unified Sorting Control (Right side in RTL) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <CustomSelectBottomSheet
                title="ترتيب خطة اليوم"
                value={sortMode}
                onChange={(newMode) => {
                  setSortMode(newMode as any);
                  if (newMode === 'custom' && totalCount > 1) {
                    setIsReorderModalOpen(true);
                  }
                }}
                searchable={false}
                options={[
                  { value: 'custom', label: 'خط سير مخصص', icon: '↕️' },
                  { value: 'territory', label: 'حسب المنطقة', icon: '📍' },
                  { value: 'time', label: 'حسب الموعد', icon: '⏰' },
                  { value: 'status', label: 'المتبقي أولاً', icon: '⏳' },
                  { value: 'class', label: 'حسب الفئة', icon: '⭐' },
                  { value: 'name', label: 'أبجدياً', icon: '🔤' },
                ]}
                buttonClassName="py-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
              />

              {/* زر تعديل المسار اليدوي يظهر فقط عند تفعيل الترتيب المخصص */}
              {sortMode === 'custom' && totalCount > 1 && (
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(true)}
                  className="p-1 rounded-xl bg-[#0a3d62]/10 dark:bg-[#42A5F5]/15 text-[#0a3d62] dark:text-[#42A5F5] hover:bg-[#0a3d62]/20 border border-[#0a3d62]/20 dark:border-[#42A5F5]/30 transition-all cursor-pointer shrink-0"
                  title="تعديل خط السير وترتيب الزيارات يدوياً"
                  aria-label="تعديل خط السير"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Buttons (الكل - المتبقي للزيارة - تمت الزيارة) as segmented tabs (Left side in RTL) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-[#0a3d62] text-white shadow-xs font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
                }`}
              >
                الكل ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('pending')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-amber-800 dark:text-amber-400 hover:text-amber-900'
                }`}
              >
                <span>المتبقي</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[0.7rem] font-black ${
                  filterMode === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300'
                }`}>
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs font-black'
                    : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-900'
                }`}
              >
                <span>تمت</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[0.7rem] font-black ${
                  filterMode === 'completed' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300'
                }`}>
                  {completedCount}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Today's Doctors List */}
      {scheduledDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#0a3d62]/10 border border-[#0a3d62]/20 text-[#0a3d62] flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">لا توجد زيارات مجدولة لليوم حتى الآن</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {currentWorkDay
              ? `لم يتم إضافة أطباء لمنطقة هذا اليوم (${currentWorkDay}) بعد، أو يمكنك اختيار أطباء لزيارتهم اليوم فوراً.`
              : 'اليوم عطلة رسمية (الخميس أو الجمعة). يمكنك إضافة أطباء يدوياً لزيارتهم اليوم.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دكتور لقائمة اليوم</span>
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
            >
              <span>فتح شاشة الأطباء وتخطيط المناطق</span>
            </button>
          </div>
        </div>
      ) : displayedDoctors.length === 0 ? (
        /* Empty State for Filter */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-xs space-y-2">
          {filterMode === 'pending' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">أحسنت صنعاً! 🎉</h3>
              <p className="text-xs text-slate-600">
                تم إكمال جميع زيارات اليوم بنجاح والتغطية 100%! لا يوجد أطباء متبقين.
              </p>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                عرض كل أطباء اليوم
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-1">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">لم تبدأ الزيارات بعد</h3>
              <p className="text-xs text-slate-600">
                لم يتم توثيق أي زيارة اليوم حتى الآن. ابدأ بزيارة أحد الأطباء من قائمة المتبقي!
              </p>
              <button
                type="button"
                onClick={() => setFilterMode('pending')}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0a3d62] text-white text-xs font-bold cursor-pointer"
              >
                عرض الأطباء المتبقين
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedDoctors.map((doctor, index) => {
            const hasVisitedToday = visitedDoctorIdsToday.has(doctor.id);
            const isMenuOpen = activeMenuDoctorId === doctor.id;
            const isExpanded = !!expandedDoctorIds[doctor.id];
            const prevDoctor = index > 0 ? displayedDoctors[index - 1] : null;
            const isFirstCompleted =
              hasVisitedToday && prevDoctor && !visitedDoctorIdsToday.has(prevDoctor.id);

            return (
              <React.Fragment key={doctor.id}>
                {/* فاصل مرئي ذكي ينتقل للزيارات المنجزة في أسفل القائمة */}
                {isFirstCompleted && filterMode === 'all' && (
                  <div className="pt-3 pb-1 flex items-center gap-2">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>الزيارات المنجزة اليوم ({completedCount})</span>
                    </span>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                  </div>
                )}

                <div
                  id={`today-doctor-card-${doctor.id}`}
                  className={`bg-white dark:bg-[#152337] rounded-2xl border transition-all shadow-xs relative overflow-hidden ${
                    hasVisitedToday
                      ? 'border-slate-200 dark:border-[#26384D] bg-slate-50/70 dark:bg-slate-900/40'
                      : 'border-slate-200 dark:border-[#26384D] hover:border-[#0a3d62]/40 shadow-xs'
                  }`}
                >
                  {/* Status Bar Accent */}
                  {hasVisitedToday && (
                    <div className="bg-[#F0FDFA] dark:bg-teal-950/60 text-[#0F766E] dark:text-[#2DD4BF] border-b border-[#99F6E4] dark:border-teal-800/60 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />
                      <span>تم توثيق الزيارة بنجاح اليوم</span>
                    </div>
                  )}

                  {/* Doctor Card Clickable Header Bar */}
                  <div
                    onClick={() => toggleDoctorExpanded(doctor.id)}
                    className="p-3 sm:p-3.5 select-none cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Row 1: Doctor's Name + Quick Action + Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Doctor Name - clear, readable, prominent, doesn't harshly clip */}
                        <h3
                          className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 hover:text-[#0a3d62] dark:hover:text-[#42A5F5] tracking-tight line-clamp-2 leading-snug break-words"
                          title={doctor.name}
                        >
                          {doctor.name}
                        </h3>

                        {/* Classification Badge inline with name if present */}
                        {doctor.classification && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.7rem] sm:text-xs font-black border shrink-0 ${getClassBadgeClass(doctor.classification)}`}>
                            {doctor.classification}
                          </span>
                        )}
                      </div>

                      {/* Right-side: Quick Action Button + 3-dots Menu + Dropdown Chevron */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Direct One-Click Visit Logging Button */}
                        {!hasVisitedToday ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddVisitForDoctor(doctor);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                            title="تسجيل وتوثيق الزيارة فوراً"
                          >
                            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>تسجيل</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddVisitForDoctor(doctor);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[34px] rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                            title="تمت الزيارة اليوم - انقر للتعديل"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>تمت ✓</span>
                          </button>
                        )}

                        {/* Context Menu Button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuDoctorId(isMenuOpen ? null : doctor.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="خيارات إضافية"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 text-xs font-semibold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  setIsReorderModalOpen(true);
                                }}
                                className="w-full text-right px-3 py-2 text-[#0a3d62] dark:text-[#42A5F5] hover:bg-sky-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer font-bold border-b border-slate-100 dark:border-slate-700"
                              >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>ترتيب خط السير ⇅</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  handleMoveDoctorOrder(doctor.id, 'up');
                                }}
                                disabled={index === 0}
                                className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                <span>نقل للأعلى ⬆️</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  handleMoveDoctorOrder(doctor.id, 'down');
                                }}
                                disabled={index === displayedDoctors.length - 1}
                                className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-b border-slate-100 dark:border-slate-700"
                              >
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                <span>نقل للأسفل ⬇️</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  onEditDoctor(doctor);
                                }}
                                className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>تعديل بيانات الطبيب</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  onRemoveDoctorFromToday(doctor.id);
                                  showToast(`تمت إزالة ${doctor.name} من زيارات اليوم.`);
                                }}
                                className="w-full text-right px-3 py-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                                <span>إزالة من زيارات اليوم</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuDoctorId(null);
                                  if (requestConfirmDelete) {
                                    requestConfirmDelete(
                                      'حذف الطبيب نهائياً',
                                      `هل أنت متأكد من حذف الطبيب "${doctor.name}" نهائياً من قاعدة البيانات؟`,
                                      () => {
                                        onDeleteDoctor(doctor.id);
                                        showToast(`تم حذف الطبيب بنجاح.`);
                                      }
                                    );
                                  } else {
                                    onDeleteDoctor(doctor.id);
                                    showToast(`تم حذف الطبيب بنجاح.`);
                                  }
                                }}
                                className="w-full text-right px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>حذف الطبيب نهائياً</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Chevron Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleDoctorExpanded(doctor.id)}
                          className={`p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform duration-200 cursor-pointer ${
                            isExpanded ? 'rotate-180 text-[#0a3d62] dark:text-[#42A5F5]' : ''
                          }`}
                          title={isExpanded ? 'طي التفاصيل' : 'فتح تفاصيل الطبيب'}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Specialty + Territory + Samples Preference (Clean Single Line on Mobile) */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
                      {/* 🩺 Specialty (التخصص) */}
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0a3d62] dark:text-[#60a5fa] bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/80 dark:border-sky-800/60 text-xs">
                        <Stethoscope className="w-3 h-3 text-[#0a3d62] dark:text-[#60a5fa] shrink-0" />
                        <span>{doctor.specialty}</span>
                      </span>

                      {/* 📍 Territory (المنطقة) */}
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 text-xs">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{doctor.territory}</span>
                      </span>

                      {/* 🎁 Samples Preference */}
                      {doctor.lovesSamples && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                          <Gift className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>عينات</span>
                        </span>
                      )}

                      {/* ⏰ Best Visit Time if available */}
                      {doctor.bestVisitTime && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{doctor.bestVisitTime}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Section: Visible when expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                      {/* Extra details: Hospital, Address, Best time, Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {doctor.hospitalOrClinic && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-slate-200">🏥 المستشفى / العيادة:</span>
                            <span className="truncate">{doctor.hospitalOrClinic}</span>
                          </div>
                        )}
                        {doctor.address && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-slate-200">📍 العنوان بالتفصيل:</span>
                            <span className="truncate">{doctor.address}</span>
                          </div>
                        )}
                        {doctor.bestVisitTime && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-slate-200">⏰ أفضل موعد للزيارة:</span>
                            <span>{doctor.bestVisitTime}</span>
                          </div>
                        )}
                        {doctor.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-slate-200">📞 الهاتف:</span>
                            <a
                              href={`tel:${doctor.phone}`}
                              className="text-[#0a3d62] dark:text-[#42A5F5] font-semibold hover:underline"
                              dir="ltr"
                            >
                              {doctor.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Targeted Products */}
                      {doctor.targetProductIds && doctor.targetProductIds.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">💊 الأدوية المستهدفة:</span>
                          {doctor.targetProductIds.map((pid) => {
                            const prod = products.find((p) => p.id === pid);
                            return prod ? (
                              <span
                                key={pid}
                                className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                              >
                                {prod.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      {/* Previous Visit Note / Summary */}
                      {(doctor.lastVisitNote || doctor.notes) && (
                        <div className="bg-[#EAF0F6] dark:bg-[#1A283B] border border-[#E2E8F0] dark:border-[#26384D] rounded-xl p-2.5 text-xs text-[#1E293B] dark:text-slate-200">
                          <span className="font-bold text-[#0F172A] dark:text-white ml-1">آخر متابعة:</span>
                          <span>{doctor.lastVisitNote || doctor.notes}</span>
                        </div>
                      )}

                      {/* Power Action Buttons */}
                      <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Button 1: Copy ChatGPT Prompt */}
                        <button
                          id={`btn-copy-prompt-${doctor.id}`}
                          onClick={(e) => handleCopyPrompt(doctor, e)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#EAF0F6] hover:bg-[#dce5ee] dark:bg-[#1B2A3D] text-[#1E293B] dark:text-[#F5F7FA] text-xs font-bold border border-[#E2E8F0] dark:border-[#26384D] transition-all cursor-pointer active:scale-98"
                          title="نسخ برومبت تجهيز الزيارة والمتابعة لـ ChatGPT"
                        >
                          <ClipboardCopy className="w-4 h-4 text-[#0A3D62] dark:text-[#42A5F5]" />
                          <span>📋 نسخ برومبت ChatGPT</span>
                        </button>

                        {/* Button 2: Log Visit & Follow-up */}
                        <button
                          id={`btn-log-visit-${doctor.id}`}
                          onClick={() => onOpenAddVisitForDoctor(doctor)}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-98 ${
                            hasVisitedToday
                              ? 'bg-[#EAF0F6] hover:bg-[#dce5ee] dark:bg-[#1B2A3D] text-[#1E293B] dark:text-[#F5F7FA] border border-[#E2E8F0] dark:border-[#26384D]'
                              : 'bg-[#0A3D62] hover:bg-[#083150] text-white'
                          }`}
                          title="توثيق ما تم في الزيارة والملاحظات"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          <span>{hasVisitedToday ? 'تعديل توثيق الزيارة' : '✍️ تسجيل الزيارة والمتابعة'}</span>
                        </button>
                      </div>

                      {/* Full Profile Link */}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onSelectDoctor(doctor)}
                          className="text-[11px] font-bold text-[#0a3d62] dark:text-[#42A5F5] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض الملف وسجل الزيارات بالكامل 📂</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Modal: Add Doctor(s) to Today's Schedule */}
      {showAddDoctorModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => {
            setShowAddDoctorModal(false);
            setSelectedDoctorIdsToAdd([]);
          }}
        >
          <div
            className="bg-white dark:bg-[#152238] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-700/80 max-h-[88vh] flex flex-col transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  إضافة أطباء لجدول اليوم
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  حدد طبيباً واحداً أو مجموعة أطباء لإضافتهم دفعة واحدة لزياراتك
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddDoctorModal(false);
                  setSelectedDoctorIdsToAdd([]);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Selection Bar */}
            <div className="py-3 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، المنطقة، أو التخصص..."
                  value={searchDoctorQuery}
                  onChange={(e) => setSearchDoctorQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0a3d62] dark:focus:ring-sky-500"
                />
              </div>

              {availableToAdd.length > 0 && (
                <div className="flex items-center justify-between px-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        selectedDoctorIdsToAdd.length === availableToAdd.length &&
                        availableToAdd.length > 0
                      ) {
                        setSelectedDoctorIdsToAdd([]);
                      } else {
                        setSelectedDoctorIdsToAdd(availableToAdd.map((d) => d.id));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-[#0a3d62] dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <span>
                      {selectedDoctorIdsToAdd.length === availableToAdd.length &&
                      availableToAdd.length > 0
                        ? 'إلغاء تحديد الكل'
                        : `تحديد الكل (${availableToAdd.length})`}
                    </span>
                  </button>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    تم تحديد {selectedDoctorIdsToAdd.length} من {availableToAdd.length}
                  </span>
                </div>
              )}
            </div>

            {/* List of Available Doctors */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-0.5 max-h-[50vh]">
              {availableToAdd.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  {searchDoctorQuery
                    ? 'لم يتم العثور على أطباء يطابقون البحث.'
                    : 'جميع أطبائك المسجلين مضافون بالفعل لجدول اليوم!'}
                </div>
              ) : (
                availableToAdd.map((doc) => {
                  const isSelected = selectedDoctorIdsToAdd.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorIdsToAdd((prev) =>
                          prev.includes(doc.id)
                            ? prev.filter((id) => id !== doc.id)
                            : [...prev, doc.id]
                        );
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#0a3d62] dark:border-sky-500 bg-[#0a3d62]/5 dark:bg-sky-500/10 ring-1 ring-[#0a3d62]/30 dark:ring-sky-500/30'
                          : 'border-slate-200/80 dark:border-slate-700/80 hover:border-[#0a3d62]/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox indicator */}
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0a3d62] dark:bg-sky-600 border-[#0a3d62] dark:border-sky-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {doc.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {doc.classification}
                            </span>
                            {doc.lovesSamples && (
                              <span className="text-[10px] text-[#0A3D62] dark:text-indigo-400 font-black">
                                🎁 عينات
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {doc.specialty} • {doc.territory}
                          </p>
                        </div>
                      </div>

                      {/* Quick Single Add Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddDoctorToToday(doc.id);
                          showToast(`تمت إضافة ${doc.name} إلى زيارات اليوم!`);
                          setSelectedDoctorIdsToAdd((prev) =>
                            prev.filter((id) => id !== doc.id)
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0a3d62] hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold shrink-0 transition-all cursor-pointer"
                        title="إضافة فورية لهذا الطبيب وحده"
                      >
                        + إضافة
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddDoctorModal(false);
                  setSelectedDoctorIdsToAdd([]);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                إغلاق
              </button>

              <button
                type="button"
                disabled={selectedDoctorIdsToAdd.length === 0}
                onClick={() => {
                  if (selectedDoctorIdsToAdd.length > 0) {
                    onAddDoctorToToday(selectedDoctorIdsToAdd);
                    setSelectedDoctorIdsToAdd([]);
                    setShowAddDoctorModal(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  selectedDoctorIdsToAdd.length > 0
                    ? 'bg-[#0a3d62] hover:bg-[#083150] text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {selectedDoctorIdsToAdd.length > 0
                    ? `إضافة الأطباء المحددين (${selectedDoctorIdsToAdd.length})`
                    : 'حدد أطباء للإضافة'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Visits Modal */}
      <ReorderVisitsModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        doctors={scheduledDoctors}
        visitedDoctorIds={visitedDoctorIdsToday}
        onSaveOrder={(newOrderIds) => {
          saveCustomOrder(newOrderIds);
          setSortMode('custom');
          showToast('تم حفظ خط السير الجديد بنجاح! ↕️');
        }}
      />
    </div>
  );
};
