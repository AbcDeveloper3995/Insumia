import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = forwardRef(({ 
  value, 
  onChange, 
  onBlur, 
  options = [], 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false,
  error = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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
            <div className="p-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500 text-center">No hay opciones</div>
              ) : (
                options.map((groupOrOption, index) => {
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CustomSelect.displayName = 'CustomSelect';
