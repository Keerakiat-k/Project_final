import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Edit, Trash2, Search, Mail, X, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { TableSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';

export default function AnnouncementListPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user_info') || '{}');
  const userRole = user.role || 'Admin'; // Admin, HR, etc.
  
  const [senderType, setSenderType] = useState(userRole === 'HR' ? 'HR' : 'IT');
  const [selectedBccList, setSelectedBccList] = useState([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [bccOptions, setBccOptions] = useState([]);

  const fetchBccOptions = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/bcc-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setBccOptions(result.data.map(item => ({
          value: item.email,
          label: `${item.label} : ${item.email}`
        })));
      }
    } catch (error) {
      console.error('Error fetching bcc options:', error);
    }
  };

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/announcements?all=true');
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setAnnouncements(result.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลประกาศได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchAnnouncements();
    fetchBccOptions();
  }, []);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = (id, title) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบประกาศ "${title}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4f46e5',
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            Swal.fire('ลบแล้ว!', 'ลบประกาศสำเร็จ', 'success');
            fetchAnnouncements();
          }
        } catch (error) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถลบประกาศได้', 'error');
        }
      }
    });
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: newStatus })
      });
      if (response.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  };

  const handleOpenEmailModal = (item) => {
    setSelectedAnnouncement(item);
    setSenderType(userRole === 'HR' ? 'HR' : 'IT');
    setSelectedBccList([]);
    setIsEmailModalOpen(true);
  };

  const handleBccToggle = (email) => {
    setSelectedBccList(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSelectAllBcc = (e) => {
    if (e.target.checked) {
      setSelectedBccList(bccOptions.map(o => o.value));
    } else {
      setSelectedBccList([]);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedAnnouncement || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      Swal.fire({
        title: 'กำลังส่งอีเมลประกาศ...',
        html: '<div style="color: #64748b; font-size: 14px; margin-top: 8px;">กำลังเชื่อมต่อ Mail Server และส่งอีเมลพร้อมแนบรูปภาพ<br/><span style="font-size: 12px; color: #f89919;">(อาจใช้เวลาประมาณ 3 - 5 วินาที กรุณารอสักครู่)</span></div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/${selectedAnnouncement.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          senderType, 
          selectedBccList 
        })
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'ส่งอีเมลสำเร็จ!',
          text: data.message,
          timer: 2000,
          showConfirmButton: false
        });
        setIsEmailModalOpen(false);
      } else {
        Swal.fire({
          icon: data.status === 'warning' ? 'warning' : 'error',
          title: data.status === 'warning' ? 'แจ้งเตือน' : 'เกิดข้อผิดพลาด',
          text: data.message
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งอีเมลได้'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };


  const filteredData = announcements.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-fade-up">

      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-2xl">
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="bg-orange-50 dark:bg-amber-950/40 border border-orange-200 dark:border-amber-900">
              <Megaphone size={18} style={{ color: '#f89919' }} />
            </div>
            จัดการประกาศองค์กร
          </h1>
          <p className="page-subtitle mt-1 text-slate-500 dark:text-slate-400 text-sm">จัดการประกาศ ข่าวสาร และกิจกรรมทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={() => navigate('/admin/announcements/new')}
          className="btn-primary flex items-center gap-2 whitespace-nowrap w-fit bg-[#f89919] hover:bg-[#d97c08] text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
        >
          <Plus size={16} />
          เพิ่มประกาศใหม่
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-[#262f3f] border border-[#e9ebee] dark:border-[#364356] rounded-2xl p-3.5 shadow-xs mb-5 transition-colors">
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="ค้นหาหัวข้อประกาศ..."
            className="input-base w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#f89919]/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white dark:bg-[#262f3f] border border-[#e9ebee] dark:border-[#364356] rounded-2xl shadow-xs overflow-hidden transition-colors">
        
        {/* Desktop Table (hidden on < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-[#fafbfc] dark:bg-[#1c232f] border-b border-[#e9ebee] dark:border-[#364356]">
                {['หัวข้อ', 'ประเภท', 'สถานะ', 'วันที่ลงประกาศ', ''].map((h, i) => (
                  <th key={i} className="table-header-cell px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase" style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
              {isLoading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="table-row hover:bg-slate-50/80 dark:hover:bg-[#2e394b]/40 transition-colors border-b border-slate-100 dark:border-[#364356]">
                    <td style={{ padding: '14px 16px' }}>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{item.title}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 9999, fontSize: 11.5, fontWeight: 600,
                        ...(item.type === 'ประกาศสำคัญ' ? { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' } :
                           item.type === 'กิจกรรม' ? { background: '#fff7ed', color: '#c2690a', border: '1px solid #fed7aa' } :
                           { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' })
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.type === 'ประกาศสำคัญ' ? '#e11d48' : item.type === 'กิจกรรม' ? '#f89919' : '#9ca3af' }} />
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        style={{
                          padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                          border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
                          ...(item.status === 'Active'
                            ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }
                            : { background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' })
                        }}
                      >
                        {item.status === 'Active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#9ca3af' }}>
                      {new Date(item.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        {[{ icon: <Mail size={15} />, title: 'ส่งอีเมล', action: () => handleOpenEmailModal(item), hoverColor: '#4f46e5', hoverBg: '#eef2ff' },
                          { icon: <Edit size={15} />, title: 'แก้ไข', action: () => navigate(`/admin/announcements/edit/${item.id}`), hoverColor: '#b45309', hoverBg: '#fff7ed' },
                          { icon: <Trash2 size={15} />, title: 'ลบ', action: () => handleDelete(item.id, item.title), hoverColor: '#dc2626', hoverBg: '#fff1f2' }
                        ].map((btn, i) => (
                          <button
                            key={i} onClick={btn.action} title={btn.title}
                            style={{ padding: '6px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = btn.hoverColor; e.currentTarget.style.background = btn.hoverBg; e.currentTarget.style.borderColor = btn.hoverBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>ไม่พบข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (block on < md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <MobileCardSkeleton count={3} />
          ) : currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors">
                
                {/* Top: Type Badge + Status Toggle */}
                <div className="flex items-center justify-between">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 600,
                    ...(item.type === 'ประกาศสำคัญ' ? { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' } :
                       item.type === 'กิจกรรม' ? { background: '#fff7ed', color: '#c2690a', border: '1px solid #fed7aa' } :
                       { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' })
                  }}>
                    {item.type}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    style={{
                      padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 600,
                      border: '1px solid', cursor: 'pointer',
                      ...(item.status === 'Active'
                        ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }
                        : { background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' })
                    }}
                  >
                    {item.status === 'Active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </button>
                </div>

                {/* Title */}
                <div className="font-bold text-slate-900 text-sm leading-snug">
                  {item.title}
                </div>

                {/* Date + Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('th-TH')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEmailModal(item)}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-indigo-200"
                    >
                      <Mail size={12} /> ส่งเมล
                    </button>
                    <button
                      onClick={() => navigate(`/admin/announcements/edit/${item.id}`)}
                      className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-amber-200"
                    >
                      <Edit size={12} /> แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">ไม่พบข้อมูล</div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              แสดง {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '5px 12px', border: '1px solid #e9ebee', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'white', color: '#4b5563', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page} onClick={() => setCurrentPage(page)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: currentPage === page ? '#f89919' : 'white',
                    color: currentPage === page ? 'white' : '#4b5563',
                    border: `1px solid ${currentPage === page ? '#f89919' : '#e9ebee'}`,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '5px 12px', border: '1px solid #e9ebee', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'white', color: '#4b5563', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Sending Modal (Portal to document.body for full-screen overlay over navbar) */}
      {isEmailModalOpen && selectedAnnouncement && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsEmailModalOpen(false); }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 print:hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">
                    ส่งอีเมลแจ้งประกาศ
                  </h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    เรื่อง: <span className="font-semibold text-orange-600">{selectedAnnouncement.title}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEmailModalOpen(false)} 
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-slate-700">
                <span className="text-slate-500 block mb-0.5 font-medium">เรื่องที่จะส่ง:</span>
                <span className="font-bold text-orange-700 text-sm">{selectedAnnouncement.title}</span>
              </div>

              {userRole === 'Admin' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกผู้ส่ง (Sender)</label>
                  <select
                    value={senderType}
                    onChange={(e) => setSenderType(e.target.value)}
                    className="input-base text-xs py-2 bg-white w-full"
                  >
                    <option value="IT">ส่งโดยอีเมล IT</option>
                    <option value="HR">ส่งโดยอีเมล HR</option>
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <strong>ผู้ส่ง:</strong> ส่งโดยอีเมล {userRole === 'HR' ? 'HR' : 'IT'} (กำหนดตามสิทธิ์ผู้ใช้งาน)
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">เลือกอีเมล BCC เพิ่มเติม (ถ้ามี)</label>
                  {bccOptions.length > 0 && (
                    <label className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBccList.length === bccOptions.length && bccOptions.length > 0}
                        onChange={handleSelectAllBcc}
                        className="w-3.5 h-3.5 accent-[#f89919] cursor-pointer"
                      />
                      <span>เลือกทั้งหมด</span>
                    </label>
                  )}
                </div>
                <div className="custom-scrollbar max-h-44 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-1 divide-y divide-slate-100">
                  {bccOptions.map(option => (
                    <label 
                      key={option.value} 
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBccList.includes(option.value)}
                        onChange={() => handleBccToggle(option.value)}
                        className="w-3.5 h-3.5 accent-[#f89919] shrink-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 break-all">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                <span>ระบบจะดึงการตั้งค่าผู้รับ (To, CC, BCC) จากหน้าตั้งค่าระบบองค์กรของ "{senderType}" มารวมกับอีเมลที่คุณเลือกด้านบน</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
              <button 
                type="button"
                disabled={isSendingEmail}
                onClick={() => setIsEmailModalOpen(false)} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                disabled={isSendingEmail}
                onClick={handleSendEmail} 
                className="btn-primary flex items-center gap-2 text-xs py-2 px-4 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังส่งอีเมล...</span>
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    <span>ยืนยันการส่ง</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

