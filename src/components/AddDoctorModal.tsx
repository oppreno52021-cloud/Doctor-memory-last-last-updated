import React, { useState, useEffect, useMemo } from 'react';
import { Doctor, Product, DoctorSpecialty, DoctorClass, WorkDay, MonthWeek } from '../types';
import { X, Check, Stethoscope, Gift, Calendar, PlusCircle } from 'lucide-react';
import { CustomSelectBottomSheet } from './CustomSelectBottomSheet';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: Doctor) => void;
  initialDoctor?: Doctor | null;
  products: Product[];
  currentTerritory: string;
  existingSpecialties?: string[];
  existingClasses?: string[];
}

const DEFAULT_SPECIALTIES: string[] = [
  'أمراض قلب وأوعية',
  'باطنة عامة',
  'طب أطفال وحديثي ولادة',
  'جراحة عظام ومفاصل',
  'جهاز هضمي وكبد',
  'نساء وتوليد',
  'أمراض صدرية وحساسية',
  'مخ وأعصاب',
  'جلدية وتناسلية',
  'مسالك بولية',
];

const EMPTY_STRING_ARRAY: string[] = [];

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDoctor,
  products,
  currentTerritory,
  existingSpecialties = EMPTY_STRING_ARRAY,
  existingClasses = EMPTY_STRING_ARRAY,
}) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<string>('باطنة عامة');
  const [isCustomSpecialty, setIsCustomSpecialty] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState('');

  const [classification, setClassification] = useState<string>('A');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClass, setCustomClass] = useState('');

  const [territory, setTerritory] = useState(currentTerritory);
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bestVisitTime, setBestVisitTime] = useState('');
  const [lovesSamples, setLovesSamples] = useState(false);
  const [planDay, setPlanDay] = useState<WorkDay | ''>('');
  const [planWeeks, setPlanWeeks] = useState<MonthWeek[]>([1, 2, 3, 4]);
  const [targetedProductIds, setTargetedProductIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Dynamically derived specialties list (combines existing in DB with defaults)
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>(DEFAULT_SPECIALTIES);
    existingSpecialties.forEach((s) => {
      if (s && s.trim()) set.add(s.trim());
    });
    if (initialDoctor?.specialty) {
      set.add(initialDoctor.specialty.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [existingSpecialties, initialDoctor?.specialty]);

  // Dynamically derived classes list (combines existing in DB with A+, A, B, C)
  const availableClasses = useMemo(() => {
    const set = new Set<string>(['A+', 'A', 'B', 'C']);
    existingClasses.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    if (initialDoctor?.classification) {
      set.add(initialDoctor.classification.trim());
    }
    return Array.from(set);
  }, [existingClasses, initialDoctor?.classification]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialDoctor) {
      setName(initialDoctor.name || '');
      setSpecialty(initialDoctor.specialty || 'باطنة عامة');
      setIsCustomSpecialty(false);
      setCustomSpecialty('');

      setClassification(initialDoctor.classification || 'A');
      setIsCustomClass(false);
      setCustomClass('');

      setTerritory(initialDoctor.territory || currentTerritory || '');
      setHospitalOrClinic(initialDoctor.hospitalOrClinic || '');
      setAddress(initialDoctor.address || '');
      setPhone(initialDoctor.phone || '');
      setBestVisitTime(initialDoctor.bestVisitTime || '');
      setLovesSamples(Boolean(initialDoctor.lovesSamples));
      setPlanDay(initialDoctor.planDay || '');
      setPlanWeeks(initialDoctor.planWeeks || [1, 2, 3, 4]);
      setTargetedProductIds(initialDoctor.targetedProductIds || []);
      setNotes(initialDoctor.notes || '');
    } else {
      setName('');
      setSpecialty(existingSpecialties[0] || 'باطنة عامة');
      setIsCustomSpecialty(false);
      setCustomSpecialty('');

      setClassification('A');
      setIsCustomClass(false);
      setCustomClass('');

      setTerritory(currentTerritory || 'المنطقة الرئيسية');
      setHospitalOrClinic('');
      setAddress('');
      setPhone('');
      setBestVisitTime('');
      setLovesSamples(false);
      setPlanDay('');
      setPlanWeeks([1, 2, 3, 4]);
      setTargetedProductIds(products.slice(0, 2).map((p) => p.id));
      setNotes('');
    }
  }, [isOpen, initialDoctor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSpecialty = isCustomSpecialty ? customSpecialty.trim() || 'عام' : specialty;
    const finalClassification = isCustomClass ? customClass.trim() || 'A' : classification;

    const savedDoctor: Doctor = {
      id: initialDoctor ? initialDoctor.id : `doc-${Date.now()}`,
      name: name.trim(),
      specialty: finalSpecialty,
      classification: finalClassification as DoctorClass,
      territory: territory.trim() || 'المنطقة الرئيسية',
      hospitalOrClinic: hospitalOrClinic.trim(),
      address: address.trim(),
      phone: phone.trim(),
      bestVisitTime: bestVisitTime.trim(),
      lovesSamples,
      planDay: planDay ? (planDay as WorkDay) : undefined,
      planWeeks: planDay ? planWeeks : undefined,
      targetedProductIds,
      totalVisitsCount: initialDoctor ? initialDoctor.totalVisitsCount : 0,
      notes: notes.trim(),
    };

    onSave(savedDoctor);
    onClose();
  };

  const toggleWeek = (week: MonthWeek) => {
    setPlanWeeks((prev) =>
      (prev || []).includes(week)
        ? (prev || []).filter((w) => w !== week)
        : [...(prev || []), week].sort()
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {initialDoctor ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}
              </h3>
              <p className="text-xs text-slate-500">البيانات الأساسية وتفضيل العينات وخطة الزيارات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 py-3 space-y-3.5 pr-1">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">اسم الطبيب *:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أ.د. هاني نبيل عبد العزيز"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* 2. Class & Specialty (Dynamic & Fully Flexible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Classification */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  الكلاس / الفئة *:
                </label>
                {!isCustomClass && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomClass(true);
                      setCustomClass('');
                    }}
                    className="text-[11px] font-bold text-[#0a3d62] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>فئة جديدة</span>
                  </button>
                )}
              </div>

              {!isCustomClass ? (
                <CustomSelectBottomSheet
                  title="اختر فئة / كلاس الطبيب"
                  value={classification}
                  onChange={(val) => {
                    if (val === '__NEW__') {
                      setIsCustomClass(true);
                      setCustomClass('');
                    } else {
                      setClassification(val);
                    }
                  }}
                  searchable={false}
                  options={[
                    ...availableClasses.map((cls) => ({
                      value: cls,
                      label: `فئة ${cls}`,
                      icon: '⭐',
                    })),
                    {
                      value: '__NEW__',
                      label: '+ إضافة فئة / كلاس مخصص جديد...',
                      icon: '✨',
                    },
                  ]}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
                />
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={customClass}
                      onChange={(e) => setCustomClass(e.target.value)}
                      placeholder="اكتب رمز الفئة (مثل VIP, A1, B+)..."
                      className="w-full px-3 py-1.5 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0a3d62]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomClass(false)}
                      className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 bg-slate-100 text-[11px] font-bold shrink-0 cursor-pointer"
                      title="العودة للقائمة المتاحة"
                    >
                      إلغاء
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-700">ستتم إضافة هذه الفئة تلقائياً لقائمتك وفلاترك</p>
                </div>
              )}
            </div>

            {/* Specialty */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  التخصص الطبي *:
                </label>
                {!isCustomSpecialty && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSpecialty(true);
                      setCustomSpecialty('');
                    }}
                    className="text-[11px] font-bold text-[#0a3d62] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>تخصص جديد</span>
                  </button>
                )}
              </div>

              {!isCustomSpecialty ? (
                <CustomSelectBottomSheet
                  title="اختر التخصص الطبي"
                  value={specialty}
                  onChange={(val) => {
                    if (val === '__NEW__') {
                      setIsCustomSpecialty(true);
                      setCustomSpecialty('');
                    } else {
                      setSpecialty(val);
                    }
                  }}
                  searchable={true}
                  options={[
                    ...availableSpecialties.map((sp) => ({
                      value: sp,
                      label: sp,
                      icon: '🩺',
                    })),
                    {
                      value: '__NEW__',
                      label: '+ كتابة تخصص طبي جديد...',
                      icon: '✨',
                    },
                  ]}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
                />
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="اكتب التخصص (مثل طب أسنان، علاج طبيعي)..."
                      className="w-full px-3 py-1.5 rounded-xl bg-sky-50/50 border border-sky-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0a3d62]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomSpecialty(false)}
                      className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 bg-slate-100 text-[11px] font-bold shrink-0 cursor-pointer"
                      title="العودة للقائمة المتاحة"
                    >
                      إلغاء
                    </button>
                  </div>
                  <p className="text-[10px] text-sky-700">سيتم إضافة هذا التخصص تلقائياً للفلاتر وخياراتك</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Area / Territory */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              المنطقة الجغرافية (Territory) *:
            </label>
            <input
              type="text"
              required
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              placeholder="مثال: مصر الجديدة ، مدينة نصر ، المعادي..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* 4. Loves Samples Checkbox (Approved Feature) */}
          <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-indigo-950/40 border border-slate-300 dark:border-indigo-800/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lovesSamples}
                onChange={(e) => setLovesSamples(e.target.checked)}
                className="w-4 h-4 accent-[#0A3D62] rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-[#0A3D62] dark:text-[#42A5F5] flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#0A3D62] dark:text-[#42A5F5]" />
                <span>طبيب يفضل العينات ويستخدمها للمرضى (Sample Lover 🎁)</span>
              </span>
            </label>
            <p className="text-[11px] text-slate-700 dark:text-indigo-300 mr-6 mt-0.5 font-bold">
              سيتم تمييزه بشارة عينات في الرئيسية لتجهيز العينات قبيل الدخول للعيادة
            </p>
          </div>

          {/* 5. Plan Assignment (Optional directly in Doctor Modal) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>جدولة الطبيب في الخطة (اختياري):</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">يوم الزيارة:</label>
                <CustomSelectBottomSheet
                  title="يوم الزيارة المعتمد بالخطة"
                  value={planDay}
                  onChange={(val) => setPlanDay(val as any)}
                  searchable={false}
                  options={[
                    { value: '', label: 'غير محدد بالخطة بعد' },
                    { value: 'السبت', label: 'السبت', icon: '📅' },
                    { value: 'الأحد', label: 'الأحد', icon: '📅' },
                    { value: 'الإثنين', label: 'الإثنين', icon: '📅' },
                    { value: 'الثلاثاء', label: 'الثلاثاء', icon: '📅' },
                    { value: 'الأربعاء', label: 'الأربعاء', icon: '📅' },
                  ]}
                  buttonClassName="bg-white border-slate-200 text-slate-900 py-1.5 px-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">أسابيع الشهر:</label>
                <div className="flex items-center gap-1">
                  {([1, 2, 3, 4] as MonthWeek[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWeek(w)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                        (planWeeks || []).includes(w)
                          ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Clinic / Hospital & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">العيادة / المستشفى:</label>
              <input
                type="text"
                value={hospitalOrClinic}
                onChange={(e) => setHospitalOrClinic(e.target.value)}
                placeholder="برج الأطباء / عيادة خاصة"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">رقم الهاتف:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ملاحظات هامة حول شخصية الطبيب وتفضيلاته:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: طبيب أكاديمي يفضل الاطلاع على الدراسات الإكلينيكية المختصرة"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0A3D62] hover:bg-[#083150] text-white text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95"
            >
              حفظ الطبيب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
