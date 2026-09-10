export default function SelectField({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  icon: Icon, 
  required, 
  disabled,
  placeholder = '-- กรุณาเลือก --'
}) {
  const hasEmptyOption = options.some((opt) => opt.value === '');

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon size={18} />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`block w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 border border-slate-300 dark:border-[#364356] rounded-xl focus:ring-2 focus:ring-[#f89919]/30 focus:border-[#f89919] bg-white dark:bg-[#1c232f] transition-all text-sm text-slate-900 dark:text-slate-100 outline-none hover:border-slate-400 dark:hover:border-slate-500 disabled:bg-slate-100 dark:disabled:bg-[#181f2a] disabled:text-slate-400 disabled:cursor-not-allowed`}
        >
          {!hasEmptyOption && placeholder && (
            <option value="" disabled className="dark:bg-[#1c232f]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-[#1c232f]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}