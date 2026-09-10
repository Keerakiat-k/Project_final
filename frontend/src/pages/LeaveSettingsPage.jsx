import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Button from '../components/ui/Button';

export default function LeaveSettingsPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', default_days: 0, is_active: 1 });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setLeaveTypes(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อประเภทการลา', 'warning');
    
    const url = isEditing 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/leave/types/${isEditing}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/leave/types`;
      
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
        setFormData({ name: '', default_days: 0, is_active: 1 });
        setIsEditing(null);
        fetchLeaveTypes();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleEdit = (type) => {
    setIsEditing(type.id);
    setFormData({ name: type.name, default_days: type.default_days, is_active: type.is_active });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#f89919] flex items-center justify-center border border-amber-200/60 dark:border-amber-900/60">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ตั้งค่าการลา (Leave Settings)</h1>
          <p className="text-slate-500 dark:text-slate-400">จัดการประเภทการลาและโควต้าตั้งต้น</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{isEditing ? 'แก้ไขประเภทการลา' : 'เพิ่มประเภทการลาใหม่'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อประเภทการลา</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#f89919]/40 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="เช่น ลาป่วย, ลากิจ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">จำนวนวัน (ตั้งต้น)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#f89919]/40 outline-none"
              value={formData.default_days}
              onChange={(e) => setFormData({...formData, default_days: Number(e.target.value)})}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} icon={Plus}>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่ม'}</Button>
            {isEditing && (
              <Button variant="outline" onClick={() => { setIsEditing(null); setFormData({name:'', default_days:0, is_active:1}) }}>ยกเลิก</Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-400 text-sm">
              <th className="py-4 px-6 font-semibold">ชื่อประเภทการลา</th>
              <th className="py-4 px-6 font-semibold">โควต้าเริ่มต้น (วัน)</th>
              <th className="py-4 px-6 font-semibold">สถานะ</th>
              <th className="py-4 px-6 font-semibold w-32 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#364356]">
            {leaveTypes.map((type) => (
              <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-[#2e394b]/40 transition-colors">
                <td className="py-4 px-6 text-slate-800 dark:text-slate-100 font-medium">{type.name}</td>
                <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{type.default_days} วัน</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${type.is_active ? 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-rose-950/40 text-red-700 dark:text-rose-400'}`}>
                    {type.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <button onClick={() => handleEdit(type)} className="text-amber-600 dark:text-[#f89919] hover:text-amber-700 dark:hover:text-amber-400 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {leaveTypes.length === 0 && !isLoading && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-400">ไม่มีข้อมูลประเภทการลา</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

