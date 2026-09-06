import React, { useState } from 'react';
import { UserProfile, Doctor, Visit, Product, Objection, AppFontSize, AppTheme } from '../types';
import {
  User,
  Download,
  Upload,
  CheckCircle2,
  Sun,
  Moon,
  Type,
  Palette,
  ShieldCheck,
  ChevronDown,
  Smartphone,
  Sparkles,
  RotateCcw,
  Save,
  Settings,
} from 'lucide-react';
import { DEFAULT_CHATGPT_PROMPT_TEMPLATE } from '../utils/planHelper';

interface SettingsScreenViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  doctors: Doctor[];
  visits: Visit[];
  products: Product[];
  objections: Objection[];
  fontSize: AppFontSize;
  onChangeFontSize: (size: AppFontSize) => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  requestConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
  onImportData: (data: {
    doctors: Doctor[];
    visits: Visit[];
    products: Product[];
    objections: Objection[];
  }) => void;
  onResetData: () => void;
  showToast: (message: string) => void;
}

export const SettingsScreenView: React.FC<SettingsScreenViewProps> = ({
  userProfile,
  onUpdateUserProfile,
  doctors,
  visits,
  products,
  objections,
  fontSize,
  onChangeFontSize,
  theme,
  onChangeTheme,
  onImportData,
  showToast,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Collapsible Dropdown State for all setting boxes (all closed by default as requested)
  const [openSections, setOpenSections] = useState<{
    profile: boolean;
    appearance: boolean;
    prompt: boolean;
    backup: boolean;
  }>({
    profile: false,
    appearance: false,
    prompt: false,
    backup: false,
  });

  const [promptText, setPromptText] = useState<string>(() => {
    return userProfile.customChatGptPrompt || DEFAULT_CHATGPT_PROMPT_TEMPLATE;
  });
  const [promptSavedSuccess, setPromptSavedSuccess] = useState(false);

  const toggleSection = (section: 'profile' | 'appearance' | 'prompt' | 'backup') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSavePrompt = () => {
    const updatedProfile = {
      ...profile,
      customChatGptPrompt: promptText,
    };
    setProfile(updatedProfile);
    onUpdateUserProfile(updatedProfile);
    setPromptSavedSuccess(true);
    showToast('تم حفظ نموذج برومبت الذكاء الاصطناعي بنجاح! 🤖✅');
    setTimeout(() => setPromptSavedSuccess(false), 2500);
  };

  const handleResetPromptToDefault = () => {
    setPromptText(DEFAULT_CHATGPT_PROMPT_TEMPLATE);
    const updatedProfile = {
      ...profile,
      customChatGptPrompt: DEFAULT_CHATGPT_PROMPT_TEMPLATE,
    };
    setProfile(updatedProfile);
    onUpdateUserProfile(updatedProfile);
    showToast('تمت استعادة البرومبت الافتراضي بنجاح! 🔄');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(profile);
    setSavedSuccess(true);
    showToast('تم حفظ بيانات المندوب بنجاح! ✅');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const fullBackup = {
      userProfile,
      doctors,
      visits,
      products,
      objections,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fullBackup, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `DoctorMemory_Backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تنزيل النسخة الاحتياطية بنجاح 📥');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.doctors && parsed.visits) {
            onImportData({
              doctors: parsed.doctors || [],
              visits: parsed.visits || [],
              products: parsed.products || products,
              objections: parsed.objections || objections,
            });
            showToast('تمت استعادة البيانات بنجاح من النسخة الاحتياطية! 🔄');
          } else {
            alert('صيغة ملف النسخة الاحتياطية غير صالحة.');
          }
        } catch (error) {
          alert('تعذر قراءة الملف. يرجى التأكد من اختيار ملف JSON صحيح.');
        }
      };
    }
  };

  return (
    <div id="settings-screen-container" className="space-y-3 pb-24 max-w-4xl mx-auto px-1">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] p-3 sm:p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-black text-black dark:text-[#F5F7FA]">
            إعدادات الحساب والنسخ الاحتياطي
          </h2>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#9AA8B8]">
            بيانات المندوب، المظهر، البرومبت الذكي، والنسخ
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0a3d62] dark:text-[#42A5F5] flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
          <Settings className="w-5 h-5" />
        </div>
      </div>

      {/* Box 1: Rep Profile Form (Collapsible Dropdown) */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('profile')}
          className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0a3d62]/10 dark:bg-[#1976D2]/20 border border-[#0a3d62]/20 dark:border-[#1976D2]/35 flex items-center justify-center text-[#0a3d62] dark:text-[#42A5F5] shrink-0">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-black dark:text-slate-100">
                الملف المهني للمندوب
              </h3>
              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                اسم المندوب، الشركة، والمنطقة الجغرافية
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 transition-transform duration-200 ${
              openSections.profile ? 'rotate-180 text-[#0a3d62] dark:text-[#42A5F5]' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4 stroke-[2.2]" />
          </div>
        </button>

        {openSections.profile && (
          <div className="p-4 pt-1 border-t border-slate-200 dark:border-[#26384D]">
            <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
                    اسم المندوب:
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.repName}
                    onChange={(e) => setProfile({ ...profile, repName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-black dark:text-slate-100 focus:ring-2 focus:ring-[#0a3d62] focus:border-[#0a3d62] focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
                    شركة الأدوية:
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-black dark:text-slate-100 focus:ring-2 focus:ring-[#0a3d62] focus:border-[#0a3d62] focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
                    المنطقة الجغرافية (Territory):
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.territory}
                    onChange={(e) => setProfile({ ...profile, territory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-black dark:text-slate-100 focus:ring-2 focus:ring-[#0a3d62] focus:border-[#0a3d62] focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
                    الخط الدوائي (Line):
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.line}
                    onChange={(e) => setProfile({ ...profile, line: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-black dark:text-slate-100 focus:ring-2 focus:ring-[#0a3d62] focus:border-[#0a3d62] focus:outline-none shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
                    الهدف اليومي لعدد الزيارات (Target):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={profile.dailyTargetVisits}
                    onChange={(e) =>
                      setProfile({ ...profile, dailyTargetVisits: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-black dark:text-slate-100 focus:ring-2 focus:ring-[#0a3d62] focus:border-[#0a3d62] focus:outline-none shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0a3d62] hover:bg-[#083150] active:scale-95 text-white text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savedSuccess ? '✓ تم الحفظ بنجاح' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Box 2: Appearance, Font Size and Theme (Collapsible Dropdown) */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('appearance')}
          className="w-full p-4 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a3d62]/10 dark:bg-[#1976D2]/20 border border-[#0a3d62]/20 dark:border-[#1976D2]/35 flex items-center justify-center text-[#0a3d62] dark:text-[#42A5F5] shrink-0">
              <Palette className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-slate-100">
                المظهر وحجم الخط والسمة
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                تخصيص حجم الخط لسهولة القراءة الميدانية، والتبديل بين الوضع الليلي والنهاري
              </p>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-500 transition-transform duration-200 ${
              openSections.appearance ? 'rotate-180 text-[#0a3d62] dark:text-[#42A5F5]' : ''
            }`}
          >
            <ChevronDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </button>

        {openSections.appearance && (
          <div className="p-4 pt-1 border-t border-slate-200 dark:border-[#26384D]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* 1. حجم الخط (عادي - وسط - كبير) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black dark:text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#0a3d62] dark:text-[#42A5F5]" />
                  <span>حجم الخط في التطبيق:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFontSize('normal');
                      showToast('تم ضبط حجم الخط: عادي');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      fontSize === 'normal'
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold'
                    }`}
                  >
                    <div className="text-xs">عادي</div>
                    <div className="text-[10px] opacity-85 mt-0.5">افتراضي</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeFontSize('medium');
                      showToast('تم ضبط حجم الخط: وسط');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      fontSize === 'medium'
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold'
                    }`}
                  >
                    <div className="text-sm">وسط</div>
                    <div className="text-[10px] opacity-85 mt-0.5">مريح للعين</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeFontSize('large');
                      showToast('تم ضبط حجم الخط: كبير');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      fontSize === 'large'
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold'
                    }`}
                  >
                    <div className="text-base font-bold">كبير</div>
                    <div className="text-[10px] opacity-85 mt-0.5">للحركة</div>
                  </button>
                </div>
              </div>

              {/* 2. السمة (فاتح - داكن) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#0a3d62] dark:text-[#42A5F5]" />
                  <span>السمة والثيم (Theme):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeTheme('light');
                      showToast('تم تفعيل الثيم الفاتح ☀️');
                    }}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">فاتح (Light)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeTheme('dark');
                      showToast('تم تفعيل الثيم الداكن 🌙');
                    }}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#0a3d62] text-white border-[#0a3d62] shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs">الداكن (Dark)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Box 3: Custom ChatGPT Prompt (Collapsible Dropdown - Closed by default) */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('prompt')}
          className="w-full p-4 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a3d62]/10 dark:bg-[#1976D2]/20 border border-[#0a3d62]/20 dark:border-[#1976D2]/35 flex items-center justify-center text-[#0a3d62] dark:text-[#42A5F5] shrink-0">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-slate-100">
                تخصيص برومبت الذكاء الاصطناعي (ChatGPT Prompt) 🤖
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                تعديل وتخصيص نص البرومبت المنسوخ لتجهيز الزيارات وتكتيكات الإقناع
              </p>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-500 transition-transform duration-200 ${
              openSections.prompt ? 'rotate-180 text-[#0a3d62] dark:text-[#42A5F5]' : ''
            }`}
          >
            <ChevronDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </button>

        {openSections.prompt && (
          <div className="p-4 pt-1 border-t border-slate-200 dark:border-[#26384D] space-y-4">
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-black dark:text-slate-200">
                  قالب البرومبت المستخدم عند الضغط على "📋 نسخ برومبت ChatGPT"
                </label>
                <button
                  type="button"
                  onClick={handleResetPromptToDefault}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline cursor-pointer"
                  title="استعادة الصياغة الافتراضية"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة الافتراضي</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يمكنك كتابة البرومبت الذي تفضله وسيقوم التطبيق تلقائياً باستبدال الكلمات المحاطة بأقواس مثل <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[#0a3d62] dark:text-[#42A5F5] font-mono font-bold text-[10px]">{`{doctorName}`}</code> ببيانات الطبيب الفعلية.
              </p>
            </div>

            {/* Textarea for Prompt */}
            <div className="space-y-2">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={11}
                dir="rtl"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0a3d62] dark:focus:ring-[#42A5F5] shadow-2xs font-sans"
                placeholder="اكتب البرومبت المخصص هنا..."
              />
            </div>

            {/* Dynamic Tags Guide */}
            <div className="bg-[#EAF0F6] dark:bg-[#1A283B] border border-[#E2E8F0] dark:border-[#26384D] rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">
                🏷️ المتغيرات الذكية المتاحة للاستخدام في النص:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{doctorName}`}</span>: اسم الطبيب
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{specialty}`}</span>: التخصص
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{classification}`}</span>: فئة الطبيب
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{territory}`}</span>: المنطقة
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{products}`}</span>: الأصناف المستهدفة
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{lastVisitNote}`}</span>: ملاحظة آخر زيارة
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{companyName}`}</span>: اسم الشركة
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{repName}`}</span>: اسم المندوب
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-[#0a3d62] dark:text-[#42A5F5]">{`{line}`}</span>: خط الدواء
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSavePrompt}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4 stroke-[2.2]" />
                <span>حفظ البرومبت المخصص</span>
              </button>

              {promptSavedSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الحفظ والتحديث بنجاح!</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Box 4: Backup and Data Safety (Collapsible Dropdown) */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl border border-slate-200 dark:border-[#26384D] shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('backup')}
          className="w-full p-4 flex items-center justify-between text-right cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a3d62]/10 dark:bg-[#1976D2]/20 border border-[#0a3d62]/20 dark:border-[#1976D2]/35 flex items-center justify-center text-[#0a3d62] dark:text-[#42A5F5] shrink-0">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-slate-100">
                أمان البيانات والنسخ الاحتياطي
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                احفظ أطباءك وسجل زياراتك في ملف آمن على جهازك واستعادتها بأي وقت
              </p>
            </div>
          </div>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-500 transition-transform duration-200 ${
              openSections.backup ? 'rotate-180 text-[#0a3d62] dark:text-[#42A5F5]' : ''
            }`}
          >
            <ChevronDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </button>

        {openSections.backup && (
          <div className="p-4 pt-1 border-t border-slate-200 dark:border-[#26384D]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* 1. Download Backup */}
              <button
                type="button"
                onClick={handleExportData}
                className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:bg-[#0a3d62]/5 dark:hover:bg-slate-800/40 hover:border-[#0a3d62] text-right space-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-black text-black dark:text-slate-100">
                  <Download className="w-4 h-4 text-[#0a3d62] dark:text-[#42A5F5]" />
                  <span>تنزيل نسخة احتياطية (Backup)</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  تنزيل ملف JSON به كل الأطباء والزيارات والأدوية
                </p>
              </button>

              {/* 2. Upload Restore */}
              <label className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:bg-[#0a3d62]/5 dark:hover:bg-slate-800/40 hover:border-[#0a3d62] text-right space-y-1 transition-all cursor-pointer block">
                <div className="flex items-center gap-2 text-xs font-black text-black dark:text-slate-100">
                  <Upload className="w-4 h-4 text-[#0a3d62] dark:text-[#42A5F5]" />
                  <span>استعادة نسخة سابقة (Restore)</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  رفع ملف JSON محفوظ سابقاً لإعادة البيانات
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

