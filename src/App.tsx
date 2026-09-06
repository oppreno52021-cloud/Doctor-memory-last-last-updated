import React, { useState, useEffect, useMemo } from 'react';
import {
  Doctor,
  Visit,
  Product,
  Objection,
  UserProfile,
  ActiveTab,
  WorkDay,
  MonthWeek,
  DailyTask,
  AppFontSize,
  AppTheme,
} from './types';
import {
  INITIAL_DOCTORS,
  INITIAL_VISITS,
  INITIAL_PRODUCTS,
  INITIAL_OBJECTIONS,
  INITIAL_USER_PROFILE,
} from './data/initialData';
import { AndroidNavBar } from './components/AndroidNavBar';
import { HomeScreenView } from './components/HomeScreenView';
import { DoctorsScreenView } from './components/DoctorsScreenView';
import { DoctorProfileScreenView } from './components/DoctorProfileScreenView';
import { VisitsScreenView } from './components/VisitsScreenView';
import { ProductsScreenView } from './components/ProductsScreenView';
import { SettingsScreenView } from './components/SettingsScreenView';
import { AddDoctorModal } from './components/AddDoctorModal';
import { AddVisitModal } from './components/AddVisitModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { getCurrentArabicWorkDay, getCurrentMonthWeek } from './utils/planHelper';
import { useBackAction } from './utils/backNavigation';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Persistence via localStorage with fallbacks
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('dm_user_profile');
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('dm_doctors');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((doc: any) => ({
          ...doc,
          territory: doc.territory || doc.governorate || 'المنطقة الرئيسية',
          planWeeks: Array.isArray(doc.planWeeks) ? doc.planWeeks : [1, 2, 3, 4],
          targetedProductIds: Array.isArray(doc.targetedProductIds) ? doc.targetedProductIds : [],
        }));
      }
      return INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    try {
      const saved = localStorage.getItem('dm_visits');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((v: any) => ({
          ...v,
          doctorReaction: v.doctorReaction || 'إيجابي',
          productsDiscussed: Array.isArray(v.productsDiscussed) ? v.productsDiscussed : [],
        }));
      }
      return INITIAL_VISITS;
    } catch {
      return INITIAL_VISITS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dm_products');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [objections, setObjections] = useState<Objection[]>(() => {
    try {
      const saved = localStorage.getItem('dm_objections');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_OBJECTIONS;
    } catch {
      return INITIAL_OBJECTIONS;
    }
  });

  // Additional ad-hoc doctors added to today
  const [extraTodayDoctorIds, setExtraTodayDoctorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dm_extra_today_docs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Daily Tasks (مهام ومتابعات اليوم)
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('dm_daily_tasks');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'task-1',
              text: 'مراجعة نواقص صيدلية العزبي (المعادي)',
              isCompleted: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'task-2',
              text: 'تسليم بروشورات المستحضر الجديد لدكتور أحمد',
              isCompleted: true,
              createdAt: new Date().toISOString(),
            },
          ];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dm_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('dm_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('dm_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('dm_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('dm_objections', JSON.stringify(objections));
  }, [objections]);

  useEffect(() => {
    localStorage.setItem('dm_extra_today_docs', JSON.stringify(extraTodayDoctorIds));
  }, [extraTodayDoctorIds]);

  useEffect(() => {
    localStorage.setItem('dm_daily_tasks', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Modal States
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [doctorForVisit, setDoctorForVisit] = useState<Doctor | null>(null);
  const [visitToEdit, setVisitToEdit] = useState<Visit | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Font Size and Theme Settings
  const [fontSize, setFontSize] = useState<AppFontSize>(() => {
    return (localStorage.getItem('dm_font_size') as AppFontSize) || 'normal';
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    // Reset to 'light' so the user immediately gets a pure white background
    try {
      const saved = localStorage.getItem('dm_theme');
      if (saved === 'dark') {
        localStorage.setItem('dm_theme', 'light');
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('dm_font_size', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('dm_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Robust In-App Delete Confirmation State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Distinct specialties and classes derived from database
  const existingSpecialties = useMemo(() => {
    return Array.from(new Set<string>(doctors.map((d) => d.specialty).filter((s): s is string => Boolean(s))));
  }, [doctors]);

  const existingClasses = useMemo(() => {
    return Array.from(new Set<string>(doctors.map((d) => d.classification).filter((c): c is string => Boolean(c))));
  }, [doctors]);

  // -------------------------------------------------------------
  // Global Hardware / Browser Back Button Stack Navigation
  // Closes open modals, profiles, and sub-views sequentially
  // Exits the application naturally at the root without any confirmation prompts
  // -------------------------------------------------------------
  // 1. Delete Confirmation Modal
  useBackAction(deleteDialog.isOpen, 'app-confirm-delete-modal', () => {
    setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
  });

  // 2. Add / Edit Doctor Modal
  useBackAction(isAddDoctorModalOpen, 'app-add-doctor-modal', () => {
    setIsAddDoctorModalOpen(false);
    setDoctorToEdit(null);
  });

  // 3. Add / Edit Visit Modal
  useBackAction(isAddVisitModalOpen, 'app-add-visit-modal', () => {
    setIsAddVisitModalOpen(false);
    setDoctorForVisit(null);
    setVisitToEdit(null);
  });

  // 4. Doctor Profile Screen View
  useBackAction(Boolean(selectedDoctor), 'app-selected-doctor', () => {
    setSelectedDoctor(null);
  });

  // 5. Active Tab Navigation: Return to Home if on another tab and no profile is open
  useBackAction(activeTab !== 'home' && !selectedDoctor, 'app-tab-navigation', () => {
    setActiveTab('home');
  });

  // Calculate today's visits count, scheduled doctors count, and completed count strictly for today's visits
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.date === todayStr);
  const todayVisitsCount = todayVisits.length;
  const visitedDoctorIdsToday = new Set(todayVisits.map((v) => v.doctorId));

  const currentWorkDay = getCurrentArabicWorkDay();
  const currentWeek = getCurrentMonthWeek();
  const todayScheduledDoctors = doctors.filter((doc) => {
    if ((extraTodayDoctorIds || []).includes(doc.id)) return true;
    if (currentWorkDay && doc.planDay === currentWorkDay) {
      if (!doc.planWeeks || doc.planWeeks.length === 0) return true;
      return (doc.planWeeks || []).includes(currentWeek);
    }
    return false;
  });
  const todayScheduledDoctorsCount = todayScheduledDoctors.length;
  // المنجز من زيارات هذا اليوم حصراً
  const todayCompletedCount = todayScheduledDoctors.filter((doc) =>
    visitedDoctorIdsToday.has(doc.id)
  ).length;

  // Derive unique territory/area of today's scheduled doctors dynamically
  const todayAreas = Array.from(
    new Set(
      todayScheduledDoctors
        .map((d) => d.territory?.trim())
        .filter((t): t is string => Boolean(t && t.length > 0))
    )
  );
  const todayAreaLabel =
    todayAreas.length > 0
      ? todayAreas.join('، ')
      : userProfile.territory || 'حسب خط السير';

  // Handlers for Doctors
  const handleSaveDoctor = (savedDoctor: Doctor) => {
    if (doctors.some((d) => d.id === savedDoctor.id)) {
      setDoctors(doctors.map((d) => (d.id === savedDoctor.id ? savedDoctor : d)));
      if (selectedDoctor && selectedDoctor.id === savedDoctor.id) {
        setSelectedDoctor(savedDoctor);
      }
      showToast('تم تحديث بيانات الطبيب بنجاح! ✅');
    } else {
      setDoctors([savedDoctor, ...doctors]);
      showToast('تمت إضافة الطبيب بنجاح إلى القائمة! 👨‍⚕️');
    }
  };

  const handleDeleteDoctor = (doctorId: string) => {
    setDoctors(doctors.filter((d) => d.id !== doctorId));
    setExtraTodayDoctorIds((extraTodayDoctorIds || []).filter((id) => id !== doctorId));
    if (selectedDoctor && selectedDoctor.id === doctorId) {
      setSelectedDoctor(null);
    }
    showToast('تم حذف الطبيب من القائمة.');
  };

  const handleBulkDeleteDoctors = (doctorIds: string[]) => {
    const ids = doctorIds || [];
    setDoctors((prev) => prev.filter((d) => !ids.includes(d.id)));
    setExtraTodayDoctorIds((prev) => (prev || []).filter((id) => !ids.includes(id)));
    if (selectedDoctor && ids.includes(selectedDoctor.id)) {
      setSelectedDoctor(null);
    }
  };

  const handleBulkUpdateDoctors = (doctorIds: string[], updates: Partial<Doctor>) => {
    const ids = doctorIds || [];
    setDoctors((prev) =>
      prev.map((d) => (ids.includes(d.id) ? { ...d, ...updates } : d))
    );
    if (selectedDoctor && ids.includes(selectedDoctor.id)) {
      setSelectedDoctor((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleOpenAddDoctor = () => {
    setDoctorToEdit(null);
    setIsAddDoctorModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    setIsAddDoctorModalOpen(true);
  };

  const handleImportDoctors = (newDoctors: Doctor[]) => {
    setDoctors((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const filtered = newDoctors.filter((d) => !existingIds.has(d.id));
      return [...filtered, ...prev];
    });
    showToast(`تم استيراد ${newDoctors.length} طبيب بنجاح من الملف! 📊`);
  };

  const handleUpdateDoctorPlan = (
    doctorId: string,
    planDay?: WorkDay,
    planWeeks?: MonthWeek[]
  ) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, planDay, planWeeks } : d))
    );
    showToast('تم تحديث خطة الطبيب بنجاح! 📅');
  };

  const handleBulkUpdateAreaPlan = (
    area: string,
    doctorIds: string[],
    planDay: WorkDay,
    planWeeks: MonthWeek[]
  ) => {
    const idSet = new Set(doctorIds);
    setDoctors((prev) =>
      prev.map((d) =>
        idSet.has(d.id)
          ? {
              ...d,
              planDay,
              planWeeks,
            }
          : d
      )
    );
    showToast(`تم جدولة جميع أطباء منطقة (${area}) في يوم ${planDay} بنجاح! 🗺️`);
  };

  // Handlers for Today's Visits Plan
  const handleAddDoctorToToday = (doctorId: string | string[]) => {
    const idsToAdd = Array.isArray(doctorId) ? doctorId : [doctorId];
    const newIds = idsToAdd.filter((id) => !(extraTodayDoctorIds || []).includes(id));
    if (newIds.length > 0) {
      setExtraTodayDoctorIds([...(extraTodayDoctorIds || []), ...newIds]);
      showToast(
        newIds.length === 1
          ? 'تمت إضافة الطبيب لزيارات اليوم بنجاح!'
          : `تمت إضافة ${newIds.length} أطباء إلى جدول اليوم بنجاح! 🎯`
      );
    }
  };

  const handleRemoveDoctorFromToday = (doctorId: string) => {
    setExtraTodayDoctorIds((extraTodayDoctorIds || []).filter((id) => id !== doctorId));
    showToast('تم استبعاد الطبيب من قائمة اليوم.');
  };

  // Handlers for Daily Tasks (مهام ومتابعات اليوم)
  const handleAddTask = (text: string) => {
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      text,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setDailyTasks([newTask, ...dailyTasks]);
    showToast('تمت إضافة المهمة لليوم بنجاح! 📋');
  };

  const handleToggleTask = (taskId: string) => {
    setDailyTasks(
      dailyTasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setDailyTasks(dailyTasks.filter((t) => t.id !== taskId));
    showToast('تم حذف المهمة.');
  };

  const handleClearCompletedTasks = () => {
    setDailyTasks(dailyTasks.filter((t) => !t.isCompleted));
    showToast('تم مسح المهام المكتملة.');
  };

  // Handlers for Visits
  const handleOpenAddVisit = (doctor?: Doctor) => {
    setVisitToEdit(null);
    setDoctorForVisit(doctor || null);
    setIsAddVisitModalOpen(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setVisitToEdit(visit);
    const doc = doctors.find((d) => d.id === visit.doctorId);
    setDoctorForVisit(doc || null);
    setIsAddVisitModalOpen(true);
  };

  const handleSaveVisit = (visitToSave: Visit) => {
    if (visitToEdit) {
      setVisits(visits.map((v) => (v.id === visitToSave.id ? visitToSave : v)));
      showToast('تم تعديل بيانات الزيارة بنجاح! ✏️');
    } else {
      setVisits([visitToSave, ...visits]);
      showToast('تم تسجيل الزيارة الميدانية بنجاح! 📝');

      // Update doctor's lastVisitDate, lastVisitNote, and total count
      setDoctors(
        doctors.map((d) => {
          if (d.id === visitToSave.doctorId) {
            return {
              ...d,
              lastVisitDate: visitToSave.date,
              lastVisitNote: visitToSave.notes || d.lastVisitNote,
              totalVisitsCount: (d.totalVisitsCount || 0) + 1,
            };
          }
          return d;
        })
      );

      // Deduct sample quantities from product stock
      if (visitToSave.samplesGiven && visitToSave.samplesGiven.length > 0) {
        setProducts(
          products.map((p) => {
            const sample = visitToSave.samplesGiven?.find(
              (s) =>
                s?.productName &&
                p?.name &&
                (s.productName.includes(p.name) || p.name.includes(s.productName))
            );
            if (sample) {
              return {
                ...p,
                sampleStock: Math.max(0, p.sampleStock - sample.quantity),
              };
            }
            return p;
          })
        );
      }
    }
  };

  const handleDeleteVisit = (visitId: string) => {
    setVisits(visits.filter((v) => v.id !== visitId));
  };

  // Handlers for Products
  const handleUpdateSampleStock = (productId: string, newStock: number) => {
    setProducts(
      products.map((p) => (p.id === productId ? { ...p, sampleStock: newStock } : p))
    );
  };

  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const prod: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts([prod, ...products]);
  };

  const handleEditProduct = (updatedProd: Product) => {
    setProducts(products.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
  };

  // Handlers for Objections
  const handleAddObjection = (newObj: Omit<Objection, 'id'>) => {
    const obj: Objection = {
      ...newObj,
      id: `obj-${Date.now()}`,
    };
    setObjections([obj, ...objections]);
  };

  const handleEditObjection = (updatedObj: Objection) => {
    setObjections(objections.map((o) => (o.id === updatedObj.id ? updatedObj : o)));
  };

  const handleDeleteObjection = (objectionId: string) => {
    setObjections(objections.filter((o) => o.id !== objectionId));
  };

  // Handlers for Data Reset / Import
  const handleImportData = (data: {
    doctors: Doctor[];
    visits: Visit[];
    products: Product[];
    objections: Objection[];
  }) => {
    if (data.doctors) setDoctors(data.doctors);
    if (data.visits) setVisits(data.visits);
    if (data.products) setProducts(data.products);
    if (data.objections) setObjections(data.objections);
  };

  const handleResetData = () => {
    setDoctors(INITIAL_DOCTORS);
    setVisits(INITIAL_VISITS);
    setProducts(INITIAL_PRODUCTS);
    setObjections(INITIAL_OBJECTIONS);
    setUserProfile(INITIAL_USER_PROFILE);
    setExtraTodayDoctorIds([]);
    setDailyTasks([]);
    localStorage.clear();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1724] text-[#0F172A] dark:text-[#F5F7FA] font-['Cairo',sans-serif] flex flex-col antialiased selection:bg-[#0A3D62] selection:text-white">
      {/* Top Application Bar & Bottom Navigation - Header shows ONLY on home screen */}
      <AndroidNavBar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedDoctor(null);
          setActiveTab(tab);
        }}
        userProfile={userProfile}
        todayVisitsCount={todayVisitsCount}
        todayCompletedCount={todayCompletedCount}
        todayScheduledCount={todayScheduledDoctorsCount}
        todayAreaLabel={todayAreaLabel}
        totalDoctorsCount={doctors.length}
        onOpenAddDoctorToToday={() => {
          setSelectedDoctor(null);
          setActiveTab('doctors');
        }}
        showTopHeader={!selectedDoctor}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-20 sm:pb-24">
        {selectedDoctor ? (
          <DoctorProfileScreenView
            doctor={selectedDoctor}
            visits={visits}
            products={products}
            objections={objections}
            userProfile={userProfile}
            onBack={() => setSelectedDoctor(null)}
            onEditDoctor={handleEditDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            requestConfirmDelete={requestConfirmDelete}
            onLogVisit={(doc) => handleOpenAddVisit(doc)}
            showToast={showToast}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreenView
                doctors={doctors}
                visits={visits}
                products={products}
                userProfile={userProfile}
                todayDoctorIds={extraTodayDoctorIds}
                onAddDoctorToToday={handleAddDoctorToToday}
                onRemoveDoctorFromToday={handleRemoveDoctorFromToday}
                onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                onOpenAddVisitForDoctor={(doc) => handleOpenAddVisit(doc)}
                onEditDoctor={handleEditDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                requestConfirmDelete={requestConfirmDelete}
                setActiveTab={setActiveTab}
                showToast={showToast}
                dailyTasks={dailyTasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onClearCompletedTasks={handleClearCompletedTasks}
              />
            )}

            {activeTab === 'doctors' && (
              <DoctorsScreenView
                doctors={doctors}
                products={products}
                onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                onOpenAddDoctor={handleOpenAddDoctor}
                onEditDoctor={handleEditDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                requestConfirmDelete={requestConfirmDelete}
                onImportDoctors={handleImportDoctors}
                onUpdateDoctorPlan={handleUpdateDoctorPlan}
                onBulkUpdateAreaPlan={handleBulkUpdateAreaPlan}
                onBulkDeleteDoctors={handleBulkDeleteDoctors}
                onBulkUpdateDoctors={handleBulkUpdateDoctors}
                showToast={showToast}
              />
            )}

            {activeTab === 'visits' && (
              <VisitsScreenView
                visits={visits}
                doctors={doctors}
                userProfile={userProfile}
                onOpenAddVisit={() => handleOpenAddVisit()}
                onEditVisit={handleEditVisit}
                onDeleteVisit={handleDeleteVisit}
                requestConfirmDelete={requestConfirmDelete}
                onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                showToast={showToast}
              />
            )}

            {activeTab === 'products' && (
              <ProductsScreenView
                products={products}
                objections={objections}
                doctors={doctors}
                onUpdateSampleStock={handleUpdateSampleStock}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddObjection={handleAddObjection}
                onEditObjection={handleEditObjection}
                onDeleteObjection={handleDeleteObjection}
                requestConfirmDelete={requestConfirmDelete}
                showToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreenView
                userProfile={userProfile}
                onUpdateUserProfile={setUserProfile}
                doctors={doctors}
                visits={visits}
                products={products}
                objections={objections}
                fontSize={fontSize}
                onChangeFontSize={setFontSize}
                theme={theme}
                onChangeTheme={setTheme}
                onImportData={handleImportData}
                onResetData={handleResetData}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => {
          setIsAddDoctorModalOpen(false);
          setDoctorToEdit(null);
        }}
        onSave={handleSaveDoctor}
        initialDoctor={doctorToEdit}
        products={products}
        currentTerritory={userProfile.territory}
        existingSpecialties={existingSpecialties}
        existingClasses={existingClasses}
      />

      {/* Add / Edit Visit Modal */}
      <AddVisitModal
        isOpen={isAddVisitModalOpen}
        onClose={() => {
          setIsAddVisitModalOpen(false);
          setDoctorForVisit(null);
          setVisitToEdit(null);
        }}
        onSave={handleSaveVisit}
        doctors={doctors}
        products={products}
        selectedDoctor={doctorForVisit}
        initialVisit={visitToEdit}
      />

      {/* In-App Robust Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        onConfirm={deleteDialog.onConfirm}
        onCancel={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs font-bold shadow-2xl border border-slate-700/80 flex items-center gap-2 animate-bounce-subtle pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
