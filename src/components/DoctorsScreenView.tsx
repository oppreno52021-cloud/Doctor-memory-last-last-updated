import React, { useState, useMemo, useRef } from 'react';
import { Doctor, Product, WorkDay, MonthWeek } from '../types';
import {
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  MapPin,
  Stethoscope,
  Gift,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Check,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  downloadDoctorsExcelTemplate,
  parseDoctorsFile,
} from '../utils/planHelper';
import { useBackAction } from '../utils/backNavigation';
import { CustomSelectBottomSheet } from './CustomSelectBottomSheet';

interface DoctorsScreenViewProps {
  doctors: Doctor[];
  products: Product[];
  onSelectDoctor: (doctor: Doctor) => void;
  onOpenAddDoctor: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctorId: string) => void;
  requestConfirmDelete?: (title: string, message: string, onConfirm: () => void) => void;
  onImportDoctors: (newDoctors: Doctor[]) => void;
  onUpdateDoctorPlan: (doctorId: string, planDay?: WorkDay, planWeeks?: MonthWeek[]) => void;
  onBulkUpdateAreaPlan: (area: string, doctorIds: string[], planDay: WorkDay, planWeeks: MonthWeek[]) => void;
  onBulkDeleteDoctors?: (doctorIds: string[]) => void;
  onBulkUpdateDoctors?: (doctorIds: string[], updates: Partial<Doctor>) => void;
  showToast: (message: string) => void;
}

export const DoctorsScreenView: React.FC<DoctorsScreenViewProps> = ({
  doctors,
  products,
  onSelectDoctor,
  onOpenAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  requestConfirmDelete,
  onImportDoctors,
  onUpdateDoctorPlan,
  onBulkUpdateAreaPlan,
  onBulkDeleteDoctors,
  onBulkUpdateDoctors,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('الكل');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('الكل');
  const [selectedClass, setSelectedClass] = useState<string>('الكل');
  const [onlyLovesSamples, setOnlyLovesSamples] = useState<boolean>(false);

  // Multi-selection state
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [showBulkAssignDayModal, setShowBulkAssignDayModal] = useState<boolean>(false);
  const [assignDayChoice, setAssignDayChoice] = useState<WorkDay>('السبت');
  const [assignWeeksChoice, setAssignWeeksChoice] = useState<MonthWeek[]>([1, 2, 3, 4]);

  // Modals state
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBulkPlanModal, setShowBulkPlanModal] = useState(false);
  const [singlePlanDoctor, setSinglePlanDoctor] = useState<Doctor | null>(null);

  // Back button listeners for Doctors screen modals
  useBackAction(showExcelModal, 'doctors-excel-modal', () => {
    setShowExcelModal(false);
    setParsedDoctors([]);
    setParseError(null);
  });

  useBackAction(showBulkPlanModal, 'doctors-bulk-plan-modal', () => {
    setShowBulkPlanModal(false);
  });

  useBackAction(showBulkAssignDayModal, 'doctors-bulk-assign-modal', () => {
    setShowBulkAssignDayModal(false);
  });

  useBackAction(Boolean(singlePlanDoctor), 'doctors-single-plan-modal', () => {
    setSinglePlanDoctor(null);
  });

  // Excel import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedDoctors, setParsedDoctors] = useState<Doctor[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Bulk Planning State (Method 1)
  const [bulkArea, setBulkArea] = useState<string>('');
  const [bulkDay, setBulkDay] = useState<WorkDay>('السبت');
  const [bulkWeeks, setBulkWeeks] = useState<MonthWeek[]>([1, 2, 3, 4]);
  const [bulkSelectedDocIds, setBulkSelectedDocIds] = useState<string[]>([]);

  // Distinct areas
  const areas = useMemo(() => {
    const list = Array.from(new Set(doctors.map((d) => d.territory).filter((t): t is string => Boolean(t))));
    return ['الكل', ...list];
  }, [doctors]);

  // Distinct specialties
  const specialties = useMemo(() => {
    const list: string[] = Array.from(new Set<string>(doctors.map((d) => d.specialty).filter((s): s is string => Boolean(s))));
    return ['الكل', ...list.sort((a: string, b: string) => a.localeCompare(b, 'ar'))];
  }, [doctors]);

  // Distinct classes derived dynamically from doctors in database
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.classification && d.classification.trim()) {
        set.add(d.classification.trim());
      }
    });
    if (set.size === 0) {
      return ['الكل', 'A+', 'A', 'B', 'C'];
    }
    const standardOrder = ['A+', 'A', 'B', 'C'];
    const standard = standardOrder.filter((c) => set.has(c));
    const custom = Array.from(set).filter((c) => !standardOrder.includes(c)).sort();
    return ['الكل', ...standard, ...custom];
  }, [doctors]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArea = selectedArea === 'الكل' || doc.territory === selectedArea;
      const matchesSpecialty = selectedSpecialty === 'الكل' || doc.specialty === selectedSpecialty;
      const matchesClass = selectedClass === 'الكل' || doc.classification === selectedClass;
      const matchesSamples = !onlyLovesSamples || doc.lovesSamples;

      return matchesSearch && matchesArea && matchesSpecialty && matchesClass && matchesSamples;
    });
  }, [doctors, searchQuery, selectedArea, selectedSpecialty, selectedClass, onlyLovesSamples]);

  // Multi-select handlers
  const handleToggleSelectDoctor = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (filteredDoctors.length === 0) return;
    if (selectedDoctorIds.length === filteredDoctors.length) {
      setSelectedDoctorIds([]);
    } else {
      setSelectedDoctorIds(filteredDoctors.map((d) => d.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedDoctorIds([]);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedDoctorIds.length === 0) return;
    const count = selectedDoctorIds.length;
    if (requestConfirmDelete) {
      requestConfirmDelete(
        `حذف ${count} أطباء نهائياً`,
        `هل أنت متأكد من حذف عدد ${count} أطباء تم تحديدهم؟ سيتم حذفهم من النظام نهائياً ولا يمكن التراجع.`,
        () => {
          if (onBulkDeleteDoctors) {
            onBulkDeleteDoctors(selectedDoctorIds);
          } else {
            selectedDoctorIds.forEach((id) => onDeleteDoctor(id));
          }
          setSelectedDoctorIds([]);
          showToast(`تم حذف ${count} أطباء بنجاح.`);
        }
      );
    } else {
      if (onBulkDeleteDoctors) {
        onBulkDeleteDoctors(selectedDoctorIds);
      } else {
        selectedDoctorIds.forEach((id) => onDeleteDoctor(id));
      }
      setSelectedDoctorIds([]);
      showToast(`تم حذف ${count} أطباء.`);
    }
  };

  // Bulk Assign Day
  const handleConfirmBulkAssignDay = () => {
    if (selectedDoctorIds.length === 0) return;
    const count = selectedDoctorIds.length;
    if (onBulkUpdateDoctors) {
      onBulkUpdateDoctors(selectedDoctorIds, {
        planDay: assignDayChoice,
        planWeeks: assignWeeksChoice,
      });
    } else {
      selectedDoctorIds.forEach((id) => {
        onUpdateDoctorPlan(id, assignDayChoice, assignWeeksChoice);
      });
    }
    setShowBulkAssignDayModal(false);
    showToast(`تم تعيين يوم (${assignDayChoice}) لـ ${count} أطباء بنجاح! 📅`);
    setSelectedDoctorIds([]);
  };

  // Bulk Samples Lovers
  const handleBulkToggleSamplesLovers = (loves: boolean) => {
    if (selectedDoctorIds.length === 0) return;
    const count = selectedDoctorIds.length;
    if (onBulkUpdateDoctors) {
      onBulkUpdateDoctors(selectedDoctorIds, { lovesSamples: loves });
    }
    showToast(
      loves
        ? `تمت إضافة ${count} أطباء إلى محبي العينات! 🎁`
        : `تمت إزالة صفة محبي العينات عن ${count} أطباء.`
    );
    setSelectedDoctorIds([]);
  };

  // Open Bulk Plan Modal initialized for current area
  const handleOpenBulkPlan = () => {
    const defaultArea = selectedArea !== 'الكل' ? selectedArea : areas[1] || '';
    setBulkArea(defaultArea);
    const docsInArea = doctors.filter((d) => d.territory === defaultArea);
    setBulkSelectedDocIds(docsInArea.map((d) => d.id));
    setShowBulkPlanModal(true);
  };

  // When bulk area changes in modal
  const handleBulkAreaChange = (newArea: string) => {
    setBulkArea(newArea);
    const docsInArea = doctors.filter((d) => d.territory === newArea);
    setBulkSelectedDocIds(docsInArea.map((d) => d.id));
  };

  // Toggle week in bulk modal
  const toggleBulkWeek = (week: MonthWeek) => {
    setBulkWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week].sort()
    );
  };

  // Save Bulk Plan
  const handleSaveBulkPlan = () => {
    if (!bulkArea) {
      alert('يرجى اختيار المنطقة');
      return;
    }
    if (bulkSelectedDocIds.length === 0) {
      alert('يرجى تحديد طبيب واحد على الأقل');
      return;
    }
    if (bulkWeeks.length === 0) {
      alert('يرجى اختيار أسبوع واحد على الأقل في الشهر');
      return;
    }

    onBulkUpdateAreaPlan(bulkArea, bulkSelectedDocIds, bulkDay, bulkWeeks);
    setShowBulkPlanModal(false);
    showToast(
      `تم تخطيط ${bulkSelectedDocIds.length} أطباء في منطقة "${bulkArea}" ليوم ${bulkDay} بنجاح! 🎯`
    );
  };

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = await parseDoctorsFile(file);
      if (parsed.length === 0) {
        setParseError('لم يتم العثور على أطباء في الملف المرفوع. يرجى التحقق من الملف.');
      } else {
        setParsedDoctors(parsed as Doctor[]);
      }
    } catch (err) {
      setParseError('حدث خطأ أثناء قراءة الملف. يرجى التأكد من صيغة الملف (.xlsx, .csv).');
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm Excel Import
  const handleConfirmImport = () => {
    if (parsedDoctors.length === 0) return;
    onImportDoctors(parsedDoctors);
    setShowExcelModal(false);
    setParsedDoctors([]);
    showToast(`تم استيراد ${parsedDoctors.length} طبيباً بنجاح إلى قاعدة بياناتك! 🚀`);
  };

  return (
    <div id="doctors-screen-container" className="space-y-4 pb-24 max-w-4xl mx-auto px-1">
      {/* Top Action Bar (Mobile-optimized layout) */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Row 1: Title and Main Add Doctor Button */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-black dark:text-[#F5F7FA] tracking-tight">
              دليل وتخطيط الأطباء
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {doctors.length} طبيب بقاعدتك
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Upload Excel / CSV */}
            <button
              id="btn-upload-excel"
              onClick={() => setShowExcelModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="رفع ملف إكسيل أو CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0a3d62] dark:text-[#42A5F5]" />
              <span className="hidden xs:inline">إكسيل</span>
            </button>

            {/* 2. Bulk Area Planning */}
            <button
              id="btn-bulk-plan-area"
              onClick={handleOpenBulkPlan}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-[#0a3d62] dark:text-[#42A5F5] border border-sky-200/80 dark:border-sky-800/60 text-xs font-bold transition-all cursor-pointer"
              title="تخطيط أطباء المنطقة دفعة واحدة"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">تخطيط منطقة</span>
            </button>

            {/* 3. Primary Add Doctor Button */}
            <button
              id="btn-add-doctor-screen"
              onClick={onOpenAddDoctor}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
              title="إضافة طبيب جديد يدوياً"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>طبيب جديد</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            id="input-search-doctors"
            type="text"
            placeholder="ابحث بالاسم، التخصص، أو المنطقة الجغرافية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-black dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0a3d62]"
          />
        </div>

        {/* Filter Controls Row (Responsive columns adapting to font size) */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Area Filter */}
          <div>
            <CustomSelectBottomSheet
              title="تصفية حسب المنطقة"
              value={selectedArea}
              onChange={setSelectedArea}
              options={areas.map((area) => ({
                value: area,
                label: area === 'الكل' ? 'كل المناطق' : area,
                icon: '📍',
              }))}
              buttonClassName="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-black dark:text-slate-100"
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <CustomSelectBottomSheet
              title="تصفية حسب التخصص"
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              options={specialties.map((spec) => ({
                value: spec,
                label: spec === 'الكل' ? 'كل التخصصات' : spec,
                icon: '🩺',
              }))}
              buttonClassName="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-black dark:text-slate-100"
            />
          </div>

          {/* Loves Samples Toggle Filter */}
          <div className="col-span-1 min-[380px]:col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => setOnlyLovesSamples(!onlyLovesSamples)}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[38px] ${
                onlyLovesSamples
                  ? 'bg-[#0A3D62] text-white border-[#0A3D62] shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Gift className={`w-3.5 h-3.5 shrink-0 ${onlyLovesSamples ? 'text-white' : 'text-[#0A3D62] dark:text-[#42A5F5]'}`} />
              <span className="truncate">{onlyLovesSamples ? 'محبي العينات فقط ✓' : 'محبي العينات 🎁'}</span>
            </button>
          </div>
        </div>

        {/* Class Chips Row (Dynamic based on existing doctors) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 ml-1 shrink-0">الفئة:</span>
          {availableClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedClass === cls
                  ? 'bg-[#0a3d62] text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cls === 'الكل' ? 'الكل' : `فئة ${cls}`}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-auto whitespace-nowrap shrink-0">
            {filteredDoctors.length} من {doctors.length}
          </span>
        </div>
      </div>

      {/* Doctors Cards List */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] p-8 text-center shadow-xs">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-black dark:text-[#F5F7FA]">لا يوجد أطباء مطابقين لشروط البحث</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4">
            جرب تغيير الفلاتر المحددة أو اضغط زر إضافة طبيب جديد
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedArea('الكل');
              setSelectedSpecialty('الكل');
              setSelectedClass('الكل');
              setOnlyLovesSamples(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-black dark:text-slate-100 text-xs font-bold cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All / Multi-Select Bar */}
          <div className="bg-white dark:bg-[#152337] rounded-2xl px-3.5 py-2.5 border border-slate-200 dark:border-[#26384D] flex items-center justify-between gap-2 shadow-xs">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none font-bold text-black dark:text-slate-200 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={
                  filteredDoctors.length > 0 &&
                  selectedDoctorIds.length === filteredDoctors.length
                }
                onChange={handleSelectAllFiltered}
                className="w-4 h-4 rounded text-[#0a3d62] focus:ring-[#0a3d62] border-slate-300 cursor-pointer accent-[#0a3d62]"
              />
              <span>
                {selectedDoctorIds.length > 0
                  ? `تم تحديد ${selectedDoctorIds.length} من ${filteredDoctors.length} دكتور`
                  : `تحديد الكل (${filteredDoctors.length} دكتور)`}
              </span>
            </label>

            {selectedDoctorIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                إلغاء التحديد
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredDoctors.map((doctor) => {
              const isSelected = selectedDoctorIds.includes(doctor.id);
              const classColor =
                doctor.classification === 'A+'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : doctor.classification === 'A'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : doctor.classification === 'B'
                  ? 'bg-sky-50 text-sky-900 border-sky-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300';

              const isPlanned = Boolean(doctor.planDay);

              return (
                <div
                  key={doctor.id}
                  id={`doctor-card-${doctor.id}`}
                  onClick={() => onSelectDoctor(doctor)}
                  className={`bg-white dark:bg-[#152337] rounded-2xl border p-4 shadow-xs transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#0a3d62] ring-2 ring-[#0a3d62]/20 bg-[#0a3d62]/5'
                      : 'border-slate-200 dark:border-[#26384D] hover:border-[#0a3d62]/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Checkbox + Doctor Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        onClick={(e) => handleToggleSelectDoctor(doctor.id, e)}
                        className="pt-0.5 cursor-pointer shrink-0"
                        title={isSelected ? 'إلغاء التحديد' : 'تحديد الطبيب'}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#0a3d62] focus:ring-[#0a3d62] border-slate-300 cursor-pointer accent-[#0a3d62]"
                        />
                      </div>

                      {/* Doctor Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-black dark:text-[#F5F7FA] hover:text-[#0a3d62] dark:hover:text-[#42A5F5] line-clamp-2 leading-snug break-words">
                            {doctor.name}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${classColor}`}>
                            فئة {doctor.classification}
                          </span>
                          {doctor.lovesSamples && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-[#0A3D62]/8 dark:bg-[#1976D2]/20 text-[#0A3D62] dark:text-[#42A5F5] border border-[#0A3D62]/15 dark:border-[#42A5F5]/30">
                              <Gift className="w-3.5 h-3.5 text-[#0A3D62] dark:text-[#42A5F5] shrink-0" />
                              <span>محب للعينات 🎁</span>
                            </span>
                          )}
                        </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#0a3d62] dark:text-[#42A5F5] font-bold">{doctor.specialty}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {doctor.territory}
                      </span>
                    </p>

                    {/* Plan Status Pill */}
                    <div className="pt-0.5">
                      {isPlanned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            مجدول بالخطة: يوم {doctor.planDay} (أسابيع:{' '}
                            {doctor.planWeeks && doctor.planWeeks.length > 0
                              ? doctor.planWeeks.join('، ')
                              : 'كل الأسابيع'}
                            )
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>⚠️ غير مضاف للخطة بعد</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions for this doctor */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSinglePlanDoctor(doctor)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                      title="تعديل يوم وأسابيع الطبيب بالخطة"
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>تعيين بالخطة</span>
                    </button>

                    <button
                      onClick={() => onEditDoctor(doctor)}
                      className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-slate-100 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="تعديل بيانات الطبيب"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>

                    <button
                      onClick={() => {
                        if (requestConfirmDelete) {
                          requestConfirmDelete(
                            'حذف الطبيب',
                            `هل تريد حذف الطبيب "${doctor.name}" نهائياً من قاعدة البيانات؟`,
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
                      className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                      title="حذف الطبيب"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Modal 1: Bulk Area Planning (Method 1) */}
      {showBulkPlanModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBulkPlanModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    تخطيط أطباء المنطقة (البلان السريع)
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعيين يوم الزيارة والأسابيع لكل أطباء المنطقة بضغطة واحدة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkPlanModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
              {/* Step 1: Area Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. اختر المنطقة المستهدفة:
                </label>
                <CustomSelectBottomSheet
                  title="اختر المنطقة المستهدفة"
                  value={bulkArea}
                  onChange={handleBulkAreaChange}
                  options={areas
                    .filter((a) => a !== 'الكل')
                    .map((area) => ({
                      value: area,
                      label: area,
                      badge: `${doctors.filter((d) => d.territory === area).length} طبيب`,
                      icon: '📍',
                    }))}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
                />
              </div>

              {/* Step 2: Choose Workday (Sat - Wed) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. اختر يوم العمل المعتمد للمنطقة (من السبت للأربعاء):
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] as WorkDay[]).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setBulkDay(day)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        bulkDay === day
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Choose Weeks */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    3. حدد أسابيع الزيارة في الشهر:
                  </label>
                  <button
                    type="button"
                    onClick={() => setBulkWeeks([1, 2, 3, 4])}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    تحديد كل الأسابيع
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as MonthWeek[]).map((week) => (
                    <button
                      key={week}
                      type="button"
                      onClick={() => toggleBulkWeek(week)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        bulkWeeks.includes(week)
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${bulkWeeks.includes(week) ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <span>أسبوع {week}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Doctors of this area checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    4. أطباء منطقة "{bulkArea}":
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const docsInArea = doctors.filter((d) => d.territory === bulkArea);
                      if (bulkSelectedDocIds.length === docsInArea.length) {
                        setBulkSelectedDocIds([]);
                      } else {
                        setBulkSelectedDocIds(docsInArea.map((d) => d.id));
                      }
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    تحديد / إلغاء تحديد الكل
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {doctors
                    .filter((d) => d.territory === bulkArea)
                    .map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedDocIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelectedDocIds((prev) => [...prev, doc.id]);
                            } else {
                              setBulkSelectedDocIds((prev) => prev.filter((id) => id !== doc.id));
                            }
                          }}
                          className="w-4 h-4 accent-emerald-700 rounded"
                        />
                        <span className="font-bold text-slate-900">{doc.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                          {doc.classification}
                        </span>
                        <span className="text-[10px] text-slate-500 mr-auto">{doc.specialty}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkPlanModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveBulkPlan}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                ✓ حفظ في خطة الشهر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Excel Import Modal */}
      {showExcelModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowExcelModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    رفع ملف أطباء (Excel / CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    استيراد قائمة الأطباء دفعة واحدة وتحديد تفضيل العينات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Template Download Card */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-teal-900">
                    هل تحتاج إلى نموذج إكسيل جاهز للملء؟
                  </h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    الأعمدة: (الاسم، الكلاس، التخصص، المنطقة، يفضل العينات)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadDoctorsExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold border border-teal-300 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل النموذج</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-700 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all"
              >
                <Upload className="w-8 h-8 text-teal-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  انقر هنا لاختيار ملف الإكسيل (.xlsx, .xls, .csv)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  أو اسحب وأفلت الملف مباشرة في هذا المربع
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isParsing && (
                <div className="text-center py-4 text-xs font-bold text-teal-800">
                  جاري قراءة واستخراج بيانات الأطباء من الملف...
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedDoctors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      تم قراءة {parsedDoctors.length} طبيباً بنجاح جاهزين للإضافة:
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-[11px] text-right">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">الاسم</th>
                          <th className="p-2">الكلاس</th>
                          <th className="p-2">التخصص</th>
                          <th className="p-2">المنطقة</th>
                          <th className="p-2">محب للعينات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedDoctors.slice(0, 15).map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{doc.name}</td>
                            <td className="p-2">{doc.classification}</td>
                            <td className="p-2">{doc.specialty}</td>
                            <td className="p-2">{doc.territory}</td>
                            <td className="p-2">
                              {doc.lovesSamples ? (
                                <span className="text-[#0A3D62] dark:text-[#42A5F5] font-bold">🎁 نعم</span>
                              ) : (
                                <span className="text-slate-400">لا</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedDoctors.length > 15 && (
                    <p className="text-[10px] text-slate-500 mt-1 text-center">
                      ... بالإضافة إلى {parsedDoctors.length - 15} طبيباً آخرين
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={parsedDoctors.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                تأكيد واستيراد {parsedDoctors.length > 0 ? `(${parsedDoctors.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Single Doctor Plan Assignment Modal */}
      {singlePlanDoctor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSinglePlanDoctor(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">تعيين الخطة للطبيب</h3>
                <p className="text-xs text-slate-500">{singlePlanDoctor.name}</p>
              </div>
              <button
                onClick={() => setSinglePlanDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                يوم الزيارة (السبت إلى الأربعاء):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] as WorkDay[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setSinglePlanDoctor((prev) => (prev ? { ...prev, planDay: day } : null))
                    }
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      singlePlanDoctor.planDay === day
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Weeks selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                أسابيع الزيارة في الشهر:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as MonthWeek[]).map((week) => {
                  const isSelected = singlePlanDoctor.planWeeks?.includes(week);
                  return (
                    <button
                      key={week}
                      type="button"
                      onClick={() => {
                        const currentWeeks = singlePlanDoctor.planWeeks || [];
                        const updated = isSelected
                          ? currentWeeks.filter((w) => w !== week)
                          : [...currentWeeks, week].sort();
                        setSinglePlanDoctor({ ...singlePlanDoctor, planWeeks: updated });
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      أسبوع {week}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdateDoctorPlan(singlePlanDoctor.id, undefined, undefined);
                  setSinglePlanDoctor(null);
                  showToast('تمت إزالة الطبيب من الخطة المجدولة.');
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                إلغاء الجدولة
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSinglePlanDoctor(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDoctorPlan(
                      singlePlanDoctor.id,
                      singlePlanDoctor.planDay,
                      singlePlanDoctor.planWeeks
                    );
                    setSinglePlanDoctor(null);
                    showToast(`تم حفظ خطة الطبيب ${singlePlanDoctor.name} بنجاح! 🎯`);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ الخطة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bulk Actions Bar */}
      {selectedDoctorIds.length > 0 && (
        <div
          id="bulk-actions-floating-bar"
          className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-slate-900/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-200"
        >
          {/* Selected Count & Dismiss */}
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold flex items-center justify-center text-xs border border-teal-500/40">
              {selectedDoctorIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200">
              أطباء محددين
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer pr-1"
            >
              إلغاء
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. تعيين يوم محدد للزيارة */}
            <button
              type="button"
              id="btn-bulk-assign-day"
              onClick={() => setShowBulkAssignDayModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold border border-slate-700 text-teal-300 cursor-pointer transition-all"
              title="تعيين يوم الزيارة في الخطة"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تعيين يوم</span>
            </button>

            {/* 2. إضافة إلى محبي العينات */}
            <button
              type="button"
              id="btn-bulk-add-samples-lovers"
              onClick={() => handleBulkToggleSamplesLovers(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold border border-slate-700 text-rose-300 cursor-pointer transition-all"
              title="إضافة الأطباء المحددين لمحبي العينات"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>محبي العينات</span>
            </button>

            {/* 3. حذف المحدد */}
            <button
              type="button"
              id="btn-bulk-delete-doctors"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              title="حذف الأطباء المحددين نهائياً"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف ({selectedDoctorIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to Assign Plan Day for Selected Doctors */}
      {showBulkAssignDayModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBulkAssignDayModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    تعيين يوم الزيارة بالخطة
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    لـ ({selectedDoctorIds.length}) من الأطباء المحددين
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkAssignDayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Day Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر يوم الزيارة المعتمد:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'] as WorkDay[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setAssignDayChoice(day)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      assignDayChoice === day
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Weeks Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                أسابيع الزيارة في الشهر:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([1, 2, 3, 4] as MonthWeek[]).map((w) => {
                  const isSelected = assignWeeksChoice.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (assignWeeksChoice.length > 1) {
                            setAssignWeeksChoice(assignWeeksChoice.filter((x) => x !== w));
                          }
                        } else {
                          setAssignWeeksChoice([...assignWeeksChoice, w].sort());
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a3d62] text-white border-[#0a3d62]'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      أسبوع {w}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkAssignDayModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkAssignDay}
                className="px-4 py-2 rounded-xl bg-[#0a3d62] hover:bg-[#083150] active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                تطبيق على المحدد ({selectedDoctorIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
