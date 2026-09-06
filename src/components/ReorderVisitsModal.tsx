import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import {
  X,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  ListOrdered,
  MapPin,
  Stethoscope,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
} from 'lucide-react';
import { useBackAction } from '../utils/backNavigation';

interface ReorderVisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  visitedDoctorIds: Set<string> | string[];
  onSaveOrder: (newOrderedDoctorIds: string[]) => void;
}

export const getClassBadgeClass = (classification?: string) => {
  const c = (classification || '').trim().toUpperCase();
  if (c === 'A+' || c.includes('VIP') || c.includes('*')) {
    return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/60';
  }
  if (c === 'A' || c.startsWith('A')) {
    return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60';
  }
  if (c === 'B' || c.startsWith('B')) {
    return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60';
  }
  if (c === 'C' || c.startsWith('C')) {
    return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600';
};

export const ReorderVisitsModal: React.FC<ReorderVisitsModalProps> = ({
  isOpen,
  onClose,
  doctors,
  visitedDoctorIds,
  onSaveOrder,
}) => {
  const [orderedDoctors, setOrderedDoctors] = useState<Doctor[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderedDoctors([...doctors]);
    }
  }, [isOpen]);

  // Global Back Action to close modal
  useBackAction(isOpen, 'reorder-visits-modal', onClose);

  if (!isOpen) return null;

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedDoctors.length) return;

    const updated = [...orderedDoctors];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setOrderedDoctors(updated);
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const updated = [...orderedDoctors];
    const [movedItem] = updated.splice(index, 1);
    updated.unshift(movedItem);
    setOrderedDoctors(updated);
  };

  const moveToBottom = (index: number) => {
    if (index === orderedDoctors.length - 1) return;
    const updated = [...orderedDoctors];
    const [movedItem] = updated.splice(index, 1);
    updated.push(movedItem);
    setOrderedDoctors(updated);
  };

  const handleReset = () => {
    setOrderedDoctors([...doctors]);
  };

  const handleSave = () => {
    onSaveOrder(orderedDoctors.map((d) => d.id));
    onClose();
  };

  // Drag & drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...orderedDoctors];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, movedItem);
    setDraggedIndex(index);
    setOrderedDoctors(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a3d62]/10 dark:bg-[#42A5F5]/10 border border-[#0a3d62]/20 dark:border-[#42A5F5]/30 flex items-center justify-center text-[#0a3d62] dark:text-[#42A5F5]">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ترتيب خط سير زيارات اليوم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {orderedDoctors.length} أطباء مجدولين اليوم • رتّب حسب مسارك الميداني
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational tip */}
        <div className="my-2.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-[11px] text-sky-800 dark:text-sky-300 flex items-center justify-between">
          <span>استخدم أزرار الأسهم أو اسحب للترتيب حسب تسلسل زيارتك</span>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        {/* Doctor list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {orderedDoctors.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              لا يوجد أطباء مجدولين لليوم لترتيبهم
            </div>
          ) : (
            orderedDoctors.map((doc, index) => {
              const isVisited =
                visitedDoctorIds instanceof Set
                  ? visitedDoctorIds.has(doc.id)
                  : Array.isArray(visitedDoctorIds)
                  ? (visitedDoctorIds as string[]).includes(doc.id)
                  : false;
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={doc.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-[#0a3d62] bg-[#0a3d62]/5'
                      : isVisited
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Grip Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0"
                    title="اسحب لتغيير الترتيب"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Order Number Badge */}
                  <div className="w-7 h-7 rounded-lg bg-[#0a3d62] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
                    {index + 1}
                  </div>

                  {/* Doctor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {doc.name}
                      </h4>
                      {doc.classification && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${getClassBadgeClass(
                            doc.classification
                          )}`}
                        >
                          {doc.classification}
                        </span>
                      )}
                      {isVisited && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          تمت ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span className="flex items-center gap-0.5">
                        <Stethoscope className="w-3 h-3 text-slate-400" />
                        {doc.specialty}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {doc.territory}
                      </span>
                    </div>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveToTop(index)}
                      disabled={index === 0}
                      className="p-1 rounded-md text-slate-400 hover:text-[#0a3d62] hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      title="نقل لأول القائمة"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      title="رفع درجة للأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === orderedDoctors.length - 1}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      title="خفض درجة للأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToBottom(index)}
                      disabled={index === orderedDoctors.length - 1}
                      className="p-1 rounded-md text-slate-400 hover:text-[#0a3d62] hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      title="نقل لآخر القائمة"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#0a3d62] hover:bg-[#072a44] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#0a3d62]/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ الترتيب المعتمد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
