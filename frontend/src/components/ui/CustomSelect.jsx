import React, { useState, useRef, useEffect, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export const CustomSelect = forwardRef(({ 
  value, 
  onChange, 
  onBlur, 
  options = [], 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false,
  error = false,
  isSearchable = true // default true para todos
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  // Flatten options to easily find selected label
  const flatOptions = options.reduce((acc, curr) => {
    if (curr.options) {
      return [...acc, ...curr.options];
    }
    return [...acc, curr];
  }, []);

  const selectedOption = flatOptions.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Reset search term when closed, focus when opened
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    } else if (isSearchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, isSearchable]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();

    return options.map(groupOrOption => {
      if (groupOrOption.options) {
        const filteredGroupOptions = groupOrOption.options.filter(opt => 
          opt.label.toLowerCase().includes(lowerSearch)
        );
        if (filteredGroupOptions.length > 0) {
          return { ...groupOrOption, options: filteredGroupOptions };
        }
        return null;
      }
      if (groupOrOption.label.toLowerCase().includes(lowerSearch)) {
        return groupOrOption;
      }
      return null;
    }).filter(Boolean);
  }, [options, searchTerm, isSearchable]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Hidden input to hold value if needed for forms, though controller usually handles it */}
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-sm text-left
          ${error ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}
          ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/50'}
        `}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-700'}`}>
          {displayLabel}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="p-1 flex flex-col max-h-60">
              {isSearchable && (
                <div className="px-2 pb-1 sticky top-0 bg-white z-10 pt-1">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              
              <div className="overflow-y-auto flex-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500 text-center">No hay opciones</div>
                ) : (
                  filteredOptions.map((groupOrOption, index) => {
                  // If it's a group
                  if (groupOrOption.options) {
                    return (
                      <div key={index} className="mb-1 last:mb-0">
                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          {groupOrOption.label}
                        </div>
                        {groupOrOption.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer
                              ${value === opt.value 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                            `}
                          >
                            <span className="truncate">{opt.label}</span>
                            {value === opt.value && <Check size={14} className="text-blue-600 shrink-0 ml-2" />}
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // If it's a flat option
                  return (
                    <button
                      key={groupOrOption.value}
                      type="button"
                      onClick={() => handleSelect(groupOrOption.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer
                        ${value === groupOrOption.value 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                      `}
                    >
                      <span className="truncate">{groupOrOption.label}</span>
                      {value === groupOrOption.value && <Check size={14} className="text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CustomSelect.displayName = 'CustomSelect';
