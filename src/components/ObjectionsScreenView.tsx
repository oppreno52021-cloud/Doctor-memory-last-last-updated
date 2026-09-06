import React, { useState } from 'react';
import { Objection, Product } from '../types';
import {
  HelpCircle,
  Search,
  Plus,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Filter,
  X,
} from 'lucide-react';
import { CustomSelectBottomSheet } from './CustomSelectBottomSheet';

interface ObjectionsScreenViewProps {
  objections: Objection[];
  products: Product[];
  onAddObjection: (objection: Objection) => void;
}

export const ObjectionsScreenView: React.FC<ObjectionsScreenViewProps> = ({
  objections,
  products,
  onAddObjection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New objection form state
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [objectionText, setObjectionText] = useState('');
  const [category, setCategory] = useState<any>('سعر وتكلفة');
  const [rebuttal, setRebuttal] = useState('');
  const [evidence, setEvidence] = useState('');

  const categories = [
    'الكل',
    'سعر وتكلفة',
    'فاعلية وسرعة',
    'أمان وآثار جانبية',
    'اعتياد على بديل',
    'توفر بالصيدليات',
  ];

  const q = (searchQuery || '').toLowerCase();
  const filteredObjections = objections.filter((obj) => {
    const matchesSearch =
      (obj.objectionText || '').toLowerCase().includes(q) ||
      (obj.productName || '').toLowerCase().includes(q) ||
      (obj.scientificRebuttal || '').toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'الكل' || obj.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectionText.trim() || !rebuttal.trim()) return;

    const prod = products.find((p) => p.id === selectedProdId) || products[0];

    const newObj: Objection = {
      id: `obj-${Date.now()}`,
      productId: prod?.id || 'prod-1',
      productName: prod?.name || 'دواء عام',
      objectionText: objectionText.trim(),
      category,
      scientificRebuttal: rebuttal.trim(),
      clinicalEvidence: evidence.trim() || undefined,
    };

    onAddObjection(newObj);
    setIsModalOpen(false);
    setObjectionText('');
    setRebuttal('');
    setEvidence('');
  };

  return (
    <div id="objections-screen-container" className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">بنك الاعتراضات والردود العلمية</h2>
          <p className="text-xs text-slate-500">
            أقوى الردود التكتيكية المدعمة بالدراسات لإقناع الأطباء أثناء الزيارة
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>اعتراض جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في الاعتراضات، الأدوية، أو الردود العلمية..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Objections List */}
      <div className="space-y-3">
        {filteredObjections.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
            لا توجد اعتراضات مسجلة مطابقة للبحث.
          </div>
        ) : (
          filteredObjections.map((obj) => (
            <div
              key={obj.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all space-y-3"
            >
              {/* Badges Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
                  {obj.productName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  {obj.category}
                </span>
              </div>

              {/* Objection Box */}
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wide">
                    اعتراض الطبيب:
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">"{obj.objectionText}"</p>
                </div>
              </div>

              {/* Scientific Rebuttal Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold text-teal-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  الرد التكتيكي والعلمي المقنع:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {obj.scientificRebuttal}
                </p>
              </div>

              {/* Clinical Evidence */}
              {obj.clinicalEvidence && (
                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-teal-50/40 p-2 rounded-lg border border-teal-100">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    <strong className="text-teal-900">الدراسة المرجعية:</strong> {obj.clinicalEvidence}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Objection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">إضافة اعتراض جديد لبنك الردود</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveObjection} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">المنتج المرتبط *</label>
                <CustomSelectBottomSheet
                  title="اختر المنتج المرتبط"
                  value={selectedProdId}
                  onChange={setSelectedProdId}
                  searchable={true}
                  options={products.map((p) => ({
                    value: p.id,
                    label: p.name,
                    icon: '💊',
                  }))}
                  buttonClassName="border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">تصنيف نوع الاعتراض *</label>
                <CustomSelectBottomSheet
                  title="تصنيف نوع الاعتراض"
                  value={category}
                  onChange={(val) => setCategory(val as any)}
                  searchable={false}
                  options={[
                    { value: 'سعر وتكلفة', label: 'سعر وتكلفة', icon: '💰' },
                    { value: 'فاعلية وسرعة', label: 'فاعلية وسرعة', icon: '⚡' },
                    { value: 'أمان وآثار جانبية', label: 'أمان وآثار جانبية', icon: '🛡️' },
                    { value: 'اعتياد على بديل', label: 'اعتياد على بديل', icon: '🔄' },
                    { value: 'توفر بالصيدليات', label: 'توفر بالصيدليات', icon: '🏪' },
                  ]}
                  buttonClassName="border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">نص اعتراض الطبيب الشائع *</label>
                <textarea
                  required
                  rows={2}
                  value={objectionText}
                  onChange={(e) => setObjectionText(e.target.value)}
                  placeholder="مثال: المريض يشتكي من ارتفاع السعر مقارنة بالبديل الهندي..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">الرد العلمي والتكتيكي المقنع *</label>
                <textarea
                  required
                  rows={3}
                  value={rebuttal}
                  onChange={(e) => setRebuttal(e.target.value)}
                  placeholder="اكتب الرد المفصل الذي يمكن للمندوب قوله مباشرة..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">الدراسة الإكلينيكية الداعمة (اختياري)</label>
                <input
                  type="text"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="مثال: دراسة EULAR 2023 المنشورة في Lancet..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  حفظ الاعتراض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
