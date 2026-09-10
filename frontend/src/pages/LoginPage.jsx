import { ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import logoImg from '../assets/logo.svg';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div
      className="h-[100dvh] w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
    >
      {/* Decorative gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, rgba(15,23,42,0.8) 100%)' }}
      />

      {/* Login Card */}
      <div
        className="relative z-10 w-full animate-fade-up max-w-[400px] mx-4"
      >
        {/* Card */}
        <div className="bg-white/95 dark:bg-[#262f3f]/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/90 dark:border-[#364356]">

          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b border-[#f0f2f5] dark:border-[#364356] bg-gradient-to-b from-[#f8fafc] to-white dark:from-[#1c232f] dark:to-[#262f3f] flex flex-col items-center">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm mb-3.5 flex items-center justify-center">
              <img
                src={logoImg}
                alt="CorpHub Logo"
                className="h-10 w-10 object-contain block"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight m-0">
                CorpHub
              </h2>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase mt-1">
                Enterprise Management Portal
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 text-center mb-5 font-normal">
              กรุณาเข้าสู่ระบบด้วยบัญชีองค์กร
            </p>

            <LoginForm />

            {/* Divider */}
            <div className="relative my-5">
              <div className="h-px bg-[#f0f2f5] dark:bg-[#364356]" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#262f3f] px-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
                หรือ
              </span>
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-[#fafbfc] dark:bg-[#1c232f] border border-[#e9ebee] dark:border-[#364356] rounded-xl py-2.5 px-4 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-[#fff7ed] dark:hover:bg-[#303b4e] hover:text-[#f89919] dark:hover:text-[#f89919] transition-all cursor-pointer"
            >
              <ArrowLeft size={15} className="text-[#f89919]" />
              กลับหน้าข่าวสารองค์กร
            </button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center mt-4 text-[11px] text-white/40 tracking-wider">
          © 2026 ASCG Group · All rights reserved
        </p>
      </div>
    </div>
  );
}