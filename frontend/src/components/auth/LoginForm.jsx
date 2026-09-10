import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { getApiBase } from '../../config/api';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // ตรวจสอบสถานะการเข้าสู่ระบบและดึงข้อมูลที่จดจำไว้
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const rememberPref = localStorage.getItem('ascg_remember_me');

    // ถ้ามี Token อยู่แล้ว ให้พาไป Dashboard ทันที
    if (token) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // ดึงอีเมล/ชื่อผู้ใช้ที่บันทึกไว้
    const savedLogin = localStorage.getItem('ascg_remembered_email');
    if (savedLogin) {
      setEmail(savedLogin);
    }
    if (rememberPref !== null) {
      setRememberMe(rememberPref === 'true');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const baseUrl = getApiBase();

      // ยิง API ไปยัง Backend พร้อม flag rememberMe
      const response = await fetch(baseUrl + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // หากเลือกจดจำการเข้าสู่ระบบ ให้บันทึกอีเมลและตั้งค่าไว้
        if (rememberMe) {
          localStorage.setItem('ascg_remembered_email', email);
          localStorage.setItem('ascg_remember_me', 'true');
        } else {
          localStorage.removeItem('ascg_remembered_email');
          localStorage.setItem('ascg_remember_me', 'false');
        }

        // เก็บ Token ลง localStorage
        localStorage.setItem('auth_token', data.token);
        // เก็บข้อมูล User เบื้องต้นไว้ใช้งานในระบบ
        localStorage.setItem('user_info', JSON.stringify(data.user));
        // เคลียร์สถานะการจำลองสิทธิ์ตกค้างของผู้ใช้ก่อนหน้า
        localStorage.removeItem('mockRole');
        
        // เปลี่ยนหน้าไปที่ Dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // หากไม่สำเร็จ (เช่น รหัสผิด) ให้แสดงข้อความ Error จาก Backend
        setError(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login Fetch Error:', err);
      // กรณี Server ดาวน์ หรือ Network มีปัญหา
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      // ปิดสถานะ Loading ไม่ว่าจะสำเร็จหรือล้มเหลว
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} method="post" action="#">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <InputField
        id="username"
        name="username"
        label="อีเมลองค์กร / ชื่อผู้ใช้"
        type="text"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@company.com หรือ admin"
        autoComplete="username"
        required
        disabled={isLoading}
      />

      <InputField
        id="password"
        name="password"
        label="รหัสผ่าน"
        type="password"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
        disabled={isLoading}
      />

      {/* Remember Me Checkbox (นำลืมรหัสผ่านออกแล้ว) */}
      <div className="flex items-center justify-between pt-1">
        <label htmlFor="remember-me" className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-orange-500 accent-amber-500 focus:ring-amber-400 border-slate-300 rounded cursor-pointer transition-all"
            disabled={isLoading}
          />
          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
            จดจำการเข้าสู่ระบบบนอุปกรณ์นี้
          </span>
        </label>
      </div>

      <Button type="submit" isLoading={isLoading}>
        เข้าสู่ระบบ
      </Button>
    </form>
  );
}