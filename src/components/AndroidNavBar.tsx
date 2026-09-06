import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import {
  Home,
  Users,
  CalendarCheck,
  Package,
  Settings,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getFormattedTodayArabic, getCurrentMonthWeek, getCurrentArabicWorkDay } from '../utils/planHelper';

interface AndroidNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  todayVisitsCount: number;
  todayScheduledCount?: number;
  todayCompletedCount?: number;
  todayAreaLabel?: string;
  totalDoctorsCount: number;
  onOpenAddDoctorToToday: () => void;
  showTopHeader?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  todayVisitsCount,
  todayScheduledCount,
  todayCompletedCount,
  todayAreaLabel,
  showTopHeader = true,
  theme = 'light',
  onToggleTheme,
}) => {
  const currentWeek = getCurrentMonthWeek();
  const weekLabel = `الأسبوع ${
    currentWeek === 1 ? 'الأول' : currentWeek === 2 ? 'الثاني' : currentWeek === 3 ? 'الثالث' : 'الرابع'
  }`;

  const arabicDayName = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
  const arabicDayAndMonth = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });

  // Total scheduled visits today (fallback to 0 or todayVisitsCount)
  const totalVisitsToday = todayScheduledCount ?? todayVisitsCount ?? 0;
  const completedVisitsToday = todayCompletedCount ?? 0;
  const completionPercentage =
    totalVisitsToday > 0 ? Math.min(100, Math.round((completedVisitsToday / totalVisitsToday) * 100)) : 0;

  const displayArea = todayAreaLabel && todayAreaLabel.trim().length > 0 ? todayAreaLabel : userProfile.territory;

  return (
    <>
      {/* Top Application Bar - Shows only on Home screen (Flexible row matching mobile standards) */}
      {showTopHeader && activeTab === 'home' && (
        <header
          id="app-header"
          className="sticky top-0 z-30 min-h-[3.5rem] py-1.5 bg-white dark:bg-[#152337] border-b border-[#E2E8F0] dark:border-[#26384D] shadow-xs transition-colors flex items-center"
        >
          <div className="max-w-md sm:max-w-xl w-full mx-auto px-3.5 sm:px-4 flex items-center justify-between gap-2.5">
            {/* الجانب الأيمن: الأسبوع واليوم والمنطقة بتنسيق مدمج ومتناسق وخطوط سوداء واضحة */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1976D2]/20 text-black dark:text-[#42A5F5] flex items-center justify-center shrink-0 border border-slate-300 dark:border-[#1976D2]/35">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col text-right leading-tight min-w-0">
                <span className="text-xs font-black text-black dark:text-[#F5F7FA] truncate">
                  {weekLabel} • {arabicDayName}
                </span>
                <div className="flex items-center gap-1 text-xs font-black text-black dark:text-[#9AA8B8] truncate">
                  <MapPin className="w-3 h-3 text-black dark:text-[#42A5F5] shrink-0 stroke-[2.5]" />
                  <span className="truncate text-black dark:text-[#9AA8B8]">{displayArea}</span>
                </div>
              </div>
            </div>

            {/* الجانب الأيسر: كبسولة إنجاز الزيارات وزر التبديل الفوري للثيم بخطوط سوداء واضحة */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1B2A3D] text-black dark:text-[#F5F7FA] border border-slate-300 dark:border-[#26384D] text-xs font-black shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-[#2E9B72] shrink-0 stroke-[2.5]" />
                <span className="text-xs font-black text-black dark:text-[#9AA8B8]">المنجز:</span>
                <span className="text-xs font-black tracking-tight text-black dark:text-[#F5F7FA]">{completedVisitsToday}/{totalVisitsToday}</span>
                {totalVisitsToday > 0 && (
                  <span className="mr-0.5 px-1.5 py-0.5 rounded-md bg-black dark:bg-[#1976D2] text-[0.7rem] font-black text-white shadow-2xs">
                    {completionPercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Bottom Android Navigation Bar (5 Approved Tabs - Ergonomic Mobile Touch Area) */}
      <nav
        id="bottom-navigation-bar"
        className="fixed bottom-0 left-0 right-0 z-40 min-h-[60px] pb-[max(env(safe-area-inset-bottom,0px),4px)] pt-1 bg-white/95 dark:bg-[#152337]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#26384D] shadow-lg flex items-center select-none"
      >
        <div className="max-w-md w-full mx-auto grid grid-cols-5 px-1.5 h-full">
          {/* 1. الرئيسية */}
          <button
            id="nav-tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative rounded-xl my-0.5 ${
              activeTab === 'home'
                ? 'bg-[#0A3D62]/10 dark:bg-[#42A5F5]/15'
                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <Home className={`w-5 h-5 shrink-0 transition-transform ${
              activeTab === 'home'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] stroke-[2.6] scale-105'
                : 'text-slate-500 dark:text-slate-400 stroke-[2]'
            }`} />
            <span className={`text-[0.7rem] sm:text-xs leading-tight mt-0.5 whitespace-nowrap transition-colors ${
              activeTab === 'home'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold'
            }`}>الرئيسية</span>
          </button>

          {/* 2. الأطباء */}
          <button
            id="nav-tab-doctors"
            onClick={() => setActiveTab('doctors')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative rounded-xl my-0.5 ${
              activeTab === 'doctors'
                ? 'bg-[#0A3D62]/10 dark:bg-[#42A5F5]/15'
                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <Users className={`w-5 h-5 shrink-0 transition-transform ${
              activeTab === 'doctors'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] stroke-[2.6] scale-105'
                : 'text-slate-500 dark:text-slate-400 stroke-[2]'
            }`} />
            <span className={`text-[0.7rem] sm:text-xs leading-tight mt-0.5 whitespace-nowrap transition-colors ${
              activeTab === 'doctors'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold'
            }`}>الأطباء</span>
          </button>

          {/* 3. الزيارات */}
          <button
            id="nav-tab-visits"
            onClick={() => setActiveTab('visits')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative rounded-xl my-0.5 ${
              activeTab === 'visits'
                ? 'bg-[#0A3D62]/10 dark:bg-[#42A5F5]/15'
                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <CalendarCheck className={`w-5 h-5 shrink-0 transition-transform ${
              activeTab === 'visits'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] stroke-[2.6] scale-105'
                : 'text-slate-500 dark:text-slate-400 stroke-[2]'
            }`} />
            <span className={`text-[0.7rem] sm:text-xs leading-tight mt-0.5 whitespace-nowrap transition-colors ${
              activeTab === 'visits'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold'
            }`}>الزيارات</span>
          </button>

          {/* 4. المنتجات */}
          <button
            id="nav-tab-products"
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative rounded-xl my-0.5 ${
              activeTab === 'products'
                ? 'bg-[#0A3D62]/10 dark:bg-[#42A5F5]/15'
                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <Package className={`w-5 h-5 shrink-0 transition-transform ${
              activeTab === 'products'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] stroke-[2.6] scale-105'
                : 'text-slate-500 dark:text-slate-400 stroke-[2]'
            }`} />
            <span className={`text-[0.7rem] sm:text-xs leading-tight mt-0.5 whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold'
            }`}>المنتجات</span>
          </button>

          {/* 5. الإعدادات */}
          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative rounded-xl my-0.5 ${
              activeTab === 'settings'
                ? 'bg-[#0A3D62]/10 dark:bg-[#42A5F5]/15'
                : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <Settings className={`w-5 h-5 shrink-0 transition-transform ${
              activeTab === 'settings'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] stroke-[2.6] scale-105'
                : 'text-slate-500 dark:text-slate-400 stroke-[2]'
            }`} />
            <span className={`text-[0.7rem] sm:text-xs leading-tight mt-0.5 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'text-[#0A3D62] dark:text-[#42A5F5] font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold'
            }`}>الإعدادات</span>
          </button>
        </div>
      </nav>
    </>
  );
};
