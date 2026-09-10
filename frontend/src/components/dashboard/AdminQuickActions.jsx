import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Settings } from 'lucide-react';


export default function AdminQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">เมนูลัด (Quick Actions)</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        
        {/* ลิงก์ไปหน้าเพิ่มพนักงานที่เราสร้างไว้ */}
        <button
          onClick={() => navigate('/employees/new')} 
          className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <UserPlus size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">เพิ่มพนักงานใหม่</span>
        </button>

        {/* ลิงก์ไปหน้าตารางรายชื่อพนักงาน */}
        <button 
          onClick={() => navigate('/employee-list')}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <Users size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">ทะเบียนพนักงาน</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <Settings size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">ตั้งค่าระบบ</span>
        </button>

      </div>
    </div>
  );
}