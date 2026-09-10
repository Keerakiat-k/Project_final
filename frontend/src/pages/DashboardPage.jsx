import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users, UserPlus, UserMinus, ShieldAlert,
  FileText, Calendar, Wallet, CheckCircle, 
  Clock, AlertCircle, BarChart3, TrendingUp,
  Laptop, Server, Activity, ArrowRight, ExternalLink, Bell
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Swal from 'sweetalert2';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // ดึงค่ามาจาก AdminLayout ผ่าน Context อย่างปลอดภัย
  const outletCtx = useOutletContext() || {};
  const userRole = outletCtx.userRole || 'Guest';
  const userName = outletCtx.userName || 'Guest';
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);
  const [stats, setStats] = useState({ totalEmployees: 0, newThisMonth: 0, resigned: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newEmployees, setNewEmployees] = useState([]);
  const [resignedEmployees, setResignedEmployees] = useState([]);
  const [myBalances, setMyBalances] = useState([]);
  const [pendingLeaveApprovals, setPendingLeaveApprovals] = useState(0);
  const [turnoverData, setTurnoverData] = useState([]);

  // State สำหรับรายงานภาพรวมผู้บริหาร (Executive Real-Time Summary)
  const [execSummary, setExecSummary] = useState({
    total_computers: 110,
    asset_counts: [
      { company: 'AIC', computer_count: 57 },
      { company: 'AIA', computer_count: 26 },
      { company: 'CST', computer_count: 8 },
      { company: 'SQT', computer_count: 8 },
      { company: 'ASPD', computer_count: 3 },
      { company: 'AEP', computer_count: 3 },
      { company: 'Q-AIR', computer_count: 2 },
      { company: 'AGC', computer_count: 2 },
      { company: 'QPM', computer_count: 1 }
    ],
    helpdesk_summary: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
    network_logs: [
      { location: 'ซอย 10 (Head Office)', device: 'FortiGate 70G', note: 'อัปเดตเปลี่ยน Firewall เป็นรุ่น 70G รุ่นใหม่แล้ว (ต้อง Upgrade Log Server)' },
      { location: 'BD-8 (ซอย 74)', device: 'FortiGate 60F', note: 'ปริมาณการใช้งานปกติ' }
    ]
  });

  useEffect(() => {
    // โหลดข้อมูลภาพรวมสำหรับ Admin/HR/IT Support
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const authHeaders = { 'Authorization': `Bearer ${token}` };

        if (userRole === 'Admin' || userRole === 'HR' || userRole === 'IT Support') {
          const empRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees', { headers: authHeaders });
          if (empRes.ok) {
            const empData = await empRes.json();
            const emps = empData.data || [];
            setStats({
              totalEmployees: emps.filter(e => e.status === 'Active').length,
              newThisMonth: emps.filter(e => {
                if (!e.start_date) return false;
                const startDate = new Date(e.start_date);
                const now = new Date();
                return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
              }).length,
              resigned: emps.filter(e => e.status === 'Resigned' || e.status === 'Inactive').length
            });
          }

          const activityRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees/stats/recent-activity', { headers: authHeaders });
          if (activityRes.ok) {
            const aData = await activityRes.json();
            setRecentActivity(aData.data || []);
          }

          const turnoverRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees/stats/turnover', { headers: authHeaders });
          if (turnoverRes.ok) {
            const turnover = await turnoverRes.json();
            setTurnoverData(turnover.data || []);
          }

          const roleRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/roles', { headers: authHeaders });
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            setRoles(roleData.data || []);
          }
        }
        
        if (userRole === 'Admin' || userRole === 'IT Support') {
          const ticketRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/it-support', { headers: authHeaders });
          if (ticketRes.ok) {
            const ticketData = await ticketRes.json();
            setPendingTicketsCount(ticketData.data.filter(t => t.status === 'รอรับเรื่อง').length);
          }

          const resignedRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees/resigned/current-month', { headers: authHeaders });
          const resignedData = await resignedRes.json();
          if (resignedRes.ok) {
            setResignedEmployees(resignedData.data || []);
          }

          const newEmpRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/employees/new/current-month', { headers: authHeaders });
          if (newEmpRes.ok) {
            const newEmpData = await newEmpRes.json();
            setNewEmployees(newEmpData.data || []);
          }

          // Fetch Executive Real-Time Summary for Admin & IT Support
          const execRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/it-health-check/executive-summary', { headers: authHeaders });
          if (execRes.ok) {
            const execData = await execRes.json();
            if (execData.status === 'success' && execData.data) {
              setExecSummary(prev => ({
                ...prev,
                ...execData.data,
                asset_counts: (execData.data.asset_counts && execData.data.asset_counts.length > 0) ? execData.data.asset_counts : prev.asset_counts
              }));
            }
          }
        }

        // Fetch leave data
        if (userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager') {
          const leaveApprRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/approvals', { headers: authHeaders });
          if (leaveApprRes.ok) {
            const leaveApprData = await leaveApprRes.json();
            setPendingLeaveApprovals(leaveApprData.data ? leaveApprData.data.length : 0);
          }
        }

        const balRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/my-balances', { headers: authHeaders });
        if (balRes.ok) {
          const balData = await balRes.json();
          setMyBalances(balData.data || []);
        }

      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      }
    };
    fetchStats();
  }, [userRole]);

  // Handle Revoke / Grant Access
  const handleRevokeAccess = async (empId, empName) => {
    Swal.fire({
      title: 'ยืนยันการเคลียร์สิทธิ์?',
      text: `คุณต้องการเคลียร์สิทธิ์การเข้าถึงทั้งหมดของ ${empName} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ใช่, เคลียร์สิทธิ์เลย',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${empId}/revoke-access`, {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            }
          });
          
          if (res.ok) {
            setResignedEmployees(prev => prev.filter(e => e.id !== empId));
            Swal.fire('สำเร็จ!', 'เคลียร์สิทธิ์เรียบร้อยแล้ว', 'success');
          } else {
            throw new Error('Server error');
          }
        } catch (error) {
          console.error('Error revoking access', error);
          Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเคลียร์สิทธิ์', 'error');
        }
      }
    });
  };

  const handleGrantAccess = async (empId, empName, companyPrefix, firstNameEn, lastNameEn) => {
    const domainMap = {
      'AEP': '@ascgengineering.com',
      'AGC': '@ascggroup.com',
      'AIA': '@interprocorp.com',
      'AIC': '@ascggroup.com',
      'CST': '@cstintergroup.com',
      'QPM': '@qpmprevention.com',
      'SQT': '@synergyqthai.com'
    };
    const suggestedDomain = domainMap[companyPrefix] || '';
    let autoUsername = '';
    if (firstNameEn && lastNameEn) {
      autoUsername = `${firstNameEn.trim().toLowerCase()}.${lastNameEn.trim().charAt(0).toLowerCase()}`;
    }
    const suggestedEmail = autoUsername ? `${autoUsername}${suggestedDomain}` : suggestedDomain;
    const roleOptions = roles.map(r => `<option value="${r.id}" ${r.name === 'Employee' ? 'selected' : ''}>${r.name}</option>`).join('');

    await Swal.fire({
      title: 'สร้างสิทธิ์การเข้าใช้งาน',
      text: empName,
      html: `
        <div style="text-align: left; font-size: 13px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">อีเมลบริษัท:</label>
          <input id="swal-input-email" class="swal2-input" value="${suggestedEmail}" style="width: 90%; margin: 0 0 15px 0;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">สิทธิ์การใช้งาน (Role):</label>
          <select id="swal-input-role" class="swal2-select" style="width: 90%; margin: 0 0 15px 0;">${roleOptions}</select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกสิทธิ์',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const email = document.getElementById('swal-input-email').value;
        const roleId = document.getElementById('swal-input-role').value;
        return { email, roleId };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { email, roleId } = result.value;
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${empId}/grant-access`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, roleId })
        });
        if (res.ok) {
          setNewEmployees(prev => prev.filter(e => e.id !== empId));
          Swal.fire('สำเร็จ!', 'สร้างสิทธิ์เรียบร้อยแล้ว', 'success');
        }
      }
    });
  };

  // 1. หน้าจอสำหรับ: พนักงานทั่วไป (Employee)
  const renderEmployeeDashboard = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-2xl p-7 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c5c3e 0%, #ae8a68 50%, #f89919 100%)', boxShadow: '0 8px 24px rgba(248,153,25,0.2)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="text-sm font-medium text-amber-100 mb-1 tracking-wide">ยินดีต้อนรับกลับ</div>
          <h2 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.4px' }}>สวัสดี, {userName} 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>ระบบสารสนเทศและบริการกลางองค์กร (ASCG Enterprise Hub)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        <div 
          onClick={() => navigate('/it-support')}
          className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-[#e9ebee] dark:border-[#364356] hover:border-orange-200 dark:hover:border-orange-500/50 transition-all group cursor-pointer" 
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-[#fff7ed] dark:bg-amber-950/40">
            <Activity size={22} style={{ color: '#f89919' }} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1" style={{ fontSize: 15 }}>แจ้งปัญหา IT</h3>
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: 13 }}>ส่งคำร้องแจ้งซ่อมอุปกรณ์และระบบไอที</p>
        </div>
        <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-[#e9ebee] dark:border-[#364356] hover:border-orange-200 dark:hover:border-orange-500/50 transition-all group cursor-default" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-[#fdf8f4] dark:bg-amber-950/30">
            <Wallet size={22} style={{ color: '#ae8a68' }} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1" style={{ fontSize: 15 }}>สลิปเงินเดือน</h3>
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: 13 }}>ดูสลิปเงินเดือนเดือนล่าสุดและย้อนหลัง</p>
        </div>
        <div 
          onClick={() => navigate('/profile')}
          className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-[#e9ebee] dark:border-[#364356] hover:border-orange-200 dark:hover:border-orange-500/50 transition-all group cursor-pointer"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-[#fff7ed] dark:bg-amber-950/40">
            <FileText size={22} style={{ color: '#f89919' }} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1" style={{ fontSize: 15 }}>ข้อมูลส่วนตัว</h3>
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: 13 }}>ตรวจสอบและขอแก้ไขประวัติส่วนตัว</p>
        </div>
      </div>
    </div>
  );

  // 2. หน้าจอสำหรับ: ทรัพยากรบุคคล (HR)
  const renderHRDashboard = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="mb-1">
        <h2 className="page-title text-slate-900 dark:text-slate-100 text-xl font-bold">ภาพรวมทรัพยากรบุคคล</h2>
        <p className="page-subtitle text-slate-500 dark:text-slate-400 text-sm">สถิติและข้อมูลพนักงานประจำเดือน</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 stagger">
        {[
          { label: 'พนักงานทั้งหมด (Active)', value: stats.totalEmployees, icon: Users, color: '#f89919', bgColor: '#fff7ed', darkBg: '#451a03', accent: '#f89919' },
          { label: 'พนักงานใหม่ (เดือนนี้)', value: stats.newThisMonth, icon: UserPlus, color: '#059669', bgColor: '#ecfdf5', darkBg: '#064e3b', accent: '#10b981' },
          { label: 'พนักงานพ้นสภาพ', value: stats.resigned, icon: AlertCircle, color: '#dc2626', bgColor: '#fff1f2', darkBg: '#4c0519', accent: '#f43f5e' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#262f3f] rounded-2xl p-5 border border-[#e9ebee] dark:border-[#364356] flex items-center gap-4 relative overflow-hidden transition-all hover:shadow-md" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: item.accent }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bgColor }}>
              <item.icon size={24} style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{item.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 3. หน้าจอสำหรับ: ผู้ดูแลระบบ (Admin & IT Support)
  const renderAdminDashboard = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title text-slate-900 dark:text-slate-100 text-xl font-bold">System & IT Operations</h2>
          <p className="page-subtitle text-slate-500 dark:text-slate-400 text-sm">ภาพรวมระบบไอทีโครงสร้างพื้นฐานและการแจ้งเตือน</p>
        </div>
        <button
          onClick={() => navigate('/admin/it-health-check')}
          className="btn-primary flex items-center gap-2 w-fit bg-[#f89919] hover:bg-[#d97c08] text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
        >
          <Activity size={15} />
          <span>ตรวจเช็คระบบรายวัน</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#f89919] to-[#d97c08] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-amber-100 font-medium mb-1">พนักงานในระบบ (Active)</p>
              <h3 className="text-4xl font-bold">{stats.totalEmployees}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate('/admin/it-support')}>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-rose-100 font-medium mb-1">แจ้งซ่อม IT (รอดำเนินการ)</p>
              <h3 className="text-4xl font-bold">{pendingTicketsCount}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShieldAlert size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 🌟 EXECUTIVE OPERATIONS SUMMARY WIDGET (รายงานภาพรวมผู้บริหาร Real-Time) 🌟 🌟 */}
      <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#364356] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-[#1c232f] text-[#f89919] rounded-xl border border-transparent dark:border-amber-900/40">
              <BarChart3 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                รายงานภาพรวม (Operations Summary)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ข้อมูลเชื่อมโยงแบบ Real-time จากโมดูล Assets, Helpdesk และ IT Health Checks
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/admin/it-health-check')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#f89919] hover:underline"
          >
            <span>ดูรายงานฉบับเต็ม & Export Excel</span>
            <ExternalLink size={14} />
          </button>
        </div>

        {/* 1. Computer Breakdown by Company */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Laptop size={16} className="text-[#f89919]" />
              <span>สรุปจำนวนคอมพิวเตอร์ (PC / Notebook) แยกตามบริษัทในเครือ</span>
            </h4>
            <span className="text-xs font-extrabold text-[#f89919] bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
              รวมทั้งหมด {execSummary.total_computers || 110} เครื่อง
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {execSummary.asset_counts && execSummary.asset_counts.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/admin/assets?company=${encodeURIComponent(item.company || '')}`)}
                className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] p-3 rounded-xl hover:border-[#f89919] hover:bg-orange-50/20 dark:hover:bg-[#2e394b] hover:shadow-xs cursor-pointer transition-all group"
                title={`คลิกเพื่อดูรายการทรัพย์สินของ ${item.company || 'ไม่ระบุ'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase group-hover:text-[#f89919] transition-colors">{item.company || 'ไม่ระบุ'}</div>
                  <span className="text-[10px] text-slate-400 group-hover:text-[#f89919] transition-colors">↗</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {item.computer_count} <span className="text-xs font-semibold text-slate-400">เครื่อง</span>
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle size={10} /> ดูทรัพย์สิน {item.company} →
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Infrastructure & Firewall Change Notes */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Server size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>หมายเหตุและประวัติการเปลี่ยนแปลงระบบ Network & Firewall</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {execSummary.network_logs && execSummary.network_logs.map((log, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl flex items-start gap-3">
                <ShieldAlert size={18} className="text-[#f89919] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{log.location} — {log.device}</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">{log.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );  

  return (
    <>
      {(userRole === 'Admin' || userRole === 'IT Support') && renderAdminDashboard()}
      {userRole === 'HR' && renderHRDashboard()}
      {(userRole === 'Employee' || userRole === 'Manager') && renderEmployeeDashboard()}
    </>
  );
}