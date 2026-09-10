import { useState, useEffect } from 'react';
import { Calendar, Plus, FileText, Clock, FileWarning, Paperclip, X, HeartPulse, Briefcase, Plane, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';

export default function LeaveRequestPage() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewAttachment, setViewAttachment] = useState(null);
  
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    duration_type: 'Full Day',
    total_days: '',
    reason: ''
  });
  const [attachment, setAttachment] = useState(null);

  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Balances
      const balRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/my-balances', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const balData = await balRes.json();
      if (balRes.ok) setBalances(balData.data);

      // Fetch Requests
      const reqRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      if (reqRes.ok) setRequests(reqData.data);

      // Fetch Types for form
      const typeRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const typeData = await typeRes.json();
      if (typeRes.ok) setLeaveTypes(typeData.data.filter(t => t.is_active));

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leave_type_id || !formData.start_date || !formData.end_date || !formData.total_days || !formData.reason) {
      return Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => payload.append(key, formData[key]));
      if (attachment) {
        payload.append('attachment', attachment);
      }

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', 'ส่งคำขอลางานเรียบร้อยแล้ว', 'success');
        setShowForm(false);
        setFormData({ leave_type_id: '', start_date: '', end_date: '', duration_type: 'Full Day', total_days: '', reason: '' });
        setAttachment(null);
        fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const cancelRequest = async (id) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการยกเลิก?',
      text: "คุณต้องการยกเลิกคำขอลางานนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ปิด'
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/leave/requests/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Cancelled' })
        });
        if (response.ok) {
          Swal.fire('ยกเลิกสำเร็จ', '', 'success');
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f89919] to-[#d97c08] text-white flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ระบบลางาน (My Leave)</h1>
            <p className="text-[#ae8a68] dark:text-slate-400 text-sm mt-0.5">ตรวจสอบโควต้าและยื่นคำขอลางาน</p>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-md shadow-orange-200 dark:shadow-none shrink-0 cursor-pointer"
          >
            <Plus size={18} /> ยื่นขอลางาน
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-[#364356] pb-2">แบบฟอร์มขอลางาน</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField 
                label="ประเภทการลา" name="leave_type_id" value={formData.leave_type_id} onChange={handleInputChange} required
                placeholder="-- เลือกประเภทการลา --"
                options={leaveTypes.map(t => ({value: t.id, label: t.name}))}
              />
              <SelectField 
                label="ช่วงเวลา" name="duration_type" value={formData.duration_type} onChange={handleInputChange} required
                options={[
                  {value: 'Full Day', label: 'เต็มวัน'},
                  {value: 'Morning', label: 'ครึ่งเช้า'},
                  {value: 'Afternoon', label: 'ครึ่งบ่าย'}
                ]}
              />
              <InputField type="date" label="วันที่เริ่มต้น" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
              <InputField type="date" label="วันที่สิ้นสุด" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
              <InputField type="number" label="จำนวนวันลาทั้งหมด (วัน)" name="total_days" step="0.5" value={formData.total_days} onChange={handleInputChange} required placeholder="เช่น 1 หรือ 1.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">เหตุผลการลา</label>
              <textarea 
                name="reason" 
                value={formData.reason} 
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#f89919]/40 outline-none h-24"
                placeholder="ระบุเหตุผลการลา..."
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">เอกสารแนบ (เช่น ใบรับรองแพทย์)</label>
              <input 
                type="file" 
                onChange={(e) => setAttachment(e.target.files[0])}
                accept="image/*,.pdf"
                className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#f89919] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#fff8f0] dark:file:bg-amber-950/40 file:text-[#f89919] hover:file:bg-orange-100"
              />
              <p className="text-xs text-[#ae8a68] dark:text-slate-400 mt-1">รองรับไฟล์รูปภาพและ PDF ขนาดไม่เกิน 5MB</p>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-[#364356]">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
              <Button type="submit">ส่งคำขอ</Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Balances Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {balances.map(b => {
              // กำหนดไอคอนและสีตามประเภทการลา
              let Icon = FileText;
              let colorClass = 'text-slate-600 bg-slate-100';
              let ringClass = 'group-hover:ring-slate-400';
              
              if (b.leave_type_name.includes('ป่วย')) {
                Icon = HeartPulse;
                colorClass = 'text-rose-500 bg-rose-50';
                ringClass = 'group-hover:ring-rose-400';
              } else if (b.leave_type_name.includes('ลากิจ')) {
                Icon = Briefcase;
                colorClass = 'text-blue-500 bg-blue-50';
                ringClass = 'group-hover:ring-blue-400';
              } else if (b.leave_type_name.includes('พักร้อน')) {
                Icon = Plane;
                colorClass = 'text-emerald-500 bg-emerald-50';
                ringClass = 'group-hover:ring-emerald-400';
              }

              return (
                <div key={b.id} className={`bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] p-6 flex flex-col group hover:shadow-md transition-all relative overflow-hidden ring-1 ring-transparent ${ringClass}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <div className="bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                      โควต้า {b.total_days} วัน
                    </div>
                  </div>
                  
                  <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-1">{b.leave_type_name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{b.total_days - b.used_days - b.pending_days}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">วันคงเหลือ</span>
                  </div>
                  
                  <div className="mt-auto space-y-3 text-sm pt-4 border-t border-slate-100 dark:border-[#364356]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> ใช้ไปแล้ว</span>
                      <span className="font-semibold">{b.used_days} วัน</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600 dark:text-[#f89919]">
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-orange-400" /> รออนุมัติ</span>
                      <span className="font-semibold">{b.pending_days} วัน</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f]">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">ประวัติการลาของฉัน</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-400 text-sm">
                    <th className="py-3 px-6 font-semibold">ประเภท</th>
                    <th className="py-3 px-6 font-semibold">วันที่ลา</th>
                    <th className="py-3 px-6 font-semibold">จำนวนวัน</th>
                    <th className="py-3 px-6 font-semibold">เหตุผล</th>
                    <th className="py-3 px-6 font-semibold">สถานะ</th>
                    <th className="py-3 px-6 font-semibold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#364356]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-[#2e394b]/40 transition-colors">
                      <td className="py-3 px-6 font-medium text-slate-800 dark:text-slate-100">
                        {req.leave_type_name}
                        {req.attachment && (
                          <button 
                            type="button"
                            onClick={() => setViewAttachment(req.attachment)} 
                            className="ml-2 text-indigo-500 hover:text-indigo-700 inline-flex items-center cursor-pointer" 
                            title="ดูเอกสารแนบ"
                          >
                            <Paperclip size={14} />
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                        {new Date(req.start_date).toLocaleDateString('th-TH')} - {new Date(req.end_date).toLocaleDateString('th-TH')}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-300">{req.total_days} วัน</td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-300 text-sm truncate max-w-xs">{req.reason}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                          ${req.status === 'Approved' ? 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400' : 
                            req.status === 'Rejected' || req.status === 'Cancelled' ? 'bg-red-100 dark:bg-rose-950/40 text-red-700 dark:text-rose-400' : 
                            'bg-orange-100 dark:bg-amber-950/40 text-orange-700 dark:text-[#f89919]'}`}>
                          {req.status === 'Pending Manager' ? 'รอหัวหน้าอนุมัติ' :
                           req.status === 'Pending HR' ? 'รอ HR ตรวจสอบ' :
                           req.status === 'Approved' ? 'อนุมัติแล้ว' :
                           req.status === 'Cancelled' ? 'ยกเลิก' : 'ไม่อนุมัติ'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {(req.status === 'Pending Manager' || req.status === 'Pending HR') && (
                          <button 
                            onClick={() => cancelRequest(req.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 dark:text-slate-400">ไม่มีประวัติการลางาน</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Attachment Modal */}
      {viewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200 dark:border-[#364356]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f] shrink-0 z-10">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">เอกสารแนบ</h3>
              <button 
                onClick={() => setViewAttachment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-[#262f3f] hover:bg-slate-100 dark:hover:bg-[#1c232f] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 flex justify-center items-center bg-slate-100 dark:bg-[#181e28] min-h-0 overflow-hidden">
              {viewAttachment.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`} 
                  className="w-full h-full rounded-xl border border-slate-300 dark:border-[#364356] bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`} 
                  alt="Attachment" 
                  className="w-full h-full object-contain rounded-xl drop-shadow-sm bg-white dark:bg-[#262f3f]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

