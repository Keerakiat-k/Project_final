export default function TextareaField({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required, 
  disabled,
  rows = 3 
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500 resize-y"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}