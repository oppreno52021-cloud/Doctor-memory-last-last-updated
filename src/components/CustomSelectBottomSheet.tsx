import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectBottomSheetProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  title?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
}

export const CustomSelectBottomSheet: React.FC<CustomSelectBottomSheetProps> = ({
  value,
  onChange,
  options,
  title,
  placeholder = 'اختر...',
  className = '',
  buttonClassName = '',
  icon,
  disabled = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [align, setAlign] = useState<'right' | 'left'>('right');
  const containerRef = useRef<HTMLDivElement>(null);

  // Check positioning relative to viewport when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If expanding leftwards (right-0) would clip against left edge of screen
      if (rect.right < 220 || (rect.left < 20 && rect.right < 250)) {
        setAlign('left');
      } else {
        setAlign('right');
      }
    }
  }, [isOpen]);

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 min-h-[38px] rounded-xl text-xs font-bold transition-all text-right cursor-pointer select-none border ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            : isOpen
            ? 'bg-white dark:bg-slate-800 border-[#0a3d62] dark:border-teal-500 shadow-xs text-slate-900 dark:text-white ring-2 ring-[#0a3d62]/10 dark:ring-teal-500/20'
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 text-right">
          {icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#0a3d62] dark:text-teal-400' : ''
          }`}
        />
      </button>

      {/* Micro-Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-50 top-full mt-1.5 ${
              align === 'right' ? 'right-0' : 'left-0'
            } w-full min-w-[210px] max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden`}
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))' }}
          >
            {/* Header (Optional Title & Quick Search if many options) */}
            {(title || (searchable && options.length > 7)) && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 space-y-1.5 bg-slate-50/70 dark:bg-slate-900/70">
                {title && (
                  <div className="text-xs font-black tracking-wide text-slate-400 dark:text-slate-400 px-1 text-right">
                    {title}
                  </div>
                )}
                {searchable && options.length > 7 && (
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث سريع..."
                      className="w-full text-right pr-7 pl-6 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0a3d62] dark:focus:border-teal-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-4 text-xs font-semibold text-slate-400">
                  لا توجد نتائج
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[38px] rounded-xl text-right transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-[#0a3d62]/10 dark:bg-teal-500/15 text-[#0a3d62] dark:text-teal-400 font-black'
                          : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/90 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Right side: Option label & icon */}
                      <div className="flex items-center gap-2 min-w-0 text-right">
                        {opt.icon && <span className="shrink-0 text-sm">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[0.7rem] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      {/* Left side: subtle check icon */}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0a3d62] dark:text-teal-400 stroke-[3] shrink-0 mr-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
