import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Fingerprint, 
  Users, 
  RefreshCw, 
  Search, 
  Calendar, 
  AlertCircle, 
  Trash2, 
  Wifi, 
  WifiOff, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';

const TimeAttendanceAdminPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [todayStats, setTodayStats] = useState({ employeesPunchedToday: 0, totalPunchesToday: 0 });

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [punchType, setPunchType] = useState('');

  // Device Users Modal
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

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

  // 1. ดึงสถานะเครื่องสแกน
  const fetchDeviceStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/time-attendance/status`, { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setDeviceStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch device status:', err);
    }
  };

  // 2. ดึงประวัติการลงเวลา
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) queryParams.append('search', search);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (punchType) queryParams.append('punchType', punchType);

      const res = await fetch(`${getApiBase()}/api/time-attendance/logs?${queryParams.toString()}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
        if (data.stats) {
          setTodayStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, startDate, endDate, punchType]);

  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 3. สั่งซิงค์เวลาจากเครื่องสแกน
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${getApiBase()}/api/time-attendance/sync`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'ซิงค์เวลาสำเร็จ!',
          text: data.message,
          confirmButtonColor: '#f89919'
        });
        fetchLogs();
        fetchDeviceStatus();
      } else {
        throw new Error(data.message || 'ไม่สามารถซิงค์ข้อมูลได้');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSyncing(false);
    }
  };

  // 4. ดึงรายชื่อผู้ใช้บนเครื่อง
  const handleOpenUsersModal = async () => {
    setShowUsersModal(true);
    setLoadingUsers(true);
    try {
      const res = await fetch(`${getApiBase()}/api/time-attendance/device-users`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDeviceUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load device users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 5. ลบผู้ใช้ออกจากเครื่อง
  const handleDeleteUser = async (uid, name) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบผู้ใช้จากเครื่อง?',
      text: `ต้องการลบ ${name || `UID ${uid}`} ออกจากเครื่องสแกนหรือไม่? (ลายนิ้วมือ/ใบหน้าจะถูกลบออกจากเครื่อง)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบออกจากเครื่อง',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${getApiBase()}/api/time-attendance/device-user/${uid}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        const data = await res.json();
        if (data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ลบข้อมูลออกจากเครื่องสแกนเรียบร้อยแล้ว',
            confirmButtonColor: '#f89919'
          });
          setDeviceUsers(prev => prev.filter(u => String(u.uid) !== String(uid)));
          fetchDeviceStatus();
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'ผิดพลาด',
          text: err.message,
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // Quick Date Presets
  const setDatePreset = (preset) => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const format = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const todayStr = format(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(format(past));
      setEndDate(format(now));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(format(firstDay));
      setEndDate(format(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  // Format Date in Thai
  const formatThaiDateTime = (dateStr) => {
    if (!dateStr) return '-';
    // รองรับทั้ง "2026-09-04 08:07:29" และ ISO String
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    if (match) {
      const year = parseInt(match[1], 10) + 543;
      const month = months[parseInt(match[2], 10) - 1] || match[2];
      const day = parseInt(match[3], 10);
      const time = `${match[4]}:${match[5]}:${match[6]} น.`;
      return `${day} ${month} ${year}, ${time}`;
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    const pad = n => String(n).padStart(2, '0');
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} น.`;
    return `${day} ${month} ${year}, ${time}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'ไม่มีรายการสำหรับดาวน์โหลด', 'info');
      return;
    }
    const headers = ['ลำดับ', 'วันที่-เวลา', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'ตำแหน่ง', 'ประเภท', 'เครื่องสแกน'];
    const rows = logs.map((l, i) => [
      i + 1,
      formatThaiDateTime(l.punch_time),
      l.employee_code || '-',
      l.employee_name || `User ID: ${l.device_user_id}`,
      l.department_name || '-',
      l.position || '-',
      l.punch_type || 'CheckIn',
      l.device_name || 'SpeedFace-V3L'
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDeviceUsers = deviceUsers.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      String(u.userId || '').toLowerCase().includes(q) ||
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.uid || '').toLowerCase().includes(q) ||
      String(u.matchedEmployee?.full_name || '').toLowerCase().includes(q) ||
      String(u.matchedEmployee?.employee_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#262f3f] p-5 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 text-[#f89919] rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                ระบบบันทึกเวลาเข้า-ออกงาน (Time Attendance)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เชื่อมต่อตรงกับเครื่องสแกนนิ้ว/ใบหน้า ZKTeco SpeedFace-V3L (Soi-10) ผ่านระบบเครือข่ายภายใน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenUsersModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#364356] transition-all cursor-pointer"
          >
            <Users size={16} className="text-indigo-500" />
            <span>จัดการผู้ใช้บนเครื่อง ({deviceStatus?.userCounts || 89})</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#364356] transition-all cursor-pointer"
          >
            <Download size={16} className="text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#f89919] hover:bg-orange-600 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'กำลังซิงค์เวลา...' : 'ซิงค์เวลาจากเครื่อง'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device Status */}
        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${deviceStatus?.online ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'}`}>
            {deviceStatus?.online ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${deviceStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {deviceStatus?.deviceName || 'SpeedFace-V3L (Soi-10)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              IP: {deviceStatus?.ip || '192.168.x.x'}:{deviceStatus?.port || 4370}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {deviceStatus?.online ? 'เชื่อมต่อพร้อมใช้งาน' : 'ขาดการเชื่อมต่อ'}
            </span>
          </div>
        </div>

        {/* Employees Punched Today */}
        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">พนักงานสแกนวันนี้</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {todayStats.employeesPunchedToday}
              </span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <span className="text-[10.5px] text-indigo-500 font-semibold">ลงเวลาเข้าปฏิบัติงานวันนี้</span>
          </div>
        </div>

        {/* Total Punches Today */}
        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-2xl">
            <Fingerprint size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">จำนวนครั้งที่สแกนวันนี้</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {todayStats.totalPunchesToday}
              </span>
              <span className="text-xs text-slate-400">ครั้ง</span>
            </div>
            <span className="text-[10.5px] text-amber-500 font-semibold">เข้างาน / พัก / ออกงาน</span>
          </div>
        </div>

        {/* Device Capacity */}
        <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-100 dark:bg-sky-950/50 text-sky-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ประวัติบันทึกในเครื่อง</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {deviceStatus?.logCounts || 3468}
              </span>
              <span className="text-xs text-slate-400">/ 200,000</span>
            </div>
            <span className="text-[10.5px] text-sky-500 font-semibold">
              ใช้ไป {(((deviceStatus?.logCounts || 3468) / 200000) * 100).toFixed(1)}% ของความจุ
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน, รหัสพนักงาน, หรือ User ID บนเครื่อง..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
            />
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1c232f] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#364356]">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
              <span className="text-xs text-slate-400">ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Type Filter */}
            <select
              value={punchType}
              onChange={(e) => { setPunchType(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none"
            >
              <option value="">ทุกประเภท</option>
              <option value="CheckIn">เข้างาน (Check-In)</option>
              <option value="CheckOut">ออกงาน (Check-Out)</option>
              <option value="Lunch">พักเที่ยง (Lunch)</option>
            </select>
          </div>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-[#364356] text-xs">
          <span className="text-slate-400 text-[11px] mr-1">เลือกด่วน:</span>
          <button 
            type="button" 
            onClick={() => setDatePreset('today')} 
            className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#f89919] hover:bg-orange-100 font-semibold cursor-pointer text-[11px]"
          >
            วันนี้
          </button>
          <button 
            type="button" 
            onClick={() => setDatePreset('week')} 
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium cursor-pointer text-[11px]"
          >
            7 วันล่าสุด
          </button>
          <button 
            type="button" 
            onClick={() => setDatePreset('month')} 
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium cursor-pointer text-[11px]"
          >
            เดือนนี้
          </button>
          <button 
            type="button" 
            onClick={() => setDatePreset('all')} 
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium cursor-pointer text-[11px]"
          >
            ล้างตัวกรอง
          </button>
          <span className="ml-auto text-[11px] text-slate-400">
            พบทั้งหมด <span className="font-bold text-slate-800 dark:text-slate-100">{totalRecords.toLocaleString()}</span> รายการ
          </span>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">วันที่ & เวลาสแกน</th>
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4">แผนก / ตำแหน่ง</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">วิธีสแกน</th>
                <th className="py-3 px-4">เครื่องบันทึกเวลา</th>
                <th className="py-3 px-4 text-center">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#f89919]" />
                    <span>กำลังโหลดข้อมูลประวัติเวลา...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle size={28} className="mx-auto mb-2 text-slate-300 opacity-60" />
                    <span>ไม่พบประวัติการลงเวลาตามเงื่อนไขที่เลือก</span>
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-[#2e394b]/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#f89919] shrink-0" />
                        <span>{formatThaiDateTime(item.punch_time)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1c232f] flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold text-[11px] shrink-0 border border-slate-200 dark:border-[#364356] overflow-hidden">
                          {item.profile_image ? (
                            <img src={item.profile_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full text-center">{(item.employee_name || 'U').charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {item.employee_name || `(ไม่พบชื่อในระบบ - ID: ${item.device_user_id})`}
                          </div>
                          {item.employee_code && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-mono">
                              {item.employee_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700 dark:text-slate-300 text-[11.5px] truncate max-w-[200px]">
                        {item.department_name || '-'}
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate max-w-[200px]">
                        {item.position || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        item.punch_type === 'CheckIn' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                          : item.punch_type === 'CheckOut'
                          ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {item.punch_type === 'CheckIn' ? 'เข้างาน' : item.punch_type === 'CheckOut' ? 'ออกงาน' : 'พักเที่ยง'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Fingerprint size={13} className="text-slate-400" />
                        <span>{item.verify_type || 'นิ้ว / ใบหน้า'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{item.device_name}</div>
                      <div className="text-[9.5px] text-slate-400 font-mono">{item.device_ip}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {item.device_user_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-[#1c232f] border-t border-slate-200 dark:border-[#364356] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            แสดงหน้า <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> จาก <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> หน้า (รวม {totalRecords.toLocaleString()} รายการ)
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

      {/* Device Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#364356] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 dark:bg-[#1c232f] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-[#f89919]" />
                <div>
                  <h3 className="font-bold text-sm">ผู้ใช้งานที่ลงทะเบียนในเครื่องสแกน (Device Users)</h3>
                  <p className="text-[11px] text-slate-400">SpeedFace-V3L (Soi-10) — มีผู้ใช้ทั้งหมด {deviceUsers.length} คน</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUsersModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-slate-100 dark:border-[#364356] bg-slate-50 dark:bg-[#1f2633]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสพนักงาน, หรือ User ID บนเครื่อง..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f89919]/50"
                />
              </div>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-[#364356]">
              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#f89919]" />
                  <span>กำลังดึงข้อมูลรายชื่อจากเครื่อง SpeedFace-V3L...</span>
                </div>
              ) : filteredDeviceUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  ไม่พบข้อมูลผู้ใช้
                </div>
              ) : (
                filteredDeviceUsers.map((u) => (
                  <div key={u.uid} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#2e394b]/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[#f89919] font-bold text-xs flex items-center justify-center shrink-0">
                        {u.userId}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {u.name || `User ${u.userId}`}
                          {u.matchedEmployee && (
                            <span className="ml-2 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                              (ตรงกับ: {u.matchedEmployee.full_name})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>UID: {u.uid}</span>
                          {u.cardno > 0 && <span>บัตร: {u.cardno}</span>}
                          {u.matchedEmployee?.department && (
                            <span className="text-slate-500">แผนก: {u.matchedEmployee.department}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.uid, u.name)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="ลบผู้ใช้นี้ออกจากเครื่องสแกน"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-[#1c232f] border-t border-slate-100 dark:border-[#364356] flex justify-between items-center text-xs text-slate-500">
              <span>แสดง {filteredDeviceUsers.length} จากทั้งหมด {deviceUsers.length} คน</span>
              <button
                type="button"
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-[#364356] hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAttendanceAdminPage;