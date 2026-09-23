import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, 
  Calendar, RefreshCw, Plus, Edit3, Server, Wifi, Video, Clock, 
  Building2, UserCheck, Search, Filter, FileText, Download,
  BarChart3, Laptop, HelpCircle, Layers, ArrowUpRight, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ITHealthCheckPage() {
  const navigate = useNavigate();
  const getTodayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [mainTab, setMainTab] = useState('daily'); // 'daily' | 'executive'
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState([]);
  const [summary, setSummary] = useState({ total_branches: 0, total_items: 0, normal_count: 0, fault_count: 0, warning_count: 0 });
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [availableDates, setAvailableDates] = useState([]);
  const [activeBranch, setActiveBranch] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Date Range Filter State สำหรับ Export
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [exporting, setExporting] = useState(false);

  // Executive Real-Time Summary State
  const [execLoading, setExecLoading] = useState(false);
  const [execData, setExecData] = useState({
    total_computers: 0,
    asset_counts: [],
    helpdesk_summary: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
    branch_stats: [],
    network_logs: [
      { location: 'ซอย 10 (Head Office)', device: 'FortiGate 70G', note: 'อัปเดตเปลี่ยน Firewall เป็นรุ่น 70G รุ่นใหม่แล้ว (ต้อง Upgrade Log Server)' },
      { location: 'BD-8 (ซอย 74)', device: 'FortiGate 60F', note: 'ปริมาณการใช้งานปกติ' }
    ]
  });

  // Modal State สำหรับบันทึก/อัปเดตข้อมูล
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBranch, setModalBranch] = useState('Soi-10');
  const [modalDate, setModalDate] = useState(getTodayDateString());
  const [reporterName, setReporterName] = useState('นาย ธนกฤต กิจสมฝัน');
  const [reporterRole, setReporterRole] = useState('IT Supports');
  const [generalNotes, setGeneralNotes] = useState('');
  const [modalItems, setModalItems] = useState([]);

  const branchList = [
    { code: 'all', name: 'ทุกสาขา' },
    { code: 'Soi-10', name: 'ซอย 10' },
    { code: 'Soi-74', name: 'ซอย 74' },
    { code: 'Soi-21', name: 'ซอย 21' },
    { code: 'BD-15', name: 'ตึก15' },
    { code: 'Rayong', name: 'ระยอง' }
  ];

  const defaultBranchTemplates = {
    'Soi-10': [
      { category: 'Internet', item_name: 'TOT 500/1000', subject: 'Link Status/Speedtest', status: 'N', remarks: 'ปกติ' },
      { category: 'Firewall', item_name: 'FGT-60E', subject: 'Rule/Policy Status', status: 'N', remarks: 'ปกติ' },
      { category: 'Firewall', item_name: 'VPN to BD-7 (FGT-90D)', subject: 'Connections', status: 'N', remarks: 'Ready' },
      { category: 'VOIP', item_name: 'VOIP System', subject: 'Ready', status: 'N', remarks: 'Ready' },
      { category: 'Server', item_name: 'ASCG-DC01 (Domain Controller)', subject: 'Ready', status: 'N', remarks: 'Ready' },
      { category: 'Server', item_name: 'SHAREFILE (Sharefile / ExpressA)', subject: 'Ready', status: 'N', remarks: 'Ready' }
    ],
    'Soi-74': [
      { category: 'Internet', item_name: 'AIS 1000/1000 Mbps FixIP', subject: 'Link Status/Speedtest', status: 'N', remarks: 'ปกติ' },
      { category: 'Internet', item_name: 'True 1000/1000 Mbps', subject: 'Link Status', status: 'N', remarks: 'ปกติ' },
      { category: 'Telephone', item_name: 'NT (Telephone Fiber)', subject: 'Status', status: 'N', remarks: 'ใช้งานได้ปกติ' },
      { category: 'Firewall', item_name: 'FGT-60F', subject: 'Rule/Policy Status', status: 'N', remarks: 'ปกติ' },
      { category: 'Firewall', item_name: 'VPN to Soi10 (FGT60E)', subject: 'Connections', status: 'N', remarks: 'Ready' },
      { category: 'VOIP', item_name: 'VOIP System', subject: 'Ready', status: 'N', remarks: 'Ready' }
    ],
    'Soi-21': [
      { category: 'Internet', item_name: 'AIS 1000/1000Mbps', subject: 'Link IP WAN Status', status: 'N', remarks: 'ปกติ' },
      { category: 'CCTV', item_name: 'CH1-16', subject: 'Monitor/Record', status: 'N', remarks: 'ปกติ' },
      { category: 'Time/Access', item_name: 'Time attendance', subject: 'Ready', status: 'N', remarks: 'Ready' }
    ],
    'BD-15': [
      { category: 'Internet', item_name: 'AIS 1000/1000 Mbps', subject: 'Link IP WAN Status', status: 'N', remarks: 'ปกติ' },
      { category: 'Time/Access', item_name: 'Time attendance', subject: 'Ready', status: 'N', remarks: 'Ready' },
      { category: 'CCTV', item_name: 'CH1-8', subject: 'Ready', status: 'N', remarks: 'Ready' }
    ],
    'Rayong': [
      { category: 'Internet', item_name: 'AIS 1000/1000Mbps W7', subject: 'Link ascgrayong.ddns.net', status: 'N', remarks: 'ปกติ' },
      { category: 'Internet', item_name: 'NT 1000/500 W16', subject: 'Link ascgrayongw16.ddns.net', status: 'N', remarks: 'ปกติ' },
      { category: 'CCTV', item_name: 'CH1-6 W7', subject: 'Monitor/Record', status: 'N', remarks: 'ปกติ' },
      { category: 'CCTV', item_name: 'CH1-8 W16', subject: 'Monitor/Record', status: 'N', remarks: 'ปกติ' },
      { category: 'Time/Access', item_name: 'Time attendance', subject: 'Ready /Access', status: 'N', remarks: 'Ready' }
    ]
  };

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  useEffect(() => {
    if (mainTab === 'daily') {
      fetchHealthData(selectedDate, activeBranch);
    } else {
      fetchExecutiveSummary();
    }
  }, [selectedDate, activeBranch, mainTab]);

  const fetchAvailableDates = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-health-check/dates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setAvailableDates(data.data);
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
    }
  };

  const fetchHealthData = async (dateStr, branchCode) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-health-check?date=${dateStr}&branch=${branchCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHealthData(data.data || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching health check data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutiveSummary = async () => {
    setExecLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-health-check/executive-summary?from_date=${fromDate}&to_date=${toDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setExecData(prev => ({
          ...prev,
          ...data.data,
          asset_counts: (data.data.asset_counts && data.data.asset_counts.length > 0) ? data.data.asset_counts : prev.asset_counts
        }));
      }
    } catch (err) {
      console.error('Error fetching executive summary:', err);
    } finally {
      setExecLoading(false);
    }
  };

  // Export Excel Functionality อิงจากไฟล์ต้นแบบ IT Report 08-2026.xlsx 100%
  const handleExportExcel = async (exportType = 'range') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/it-health-check/download-excel`;
      let fileNameStr = `IT_Report_08-2026_ALL.xlsx`;

      if (exportType === 'range') {
        url += `?from_date=${fromDate}&to_date=${toDate}`;
        fileNameStr = `IT_Report_08-2026_${fromDate}_to_${toDate}.xlsx`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถดาวน์โหลดไฟล์ Excel ได้');
      }

      const blob = await res.blob();
      saveAs(blob, fileNameStr);

      Swal.fire({
        icon: 'success',
        title: 'ส่งออกข้อมูลสำเร็จ!',
        text: `ดาวน์โหลดไฟล์ ${fileNameStr} (รูปแบบ IT Report 08-2026.xlsx) เรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Export Error:', err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถสร้างไฟล์ Excel ได้', 'error');
    } finally {
      setExporting(false);
    }
  };

  const openNewCheckModal = async (targetBranchCode = 'Soi-10') => {
    const existingBranchData = healthData.find(b => b.branch_code === targetBranchCode);
    setModalBranch(targetBranchCode);
    setModalDate(selectedDate);
    setReporterName(existingBranchData ? existingBranchData.reporter_name : 'นาย ธนกฤต กิจสมฝัน');
    setReporterRole(existingBranchData ? existingBranchData.reporter_role : 'IT Supports');
    setGeneralNotes(existingBranchData ? existingBranchData.general_notes || '' : '');

    if (existingBranchData && existingBranchData.items && existingBranchData.items.length > 0) {
      setModalItems(existingBranchData.items.map(it => ({ ...it })));
    } else {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-health-check?date=2026-08-01&branch=${targetBranchCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success' && data.data && data.data[0] && data.data[0].items && data.data[0].items.length > 0) {
          const fetchedItems = data.data[0].items.map(it => ({
            category: it.category,
            item_name: it.item_name,
            subject: it.subject,
            status: 'N',
            remarks: 'ปกติ'
          }));
          setModalItems(fetchedItems);
        } else {
          const template = defaultBranchTemplates[targetBranchCode] || defaultBranchTemplates['Soi-10'];
          setModalItems(template.map(t => ({ ...t })));
        }
      } catch (err) {
        const template = defaultBranchTemplates[targetBranchCode] || defaultBranchTemplates['Soi-10'];
        setModalItems(template.map(t => ({ ...t })));
      }
    }
    setIsModalOpen(true);
  };

  const handleModalItemChange = (index, field, value) => {
    const updated = [...modalItems];
    updated[index][field] = value;
    if (field === 'status') {
      if (value === 'N') updated[index].remarks = 'ปกติ';
      else if (value === 'F' && !updated[index].remarks) updated[index].remarks = 'ขัดข้อง/Down';
    }
    setModalItems(updated);
  };

  const handleAddModalItem = () => {
    setModalItems([
      ...modalItems,
      { category: 'Network', item_name: '', subject: '', status: 'N', remarks: '' }
    ]);
  };

  const handleRemoveModalItem = (index) => {
    setModalItems(modalItems.filter((_, i) => i !== index));
  };

  const handleSaveCheck = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const bObj = branchList.find(b => b.code === modalBranch);
      const branchName = bObj ? `สาขา ${bObj.name}` : modalBranch;

      const payload = {
        check_date: modalDate,
        branch_code: modalBranch,
        branch_name: branchName,
        reporter_name: reporterName,
        reporter_role: reporterRole,
        general_notes: generalNotes,
        items: modalItems
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-health-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'บันทึกสถานะตรวจเช็คระบบ IT เรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false
        });
        setIsModalOpen(false);
        fetchAvailableDates();
        fetchHealthData(selectedDate, activeBranch);
      } else {
        Swal.fire('ข้อผิดพลาด', data.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('internet') || c.includes('network') || c.includes('telephone')) return <Wifi size={16} className="text-sky-500" />;
    if (c.includes('firewall') || c.includes('vpn')) return <ShieldAlert size={16} className="text-amber-500" />;
    if (c.includes('server')) return <Server size={16} className="text-indigo-500" />;
    if (c.includes('cctv')) return <Video size={16} className="text-emerald-500" />;
    if (c.includes('time') || c.includes('access')) return <Clock size={16} className="text-purple-500" />;
    return <Activity size={16} className="text-slate-500" />;
  };

  const filteredHealthData = healthData.filter(branch => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchBranch = branch.branch_name.toLowerCase().includes(q) || branch.branch_code.toLowerCase().includes(q);
    const matchItem = branch.items && branch.items.some(i => 
      i.item_name.toLowerCase().includes(q) || 
      (i.remarks && i.remarks.toLowerCase().includes(q))
    );
    return matchBranch || matchItem;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* --- PAGE HEADER & TOP NAVIGATION TABS --- */}
      <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#f89919] uppercase tracking-wider mb-1">
              <Activity size={16} />
              <span>ASCG Group Enterprise IT Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              ระบบจัดการและตรวจเช็คสถานะ IT (System Operations & Health Check)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ติดตามสถานะโครงสร้างพื้นฐาน IT รายวัน และรายงานสรุปผู้บริหารแบบ Real-Time ข้ามโมดูล
            </p>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={() => handleExportExcel('range')}
              disabled={exporting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
              title="ส่งออกรายงานตามช่วงวันที่เลือก"
            >
              <Download size={16} />
              <span>{exporting ? 'กำลังสร้างไฟล์...' : 'Export ตามช่วงวันที่'}</span>
            </button>

            <button 
              onClick={() => handleExportExcel('all')}
              disabled={exporting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
              title="ส่งออกข้อมูลทั้งหมดในระบบ"
            >
              <Download size={16} />
              <span>Export ทั้งหมด</span>
            </button>

            <button 
              onClick={() => openNewCheckModal(activeBranch !== 'all' ? activeBranch : 'Soi-10')}
              className="flex items-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-[#f89919]/20 transition-all text-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>บันทึกสถานะประจำวัน</span>
            </button>
          </div>
        </div>

        {/* --- MAIN TABS & DATE RANGE FILTER BAR --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#364356]">
          
          {/* Main Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1c232f] p-1 rounded-xl w-full sm:w-max overflow-x-auto">
            <button
              onClick={() => setMainTab('daily')}
              className={`flex-1 sm:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mainTab === 'daily'
                  ? 'bg-white dark:bg-[#262f3f] text-[#f89919] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={15} />
              <span>ตรวจเช็ครายวัน (Daily Check)</span>
            </button>

            <button
              onClick={() => setMainTab('executive')}
              className={`flex-1 sm:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mainTab === 'executive'
                  ? 'bg-white dark:bg-[#262f3f] text-[#f89919] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={15} />
              <span>รายงานภาพรวม (Operations Summary)</span>
            </button>
          </div>

          {/* Date Range Picker Controls */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-[#1c232f] p-2 rounded-xl border border-slate-200 dark:border-[#364356] w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">ช่วงวันที่ Export:</span>
            <div className="flex items-center gap-1.5">
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] px-2 py-1 rounded-lg text-slate-800 dark:text-slate-100 font-semibold text-xs outline-none"
              />
              <span className="text-slate-400">ถึง</span>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] px-2 py-1 rounded-lg text-slate-800 dark:text-slate-100 font-semibold text-xs outline-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY SYSTEM CHECK VIEW                             */}
      {/* ========================================================= */}
      {mainTab === 'daily' && (
        <div className="space-y-6">
          
          {/* Daily Date Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1c232f] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#364356] text-xs font-medium text-slate-700 dark:text-slate-300">
                <Calendar size={16} className="text-[#f89919]" />
                <span>วันที่เลือกดู:</span>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 border-none outline-none cursor-pointer"
                />
              </div>

              <button 
                onClick={() => fetchHealthData(selectedDate, activeBranch)} 
                className="p-2 bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="ค้นหาอุปกรณ์, IP, หมายเหตุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f89919]"
              />
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-[#1c232f] text-slate-700 dark:text-slate-300 rounded-xl">
                <Building2 size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-400">สาขาที่ตรวจเช็ค</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{summary.total_branches || 0} สาขา</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Activity size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-400">ระบบทั้งหมดที่เช็ค</div>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{summary.total_items || 0} รายการ</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">ทำงานปกติ (Normal)</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.normal_count || 0} รายการ</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-rose-100 dark:border-rose-900/60 shadow-sm flex items-center gap-4 relative overflow-hidden">
              {summary.fault_count > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping m-2" />
              )}
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                <XCircle size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">ขัดข้อง (Fault / Down)</div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{summary.fault_count || 0} รายการ</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-amber-100 dark:border-amber-900/60 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">มีหมายเหตุ / เตือน</div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.warning_count || 0} รายการ</div>
              </div>
            </div>
          </div>

          {/* Branch Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-[#262f3f] p-2 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm custom-scrollbar">
            {branchList.map(b => (
              <button
                key={b.code}
                onClick={() => setActiveBranch(b.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeBranch === b.code
                    ? 'bg-[#f89919] text-white shadow-sm shadow-[#f89919]/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c232f]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Branch Cards List */}
          {loading ? (
            <div className="bg-white dark:bg-[#262f3f] p-12 rounded-2xl border border-slate-200 dark:border-[#364356] text-center">
              <RefreshCw size={32} className="animate-spin mx-auto text-[#f89919] mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">กำลังโหลดข้อมูลสถานะระบบ IT...</p>
            </div>
          ) : filteredHealthData.length === 0 ? (
            <div className="bg-white dark:bg-[#262f3f] p-12 rounded-2xl border border-slate-200 dark:border-[#364356] text-center">
              <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">ยังไม่มีการบันทึกสถานะประจำวัน</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">ยังไม่มีการลงบันทึกสถานะระบบในวันที่ {selectedDate}</p>
              <button 
                onClick={() => openNewCheckModal(activeBranch !== 'all' ? activeBranch : 'Soi-10')}
                className="inline-flex items-center gap-2 bg-[#f89919] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#d97c08] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>เริ่มต้นบันทึกสถานะของวันนี้</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredHealthData.map((branch) => {
                const hasFault = branch.items && branch.items.some(i => i.status === 'F');
                
                return (
                  <div 
                    key={branch.id || branch.branch_code}
                    className={`bg-white dark:bg-[#262f3f] rounded-2xl border transition-all overflow-hidden shadow-sm ${
                      hasFault ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200 dark:border-[#364356]'
                    }`}
                  >
                    <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
                      hasFault ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' : 'bg-slate-50/80 dark:bg-[#1c232f] border-slate-200 dark:border-[#364356]'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl font-bold ${
                          hasFault ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-900 dark:bg-slate-700 text-white'
                        }`}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{branch.branch_name}</h2>
                            {hasFault && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center gap-1 animate-pulse">
                                <XCircle size={10} /> มีระบบขัดข้อง
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <UserCheck size={14} className="text-slate-400" />
                              ผู้บันทึก: <strong className="text-slate-700 dark:text-slate-200">{branch.reporter_name}</strong> ({branch.reporter_role})
                            </span>
                            <span>•</span>
                            <span>วันที่: {selectedDate}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => openNewCheckModal(branch.branch_code)}
                        className="flex items-center gap-1.5 bg-white dark:bg-[#262f3f] hover:bg-slate-100 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#364356] transition-colors shadow-xs cursor-pointer"
                      >
                        <Edit3 size={14} className="text-[#f89919]" />
                        <span>อัปเดตสถานะ</span>
                      </button>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-[#364356] text-slate-400 font-bold uppercase tracking-wider">
                              <th className="pb-3 px-2">หมวดหมู่</th>
                              <th className="pb-3 px-3">ชื่ออุปกรณ์ / ระบบ</th>
                              <th className="pb-3 px-3">รายการตรวจเช็ค (Subject)</th>
                              <th className="pb-3 px-3 text-center">สถานะ (Status)</th>
                              <th className="pb-3 px-3">หมายเหตุ / รายละเอียด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {branch.items && branch.items.map((item, idx) => (
                              <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${
                                item.status === 'F' ? 'bg-rose-50/30' : ''
                              }`}>
                                <td className="py-3 px-2 font-medium text-slate-700">
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(item.category)}
                                    <span>{item.category}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-900">
                                  {item.item_name}
                                </td>
                                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                                  {item.subject || '-'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {item.status === 'F' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                      <XCircle size={14} className="text-rose-500" />
                                      <span>{item.status_text || 'ขัดข้อง'}</span>
                                    </span>
                                  ) : item.status === 'N' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      <CheckCircle2 size={14} className="text-emerald-500" />
                                      <span>{item.status_text || 'ปกติ'}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                      <AlertTriangle size={14} className="text-amber-500" />
                                      <span>{item.status_text || 'เตือน'}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-600 font-medium">
                                  {item.remarks ? (
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      item.status === 'F' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-600'
                                    }`}>
                                      {item.remarks}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EXECUTIVE REAL-TIME SUMMARY VIEW (Sheet Summary)     */}
      {/* ========================================================= */}
      {mainTab === 'executive' && (
        <div className="space-y-6">
          
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#f89919]">Real-Time Cross-Module Summary</span>
              <h2 className="text-2xl font-bold mt-1">รายงานภาพรวม (Operations Summary)</h2>
              <p className="text-xs text-slate-300 mt-1">
                เชื่อมโยงข้อมูลอัตโนมัติจากโมดูลทรัพย์สิน (`Assets`), แจ้งซ่อม IT (`Helpdesk`), และการตรวจเช็คโครงสร้างพื้นฐาน
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">คอมพิวเตอร์ในระบบ</div>
                <div className="text-2xl font-bold text-[#f89919]">{execData.total_computers || 110} เครื่อง</div>
              </div>
            </div>
          </div>

          {/* 1. สรุปจำนวนคอมพิวเตอร์จำแนกตามบริษัท (Real-time Assets) */}
          <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#364356] pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="text-[#f89919]" size={20} />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. สรุปจำนวนคอมพิวเตอร์ PC / Notebook แยกตามบริษัท (Real-Time Assets)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-[#1c232f] px-2.5 py-1 rounded-lg">
                รวมทั้งหมด {execData.total_computers} เครื่อง
              </span>
            </div>

            {execData.asset_counts && execData.asset_counts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {execData.asset_counts.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/admin/assets?company=${encodeURIComponent(item.company || '')}`)}
                    className="bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] p-3.5 rounded-xl hover:border-[#f89919] hover:bg-orange-50/20 dark:hover:bg-amber-950/30 hover:shadow-xs cursor-pointer transition-all group"
                    title={`คลิกเพื่อดูรายการทรัพย์สินของ ${item.company || 'ไม่ระบุ'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase group-hover:text-[#f89919] transition-colors">{item.company || 'ไม่ระบุ'}</div>
                      <span className="text-[10px] text-slate-400 group-hover:text-[#f89919] transition-colors">↗</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                      {item.computer_count} <span className="text-xs font-semibold text-slate-400">เครื่อง</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} /> ดูทรัพย์สิน {item.company} →
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl text-center">
                <Laptop size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 opacity-60" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ยังไม่มีข้อมูลคอมพิวเตอร์ในระบบ (0 เครื่อง)
                </p>
              </div>
            )}
          </div>

          {/* 2. สรุปทิกเก็ตแจ้งซ่อม IT (Helpdesk) & สถานะ Network / Firewall */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Helpdesk Summary Card */}
            <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#364356] pb-3">
                <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">2. รายงาน Helpdesk & Support Tickets</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">รอดำเนินการ</div>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{execData.helpdesk_summary.pending || 0}</div>
                </div>
                <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-sky-700 dark:text-sky-400">กำลังซ่อม</div>
                  <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{execData.helpdesk_summary.in_progress || 0}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">แก้ไขเสร็จสิ้น</div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{execData.helpdesk_summary.resolved || 0}</div>
                </div>
              </div>
            </div>

            {/* Network & Infrastructure Logs */}
            <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#364356] pb-3">
                <ShieldAlert className="text-amber-500" size={20} />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">3. หมายเหตุการเปลี่ยนแปลงระบบ Network & Firewall</h3>
              </div>

              <div className="space-y-2 text-xs">
                {execData.network_logs && execData.network_logs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl flex items-start gap-3">
                    <Server size={18} className="text-[#f89919] shrink-0 mt-0.5" />
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
      )}

      {/* --- MODAL FORM FOR ADDING / UPDATING CHECK STATUS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-[#364356] my-8">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#364356] pb-4 mb-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-lg">
                <Edit3 className="text-[#f89919]" size={20} />
                <span>บันทึก / อัปเดตสถานะตรวจเช็คระบบ IT</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c232f] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">เลือกสาขา:</label>
                  <select
                    value={modalBranch}
                    onChange={(e) => openNewCheckModal(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-[#364356] rounded-xl bg-slate-50 dark:bg-[#1c232f] font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {branchList.filter(b => b.code !== 'all').map(b => (
                      <option key={b.code} value={b.code} className="dark:bg-[#1c232f]">สาขา {b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">วันที่ตรวจเช็ค:</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-[#364356] rounded-xl bg-slate-50 dark:bg-[#1c232f] font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">ผู้ตรวจเช็ค:</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-[#364356] rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1c232f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">ตำแหน่ง:</label>
                  <input
                    type="text"
                    value={reporterRole}
                    onChange={(e) => setReporterRole(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-[#364356] rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1c232f] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold">รายการอุปกรณ์ & สถานะ:</label>
                  <button 
                    type="button"
                    onClick={handleAddModalItem}
                    className="text-[#f89919] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> เพิ่มรายการใหม่
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-[#364356] rounded-xl p-3 bg-slate-50/50 dark:bg-[#1c232f]/50">
                  {modalItems.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#262f3f] p-2.5 rounded-xl border border-slate-200 dark:border-[#364356] flex flex-col sm:flex-row gap-2 items-center">
                      <select
                        value={item.category}
                        onChange={(e) => handleModalItemChange(idx, 'category', e.target.value)}
                        className="w-full sm:w-28 p-1.5 border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-lg text-[11px] font-semibold outline-none"
                      >
                        <option value="Internet" className="dark:bg-[#1c232f]">Internet</option>
                        <option value="Firewall" className="dark:bg-[#1c232f]">Firewall</option>
                        <option value="VOIP" className="dark:bg-[#1c232f]">VOIP</option>
                        <option value="Server" className="dark:bg-[#1c232f]">Server</option>
                        <option value="CCTV" className="dark:bg-[#1c232f]">CCTV</option>
                        <option value="Time/Access" className="dark:bg-[#1c232f]">Time/Access</option>
                        <option value="Telephone" className="dark:bg-[#1c232f]">Telephone</option>
                      </select>

                      <input 
                        type="text"
                        placeholder="ชื่ออุปกรณ์"
                        value={item.item_name}
                        onChange={(e) => handleModalItemChange(idx, 'item_name', e.target.value)}
                        className="flex-1 p-1.5 border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-lg text-[11px] font-medium outline-none"
                      />

                      <select
                        value={item.status}
                        onChange={(e) => handleModalItemChange(idx, 'status', e.target.value)}
                        className={`p-1.5 border rounded-lg font-bold text-[11px] outline-none ${
                          item.status === 'F' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60' :
                          item.status === 'N' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/60' :
                          'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-900/60'
                        }`}
                      >
                        <option value="N" className="dark:bg-[#1c232f]">ปกติ (N)</option>
                        <option value="F" className="dark:bg-[#1c232f]">ขัดข้อง (F)</option>
                        <option value="W" className="dark:bg-[#1c232f]">เตือน (W)</option>
                      </select>

                      <input 
                        type="text"
                        placeholder="หมายเหตุ"
                        value={item.remarks}
                        onChange={(e) => handleModalItemChange(idx, 'remarks', e.target.value)}
                        className="w-full sm:w-36 p-1.5 border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-lg text-[11px] outline-none"
                      />

                      <button 
                        type="button"
                        onClick={() => handleRemoveModalItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">หมายเหตุเพิ่มเติมภาพรวม:</label>
                <textarea
                  rows="2"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="เช่น สาย Fiber ขาดกำลังรอช่าง..."
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveCheck}
                className="px-5 py-2 rounded-xl bg-[#f89919] hover:bg-[#d97c08] text-white text-xs font-bold shadow-md shadow-[#f89919]/20 transition-all"
              >
                บันทึกสถานะ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
