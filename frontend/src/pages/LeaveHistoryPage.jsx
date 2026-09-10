import { useState, useEffect } from 'react';
import { History, Search, Filter, Paperclip, X, Download } from 'lucide-react';

export default function LeaveHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [viewAttachment, setViewAttachment] = useState(null);

  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/leave/approvals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.data);
        setFilteredRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          (r.emp_fname && r.emp_fname.toLowerCase().includes(term)) ||
          (r.emp_lname && r.emp_lname.toLowerCase().includes(term)) ||
          (r.emp_nick && r.emp_nick.toLowerCase().includes(term))
      );
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (typeFilter) {
      result = result.filter((r) => r.leave_type_name && r.leave_type_name.includes(typeFilter));
    }

    if (startDate) {
      result = result.filter((r) => new Date(r.start_date) >= new Date(startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.start_date) <= end);
    }

    setFilteredRequests(result);
  }, [searchTerm, statusFilter, typeFilter, startDate, endDate, requests]);

  const uniqueTypes = [...new Set(requests.map((r) => r.leave_type_name))].filter(Boolean);

  const statusLabel = (s) => {
    if (s === 'Approved') return 'อนุมัติแล้ว';
    if (s === 'Rejected') return 'ไม่อนุมัติ';
    if (s === 'Cancelled') return 'ยกเลิก';
    if (s === 'Pending HR') return 'รอ HR';
    if (s === 'Pending Manager') return 'รอหัวหน้า';
    return s;
  };

  const statusClass = (s) => {
    if (s === 'Approved') return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60';
    if (s === 'Rejected' || s === 'Cancelled') return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
    return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-[#f89919] border border-amber-200 dark:border-amber-800/60';
  };

  const exportToCSV = () => {
    if (filteredRequests.length === 0) return;
    const headers = ['ชื่อ-สกุล', 'ชื่อเล่น', 'ประเภทการลา', 'เริ่มวันที่', 'ถึงวันที่', 'จำนวนวัน', 'เหตุผล', 'สถานะ'];
    const rows = filteredRequests.map((r) => {
      return [
        `"${r.emp_fname} ${r.emp_lname}"`,
        `"${r.emp_nick || '-'}"`,
        `"${r.leave_type_name}"`,
        `"${new Date(r.start_date).toLocaleDateString('th-TH')}"`,
        `"${new Date(r.end_date).toLocaleDateString('th-TH')}"`,
        `"${r.total_days}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${statusLabel(r.status)}"`,
      ].join(',');
    });
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `leave_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="text-[#f89919]" />
          ประวัติการลาทั้งหมด
        </h1>
        <p className="text-[#ae8a68] dark:text-slate-400 mt-1">ตรวจสอบประวัติการลางานของพนักงานทุกคนในระบบ</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-[#dfe0df] dark:border-[#364356] shadow-sm mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae8a68] dark:text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, ชื่อเล่น..."
              className="pl-10 pr-4 py-2 border border-[#dfe0df] dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#f89919]/40 focus:border-[#f89919] outline-none w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status */}
          <select
            className="border border-[#dfe0df] dark:border-[#364356] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#f89919]/40 outline-none text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1c232f] text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="Approved">อนุมัติแล้ว</option>
            <option value="Rejected">ไม่อนุมัติ</option>
            <option value="Pending HR">รอ HR</option>
            <option value="Pending Manager">รอหัวหน้า</option>
            <option value="Cancelled">ยกเลิก</option>
          </select>

          {/* Type */}
          <select
            className="border border-[#dfe0df] dark:border-[#364356] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#f89919]/40 outline-none text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1c232f] text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">ประเภททั้งหมด</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Date Range */}
          <input
            type="date"
            className="border border-[#dfe0df] dark:border-[#364356] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#f89919]/40 outline-none text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1c232f] text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="ตั้งแต่วันที่"
          />
          <span className="text-[#ae8a68] dark:text-slate-400 text-sm">ถึง</span>
          <input
            type="date"
            className="border border-[#dfe0df] dark:border-[#364356] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#f89919]/40 outline-none text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1c232f] text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="ถึงวันที่"
          />

          {/* Count + Export */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter size={15} /> พบ {filteredRequests.length} รายการ
            </span>
            <button
              onClick={exportToCSV}
              disabled={filteredRequests.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] text-slate-600 dark:text-slate-400 text-sm font-semibold">
                <th className="py-4 px-6">พนักงาน</th>
                <th className="py-4 px-6">ประเภทการลา</th>
                <th className="py-4 px-6">วันที่ลา</th>
                <th className="py-4 px-6">จำนวนวัน</th>
                <th className="py-4 px-6">เหตุผล</th>
                <th className="py-4 px-6 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-[#2e394b]/40 transition-colors">
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{req.emp_fname} {req.emp_lname}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">({req.emp_nick || '-'})</div>
                    </td>
                    <td className="py-3 px-6 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        {req.leave_type_name}
                        {req.attachment && (
                          <button
                            type="button"
                            onClick={() => setViewAttachment(req.attachment)}
                            className="text-[#f89919] hover:text-[#d97c08] bg-[#fff8f0] dark:bg-amber-950/40 hover:bg-orange-100 p-1 rounded transition-colors cursor-pointer"
                            title="ดูเอกสารแนบ"
                          >
                            <Paperclip size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300 text-sm">
                      {new Date(req.start_date).toLocaleDateString('th-TH')} –{' '}
                      {new Date(req.end_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300 font-medium">{req.total_days} วัน</td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300 text-sm max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(req.status)}`}>
                        {statusLabel(req.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-slate-400">
                    <History size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p>ไม่พบประวัติการลา</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Attachment Modal - อยู่นอก div ที่มี animation เพื่อให้ position:fixed ทำงานถูกต้อง */}
    {viewAttachment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200 dark:border-[#364356]">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f] shrink-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">เอกสารแนบ</h3>
            <button
              onClick={() => setViewAttachment(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-[#262f3f] hover:bg-slate-100 dark:hover:bg-[#1c232f] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-auto bg-slate-100 dark:bg-[#181e28]">
            {viewAttachment.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`}
                className="w-full rounded border border-slate-300 dark:border-[#364356] bg-white"
                style={{ height: '75vh' }}
                title="PDF Viewer"
              />
            ) : (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/leaves/${viewAttachment}`}
                alt="Attachment"
                className="w-full block object-contain"
              />
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
