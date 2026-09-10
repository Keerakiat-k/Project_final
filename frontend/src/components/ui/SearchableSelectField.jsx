import React from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useTheme } from '../../context/ThemeContext';

export default function SearchableSelectField({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  icon: Icon, 
  required, 
  disabled,
  allowCustom = false,
  placeholder = "-- กรุณาเลือก --"
}) {
  let isDark = false;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx.isDark;
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  // If value exists, find in options or generate display option
  const selectedOption = options?.find(opt => String(opt.value) === String(value)) 
    || (value ? { value: String(value), label: String(value) } : null);

  const handleChange = (selected) => {
    const selectedVal = selected ? selected.value : '';
    if (typeof onChange === 'function') {
      onChange({ target: { name, value: selectedVal } });
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      paddingTop: '2px',
      paddingBottom: '2px',
      paddingLeft: Icon ? '2.5rem' : '0.25rem',
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#f89919' : (isDark ? '#364356' : '#cbd5e1'),
      boxShadow: state.isFocused ? '0 0 0 2px rgba(248, 153, 25, 0.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#f89919' : (isDark ? '#4b5b75' : '#94a3b8')
      },
      backgroundColor: disabled 
        ? (isDark ? '#181e28' : '#f1f5f9') 
        : (isDark ? '#1c232f' : '#ffffff'),
      cursor: 'pointer',
    }),
    valueContainer: (base) => ({
      ...base,
      paddingLeft: Icon ? '0.25rem' : '0.5rem',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      margin: '0px',
      padding: '0px',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontWeight: 500,
      fontSize: '13px',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '13px',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? '#364356' : '#e2e8f0',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      '&:hover': {
        color: isDark ? '#cbd5e1' : '#475569',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      '&:hover': {
        color: isDark ? '#cbd5e1' : '#475569',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#262f3f' : '#ffffff',
      border: `1px solid ${isDark ? '#364356' : '#e2e8f0'}`,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 99999,
      boxShadow: isDark 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      backgroundColor: isDark ? '#262f3f' : '#ffffff',
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      backgroundColor: state.isSelected 
        ? '#f89919' 
        : state.isFocused 
          ? (isDark ? '#364356' : '#fff8f0') 
          : 'transparent',
      color: state.isSelected 
        ? '#ffffff' 
        : (isDark ? '#f8fafc' : '#0f172a'),
      cursor: 'pointer',
      fontSize: '13px',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: '#f89919',
        color: '#ffffff',
      }
    })
  };

  const SelectComponent = allowCustom ? CreatableSelect : Select;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 z-10">
            <Icon size={18} />
          </div>
        )}
        <SelectComponent
          name={name}
          value={selectedOption}
          onChange={handleChange}
          options={options}
          isDisabled={disabled}
          placeholder={placeholder}
          styles={customStyles}
          isClearable
          isSearchable
          formatCreateLabel={(input) => `+ เพิ่ม "${input}" เป็นรายการใหม่`}
        />
      </div>
    </div>
  );
}
