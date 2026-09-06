import React from 'react';
import { Doctor, AIBrief } from '../types';
import {
  X,
  Sparkles,
  Target,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Package,
  CalendarCheck,
} from 'lucide-react';

interface AIBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: AIBrief | null;
  doctor: Doctor | null;
  onProceedToVisit: (doctor: Doctor) => void;
}

export const AIBriefModal: React.FC<AIBriefModalProps> = ({
  isOpen,
  onClose,
  brief,
  doctor,
  onProceedToVisit,
}) => {
  if (!isOpen || !brief || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-teal-100 my-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">موجز الذكاء الاصطناعي للزيارة</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                  Pre-Call Brief
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {doctor.name} ({doctor.specialty}) • فئة {doctor.classification}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Executive Summary */}
          <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-2xl text-teal-950 space-y-1">
            <span className="font-extrabold text-teal-900 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              التقييم التكتيكي للطبيب:
            </span>
            <p className="leading-relaxed">{brief.summary}</p>
          </div>

          {/* Call Objective */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <Target className="w-4 h-4 text-emerald-600" />
              الهدف الإجرائي من زيارة اليوم:
            </span>
            <p className="text-slate-700 font-medium leading-relaxed">{brief.callObjective}</p>
          </div>

          {/* Suggested Opening */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
            <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              مدخل الحوار الافتتاحي المقترح (Opening Hook):
            </span>
            <p className="text-amber-950 italic leading-relaxed">"{brief.suggestedOpening}"</p>
          </div>

          {/* Recommended Products */}
          <div className="space-y-1.5">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <Package className="w-4 h-4 text-teal-600" />
              الأدوية ذات الأولوية ومبرر ترويجها:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {brief.recommendedProducts.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                  <p className="text-[11px] text-slate-600">{item.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Anticipated Objections */}
          <div className="space-y-1.5">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              الاعتراض المتوقع والرد العلمي الجاهز:
            </span>
            <div className="space-y-2">
              {brief.anticipatedObjections.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-1">
                  <div className="font-bold text-rose-950 text-[11px]">
                    ⚠️ اعتراض متوقع: {item.objection}
                  </div>
                  <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-rose-200/60 leading-relaxed">
                    <strong className="text-teal-800">الرد المقنع: </strong>
                    {item.suggestedRebuttal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Talking Points */}
          <div className="space-y-1.5">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              أهم النقاط السريعة للتذكير (Quick Bullets):
            </span>
            <ul className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {brief.keyTalkingPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              onClose();
              onProceedToVisit(doctor);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A3D62] hover:bg-[#083150] active:bg-[#083150] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>البدء بتسجيل الزيارة الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
