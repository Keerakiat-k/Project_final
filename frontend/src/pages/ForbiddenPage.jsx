import { ShieldAlert, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  let user = {};
  try {
    const stored = localStorage.getItem('user_info');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      user = JSON.parse(stored);
    }
  } catch (e) {
    user = {};
  }

  const isSimulating = Boolean(user.original_role) || Boolean(localStorage.getItem('mockRole'));

  const handleResetRole = () => {
    const realRole = user.original_role || 'Admin';
    const resetUser = {
      ...user,
      role: realRole,
      role_id: 1,
      permissions: user.original_permissions || [
        'view_dashboard', 'manage_employees', 'manage_announcements', 'manage_assets', 'manage_it_support', 'manage_settings'
      ],
      original_role: undefined,
      original_permissions: undefined
    };
    localStorage.setItem('user_info', JSON.stringify(resetUser));
    localStorage.removeItem('mockRole');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e2430] flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-[#262f3f] p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none max-w-md w-full text-center border border-slate-100 dark:border-[#364356] relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-50 dark:bg-rose-950/20 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-50 dark:bg-amber-950/20 rounded-full blur-2xl opacity-60"></div>

        <div className="relative">
          <div className="w-20 h-20 bg-red-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-200 dark:border-rose-900/60">
            <ShieldAlert size={40} className="text-red-500 dark:text-rose-400" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">403 Forbidden</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            ขออภัยครับ คุณไม่มีสิทธิ์เข้าถึงหน้านี้ <br/>
            <span className="text-sm text-slate-500 dark:text-slate-400">กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่านี่คือข้อผิดพลาด</span>
          </p>

          {isSimulating && (
            <div className="mb-6 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-left text-xs text-amber-900 dark:text-amber-200">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <UserCheck size={16} className="text-[#f89919]" />
                <span>คุณกำลังจำลองสิทธิ์:</span>
                <span className="bg-[#f89919] text-white px-2 py-0.5 rounded-md font-mono">{user.role}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">
                หน้านี้สงวนสิทธิ์สำหรับบทบาทอื่น คุณสามารถกดปุ่มด้านล่างเพื่อคืนค่าสิทธิ์ผู้ดูแลระบบหลักได้ทันที
              </p>
              <button
                onClick={handleResetRole}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
              >
                <RefreshCw size={14} />
                <span>คืนค่าสิทธิ์ดั้งเดิม ({user.original_role || 'Admin'})</span>
              </button>
            </div>
          )}

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={18} />
            กลับสู่หน้าแดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
