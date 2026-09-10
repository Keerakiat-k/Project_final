import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, UserMinus, Search, ArrowLeft, Printer, Users, Mail, Trash2,
  CalendarRange, X, User, Copy, Check, ExternalLink, Laptop, ShieldCheck, Tag,
  ShieldAlert, AlertTriangle, CheckSquare, Square, FileText, CheckCircle2, RotateCcw, Lock,
  ArrowDown, ArrowUp, ArrowUpDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import ITFormPrintTemplate from '../components/pdf/ITFormPrintTemplate';
import { TableSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResigned, setShowResigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Asset Preview Modal Setup
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedEmpForAssets, setSelectedEmpForAssets] = useState(null);
  const [empAssetsList, setEmpAssetsList] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [copiedSn, setCopiedSn] = useState(null);

  const handleOpenAssetsModal = async (employee) => {
    setSelectedEmpForAssets(employee);
    setShowAssetModal(true);
    setIsLoadingAssets(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${employee.id}/assets`, {
        headers
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setEmpAssetsList(result.data.assets || []);
      } else {
        setEmpAssetsList([]);
      }
    } catch (error) {
      console.error('Error fetching employee assets:', error);
      setEmpAssetsList([]);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSn(text);
    setTimeout(() => setCopiedSn(null), 2000);
  };

  // ดึงข้อมูล Role เพื่อใช้เช็คสิทธิ์
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const mockRole = localStorage.getItem('mockRole');
  const isAdmin = String(userInfo.role_id) === '1' || mockRole === '1' || userInfo.role === 'Admin';

  // Print Setup
  const componentRef = useRef();
  const [selectedEmpForPrint, setSelectedEmpForPrint] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'IT-FORM-002',
    pageStyle: '@page { size: A4 portrait; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }',
    onAfterPrint: () => setSelectedEmpForPrint(null),
  });

  const triggerPrint = async (employee) => {
    try {
      Swal.fire({ title: 'กำลังโหลดข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${employee.id}`);
      const result = await response.json();
      Swal.close();
      if (response.ok && result.status === 'success') {
        setSelectedEmpForPrint(result.data);
        setTimeout(() => {
          handlePrint();
        }, 300); // Wait for state to update and render the template
      } else {
        Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลพนักงาน', 'error');
      }
    } catch (error) {
      console.error('Error fetching employee for print:', error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถดึงข้อมูลสำหรับพิมพ์ได้', 'error');
    }
  };

  // 1. ฟังก์ชันดึงข้อมูลพนักงานทั้งหมดมาแสดงในตาราง
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees');
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลพนักงานได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==========================================
  // 🚪 IT Offboarding Checklist Setup
  // ==========================================
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [offboardEmp, setOffboardEmp] = useState(null);
  const [offboardAssets, setOffboardAssets] = useState([]);
  const [selectedReturnAssetIds, setSelectedReturnAssetIds] = useState([]);
  const [offboardResignDate, setOffboardResignDate] = useState(new Date().toISOString().split('T')[0]);
  const [offboardLocation, setOffboardLocation] = useState('คลัง IT ส่วนกลาง (สำนักงานใหญ่)');
  const [revokePortalAccess, setRevokePortalAccess] = useState(true);
  const [revokeEmailAccess, setRevokeEmailAccess] = useState(true);
  const [revokeVpnNasAccess, setRevokeVpnNasAccess] = useState(true);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isOffboardingLoading, setIsOffboardingLoading] = useState(false);
  const [isOffboardingSubmitting, setIsOffboardingSubmitting] = useState(false);

  const handleOpenOffboardModal = async (employee) => {
    setOffboardEmp(employee);
    setOffboardResignDate(new Date().toISOString().split('T')[0]);
    setOffboardLocation(employee.location || 'คลัง IT ส่วนกลาง (สำนักงานใหญ่)');
    setRevokePortalAccess(true);
    setRevokeEmailAccess(true);
    setRevokeVpnNasAccess(true);
    setHandoverNotes('');
    setShowOffboardModal(true);
    setIsOffboardingLoading(true);

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${employee.id}/assets`, { headers });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        const assets = result.data.assets || [];
        setOffboardAssets(assets);
        setSelectedReturnAssetIds(assets.map(a => a.id));
      } else {
        setOffboardAssets([]);
        setSelectedReturnAssetIds([]);
      }
    } catch (error) {
      console.error('Error fetching offboard employee assets:', error);
      setOffboardAssets([]);
      setSelectedReturnAssetIds([]);
    } finally {
      setIsOffboardingLoading(false);
    }
  };

  const toggleReturnAsset = (assetId) => {
    setSelectedReturnAssetIds(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleExecuteOffboard = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!offboardEmp) return;

    const confirmResult = await Swal.fire({
      title: 'ยืนยันการตัดสิทธิ์และพ้นสภาพ?',
      html: `
        <div class="text-xs text-slate-600 text-left space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div><strong>พนักงาน:</strong> ${offboardEmp.full_name_th || offboardEmp.first_name_th} (${offboardEmp.employee_code})</div>
          <div><strong>วันที่มีผล:</strong> ${offboardResignDate}</div>
          <div><strong>อุปกรณ์ที่จะเรียกคืน:</strong> ${selectedReturnAssetIds.length} จาก ${offboardAssets.length} เครื่อง</div>
          <div><strong>การตัดสิทธิ์:</strong> ${revokePortalAccess ? 'ปิดบัญชีระบบ' : ''} ${revokeEmailAccess ? '• ปลดสิทธิ์อีเมล' : ''} ${revokeVpnNasAccess ? '• ถอนสิทธิ์ VPN/NAS' : ''}</div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยันดำเนินการตัดสิทธิ์',
      cancelButtonText: 'ยกเลิก'
    });

    if (!confirmResult.isConfirmed) return;

    setIsOffboardingSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${offboardEmp.id}/offboard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resignationDate: offboardResignDate,
          returnAssetIds: selectedReturnAssetIds,
          returnLocation: offboardLocation,
          revokePortalAccess,
          revokeEmailAccess,
          revokeVpnNasAccess,
          handoverNotes
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setShowOffboardModal(false);
        Swal.fire({
          title: 'สำเร็จ!',
          text: data.message,
          icon: 'success',
          confirmButtonColor: '#f89919'
        });
        fetchEmployees();
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการตัดสิทธิ์');
      }
    } catch (error) {
      console.error('Error offboarding employee:', error);
      Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถดำเนินการตัดสิทธิ์ได้', 'error');
    } finally {
      setIsOffboardingSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูลพนักงาน?',
      html: `
        <div class="text-xs text-slate-600 dark:text-slate-300 text-left space-y-2 bg-slate-50 dark:bg-[#1c232f] p-3 rounded-xl border border-slate-200 dark:border-[#364356]">
          <div>คุณกำลังจะลบข้อมูลพนักงาน: <strong>${employee.first_name_th || ''} ${employee.last_name_th || ''}</strong></div>
          <div>รหัส: <strong class="text-orange-600 dark:text-orange-400">${employee.employee_code}</strong></div>
          <div class="text-rose-600 dark:text-rose-400 font-semibold mt-1">⚠️ ข้อมูลบัญชีและประวัติทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้</div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบถาวร',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${employee.id}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        Swal.fire({
          title: 'ลบข้อมูลสำเร็จ',
          text: `ลบพนักงาน ${employee.employee_code} เรียบร้อยแล้ว`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchEmployees();
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: data.message || 'ไม่สามารถลบข้อมูลพนักงานได้',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ',
        icon: 'error'
      });
    }
  };

  // กรองข้อมูลตามช่องค้นหา, บริษัท และสถานะการลาออก
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.employee_code && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.full_name_th && emp.full_name_th.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.first_name_en && emp.first_name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.last_name_en && emp.last_name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = selectedCompany === 'ALL' || (emp.company_prefix && emp.company_prefix.toUpperCase() === selectedCompany.toUpperCase());
    const matchesStatus = showResigned ? true : emp.status === 'Active';
    
    return matchesSearch && matchesCompany && matchesStatus;
  });

  // Calculate Company Counts
  const companyCounts = employees.reduce((acc, emp) => {
    const p = (emp.company_prefix || 'OTHER').toUpperCase();
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const companiesList = ['ALL', 'AIC', 'AIA', 'SQT', 'CST', 'QPM', 'AGC', 'AEP', 'ASCG'];

  // 3. ฟังก์ชันส่งอีเมลต้อนรับพนักงานใหม่
  const handleSendWelcomeEmail = async (employee) => {
    Swal.fire({
      title: 'ยืนยันการส่งอีเมล',
      text: `ต้องการส่งอีเมลต้อนรับพนักงานใหม่ไปที่ ${employee.full_name_th} (${employee.email}) ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f89919',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ส่งเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: 'กำลังส่งอีเมล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${employee.id}/send-welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const result = await response.json();
          if (response.ok && result.status === 'success') {
            Swal.fire('สำเร็จ!', result.message || 'ส่งอีเมลต้อนรับเรียบร้อยแล้ว', 'success');
          } else {
            Swal.fire('ผิดพลาด', result.message || 'ไม่สามารถส่งอีเมลได้', 'error');
          }
        } catch (error) {
          console.error('Error sending welcome email:', error);
          Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        }
      }
    });
  };

  // Sort State
  const [sortField, setSortField] = useState('code'); // 'code' | 'name' | 'company'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortField === 'code') {
      const valA = (a.employee_code || '').toString();
      const valB = (b.employee_code || '').toString();
      return sortOrder === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortField === 'name') {
      const valA = (a.full_name_th || `${a.first_name_th || ''} ${a.last_name_th || ''}`).trim();
      const valB = (b.full_name_th || `${b.first_name_th || ''} ${b.last_name_th || ''}`).trim();
      return sortOrder === 'asc'
        ? valA.localeCompare(valB, 'th')
        : valB.localeCompare(valA, 'th');
    }
    if (sortField === 'company') {
      const valA = (a.company_prefix || '').toString();
      const valB = (b.company_prefix || '').toString();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  
  // รีเซ็ตหน้ากลับไปหน้าแรก เมื่อมีการค้นหาหรือเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, showResigned, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = sortedEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Leave Balances Logic
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeaveEmp, setSelectedLeaveEmp] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  const handleOpenLeaveModal = async (employee) => {
    setSelectedLeaveEmp(employee);
    setLeaveBalances([]);
    setShowLeaveModal(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leave/employee/${employee.id}/balances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setLeaveBalances(data.data);
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลวันลาได้');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
      setShowLeaveModal(false);
    }
  };

  const handleLeaveBalanceChange = (id, newDays) => {
    setLeaveBalances(prev => prev.map(b => b.id === id ? { ...b, total_days: Number(newDays) } : b));
  };

  const handleSaveLeaveBalances = async () => {
    setIsSavingLeave(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const payload = {
        balances: leaveBalances.map(b => ({ id: b.id, total_days: b.total_days }))
      };
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leave/employee/${selectedLeaveEmp.id}/balances`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        Swal.fire('สำเร็จ', 'บันทึกวันลาเรียบร้อยแล้ว', 'success');
        setShowLeaveModal(false);
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    } finally {
      setIsSavingLeave(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Hidden Print Template */}
        <div style={{ display: 'none' }}>
          <ITFormPrintTemplate ref={componentRef} employee={selectedEmpForPrint} />
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="text-[#f89919]" />
              รายการผู้ใช้งานระบบ (System Users)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">จัดการข้อมูลบุคลากร สิทธิ์การเข้าถึง และการถือครองอุปกรณ์ไอทีประจำตัว</p>
          </div>

          <button 
            onClick={() => navigate('/employees/new')}
            className="inline-flex items-center justify-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-[#f89919]/20 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus size={18} />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>

        {/* 🏢 Company Filter Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4">
          {companiesList.map(comp => {
            const count = comp === 'ALL' ? employees.length : (companyCounts[comp] || 0);
            const isSelected = selectedCompany === comp;
            return (
              <button
                key={comp}
                onClick={() => setSelectedCompany(comp)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#f89919] text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-[#262f3f] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#303b4e] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#364356]'
                }`}
              >
                <span>{comp === 'ALL' ? '🏢 ทั้งหมด' : `🏢 ${comp}`}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 🔍 Search & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#262f3f] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm mb-6 transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
              <input 
                type="text" 
                placeholder="ค้นหารหัส, ชื่อ-สกุล (ไทย/EN), อีเมล, ตำแหน่ง..." 
                className="pl-9 pr-4 py-2 border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] rounded-xl focus:ring-2 focus:ring-[#f89919]/30 focus:border-[#f89919] outline-none w-full text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#1c232f] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#364356] transition-colors whitespace-nowrap">
              <input 
                type="checkbox" 
                checked={showResigned} 
                onChange={(e) => setShowResigned(e.target.checked)}
                className="w-4 h-4 text-[#f89919] rounded border-slate-300 dark:border-slate-600 focus:ring-[#f89919]"
              />
              <span>แสดงพนักงานที่พ้นสภาพ (Resigned)</span>
            </label>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>แสดง:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-semibold outline-none cursor-pointer text-xs"
              >
                <option value={10}>10 รายการ</option>
                <option value={25}>25 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => handleSort('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                sortField === 'code'
                  ? 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400'
                  : 'border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#303b4e]'
              }`}
              title="สลับการเรียงตามรหัสพนักงาน"
            >
              <ArrowUpDown size={12} />
              <span>รหัส: {sortField === 'code' ? (sortOrder === 'desc' ? 'มาก → น้อย' : 'น้อย → มาก') : 'สลับเรียง'}</span>
            </button>

            <div className="text-slate-400 dark:text-slate-400">
              พบ <span className="font-bold text-slate-800 dark:text-slate-100">{filteredEmployees.length}</span> คน
            </div>
          </div>

        </div>

        {/* Table & Mobile Cards Section */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm overflow-hidden mb-6 transition-colors">
          
          {/* 💻 Desktop Table View (md:block) - Fit to 100% Screen width with No Horizontal Scroll */}
          <div className="hidden md:block w-full overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-[32%]">
                    <div className="flex items-center gap-2">
                      <span>ผู้ใช้งานระบบ</span>
                      <button
                        type="button"
                        onClick={() => handleSort('code')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          sortField === 'code' ? 'bg-orange-100 text-orange-700 shadow-2xs' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="คลิกเพื่อสลับการเรียงตามรหัสพนักงาน"
                      >
                        <span>รหัส</span>
                        {sortField === 'code' ? (sortOrder === 'desc' ? <ArrowDown size={12} className="stroke-[2.5]" /> : <ArrowUp size={12} className="stroke-[2.5]" />) : <ArrowUpDown size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          sortField === 'name' ? 'bg-orange-100 text-orange-700 shadow-2xs' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="คลิกเพื่อสลับการเรียงตามชื่อพนักงาน"
                      >
                        <span>ชื่อ</span>
                        {sortField === 'name' ? (sortOrder === 'desc' ? <ArrowDown size={12} className="stroke-[2.5]" /> : <ArrowUp size={12} className="stroke-[2.5]" />) : <ArrowUpDown size={12} />}
                      </button>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('company')}
                    className="px-4 py-3.5 w-[25%] cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                    title="คลิกเพื่อสลับการเรียงตามสังกัด/บริษัท"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>สังกัด & ตำแหน่ง</span>
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[11px] ${sortField === 'company' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                        {sortField === 'company' ? (sortOrder === 'desc' ? <ArrowDown size={12} className="stroke-[2.5]" /> : <ArrowUp size={12} className="stroke-[2.5]" />) : <ArrowUpDown size={12} />}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-[23%]">อีเมล & อุปกรณ์ IT</th>
                  <th className="px-4 py-3.5 w-[10%] text-center">สถานะ</th>
                  <th className="px-4 py-3.5 w-[10%] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={5} />
                ) : currentEmployees.length > 0 ? (
                  currentEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50/70 dark:hover:bg-[#2e394b]/60 transition-colors">
                      
                      {/* 1. Profile, Code & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {employee.profile_image ? (
                            <img src={`${import.meta.env.VITE_API_BASE_URL}${employee.profile_image}`} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-[#364356] shrink-0 shadow-xs" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1c232f] flex items-center justify-center border border-slate-200 dark:border-[#364356] shrink-0 text-slate-400">
                              <User size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[11px] bg-slate-100 dark:bg-[#1c232f] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#364356] shrink-0">
                                {employee.employee_code}
                              </span>
                              <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                                {employee.full_name_th || `${employee.first_name_th || ''} ${employee.last_name_th || ''}`.trim()}
                                {employee.nickname && <span className="text-slate-400 dark:text-slate-400 font-normal text-xs ml-1">({employee.nickname})</span>}
                              </span>
                            </div>
                            {(employee.first_name_en || employee.last_name_en) && (
                              <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 truncate">
                                {employee.first_name_en} {employee.last_name_en}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Company, Position & Dept */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60 shrink-0">
                            {employee.company_prefix}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {employee.position || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug break-words" title={employee.department_name}>
                          {employee.department_name || 'ทั่วไป'}
                        </div>
                      </td>

                      {/* 3. Email & IT Assets */}
                      <td className="px-4 py-3">
                        {employee.email ? (
                          <a href={`mailto:${employee.email}`} className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1.5 mb-1 truncate" title={employee.email}>
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{employee.email}</span>
                          </a>
                        ) : (
                          <div className="text-xs text-slate-400 mb-1">-</div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenAssetsModal(employee)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all transform active:scale-95 cursor-pointer group ${
                              (employee.asset_count || 0) > 0 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-[#f89919] dark:text-amber-400 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900 hover:border-amber-300 hover:shadow-xs' 
                                : 'bg-slate-100 dark:bg-[#1c232f] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#364356] hover:bg-slate-200 dark:hover:bg-[#303b4e]'
                            }`}
                            title="คลิกเพื่อดูรายละเอียดทรัพย์สินที่ถือครอง"
                          >
                            <span>💻</span>
                            <span>{employee.asset_count || 0} เครื่อง</span>
                            {(employee.asset_count || 0) > 0 && (
                              <span className="text-[10px] text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {employee.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            เปิดใช้งาน
                          </span>
                        ) : employee.status === 'Resigned' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            พ้นสภาพพนักงาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            ปิดใช้งาน
                          </span>
                        )}
                      </td>
                      
                      {/* 5. Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          
                          <button 
                            onClick={() => triggerPrint(employee)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#303b4e] rounded-lg transition-colors"
                            title="พิมพ์แบบฟอร์ม IT-FORM-002"
                          >
                            <Printer size={15} />
                          </button>

                          {/* ซ่อนปุ่มส่งอีเมลต้อนรับไว้ก่อน */}
                          {/* {isAdmin && employee.email && (
                            <button 
                              onClick={() => handleSendWelcomeEmail(employee)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="ส่งอีเมลต้อนรับผู้ใช้ใหม่"
                            >
                              <Mail size={15} />
                            </button>
                          )} */}

                          <button 
                            onClick={() => navigate(`/edit-employee/${employee.id}`)}
                            className="p-1.5 text-slate-400 hover:text-[#f89919] hover:bg-orange-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูลผู้ใช้งาน"
                          >
                            <Edit size={15} />
                          </button>
                          
                          {employee.status !== 'Resigned' ? (
                            <button 
                              onClick={() => handleOpenOffboardModal(employee)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="พ้นสภาพพนักงาน / IT Offboarding Checklist"
                            >
                              <UserMinus size={15} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenOffboardModal(employee)}
                              className="p-1.5 text-rose-400/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="พ้นสภาพพนักงานแล้ว (คลิกเพื่อดูรายการตัดสิทธิ์/ทรัพย์สิน)"
                            >
                              <UserMinus size={15} />
                            </button>
                          )}

                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteEmployee(employee)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer ml-0.5"
                              title="ลบข้อมูลพนักงานถาวร"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400">ไม่พบข้อมูลผู้ใช้งานตามเงื่อนไขการค้นหา</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 📱 Mobile Card View (md:hidden) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <MobileCardSkeleton count={4} />
            ) : currentEmployees.length > 0 ? (
              currentEmployees.map((employee) => (
                <div key={employee.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                  
                  {/* Top: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {employee.profile_image ? (
                        <img src={`${import.meta.env.VITE_API_BASE_URL}${employee.profile_image}`} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          <User size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-[#1c232f] px-1.5 py-0.5 rounded border border-transparent dark:border-[#364356]">
                            {employee.employee_code}
                          </span>
                          <span className="text-xs font-bold text-orange-600">{employee.company_prefix}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                          {employee.full_name_th} {employee.nickname && <span className="text-slate-400 dark:text-slate-400 text-xs">({employee.nickname})</span>}
                        </div>
                      </div>
                    </div>

                    {employee.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        เปิดใช้งาน
                      </span>
                    ) : employee.status === 'Resigned' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        พ้นสภาพพนักงาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200/70 dark:border-[#364356] text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10.5px]">แผนก / ตำแหน่ง</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{employee.department_name || '-'} • {employee.position || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10.5px]">ทรัพย์สินถือครอง</span>
                      <button
                        type="button"
                        onClick={() => handleOpenAssetsModal(employee)}
                        className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          (employee.asset_count || 0) > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-[#f89919] dark:text-amber-400 border border-amber-200 dark:border-amber-900 active:bg-amber-100'
                            : 'bg-slate-100 dark:bg-[#262f3f] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#364356]'
                        }`}
                      >
                        💻 {employee.asset_count || 0} เครื่อง {(employee.asset_count || 0) > 0 && '🔍'}
                      </button>
                    </div>
                    {employee.email && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-[#364356]">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10.5px]">อีเมล</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px] break-all">{employee.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {/* ซ่อนปุ่มส่งอีเมลต้อนรับไว้ก่อน */}
                    {/* {isAdmin && (
                      <button 
                        onClick={() => handleSendWelcomeEmail(employee)}
                        className="px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                      >
                        <Mail size={13} /> ส่งอีเมล
                      </button>
                    )} */}
                    <button 
                      onClick={() => navigate(`/edit-employee/${employee.id}`)}
                      className="px-2.5 py-1.5 text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors flex items-center gap-1 border border-orange-200 dark:border-orange-900"
                    >
                      <Edit size={13} /> แก้ไข
                    </button>
                    {employee.status !== 'Resigned' ? (
                      <button 
                        onClick={() => handleOpenOffboardModal(employee)}
                        className="px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900 cursor-pointer"
                      >
                        <UserMinus size={13} /> พ้นสภาพ / ตัดสิทธิ์
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenOffboardModal(employee)}
                        className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900 cursor-pointer"
                      >
                        <UserMinus size={13} /> ข้อมูลพ้นสภาพ
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteEmployee(employee)}
                        className="px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900 cursor-pointer"
                        title="ลบข้อมูลพนักงานถาวร"
                      >
                        <Trash2 size={13} /> ลบ
                      </button>
                    )}
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">ไม่พบข้อมูลพนักงาน</div>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-[#364356] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
                แสดง {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} จากทั้งหมด {filteredEmployees.length} รายการ
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 dark:border-[#364356] rounded-lg hover:bg-slate-50 dark:hover:bg-[#303b4e] disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition-colors"
                >
                  ก่อนหน้า
                </button>
                <div className="flex gap-1 items-center overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                        currentPage === page
                          ? 'bg-[#f89919] text-white shadow-sm font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-[#303b4e] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 dark:border-[#364356] rounded-lg hover:bg-slate-50 dark:hover:bg-[#303b4e] disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leave Balances Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-[#364356] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarRange size={20} className="text-[#f89919]" />
                  จัดการโควต้าวันลา
                </h3>
                <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#303b4e] p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    พนักงาน: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedLeaveEmp?.full_name_th}</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    ปี: <span className="font-semibold text-slate-900 dark:text-slate-100">{new Date().getFullYear()}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {leaveBalances.length === 0 ? (
                    <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                      กำลังโหลดข้อมูล...
                    </div>
                  ) : (
                    leaveBalances.map(bal => (
                      <div key={bal.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-[#364356] rounded-lg bg-slate-50/50 dark:bg-[#1c232f]">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{bal.leave_type_name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            step="0.5"
                            value={bal.total_days}
                            onChange={(e) => handleLeaveBalanceChange(bal.id, e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#262f3f] text-slate-900 dark:text-slate-100 rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <span className="text-sm text-slate-500 dark:text-slate-400">วัน</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1c232f] border border-slate-300 dark:border-[#364356] rounded-lg hover:bg-slate-50 dark:hover:bg-[#303b4e] transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    onClick={handleSaveLeaveBalances}
                    disabled={isSavingLeave || leaveBalances.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingLeave ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 💻 Asset Quick View Modal */}
        {showAssetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-[#364356] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 dark:from-[#1c232f] dark:via-amber-950/20 dark:to-[#1c232f]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center text-[#f89919] shrink-0 font-bold text-lg shadow-xs">
                    💻
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        ทรัพย์สินไอทีในการถือครอง
                      </h3>
                      {selectedEmpForAssets && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
                          {selectedEmpForAssets.company_prefix}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedEmpForAssets?.full_name_th || selectedEmpForAssets?.first_name_th} 
                      {selectedEmpForAssets?.employee_code && ` (${selectedEmpForAssets.employee_code})`} • {selectedEmpForAssets?.position || selectedEmpForAssets?.department_name || 'พนักงาน'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowAssetModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#303b4e] p-2 rounded-xl transition-colors cursor-pointer"
                  title="ปิดหน้าต่าง (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-50/50 dark:bg-[#1e2430]">
                {isLoadingAssets ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#f89919] border-t-transparent"></div>
                    <span className="text-xs font-medium">กำลังโหลดข้อมูลทรัพย์สิน...</span>
                  </div>
                ) : empAssetsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#262f3f] rounded-xl border border-dashed border-slate-200 dark:border-[#364356] p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1c232f] text-slate-400 flex items-center justify-center mx-auto text-xl">
                      📦
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">ไม่พบทรัพย์สินที่ถือครอง</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">พนักงานท่านนี้ยังไม่มีการลงทะเบียนถือครองอุปกรณ์คอมพิวเตอร์ในระบบ</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAssetModal(false);
                        navigate('/admin/assets');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <span>ไปยังหน้าทะเบียนทรัพย์สิน</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        รายการอุปกรณ์ทั้งหมด ({empAssetsList.length} เครื่อง)
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        สถานะใช้งานปกติ
                      </span>
                    </div>

                    {empAssetsList.map((asset, idx) => (
                      <div 
                        key={asset.id || idx}
                        className="bg-white dark:bg-[#262f3f] rounded-xl border border-slate-200/80 dark:border-[#364356] p-4 shadow-xs hover:border-amber-300/80 dark:hover:border-amber-500/50 transition-all space-y-3"
                      >
                        {/* Top: Asset Code & Status */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[#364356] pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-extrabold text-xs bg-slate-900 dark:bg-[#1c232f] text-amber-400 px-2 py-0.5 rounded-md tracking-wide border border-transparent dark:border-amber-900/40">
                              {asset.asset_code}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {asset.brand} {asset.model}
                            </span>
                            {asset.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#364356]">
                                {asset.category}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {asset.status === 'In Use' ? 'กำลังใช้งาน' : asset.status}
                          </span>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-50 dark:bg-[#1c232f] p-2 rounded-lg border border-slate-100 dark:border-[#364356]">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">⚡ หน่วยประมวลผล (CPU)</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate block" title={asset.cpu}>
                              {asset.cpu || '-'}
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-[#1c232f] p-2 rounded-lg border border-slate-100 dark:border-[#364356]">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">💾 RAM / ความจุ</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate block">
                              {asset.ram ? `${asset.ram} GB` : '-'} / {asset.storage ? `${asset.storage} GB` : '-'}
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-[#1c232f] p-2 rounded-lg border border-slate-100 dark:border-[#364356]">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">🖥️ ขนาดหน้าจอ</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate block">
                              {asset.display_size || '-'}
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-[#1c232f] p-2 rounded-lg border border-slate-100 dark:border-[#364356]">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">📍 สาขา / สถานที่</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate block">
                              {asset.location || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Serial Number & License Keys */}
                        <div className="bg-amber-50/40 dark:bg-[#1c232f] rounded-lg p-2.5 border border-amber-100 dark:border-[#364356] text-xs space-y-1.5">
                          {/* S/N */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Serial Number (S/N):</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs bg-white dark:bg-[#262f3f] px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-[#364356]">
                                {asset.serial_number || 'ไม่ระบุ S/N'}
                              </span>
                            </div>
                            {asset.serial_number && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(asset.serial_number)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f89919] hover:text-[#d97c08] bg-white dark:bg-[#262f3f] px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/80 hover:border-amber-300 dark:hover:border-amber-600 shadow-2xs transition cursor-pointer"
                                title="คัดลอก Serial Number"
                              >
                                {copiedSn === asset.serial_number ? (
                                  <>
                                    <Check size={11} className="text-emerald-600" />
                                    <span className="text-emerald-600">คัดลอกแล้ว</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>คัดลอก</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Licenses */}
                          {(asset.os_license || asset.office_license) && (
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-amber-200/40 dark:border-[#364356] flex-wrap">
                              {asset.os_license && (
                                <span><strong className="text-slate-700 dark:text-slate-300">OS:</strong> {asset.os_license}</span>
                              )}
                              {asset.office_license && asset.office_license !== 'None' && (
                                <span><strong className="text-slate-700 dark:text-slate-300">Office:</strong> {asset.office_license}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssetModal(false);
                    navigate('/admin/assets');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#f89919] dark:hover:text-[#f89919] transition cursor-pointer"
                >
                  <span>เปิดระบบทะเบียนทรัพย์สินทั้งหมด</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#262f3f] border border-slate-300 dark:border-[#364356] rounded-xl hover:bg-slate-100 dark:hover:bg-[#303b4e] transition-colors shadow-xs cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 🚪 IT Offboarding & Asset Recovery Checklist Modal */}
        {/* 🚪 IT Offboarding & Asset Recovery Checklist Modal */}
        {showOffboardModal && offboardEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-rose-100 dark:border-[#364356] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-rose-100 dark:border-[#364356] flex items-center justify-between bg-gradient-to-r from-rose-50 via-amber-50/30 to-slate-50 dark:from-[#1c232f] dark:via-rose-950/20 dark:to-[#1c232f]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold text-lg shadow-xs">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        IT Offboarding Checklist
                      </h3>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                        พ้นสภาพพนักงาน & ตัดสิทธิ์
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ตรวจสอบการคืนอุปกรณ์ IT และถอนสิทธิ์การเข้าถึงระบบทั้งหมด
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowOffboardModal(false)}
                  disabled={isOffboardingSubmitting}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#303b4e] p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  title="ปิดหน้าต่าง"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleExecuteOffboard} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-slate-50/40 dark:bg-[#1e2430]">
                
                {/* 1. Employee Profile Summary Card */}
                <div className="bg-white dark:bg-[#262f3f] p-3.5 rounded-xl border border-slate-200/80 dark:border-[#364356] shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {offboardEmp.first_name_en?.charAt(0) || offboardEmp.first_name_th?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {offboardEmp.full_name_th || offboardEmp.first_name_th} {offboardEmp.last_name_th || ''}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/40 text-[#f89919] border border-orange-200 dark:border-orange-900/60 shrink-0">
                          {offboardEmp.company_prefix}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        รหัส: <strong className="font-mono text-slate-700 dark:text-slate-300">{offboardEmp.employee_code}</strong> • {offboardEmp.department_name || '-'} ({offboardEmp.position || '-'})
                      </p>
                    </div>
                  </div>

                  {offboardEmp.email && (
                    <div className="text-right hidden sm:block shrink-0">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">อีเมลองค์กร</span>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{offboardEmp.email}</span>
                    </div>
                  )}
                </div>

                {/* 2. Effective Resignation Date */}
                <div className="bg-white dark:bg-[#262f3f] p-4 rounded-xl border border-slate-200/80 dark:border-[#364356] shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarRange size={14} className="text-rose-500" />
                    <span>วันที่มีผลพ้นสภาพพนักงาน (Effective Date) <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={offboardResignDate}
                    onChange={(e) => setOffboardResignDate(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                  />
                </div>

                {/* 3. Asset Recovery Checklist (การเรียกคืนทรัพย์สิน) */}
                <div className="bg-white dark:bg-[#262f3f] p-4 rounded-xl border border-slate-200/80 dark:border-[#364356] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#364356] pb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Laptop size={15} className="text-amber-500" />
                      <span>1. การเรียกคืนทรัพย์สิน IT และอุปกรณ์</span>
                    </label>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      offboardAssets.length > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-[#f89919] border border-amber-200 dark:border-amber-900' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {offboardAssets.length > 0 ? `มีอุปกรณ์ถือครอง ${offboardAssets.length} เครื่อง` : 'ไม่มีทรัพย์สินค้างส่งมอบ'}
                    </span>
                  </div>

                  {isOffboardingLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
                      กำลังโหลดข้อมูลทรัพย์สิน...
                    </div>
                  ) : offboardAssets.length === 0 ? (
                    <div className="py-4 px-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>พนักงานท่านนี้ไม่มีอุปกรณ์คอมพิวเตอร์ผูกอยู่ในระบบ (พร้อมข้ามขั้นตอนนี้ได้ทันที)</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        เลือกอุปกรณ์ที่ได้รับคืนแล้ว (ระบบจะปลดสถานะเป็น <strong>Available</strong> และบันทึกประวัติการส่งคืนลงใน Transfer Log อัตโนมัติ):
                      </p>

                      <div className="space-y-2">
                        {offboardAssets.map((asset) => {
                          const isChecked = selectedReturnAssetIds.includes(asset.id);
                          return (
                            <div 
                              key={asset.id}
                              onClick={() => toggleReturnAsset(asset.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isChecked 
                                  ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-2xs' 
                                  : 'bg-slate-50/60 dark:bg-[#1c232f] border-slate-200 dark:border-[#364356] opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button type="button" className="text-[#f89919] shrink-0">
                                  {isChecked ? <CheckSquare size={17} /> : <Square size={17} className="text-slate-400" />}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs bg-slate-900 dark:bg-[#1c232f] text-amber-400 px-1.5 py-0.2 rounded border border-transparent dark:border-amber-900/40">
                                      {asset.asset_code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                      {asset.brand} {asset.model}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    S/N: <span className="font-mono">{asset.serial_number || '-'}</span> • สเปก: {asset.cpu || '-'} / {asset.ram ? `${asset.ram}GB` : '-'}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-300 shrink-0">
                                {isChecked ? '✅ เรียกคืนเข้าคลัง' : 'ไม่เรียกคืน'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Return Destination Location */}
                      {selectedReturnAssetIds.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-[#364356] flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">สถานที่จัดเก็บคืน:</span>
                          <input 
                            type="text"
                            value={offboardLocation}
                            onChange={(e) => setOffboardLocation(e.target.value)}
                            placeholder="เช่น คลัง IT Soi-10 หรือ คลังส่วนกลาง"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. System Access Revocation Checklist */}
                <div className="bg-white dark:bg-[#262f3f] p-4 rounded-xl border border-slate-200/80 dark:border-[#364356] shadow-2xs space-y-3">
                  <div className="border-b border-slate-100 dark:border-[#364356] pb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock size={15} className="text-rose-500" />
                      <span>2. การตัดสิทธิ์การเข้าถึงระบบ (Access Revocation)</span>
                    </label>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Item 2: Email Access */}
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-[#364356] bg-slate-50/60 dark:bg-[#1c232f] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#303b4e]">
                      <input 
                        type="checkbox"
                        checked={revokeEmailAccess}
                        onChange={(e) => setRevokeEmailAccess(e.target.checked)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500 rounded cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">บันทึกการตัดสิทธิ์ / เปลี่ยนรหัสผ่านอีเมลองค์กร</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          อีเมล: {offboardEmp.email || 'ไม่มีอีเมลองค์กร'}
                        </span>
                      </div>
                    </label>

                    {/* Item 3: VPN / NAS / ERP */}
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-[#364356] bg-slate-50/60 dark:bg-[#1c232f] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#303b4e]">
                      <input 
                        type="checkbox"
                        checked={revokeVpnNasAccess}
                        onChange={(e) => setRevokeVpnNasAccess(e.target.checked)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500 rounded cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">ตัดสิทธิ์การเข้าถึง VPN / File Server (NAS) / โปรแกรมภายใน</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">ถอนบัญชีผู้ใช้งานออกจากระบบเครือข่ายและสิทธิ์โฟลเดอร์แชร์</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Handover Notes */}
                <div className="bg-white dark:bg-[#262f3f] p-4 rounded-xl border border-slate-200/80 dark:border-[#364356] shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-500" />
                    <span>บันทึกการส่งมอบงาน / หมายเหตุเพิ่มเติม</span>
                  </label>
                  <textarea 
                    rows={2}
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="เช่น ผู้รับมอบอุปกรณ์แทน, ตรวจรับสภาพเครื่องเรียบร้อย, หรือเอกสารส่งมอบงาน..."
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

              </form>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isOffboardingSubmitting}
                  onClick={() => setShowOffboardModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#262f3f] border border-slate-300 dark:border-[#364356] rounded-xl hover:bg-slate-100 dark:hover:bg-[#303b4e] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  disabled={isOffboardingSubmitting}
                  onClick={handleExecuteOffboard}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isOffboardingSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>กำลังดำเนินการ...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} />
                      <span>ยืนยันการพ้นสภาพและตัดสิทธิ์ทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

    </div>
  );
}