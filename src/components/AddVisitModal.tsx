import React, { useState, useEffect } from 'react';
import { Visit, Doctor, Product, DoctorReaction } from '../types';
import { X, CalendarCheck, Check, Plus, Minus, Stethoscope, Gift } from 'lucide-react';
import { CustomSelectBottomSheet } from './CustomSelectBottomSheet';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visit: Visit) => void;
  doctors: Doctor[];
  products: Product[];
  selectedDoctor?: Doctor | null;
  initialVisit?: Visit | null;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  doctors,
  products,
  selectedDoctor,
  initialVisit,
}) => {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }) ||
      '18:30'
  );
  const [status, setStatus] = useState<'تمت' | 'مجدولة'>('تمت');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [doctorReaction, setDoctorReaction] = useState<DoctorReaction>('إيجابي');
  const [samples, setSamples] = useState<{ [productName: string]: number }>({});
  const [objectionRaised, setObjectionRaised] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialVisit) {
      setDoctorId(initialVisit.doctorId);
      setDate(initialVisit.date);
      setTime(initialVisit.time || '18:30');
      setStatus(initialVisit.status);
      setSelectedProducts(initialVisit.productsDiscussed || []);
      setDoctorReaction(initialVisit.doctorReaction);
      const sMap: { [productName: string]: number } = {};
      (initialVisit.samplesGiven || []).forEach((s) => {
        sMap[s.productName] = s.quantity;
      });
      setSamples(sMap);
      setObjectionRaised(initialVisit.objectionRaised || '');
      setNextVisitDate(initialVisit.nextVisitDate || '');
      setNotes(initialVisit.notes || '');
    } else if (selectedDoctor) {
      setDoctorId(selectedDoctor.id);
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('تمت');
      const targetedNames = products
        .filter((p) => selectedDoctor.targetedProductIds?.includes(p.id))
        .map((p) => p.name);
      setSelectedProducts(targetedNames.length > 0 ? targetedNames : [products[0]?.name || '']);
      setDoctorReaction('إيجابي');
      setSamples({});
      setObjectionRaised('');
      setNextVisitDate('');
      setNotes('');
    } else if (doctors.length > 0) {
      setDoctorId(doctors[0].id);
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('تمت');
      setSelectedProducts(products[0] ? [products[0].name] : []);
      setDoctorReaction('إيجابي');
      setSamples({});
      setObjectionRaised('');
      setNextVisitDate('');
      setNotes('');
    }
  }, [isOpen, initialVisit, selectedDoctor]);

  if (!isOpen) return null;

  const currentDoctor = doctors.find((d) => d.id === doctorId);

  const toggleProduct = (prodName: string) => {
    if (selectedProducts.includes(prodName)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== prodName));
    } else {
      setSelectedProducts([...selectedProducts, prodName]);
    }
  };

  const handleSampleChange = (prodName: string, delta: number) => {
    const current = samples[prodName] || 0;
    const nextVal = Math.max(0, current + delta);
    setSamples({ ...samples, [prodName]: nextVal });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return;

    const samplesGiven: { productName: string; quantity: number }[] = Object.entries(samples)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([productName, quantity]) => ({ productName, quantity: Number(quantity) }));

    const visitToSave: Visit = {
      id: initialVisit ? initialVisit.id : `visit-${Date.now()}`,
      doctorId: doc.id,
      doctorName: doc.name,
      date,
      time,
      productsDiscussed: selectedProducts.length > 0 ? selectedProducts : ['مراجعة عامة'],
      doctorReaction,
      samplesGiven,
      objectionRaised: objectionRaised.trim() || undefined,
      nextVisitDate: nextVisitDate || undefined,
      notes: notes.trim() || undefined,
      status,
      durationMinutes: status === 'تمت' ? 10 : undefined,
    };

    onSave(visitToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A3D62]/10 border border-[#0A3D62]/20 flex items-center justify-center text-[#0A3D62]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                {initialVisit ? 'تعديل بيانات الزيارة' : 'تسجيل زيارة ميدانية'}
              </h3>
              <p className="text-xs text-slate-500">توثيق مناقشة الأدوية، العينات، وردود الفعل</p>
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
          {/* Doctor Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">اختيار الطبيب *:</label>
            <CustomSelectBottomSheet
              title="اختيار الطبيب للزيارة"
              value={doctorId}
              onChange={setDoctorId}
              searchable={true}
              options={doctors.map((doc) => ({
                value: doc.id,
                label: `${doc.name} (${doc.specialty} • ${doc.territory})`,
                badge: `فئة ${doc.classification}`,
                icon: doc.lovesSamples ? '🎁' : '🩺',
              }))}
              buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
            />
          </div>

          {/* Date, Time & Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">الوقت:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">حالة الزيارة:</label>
              <CustomSelectBottomSheet
                title="حالة الزيارة"
                value={status}
                onChange={(val) => setStatus(val as any)}
                searchable={false}
                options={[
                  { value: 'تمت', label: 'تمت بنجاح', icon: '✅' },
                  { value: 'مجدولة', label: 'مجدولة لاحقاً', icon: '⏳' },
                ]}
                buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-1.5 px-2"
              />
            </div>
          </div>

          {/* Products Discussed (Chips) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              الأدوية التي تمت مناقشتها بالزيارة (اختر صنفاً أو أكثر):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {products.map((prod) => {
                const isSelected = selectedProducts.includes(prod.name);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => toggleProduct(prod.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A3D62] text-white border-[#0A3D62] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {prod.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor Reaction */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              رد فعل الطبيب في المقابلة *:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(
                [
                  'ممتاز / إيجابي جداً',
                  'إيجابي',
                  'محايد',
                  'متردد',
                  'معترض',
                ] as DoctorReaction[]
              ).map((reaction) => {
                const isSelected = doctorReaction === reaction;
                const color =
                  reaction.includes('ممتاز') || reaction === 'إيجابي'
                    ? 'border-emerald-300 text-emerald-800'
                    : reaction === 'محايد'
                    ? 'border-amber-300 text-amber-800'
                    : 'border-rose-300 text-rose-800';

                return (
                  <button
                    key={reaction}
                    type="button"
                    onClick={() => setDoctorReaction(reaction)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `bg-slate-50 hover:bg-slate-100 ${color}`
                    }`}
                  >
                    {reaction}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Samples Stepper */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Gift className="w-4 h-4 text-teal-700" />
              <span>عينات تم تسليمها للطبيب (اختياري):</span>
            </div>
            <div className="space-y-1.5">
              {products.map((prod) => {
                const qty = samples[prod.name] || 0;
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{prod.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSampleChange(prod.name, -1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleSampleChange(prod.name, 1)}
                        className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Agreement */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ملاحظات المقابلة والاتفاق مع الطبيب:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: وعد بوصف الدواء لـ 5 مرضى سكر وضغط هذا الأسبوع، وطلب عينات إضافية بالزيارة القادمة"
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
              حفظ الزيارة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
