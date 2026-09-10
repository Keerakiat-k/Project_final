import { useState, useEffect } from 'react';
import { ArrowLeft, Search, CheckCircle, X, User, Plus, FileText, Download, Calendar as CalendarIcon, PieChart, ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TableSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';

export default function ITSupportAdminPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🔄 Sorting State
  const [sortField, setSortField] = useState('date'); // 'date' | 'ticket_no' | 'name' | 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', admin_note: '', assigned_to: '' });

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/it-support', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setTickets(result.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'รอรับเรื่อง': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'กำลังดำเนินการ': return 'bg-indigo-100 text-indigo-700 border-blue-200';
      case 'แก้ไขเสร็จสิ้น': return 'bg-green-100 text-green-700 border-green-200';
      case 'ยกเลิก':
      case 'ยกเลิกรายการ': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const openUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateData({ 
      status: ticket.status, 
      admin_note: ticket.admin_note || '',
      assigned_to: ticket.assigned_to || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        Swal.fire('บันทึกสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
        setSelectedTicket(null);
        fetchTickets(); 
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleDelete = async (ticket) => {
    if (!ticket) return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบรายการ?',
      html: `คุณต้องการลบรายการแจ้งซ่อมรหัส <b>${ticket.ticket_no}</b> (${ticket.name}) ใช่หรือไม่?<br/><span style="font-size: 12px; color: #ef4444;">* ข้อมูลจะถูกลบออกจากระบบและไม่สามารถย้อนกลับได้</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบรายการ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/it-support/${ticket.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: data.message || 'ลบรายการแจ้งซ่อมเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
          });
          if (selectedTicket?.id === ticket.id) {
            setSelectedTicket(null);
          }
          fetchTickets();
        } else {
          Swal.fire('ผิดพลาด', data.message || 'ไม่สามารถลบรายการได้', 'error');
        }
      } catch (error) {
        console.error('Delete Ticket Error:', error);
        Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
      }
    }
  };

  // กรองข้อมูล
  const filteredTickets = tickets.filter(ticket => {
    const matchSearch = 
      ticket.ticket_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.department.toLowerCase().includes(searchTerm.toLowerCase());

    let matchDate = true;
    const ticketDate = ticket.created_at ? ticket.created_at.split('T')[0] : '';
    if (startDate && endDate) {
      matchDate = ticketDate >= startDate && ticketDate <= endDate;
    }

    return matchSearch && matchDate;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortField === 'date') {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }
    if (sortField === 'ticket_no') {
      const codeA = (a.ticket_no || '').toString();
      const codeB = (b.ticket_no || '').toString();
      return sortOrder === 'asc'
        ? codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' })
        : codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortField === 'name') {
      const nameA = (a.name || '').toString();
      const nameB = (b.name || '').toString();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'th') : nameB.localeCompare(nameA, 'th');
    }
    if (sortField === 'status') {
      const stA = (a.status || '').toString();
      const stB = (b.status || '').toString();
      return sortOrder === 'asc' ? stA.localeCompare(stB) : stB.localeCompare(stA);
    }
    return 0;
  });

  // 🌟 1. ฟังก์ชันออกรายงาน PDF (ใช้ Isolated Print Frame ป้องกันปัญหา Layout ซ้อนทับ 100%) 🌟
  const handleExportPDF = () => {
    if (filteredTickets.length === 0) {
      Swal.fire('แจ้งเตือน', 'ไม่พบข้อมูลรายการแจ้งซ่อมสำหรับพิมพ์รายงาน', 'warning');
      return;
    }

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>รายงานสรุปการแจ้งซ่อมและปัญหา IT - ASCG Group</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', 'Prompt', 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .header h2 {
      margin: 0 0 5px 0;
      font-size: 15px;
      color: #334155;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 11.5px;
      color: #64748b;
    }
    .stats-grid {
      display: table;
      width: 100%;
      margin-bottom: 20px;
    }
    .stat-box {
      display: table-cell;
      width: 25%;
      padding: 10px 8px;
      text-align: center;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
    }
    .stat-box + .stat-box {
      border-left: none;
    }
    .stat-box .title {
      font-size: 10.5px;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .stat-box .val {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
    }
    .stat-box.green { background: #f0fdf4; border-color: #86efac; }
    .stat-box.green .val { color: #15803d; }
    .stat-box.green .title { color: #166534; }
    .stat-box.orange { background: #fffbeb; border-color: #fde68a; }
    .stat-box.orange .val { color: #b45309; }
    .stat-box.orange .title { color: #92400e; }
    .stat-box.red { background: #fef2f2; border-color: #fecaca; }
    .stat-box.red .val { color: #b91c1c; }
    .stat-box.red .title { color: #991b1b; }
    
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 10px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
      padding: 8px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    table.data-table td {
      padding: 7px 6px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      display: inline-block;
    }
    .badge-done { background: #dcfce7; color: #15803d; }
    .badge-doing { background: #dbeafe; color: #1d4ed8; }
    .badge-wait { background: #ffedd5; color: #c2410c; }
    .badge-cancel { background: #fee2e2; color: #b91c1c; }
    .footer-note {
      margin-top: 25px;
      text-align: right;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 ASCG GLOBAL GROUP</h1>
    <h2>รายงานสรุปการแจ้งซ่อมและปัญหา IT (Executive IT Helpdesk Report)</h2>
    <p>ข้อมูลตั้งแต่วันที่: ${startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'ทั้งหมด'} ถึง: ${endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'} | พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="title">เคสทั้งหมด</div>
      <div class="val">${stats.total}</div>
    </div>
    <div class="stat-box green">
      <div class="title">แก้ไขเสร็จสิ้น</div>
      <div class="val">${stats.completed}</div>
    </div>
    <div class="stat-box orange">
      <div class="title">กำลังดำเนินการ / รอรับเรื่อง</div>
      <div class="val">${stats.pending}</div>
    </div>
    <div class="stat-box red">
      <div class="title">ยกเลิกรายการ</div>
      <div class="val">${stats.cancelled}</div>
    </div>
  </div>

  <div style="font-size: 12px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">📋 รายการแจ้งปัญหา IT (${filteredTickets.length} รายการ)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 13%;">รหัสคำขอ</th>
        <th style="width: 11%;">วันที่แจ้ง</th>
        <th style="width: 18%;">ผู้แจ้ง (แผนก)</th>
        <th style="width: 16%;">หมวดหมู่</th>
        <th style="width: 29%;">รายละเอียดอาการ</th>
        <th style="width: 13%; text-align: center;">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${filteredTickets.map(ticket => `
        <tr>
          <td style="font-family: monospace; font-weight: bold; color: #d97706;">${ticket.ticket_no}</td>
          <td>${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '-'}</td>
          <td>
            <strong>${ticket.name || '-'}</strong><br/>
            <span style="color: #64748b; font-size: 9.5px;">${ticket.department || '-'}</span>
          </td>
          <td>${ticket.category || '-'}</td>
          <td style="color: #334155;">${ticket.description || '-'}</td>
          <td style="text-align: center;">
            <span class="badge ${
              ticket.status === 'แก้ไขเสร็จสิ้น' ? 'badge-done' :
              ticket.status === 'กำลังดำเนินการ' ? 'badge-doing' :
              (ticket.status === 'ยกเลิก' || ticket.status === 'ยกเลิกรายการ') ? 'badge-cancel' :
              'badge-wait'
            }">
              ${ticket.status || 'รอรับเรื่อง'}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-note">
    พิมพ์จากระบบ ASCG IT Portal (https://portal.ascgglobalgroup.com/)
  </div>
</body>
</html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
    frameDoc.document.open();
    frameDoc.document.write(printContent);
    frameDoc.document.close();

    setTimeout(() => {
      frameDoc.focus();
      frameDoc.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 400);
  };

// 🌟 2. ฟังก์ชันดาวน์โหลด Excel (พร้อมเส้นตารางและจัดฟอร์แมตสวยงาม) 🌟
  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือก "จากวันที่" และ "ถึงวันที่" ให้ครบถ้วนก่อนดาวน์โหลด', 'warning');
      return;
    }
    if (filteredTickets.length === 0) {
      Swal.fire('แจ้งเตือน', 'ไม่พบข้อมูลในช่วงเวลาที่เลือก', 'warning');
      return;
    }

    // 1. สร้างไฟล์และแผ่นงาน (Workbook & Worksheet)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('สรุปแจ้งซ่อม IT');

    // 2. กำหนดหัวตาราง (Headers) และความกว้างของคอลัมน์
    worksheet.columns = [
      { header: 'รหัสทิกเก็ต', key: 'ticket_no', width: 15 },
      { header: 'วันที่แจ้ง', key: 'created_at', width: 15 },
      { header: 'ผู้แจ้ง', key: 'name', width: 20 },
      { header: 'แผนก', key: 'department', width: 15 },
      { header: 'หมวดหมู่', key: 'category', width: 25 },
      { header: 'ความเร่งด่วน', key: 'urgency', width: 20 },
      { header: 'รายละเอียดปัญหา', key: 'description', width: 40 },
      { header: 'ผู้รับผิดชอบ', key: 'assigned_to', width: 20 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'บันทึกของ IT', key: 'admin_note', width: 40 }
    ];

    // 3. ใส่ข้อมูลลงตาราง
    filteredTickets.forEach(ticket => {
      worksheet.addRow({
        ticket_no: ticket.ticket_no,
        created_at: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '',
        name: ticket.name,
        department: ticket.department,
        category: ticket.category,
        urgency: ticket.urgency,
        description: ticket.description,
        assigned_to: ticket.assigned_to || 'ยังไม่ระบุ',
        status: ticket.status,
        admin_note: ticket.admin_note || ''
      });
    });

    // 4. 🌟 จัดรูปแบบ (ใส่เส้นตาราง, ทำตัวหนา, จัดกึ่งกลาง) 🌟
    // แต่งหัวตาราง (แถวที่ 1)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // วนลูปตีเส้นตารางให้ "ทุกช่อง" ที่มีข้อมูล
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        // จัดให้ข้อความอยู่ตรงกลางแนวตั้ง และปัดบรรทัดอัตโนมัติ (Wrap Text)
        cell.alignment = { vertical: 'middle', wrapText: true };
        
        // ตีเส้นขอบตาราง (Borders) ทั้ง 4 ด้าน
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // 5. สั่งดาวน์โหลดไฟล์
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `IT_Support_Report_${startDate}_ถึง_${endDate}.xlsx`);

      Swal.fire({
        title: 'สร้างรายงานสำเร็จ',
        text: 'ดาวน์โหลดไฟล์ Excel พร้อมเส้นตารางเรียบร้อยแล้ว',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Excel Export Error:', error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างไฟล์ Excel ได้', 'error');
    }
  };

  // คำนวณสถิติสำหรับผู้บริหาร
  const stats = {
    total: filteredTickets.length,
    completed: filteredTickets.filter(t => t.status === 'แก้ไขเสร็จสิ้น').length,
    pending: filteredTickets.filter(t => t.status === 'รอรับเรื่อง' || t.status === 'กำลังดำเนินการ').length,
    cancelled: filteredTickets.filter(t => t.status === 'ยกเลิก' || t.status === 'ยกเลิกรายการ').length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e2430] font-sans print:min-h-0 print:bg-white print:p-0 print:m-0 print:w-full">
      
      {/* ========================================== */}
      {/* 🌟 ส่วนหน้าจอปกติ (ซ่อนตอนปริ้น PDF) 🌟 */}
      {/* ========================================== */}
      <div className="print-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              ระบบจัดการแจ้งซ่อม IT (Admin)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">จัดการคำร้องและปัญหา IT จากพนักงานทั้งหมด</p>
          </div>
          <button 
            onClick={() => navigate('/it-support', { state: { fromAdmin: true } })} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> แจ้งงานใหม่
          </button>
        </div>

        <div className="bg-white dark:bg-[#262f3f] p-5 rounded-2xl border border-[#dfe0df] dark:border-[#364356] shadow-sm mb-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            
            {/* แถบค้นหา */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae8a68]" size={18} />
              <input 
                type="text" placeholder="ค้นหารหัส ชื่อ หรือแผนก..." 
                className="w-full pl-10 pr-4 py-2 border border-[#dfe0df] dark:border-[#364356] rounded-xl focus:ring-2 focus:ring-[#f89919]/40 focus:border-[#f89919] outline-none bg-[#fff8f0]/50 dark:bg-[#1c232f] focus:bg-white dark:focus:bg-[#1c232f] text-slate-800 dark:text-slate-100 transition-colors text-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* แถบเลือกวันที่ + ปุ่ม Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto bg-slate-50 dark:bg-[#1c232f] p-2.5 rounded-xl border border-slate-200 dark:border-[#364356]">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <CalendarIcon size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <input 
                  type="date" 
                  className="w-full sm:w-auto px-2 py-1.5 border border-slate-300 dark:border-[#364356] rounded-lg text-xs sm:text-sm outline-none focus:border-orange-500 bg-white dark:bg-[#262f3f] text-slate-800 dark:text-slate-100"
                  value={startDate} onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 text-xs">ถึง</span>
                <input 
                  type="date" 
                  className="w-full sm:w-auto px-2 py-1.5 border border-slate-300 dark:border-[#364356] rounded-lg text-xs sm:text-sm outline-none focus:border-orange-500 bg-white dark:bg-[#262f3f] text-slate-800 dark:text-slate-100"
                  value={endDate} onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              {/* 🌟 ปุ่ม Export Excel & PDF 🌟 */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-2xs"
                  title="ดาวน์โหลดเป็นไฟล์ Excel"
                >
                  <Download size={14} /> Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-[#262f3f] text-white hover:bg-slate-800 dark:hover:bg-[#303b4e] border border-transparent dark:border-[#364356] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-2xs"
                  title="พิมพ์สรุปเป็น PDF สำหรับผู้บริหาร"
                >
                  <FileText size={14} /> PDF
                </button>
              </div>
            </div>

          </div>

          {/* ตารางข้อมูล & Mobile Card View */}
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-[#dfe0df] dark:border-[#364356] shadow-sm overflow-hidden">
            
            {/* 💻 Desktop Table (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fff8f0] dark:bg-[#1c232f] border-b border-[#dfe0df] dark:border-[#364356] text-sm text-slate-700 dark:text-slate-300 select-none">
                    <th 
                      onClick={() => handleSort('ticket_no')}
                      className="px-6 py-4 font-semibold cursor-pointer hover:bg-orange-100/60 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามรหัสทิกเก็ต"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>รหัสทิกเก็ต</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'ticket_no' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'ticket_no' ? (sortOrder === 'desc' ? <ArrowDown size={13} className="stroke-[2.5]" /> : <ArrowUp size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('date')}
                      className="px-6 py-4 font-semibold cursor-pointer hover:bg-orange-100/60 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามวันที่แจ้ง"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>วันที่แจ้ง</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'date' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'date' ? (sortOrder === 'desc' ? <ArrowDown size={13} className="stroke-[2.5]" /> : <ArrowUp size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-4 font-semibold cursor-pointer hover:bg-orange-100/60 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามชื่อผู้แจ้ง"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ผู้แจ้ง (แผนก)</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'name' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'name' ? (sortOrder === 'desc' ? <ArrowDown size={13} className="stroke-[2.5]" /> : <ArrowUp size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium">ปัญหา</th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-6 py-4 font-semibold text-center cursor-pointer hover:bg-orange-100/60 transition-colors"
                      title="คลิกเพื่อสลับการเรียงตามสถานะ"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>สถานะ</span>
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs ${sortField === 'status' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                          {sortField === 'status' ? (sortOrder === 'desc' ? <ArrowDown size={13} className="stroke-[2.5]" /> : <ArrowUp size={13} className="stroke-[2.5]" />) : <ArrowUpDown size={13} />}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
                  {isLoading ? (
                    <TableSkeleton rows={6} cols={6} />
                  ) : sortedTickets.length > 0 ? (
                    sortedTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-[#2e394b]/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#f89919] font-mono">{ticket.ticket_no}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{ticket.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.department}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{ticket.description}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.category}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => openUpdateModal(ticket)}
                              className="bg-orange-50 dark:bg-amber-950/40 hover:bg-orange-100 dark:hover:bg-amber-900/60 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-orange-200 dark:border-amber-800 cursor-pointer"
                            >
                              ตรวจสอบ
                            </button>
                            <button 
                              onClick={() => handleDelete(ticket)}
                              title="ลบรายการนี้"
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500 dark:text-slate-400">ไม่พบข้อมูล</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 📱 Mobile Card View (md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#364356]">
              {isLoading ? (
                <MobileCardSkeleton count={4} />
              ) : sortedTickets.length > 0 ? (
                sortedTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 space-y-2.5 hover:bg-slate-50 dark:hover:bg-[#2e394b]/40 transition-colors">
                    
                    {/* Top: Ticket No + Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-orange-200 dark:border-amber-900">
                        {ticket.ticket_no}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    {/* Details: User + Dept + Category */}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ticket.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.department} • {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('th-TH') : '-'}</div>
                    </div>

                    {/* Problem Description */}
                    <div className="p-2.5 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200/70 dark:border-[#364356] text-xs">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">หมวดหมู่: {ticket.category}</span>
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={() => openUpdateModal(ticket)}
                        className="flex-1 py-2 bg-[#f89919] hover:bg-[#d97c08] text-white text-xs font-semibold rounded-xl transition-colors text-center shadow-2xs cursor-pointer"
                      >
                        ตรวจสอบ / อัปเดตสถานะ
                      </button>
                      <button 
                        onClick={() => handleDelete(ticket)}
                        title="ลบรายการ"
                        className="p-2 text-rose-500 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">ไม่พบข้อมูลแจ้งซ่อม</div>
              )}
            </div>

          </div>
      </div>

      {/* ========================================== */}
      {/* 🌟 MODAL ป๊อปอัป (ซ่อนตอนปริ้นเช่นกัน) 🌟 */}
      {/* ========================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
           <div className="bg-white dark:bg-[#262f3f] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-[#364356]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50 dark:bg-[#1c232f]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                จัดการรายการ: <span className="text-indigo-600 dark:text-indigo-400">{selectedTicket.ticket_no}</span>
              </h2>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white dark:bg-[#262f3f]">
              <div className="bg-slate-50 dark:bg-[#1c232f] p-4 rounded-2xl border border-slate-200 dark:border-[#364356] mb-6">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">ปัญหาที่แจ้ง: ({selectedTicket.category})</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedTicket.urgency?.includes('สูง') ? 'bg-red-100 dark:bg-rose-950/40 text-red-700 dark:text-rose-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    ด่วน: {selectedTicket.urgency?.split(' ')[0]}
                  </span>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{selectedTicket.description}</p>
                <p className="text-xs text-slate-400 mt-2">แจ้งโดย: {selectedTicket.name} ({selectedTicket.department})</p>
              </div>

              <form id="update-ticket-form" onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">มอบหมายผู้รับผิดชอบ (Assign To)</label>
                  <input 
                    type="text"
                    value={updateData.assigned_to} 
                    onChange={(e) => setUpdateData({...updateData, assigned_to: e.target.value})}
                    placeholder="พิมพ์ชื่อเจ้าหน้าที่ผู้รับผิดชอบ..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">สถานะงาน</label>
                  <select 
                    value={updateData.status} 
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#364356] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100"
                  >
                    <option value="รอรับเรื่อง">รอรับเรื่อง</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="แก้ไขเสร็จสิ้น">แก้ไขเสร็จสิ้น</option>
                    <option value="ยกเลิกรายการ">ยกเลิกรายการ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">บันทึกการซ่อม / สาเหตุการแก้ไข (Admin Note)</label>
                  <textarea 
                    value={updateData.admin_note} 
                    onChange={(e) => setUpdateData({...updateData, admin_note: e.target.value})}
                    rows="3"
                    placeholder="พิมพ์บันทึกการซ่อม หรือสาเหตุการแก้ไขที่นี่..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-[#364356] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100"
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50 dark:bg-[#1c232f]">
              <button 
                type="button" 
                onClick={() => handleDelete(selectedTicket)}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
              >
                <Trash2 size={16} /> ลบรายการนี้
              </button>
              <div className="flex items-center gap-3">
                <button 
                  type="button" onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-[#303b4e] transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" form="update-ticket-form"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={18} /> บันทึกการอัปเดต
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
