import { CalendarOff, UserCheck, Receipt, Users } from 'lucide-react';

export default function EmployeeQuickActions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">บริการสำหรับพนักงาน (Self-Service)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <button className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <CalendarOff size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">ยื่นใบลา</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <UserCheck size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">ประวัติส่วนตัว</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <Receipt size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">สลิปเงินเดือน</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
          <Users size={32} className="text-gray-400 group-hover:text-blue-600 mb-3" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">รายชื่อเพื่อนร่วมงาน</span>
        </button>

      </div>
    </div>
  );
}