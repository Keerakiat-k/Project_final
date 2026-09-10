import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, Trash2, Paperclip, X } from 'lucide-react';
import Swal from 'sweetalert2';
import Button from '../components/ui/Button';

export default function LeaveManagementPage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewAttachment, setViewAttachment] = useState(null);
  
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = userInfo.role === 'Admin' || userInfo.role === 'HR';

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/approvals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setRequests(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    let reject_reason = '';

    if (status === 'Rejected') {
      const { value: reason } = await Swal.fire({
        title: 'ระบุเหตุผลที่ไม่อนุมัติ',
        input: 'text',
        inputPlaceholder: 'กรอกเหตุผล...',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        inputValidator: (value) => {
          if (!value) {
            return 'กรุณาระบุเหตุผล!';
          }
        }
      });
      if (!reason) return;
      reject_reason = reason;
    } else {
      const confirm = await Swal.fire({
        title: 'ยืนยันการอนุมัติ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
      });
      if (!confirm.isConfirmed) return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/leave/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reject_reason })
      });
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', 'อัปเดตสถานะเรียบร้อยแล้ว', 'success');
        fetchApprovals();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  };

  const handleDeleteRequest = async (id) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณต้องการลบคำขอลางานนี้ใช่หรือไม่? ข้อมูลจะถูกลบถาวรและคืนสิทธิ์วันลา',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/leave/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', 'ลบคำขอลางานเรียบร้อยแล้ว', 'success');
        fetchApprovals();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#fff8f0] dark:bg-amber-950/40 text-[#f89919] flex items-center justify-center border border-[#dfe0df] dark:border-amber-900/60">
          <ClipboardList size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">อนุมัติการลา (Leave Approvals)</h1>
          <p className="text-[#ae8a68] dark:text-slate-400">ตรวจสอบและอนุมัติคำขอลางานของพนักงาน</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-[#dfe0df] dark:border-[#364356] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#dfe0df] dark:border-[#364356] flex justify-between items-center bg-[#fff8f0] dark:bg-[#1c232f]">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">รายการคำขอลางาน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-400 text-sm">
                <th className="py-3 px-6 font-semibold">ผู้ขอ</th>
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
                  <td className="py-3 px-6">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{req.emp_fname} {req.emp_lname}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">({req.emp_nick})</div>
                  </td>
                  <td className="py-3 px-6 font-medium text-slate-700 dark:text-slate-200">
                    {req.leave_type_name}
                    {req.attachment && (
                      <button 
                        type="button"
                        onClick={() => setViewAttachment(req.attachment)} 
                        className="ml-2 text-[#f89919] hover:text-[#d97c08] inline-flex items-center" 
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
                  <td className="py-3 px-6 text-slate-600 dark:text-slate-300 text-sm max-w-[200px] truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        req.status === 'Rejected' || req.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                        'bg-orange-100 text-orange-700'}`}>
                      {req.status === 'Pending Manager' ? 'รอหัวหน้าอนุมัติ' :
                       req.status === 'Pending HR' ? 'รอ HR ตรวจสอบ' :
                       req.status === 'Approved' ? 'อนุมัติแล้ว' :
                       req.status === 'Cancelled' ? 'ยกเลิก' : 'ไม่อนุมัติ'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center flex justify-center gap-2">
                    {/* If Admin/HR viewing, and status is Pending HR -> They can Approve/Reject */}
                    {/* If Manager viewing, and status is Pending Manager -> They can Approve to Pending HR / Reject */}
                    {isAdmin && req.status === 'Pending HR' && (
                      <>
                        <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="text-green-600 hover:text-green-800 bg-green-50 p-2 rounded-lg" title="อนุมัติ"><CheckCircle size={18} /></button>
                        <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-lg" title="ไม่อนุมัติ"><XCircle size={18} /></button>
                      </>
                    )}
                    {!isAdmin && req.status === 'Pending Manager' && (
                      <>
                        <button onClick={() => handleUpdateStatus(req.id, 'Pending HR')} className="text-green-600 hover:text-green-800 bg-green-50 p-2 rounded-lg" title="อนุมัติส่งต่อให้ HR"><CheckCircle size={18} /></button>
                        <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-lg" title="ไม่อนุมัติ"><XCircle size={18} /></button>
                      </>
                    )}
                    
                    {/* Delete button (Admin can always delete) */}
                    {isAdmin && (
                      <button onClick={() => handleDeleteRequest(req.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg ml-2" title="ลบคำขอ">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 dark:text-slate-400">ไม่มีรายการที่ต้องอนุมัติ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachment Modal */}
      {viewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200 dark:border-[#364356]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f] shrink-0 z-10">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">เอกสารแนบ</h3>
              <button 
                onClick={() => setViewAttachment(null)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 flex justify-center items-center bg-slate-100 dark:bg-[#181e28] min-h-0 overflow-hidden">
              {viewAttachment.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`} 
                  className="w-full h-full rounded border border-slate-300 bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`} 
                  alt="Attachment" 
                  className="w-full h-full object-contain rounded drop-shadow-sm bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

