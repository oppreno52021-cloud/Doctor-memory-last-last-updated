import React from 'react';
import { Doctor, Visit, Product, Objection, UserProfile } from '../types';
import {
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  CalendarCheck,
  Package,
  FileText,
  Edit2,
  Calendar,
  Gift,
  ClipboardCopy,
  Clock3,
  Trash2,
} from 'lucide-react';
import { generateChatGptPrompt } from '../utils/planHelper';

interface DoctorProfileScreenViewProps {
  doctor: Doctor;
  visits: Visit[];
  products: Product[];
  objections: Objection[];
  userProfile: UserProfile;
  onBack: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  requestConfirmDelete?: (title: string, message: string, onConfirm: () => void) => void;
  onLogVisit: (doctor: Doctor) => void;
  showToast: (message: string) => void;
}

export const DoctorProfileScreenView: React.FC<DoctorProfileScreenViewProps> = ({
  doctor,
  visits,
  products,
  objections,
  userProfile,
  onBack,
  onEditDoctor,
  onDeleteDoctor,
  requestConfirmDelete,
  onLogVisit,
  showToast,
}) => {
  const doctorVisits = visits.filter((v) => v.doctorId === doctor.id);
  const targetedProducts = products.filter((p) =>
    doctor.targetedProductIds?.includes(p.id)
  );

  const handleCopyChatGptPrompt = async () => {
    const prompt = generateChatGptPrompt(doctor, userProfile, products, doctorVisits);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast(`تم نسخ برومبت ChatGPT للطبيب (${doctor.name}) بنجاح! 🚀`);
    } catch {
      showToast('تم النسخ.');
    }
  };

  return (
    <div id="doctor-profile-container" className="space-y-4 pb-24 max-w-4xl mx-auto px-1">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black dark:text-slate-200 hover:text-[#0a3d62] p-2 rounded-xl bg-white dark:bg-[#152337] border border-slate-200 dark:border-[#26384D] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع لقائمة الأطباء</span>
        </button>

        <div className="flex items-center gap-2">
          {onDeleteDoctor && (
            <button
              onClick={() => {
                if (requestConfirmDelete) {
                  requestConfirmDelete(
                    'حذف الطبيب',
                    `هل تريد حذف الطبيب "${doctor.name}" نهائياً من قاعدة البيانات؟`,
                    () => {
                      onDeleteDoctor(doctor.id);
                      onBack();
                    }
                  );
                } else {
                  onDeleteDoctor(doctor.id);
                  onBack();
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#152337] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 hover:text-rose-700 border border-slate-200 dark:border-[#26384D] hover:border-rose-200 cursor-pointer transition-colors"
              title="حذف الطبيب نهائياً"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onEditDoctor(doctor)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-[#152337] hover:bg-slate-50 dark:hover:bg-slate-800 text-black dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-[#26384D] cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>تعديل الطبيب</span>
          </button>

          <button
            onClick={() => onLogVisit(doctor)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0a3d62] hover:bg-[#083150] text-white text-xs font-black shadow-xs cursor-pointer active:scale-95"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>تسجيل زيارة</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl p-5 border border-slate-200 dark:border-[#26384D] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-black dark:text-[#F5F7FA] tracking-tight">{doctor.name}</h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#0a3d62]/10 dark:bg-[#0a3d62]/30 text-[#0a3d62] dark:text-[#42A5F5] border border-[#0a3d62]/20">
                فئة {doctor.classification}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-200">
                {doctor.territory}
              </span>

              {/* Sample Lover Badge */}
              {doctor.lovesSamples && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#0A3D62]/8 dark:bg-[#1976D2]/20 text-[#0A3D62] dark:text-[#42A5F5] border border-[#0A3D62]/15 dark:border-[#42A5F5]/30 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-[#0A3D62] dark:text-[#42A5F5]" />
                  <span>يفضل العينات ويستخدمها للمرضى 🎁</span>
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-[#0a3d62] dark:text-[#42A5F5] mt-1">{doctor.specialty}</p>

            {/* Plan Info */}
            {doctor.planDay && (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mt-2">
                <Calendar className="w-3.5 h-3.5 text-[#0a3d62] dark:text-[#42A5F5]" />
                <span className="font-black text-black dark:text-white">خطة الزيارة:</span>
                <span>
                  كل {doctor.planDay} (الأسابيع:{' '}
                  {doctor.planWeeks?.map((w) => `أسبوع ${w}`).join(' ، ') || 'كل الأسابيع'})
                </span>
              </div>
            )}
          </div>

          {/* ChatGPT Prompt Button */}
          <button
            onClick={handleCopyChatGptPrompt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer self-start sm:self-auto shrink-0"
            title="نسخ برومبت ChatGPT مخصص لهذا الطبيب لطلب سيناريو الزيارة"
          >
            <ClipboardCopy className="w-4 h-4 text-[#0a3d62] dark:text-[#42A5F5]" />
            <span>📋 برومبت سيناريو الزيارة لـ ChatGPT</span>
          </button>
        </div>

        {/* Contact & Clinic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-black dark:text-white">العيادة/المستشفى:</strong> {doctor.hospitalOrClinic || 'غير مسجل'} (
              {doctor.address || doctor.territory})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-black dark:text-white">أفضل أوقات الزيارة:</strong> {doctor.bestVisitTime || 'مساءً'}
            </span>
          </div>

          {doctor.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-black dark:text-white">الهاتف:</strong>{' '}
                <a href={`tel:${doctor.phone}`} className="text-[#0a3d62] dark:text-[#42A5F5] font-black hover:underline">
                  {doctor.phone}
                </a>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-black dark:text-white">الزيارات السابقة:</strong> {doctorVisits.length} زيارات مسجلة
            </span>
          </div>
        </div>

        {/* Rep's Persona Notes */}
        {doctor.notes && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-black flex items-center gap-1 text-amber-950 dark:text-amber-300">
              <FileText className="w-3.5 h-3.5" />
              <span>ملاحظات المندوب حول شخصية الطبيب وتفضيلاته:</span>
            </div>
            <p className="leading-relaxed font-medium">{doctor.notes}</p>
          </div>
        )}
      </div>

      {/* Targeted Products Section */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl p-4 border border-slate-200 dark:border-[#26384D] shadow-xs space-y-3">
        <h3 className="text-sm font-black text-black dark:text-[#F5F7FA] flex items-center gap-2">
          <Package className="w-4 h-4 text-[#0a3d62] dark:text-[#42A5F5]" />
          <span>الأدوية المستهدفة في زيارات الطبيب ({targetedProducts.length})</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {targetedProducts.map((product) => (
            <div
              key={product.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-black dark:text-white">{product.name}</h4>
                <span className="text-[11px] font-black text-[#0a3d62] dark:text-[#42A5F5]">{product.dosage}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{product.genericName}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {product.indications.slice(0, 3).map((ind, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-black dark:text-slate-200 font-medium"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous Visits History */}
      <div className="bg-white dark:bg-[#152337] rounded-2xl p-4 border border-slate-200 dark:border-[#26384D] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-black dark:text-[#F5F7FA] flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#0a3d62] dark:text-[#42A5F5]" />
            <span>سجل الزيارات السابقة لهذا الطبيب ({doctorVisits.length})</span>
          </h3>
          <button
            onClick={() => onLogVisit(doctor)}
            className="text-xs font-black text-[#0a3d62] dark:text-[#42A5F5] hover:underline cursor-pointer"
          >
            + تسجيل زيارة جديدة
          </button>
        </div>

        {doctorVisits.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            لم تسجل زيارات سابقة لهذا الطبيب بعد.
          </div>
        ) : (
          <div className="space-y-2.5">
            {doctorVisits.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {v.date} {v.time ? `• ${v.time}` : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-800">
                    رد الفعل: {v.doctorReaction || 'إيجابي'}
                  </span>
                </div>

                <div className="text-slate-700">
                  <span className="font-bold">الأدوية المعروضة: </span>
                  <span>{(v.productsDiscussed || []).join(' ، ') || 'مراجعة عامة'}</span>
                </div>

                {v.notes && (
                  <div className="text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-900">الملاحظات: </span>
                    <span>{v.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
