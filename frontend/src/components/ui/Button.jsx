import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  type = 'button', 
  isLoading = false, 
  disabled = false, 
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  className = ''
}) {
  const baseStyle = "w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";

  const variants = {
    primary: "bg-[#f89919] hover:bg-[#d97c08] text-white shadow-orange-200/50 focus:ring-2 focus:ring-[#f89919]",
    secondary: "bg-[#ae8a68] hover:bg-[#8a6a4a] text-white focus:ring-2 focus:ring-[#ae8a68]",
    outline: "bg-white border border-[#dfe0df] text-[#ae8a68] hover:bg-[#fff8f0] hover:border-[#ae8a68]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-2 focus:ring-rose-500",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyle} ${selectedVariant} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
          กำลังดำเนินการ...
        </>
      ) : (
        children
      )}
    </button>
  );
}