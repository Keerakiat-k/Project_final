import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  UserCog, 
  Search, 
  RefreshCw, 
  KeyRound, 
  Shield, 
  ShieldCheck, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Briefcase,
  UserPlus,
  Trash2,
  Lock,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';

const SystemAccountsAdminPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Add Account Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [addRoleId, setAddRoleId] = useState('3');
  const [addPassword, setAddPassword] = useState('');
  const [addShowPassword, setAddShowPassword] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [addingSubmitting, setAddingSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modals
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState('');

  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.trim() !== '') return envUrl.trim().replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location) {
      const { hostname, protocol } = window.location;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
        return '';
      }
      return `${protocol}//${hostname}:5000`;
    }
    return '';
  };

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. ดึงข้อมูลบัญชีระบบทั้งหมด
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/employees/system-accounts`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching system accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. ดึงข้อมูล Roles
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/settings/roles`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.length > 0) {
        setRoles(data.data);
      } else {
        setRoles([
          { id: 1, name: 'Admin' },
          { id: 2, name: 'HR' },
          { id: 3, name: 'Employee' },
          { id: 4, name: 'IT Support' },
          { id: 5, name: 'Manager' }
        ]);
      }
    } catch (err) {
      setRoles([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'HR' },
        { id: 3, name: 'Employee' },
        { id: 4, name: 'IT Support' },
        { id: 5, name: 'Manager' }
      ]);
    }
  }, []);

  // 1.1 ดึงรายชื่อพนักงานที่ยังไม่ได้เป็นบัญชีระบบ
  const fetchAvailableEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/employees/system-accounts/available`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAvailableEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available employees:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchRoles();
    fetchAvailableEmployees();
  }, [fetchAccounts, fetchRoles, fetchAvailableEmployees]);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ฟังก์ชันเพิ่มบัญชีระบบ
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกพนักงานที่ต้องการเพิ่มสิทธิ์ระบบ', 'warning');
      return;
    }

    setAddingSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/employees/system-accounts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          role_id: addRoleId,
          password: addPassword
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มบัญชีระบบสำเร็จ!',
          text: data.message || 'กำหนดสิทธิ์การใช้งานระบบเรียบร้อยแล้ว',
          confirmButtonColor: '#f89919'
        });
        setShowAddModal(false);
        setSelectedEmployeeId('');
        setAddPassword('');
        setAddRoleId('3');
        setEmpSearch('');
        fetchAccounts();
        fetchAvailableEmployees();
      } else {
        throw new Error(data.message || 'ไม่สามารถเพิ่มบัญชีระบบได้');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    } finally {
      setAddingSubmitting(false);
    }
  };

  // ฟังก์ชันถอดสิทธิ์บัญชีระบบ
  const handleRemoveAccount = async (acc) => {
    if (parseInt(acc.id, 10) === 1) {
      Swal.fire('ปฏิเสธการทำงาน', 'ไม่สามารถถอดสิทธิ์ผู้ดูแลระบบหลัก (Main Admin) ได้', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันถอดสิทธิ์บัญชีระบบ?',
      html: `คุณต้องการถอดสิทธิ์การเข้าใช้งานระบบของ <b>${acc.full_name_th || acc.employee_code}</b> หรือไม่?<br/><span class="text-xs text-slate-500 mt-1 block">ข้อมูลพนักงานยังคงอยู่ในระบบ HR ตามปกติ แต่จะไม่สามารถเข้าสู่ระบบนี้ได้อีก</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ถอดสิทธิ์',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${getApiBase()}/api/employees/system-accounts/${acc.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        const data = await res.json();
        if (data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ถอดสิทธิ์สำเร็จ',
            text: 'ถอดสิทธิ์การเข้าใช้งานระบบเรียบร้อยแล้ว',
            confirmButtonColor: '#f89919'
          });
          fetchAccounts();
          fetchAvailableEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        Swal.fire('ผิดพลาด', err.message, 'error');
      }
    }
  };

  // 3. รีเซ็ตรหัสผ่าน
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาระบุรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร', 'warning');
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/employees/${resetModalUser.id}/reset-password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'รีเซ็ตรหัสผ่านสำเร็จ!',
          text: `เปลี่ยนรหัสผ่านสำหรับ ${resetModalUser.employee_code || resetModalUser.email} เรียบร้อยแล้ว`,
          confirmButtonColor: '#f89919'
        });
        setResetModalUser(null);
        setNewPassword('');
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };

  // 4. อัปเดตสิทธิ์ (Role)
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!newRoleId) return;

    try {
      const res = await fetch(`${getApiBase()}/api/employees/${roleModalUser.id}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ roleId: newRoleId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนสิทธิ์สำเร็จ!',
          text: 'อัปเดตสิทธิ์การใช้งานเรียบร้อยแล้ว',
          confirmButtonColor: '#f89919'
        });
        setRoleModalUser(null);
        fetchAccounts();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };

  // กรองข้อมูล
  const filteredAccounts = accounts.filter(acc => {
    if (selectedRole && String(acc.role_id) !== String(selectedRole) && String(acc.role_name) !== String(selectedRole)) {
      return false;
    }
    if (selectedStatus && acc.status !== selectedStatus) {
      return false;
    }
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      const matchCode = (acc.employee_code || '').toLowerCase().includes(q);
      const matchEmail = (acc.email || '').toLowerCase().includes(q);
      const matchName = (acc.full_name_th || '').toLowerCase().includes(q);
      const matchPos = (acc.position || '').toLowerCase().includes(q);
      const matchRole = (acc.role_name || '').toLowerCase().includes(q);
      return matchCode || matchEmail || matchName || matchPos || matchRole;
    }
    return true;
  });

  // KPI Summary
  const adminCount = accounts.filter(a => String(a.role_id) === '1' || a.role_name === 'Admin').length;
  const hrCount = accounts.filter(a => String(a.role_id) === '2' || a.role_name === 'HR').length;
  const itCount = accounts.filter(a => String(a.role_id) === '4' || a.role_name === 'IT Support').length;
  const empCount = accounts.filter(a => !['1', '2', '4'].includes(String(a.role_id)) && !['Admin', 'HR', 'IT Support'].includes(a.role_name)).length;

  // Pagination Slice
  const totalPages = Math.ceil(filteredAccounts.length / limit) || 1;
  const paginatedAccounts = filteredAccounts.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#262f3f] p-5 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 text-[#f89919] rounded-xl">
              <UserCog size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                บัญชีระบบ & รหัสผ่าน (System Accounts)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จัดการสิทธิ์การเข้าใช้งานระบบ (Role-Based Access Control) และรีเซ็ตรหัสผ่านพนักงาน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#f89919] hover:bg-orange-600 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus size={15} />
            <span>เพิ่มบัญชีระบบ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchAccounts();
              fetchAvailableEmployees();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#364356] transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#f89919]' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">บัญชีทั้งหมด</span>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {accounts.length}
          </div>
          <span className="text-[10.5px] text-slate-400">บัญชีในระบบที่เปิดใช้งาน</span>
        </div>

        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">ผู้ดูแลระบบ (Admin)</span>
            <ShieldCheck size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {adminCount}
          </div>
          <span className="text-[10.5px] text-rose-500/80">สิทธิ์สูงสุด (God Mode)</span>
        </div>

        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">ฝ่ายบุคคล (HR)</span>
            <UserCheck size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {hrCount}
          </div>
          <span className="text-[10.5px] text-amber-500/80">จัดการพนักงาน & เวลา</span>
        </div>

        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">ไอที (IT Support)</span>
            <Shield size={18} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {itCount}
          </div>
          <span className="text-[10.5px] text-indigo-500/80">แจ้งซ่อม & ทรัพย์สิน IT</span>
        </div>

        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">พนักงาน (Employee)</span>
            <Users size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {empCount}
          </div>
          <span className="text-[10.5px] text-emerald-500/80">ผู้ใช้งานทั่วไป</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารหัสพนักงาน, อีเมล, ชื่อ-นามสกุล, หรือตำแหน่ง..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none"
          >
            <option value="">ทุกสิทธิ์การใช้งาน (All Roles)</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none"
          >
            <option value="">ทุกสถานะ</option>
            <option value="Active">เปิดใช้งาน (Active)</option>
            <option value="Suspended">ระงับชั่วคราว (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">รหัสพนักงาน</th>
                <th className="py-3 px-4">ชื่อผู้ใช้งาน (Email / Code)</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">ตำแหน่ง</th>
                <th className="py-3 px-4">สิทธิ์การใช้งาน (Role)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#f89919]" />
                    <span>กำลังโหลดรายชื่อบัญชีระบบ...</span>
                  </td>
                </tr>
              ) : paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle size={28} className="mx-auto mb-2 text-slate-300 opacity-60" />
                    <span>ไม่พบบัญชีระบบที่ตรงกับเงื่อนไข</span>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc) => {
                  const roleName = acc.role_name || 'Employee';
                  const isGodAdmin = roleName === 'Admin';
                  const isHR = roleName === 'HR';
                  const isIT = roleName === 'IT Support';

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 dark:hover:bg-[#2e394b]/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-[#1c232f] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-[#364356]">
                          {acc.employee_code || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {acc.email || acc.employee_code}
                        </div>
                        {acc.company_prefix && (
                          <span className="text-[10px] text-slate-400">
                            บริษัท: {acc.company_prefix}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {acc.full_name_th || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-300 text-[11.5px]">
                          {acc.position || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isGodAdmin 
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                            : isHR
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                            : isIT
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                        }`}>
                          <Shield size={12} />
                          <span>{roleName}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          acc.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{acc.status === 'Active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(acc);
                              setNewRoleId(String(acc.role_id || '3'));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#364356] transition-all cursor-pointer text-[11px] font-medium"
                            title="เปลี่ยนสิทธิ์การใช้งาน"
                          >
                            <Shield size={12} className="text-[#f89919]" />
                            <span>เปลี่ยนสิทธิ์</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(acc);
                              setNewPassword('');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-[#f89919] border border-orange-200 dark:border-orange-800/40 transition-all cursor-pointer text-[11px] font-semibold"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <KeyRound size={12} />
                            <span>รีเซ็ตรหัส</span>
                          </button>

                          {parseInt(acc.id, 10) !== 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAccount(acc)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 transition-all cursor-pointer text-[11px] font-semibold"
                              title="ถอดสิทธิ์ออกจากบัญชีระบบ"
                            >
                              <Trash2 size={12} />
                              <span>ถอดสิทธิ์</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-[#1c232f] border-t border-slate-200 dark:border-[#364356] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            แสดงหน้า <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> จาก <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> หน้า (รวม {filteredAccounts.length} รายการ)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#364356] hover:bg-white dark:hover:bg-[#262f3f] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-semibold text-slate-800 dark:text-slate-100">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#364356] hover:bg-white dark:hover:bg-[#262f3f] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: รีเซ็ตรหัสผ่าน */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#364356]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/50 text-[#f89919] rounded-2xl">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">รีเซ็ตรหัสผ่าน</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resetModalUser.full_name_th} ({resetModalUser.employee_code || resetModalUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  รหัสผ่านใหม่ (New Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่ (เช่น Hr@123)"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#364356]">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c232f] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#f89919] hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: เปลี่ยนสิทธิ์ (Role) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#364356]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">เปลี่ยนสิทธิ์การใช้งาน (Role)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {roleModalUser.full_name_th} ({roleModalUser.employee_code || roleModalUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกระดับสิทธิ์
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#364356]">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c232f] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  บันทึกสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: เพิ่มบัญชีระบบ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-[#364356]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/50 text-[#f89919] rounded-2xl">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  เพิ่มบัญชีระบบ (Add System Account)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  เลือกพนักงานเพื่อเปิดสิทธิ์เข้าใช้งานระบบ กำหนดระดับสิทธิ์ และรหัสผ่าน
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {/* เลือกพนักงาน แบบ Searchable Combobox */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  เลือกพนักงาน <span className="text-rose-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">
                    (มีพนักงานพร้อมให้สิทธิ์ {availableEmployees.length} คน)
                  </span>
                </label>

                {/* Search Input Box */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ, รหัสพนักงาน, แผนก หรือตำแหน่ง เพื่อค้นหา..."
                    value={empSearch}
                    onFocus={() => setIsSelectOpen(true)}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setIsSelectOpen(true);
                      // ถ้าแก้ไขคำค้นหาแล้วชื่อไม่ตรงกับที่เลือกไว้ ให้เคลียร์ selectedEmployeeId
                      if (selectedEmployeeId) {
                        const current = availableEmployees.find(emp => String(emp.id) === String(selectedEmployeeId));
                        const label = current ? `[${current.employee_code || 'No Code'}] ${current.full_name_th}` : '';
                        if (e.target.value !== label) {
                          setSelectedEmployeeId('');
                        }
                      }
                    }}
                    className={`w-full pl-9 pr-16 py-2.5 bg-slate-50 dark:bg-[#1c232f] border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50 transition-all ${
                      selectedEmployeeId 
                        ? 'border-emerald-500/70 bg-emerald-50/20 dark:bg-emerald-950/20' 
                        : 'border-slate-200 dark:border-[#364356]'
                    }`}
                  />

                  {/* Buttons on the right of input */}
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {empSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmpSearch('');
                          setSelectedEmployeeId('');
                          setIsSelectOpen(true);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-[#364356] rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                        title="ล้างข้อมูล"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSelectOpen(!isSelectOpen)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-[#364356] rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    >
                      <ChevronDown size={15} className={`transition-transform duration-200 ${isSelectOpen ? 'rotate-180 text-[#f89919]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dropdown Results */}
                {isSelectOpen && (
                  <div className="absolute z-20 mt-1.5 w-full bg-white dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e394b] animate-in fade-in-50 zoom-in-95 duration-150">
                    {availableEmployees
                      .filter(emp => {
                        if (!empSearch.trim()) return true;
                        // ถ้าตรงกับชื่อที่เลือกอยู่แล้วให้แสดงครบ
                        const current = availableEmployees.find(e => String(e.id) === String(selectedEmployeeId));
                        if (current && `[${current.employee_code || 'No Code'}] ${current.full_name_th}` === empSearch) return true;
                        
                        const q = empSearch.toLowerCase().trim();
                        return (
                          (emp.employee_code || '').toLowerCase().includes(q) ||
                          (emp.full_name_th || '').toLowerCase().includes(q) ||
                          (emp.position || '').toLowerCase().includes(q) ||
                          (emp.department_name || '').toLowerCase().includes(q) ||
                          (emp.email || '').toLowerCase().includes(q)
                        );
                      })
                      .length === 0 ? (
                        <div className="py-6 px-4 text-center text-slate-400 text-xs">
                          <AlertCircle size={20} className="mx-auto mb-1 opacity-50" />
                          <span>ไม่พบรายชื่อพนักงานที่ค้นหา</span>
                        </div>
                      ) : (
                        availableEmployees
                          .filter(emp => {
                            if (!empSearch.trim()) return true;
                            const current = availableEmployees.find(e => String(e.id) === String(selectedEmployeeId));
                            if (current && `[${current.employee_code || 'No Code'}] ${current.full_name_th}` === empSearch) return true;

                            const q = empSearch.toLowerCase().trim();
                            return (
                              (emp.employee_code || '').toLowerCase().includes(q) ||
                              (emp.full_name_th || '').toLowerCase().includes(q) ||
                              (emp.position || '').toLowerCase().includes(q) ||
                              (emp.department_name || '').toLowerCase().includes(q) ||
                              (emp.email || '').toLowerCase().includes(q)
                            );
                          })
                          .map(emp => {
                            const isSelected = String(emp.id) === String(selectedEmployeeId);
                            return (
                              <div
                                key={emp.id}
                                onClick={() => {
                                  setSelectedEmployeeId(String(emp.id));
                                  setEmpSearch(`[${emp.employee_code || 'No Code'}] ${emp.full_name_th}`);
                                  setIsSelectOpen(false);
                                }}
                                className={`px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-orange-50/80 dark:hover:bg-orange-950/30 cursor-pointer transition-colors text-xs ${
                                  isSelected ? 'bg-orange-50 dark:bg-orange-950/40 text-[#f89919] font-medium' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#262f3f] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#364356]">
                                      {emp.employee_code || 'No Code'}
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                      {emp.full_name_th}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>{emp.position || 'พนักงาน'}</span>
                                    {emp.department_name && (
                                      <span>• แผนก: {emp.department_name}</span>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check size={16} className="text-[#f89919] shrink-0" />
                                )}
                              </div>
                            );
                          })
                      )}
                  </div>
                )}

                {/* Selected Status Hint */}
                {selectedEmployeeId ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 size={13} />
                    <span>เลือกพนักงานเรียบร้อยแล้ว</span>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    * พิมพ์เพื่อค้นหาแล้วคลิกเลือกพนักงาน 1 ท่าน
                  </div>
                )}
              </div>

              {/* เลือกระดับสิทธิ์ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ระดับสิทธิ์การใช้งาน (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addRoleId}
                  onChange={(e) => setAddRoleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* กำหนดรหัสผ่านเริ่มต้น */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  กำหนดรหัสผ่านเริ่มต้น (Initial Password)
                  <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ ถ้าเว้นว่างจะใช้รหัสผ่านเดิมหากมี)</span>
                </label>
                <div className="relative">
                  <input
                    type={addShowPassword ? 'text' : 'password'}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="เช่น Pass@123 หรือเว้นว่างไว้"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setAddShowPassword(!addShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {addShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#364356]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedEmployeeId('');
                    setAddPassword('');
                    setEmpSearch('');
                    setIsSelectOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c232f] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addingSubmitting || !selectedEmployeeId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#f89919] hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {addingSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  <span>ยืนยันเพิ่มสิทธิ์ระบบ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAccountsAdminPage;