import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Settings, Building2, Users, Shield, Briefcase, 
  Workflow, ArrowLeft, Plus, Edit2, Trash2, X, Mail, UserCog
} from 'lucide-react';
import Swal from 'sweetalert2';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';

const EmailTagInput = ({ label, name, value, onChange, placeholder, hint }) => {
  const [inputValue, setInputValue] = useState('');
  
  const emails = value ? value.split(',').map(e => e.trim()).filter(e => e) : [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // split input value by comma in case they paste multiple
      const newEmails = inputValue.split(',').map(e => e.trim()).filter(e => e && !emails.includes(e));
      if (newEmails.length > 0) {
        onChange({ target: { name, value: [...emails, ...newEmails].join(','), type: 'text' } });
      }
      setInputValue('');
    }
  };

  const handleRemove = (emailToRemove) => {
    const newEmails = emails.filter(e => e !== emailToRemove);
    onChange({ target: { name, value: newEmails.join(','), type: 'text' } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(e);
    }
  };

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="p-2 border border-slate-300 dark:border-[#364356] rounded-xl focus-within:ring-2 focus-within:ring-[#f89919]/40 focus-within:border-[#f89919] transition-all bg-white dark:bg-[#1c232f] min-h-[42px] flex flex-wrap gap-2 items-center">
        {emails.map((email, idx) => (
          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-orange-50 dark:bg-amber-950/40 text-[#f89919] border border-orange-200 dark:border-amber-900/60">
            {email}
            <button type="button" onClick={() => handleRemove(email)} className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 focus:outline-none cursor-pointer">
              <X size={14} />
            </button>
          </span>
        ))}
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={(e) => { if(inputValue.trim()) handleAdd(e) }}
            placeholder={emails.length === 0 ? placeholder : "พิมพ์อีเมลแล้วกด Enter..."}
            className="flex-1 outline-none text-sm bg-transparent px-1 py-1 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
    </div>
  );
};

export default function SystemSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || 'company_dept');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) {
      setActiveTab(t);
    }
  }, [searchParams]);
  
  // Data States
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [bccGroups, setBccGroups] = useState([]);
  const [itCategories, setItCategories] = useState([]);
  const [announcementTypes, setAnnouncementTypes] = useState([]);
  const [systemAccounts, setSystemAccounts] = useState([]);
  
  // System Accounts Search & Pagination
  const [sysAccSearch, setSysAccSearch] = useState('');
  const [sysAccPage, setSysAccPage] = useState(1);

  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [emailSettings, setEmailSettings] = useState({
    IT: { type: 'IT', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_secure: false, from_email: '', from_name: '', to_emails: '', cc_emails: '', bcc_emails: '', ticket_emails: '', welcome_template: '' },
    HR: { type: 'HR', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_secure: false, from_email: '', from_name: '', to_emails: '', cc_emails: '', bcc_emails: '', ticket_emails: '', welcome_template: '' }
  });
  const [activeEmailTab, setActiveEmailTab] = useState('IT');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'company', 'department', 'role', 'position'
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({});

  const fetchSettingsData = async () => {
    try {
      setIsLoading(true);
      const [compRes, deptRes, roleRes, posRes, bccRes, itCatRes, annTypeRes, sysAccRes, permRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/companies'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/departments'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/roles'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/positions'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/bcc-groups'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/it-categories'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/announcement-types'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/system-accounts'),
        fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/permissions')
      ]);

      if (compRes.ok) setCompanies((await compRes.json()).data || []);
      if (deptRes.ok) setDepartments((await deptRes.json()).data || []);
      if (roleRes.ok) setRoles((await roleRes.json()).data || []);
      if (posRes.ok) setPositions((await posRes.json()).data || []);
      if (bccRes.ok) setBccGroups((await bccRes.json()).data || []);
      if (itCatRes.ok) setItCategories((await itCatRes.json()).data || []);
      if (annTypeRes.ok) setAnnouncementTypes((await annTypeRes.json()).data || []);
      if (sysAccRes.ok) setSystemAccounts((await sysAccRes.json()).data || []);
      if (permRes.ok) setAllPermissions((await permRes.json()).data || []);
      
      // Fetch Email Settings
      const emailRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/email');
      const emailData = await emailRes.json();
      if (emailRes.ok && emailData.data) {
        const itData = emailData.data.IT || {};
        const hrData = emailData.data.HR || {};
        
        setEmailSettings({
          IT: {
            type: 'IT',
            smtp_host: itData.smtp_host || '',
            smtp_port: itData.smtp_port || '',
            smtp_user: itData.smtp_user || '',
            smtp_pass: itData.smtp_pass || '',
            smtp_secure: itData.smtp_secure === 1,
            from_email: itData.from_email || '',
            from_name: itData.from_name || '',
            to_emails: itData.to_emails || '',
            cc_emails: itData.cc_emails || '',
            bcc_emails: itData.bcc_emails || '',
            ticket_emails: itData.ticket_emails || ''
          },
          HR: {
            type: 'HR',
            smtp_host: hrData.smtp_host || '',
            smtp_port: hrData.smtp_port || '',
            smtp_user: hrData.smtp_user || '',
            smtp_pass: hrData.smtp_pass || '',
            smtp_secure: hrData.smtp_secure === 1,
            from_email: hrData.from_email || '',
            from_name: hrData.from_name || '',
            to_emails: hrData.to_emails || '',
            cc_emails: hrData.cc_emails || '',
            bcc_emails: hrData.bcc_emails || '',
            ticket_emails: hrData.ticket_emails || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) await fetchSettingsData();
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // --- Handlers ---
  const openModal = async (type, mode, data = {}) => {
    setModalType(type);
    setModalMode(mode);
    setFormData(data);
    
    if (type === 'role' && mode === 'edit' && data.id) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/settings/roles/${data.id}/permissions`);
        const json = await res.json();
        if (res.ok) setSelectedRolePermissions(json.data || []);
      } catch (e) {
        console.error('Error fetching role permissions:', e);
        setSelectedRolePermissions([]);
      }
    } else if (type === 'role' && mode === 'add') {
      setSelectedRolePermissions([]);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let url = '';
    let method = modalMode === 'add' ? 'POST' : 'PUT';

    if (modalType === 'company') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/companies${modalMode === 'edit' ? '/' + formData.id : ''}`;
    if (modalType === 'department') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/departments${modalMode === 'edit' ? '/' + formData.id : ''}`;
    if (modalType === 'role') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/roles/${formData.id}`;
    if (modalType === 'position') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/positions${modalMode === 'edit' ? '/' + formData.id : ''}`;
    if (modalType === 'bcc_group') url = `${import.meta.env.VITE_API_BASE_URL}/api/bcc-groups${modalMode === 'edit' ? '/' + formData.id : ''}`;
    if (modalType === 'it_category') url = `${import.meta.env.VITE_API_BASE_URL}/api/it-categories${modalMode === 'edit' ? '/' + formData.id : ''}`;
    if (modalType === 'announcement_type') url = `${import.meta.env.VITE_API_BASE_URL}/api/announcement-types${modalMode === 'edit' ? '/' + formData.id : ''}`;

    // กรณีแก้ไขสิทธิ์บัญชีระบบ
    if (modalType === 'system_account' && modalMode === 'edit') {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${formData.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: formData.role_id })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          Swal.fire({ title: 'สำเร็จ', text: data.message, icon: 'success', timer: 1500, showConfirmButton: false });
          closeModal();
          fetchSettingsData();
          return; // ออกเลยเพราะจบแค่นี้สำหรับแก้ไข Role บัญชีระบบ
        } else {
          throw new Error(data.message || 'เกิดข้อผิดพลาด');
        }
      } catch (err) {
        Swal.fire('ผิดพลาด', err.message, 'error');
        return;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // If saving Role, also save its permissions
        if (modalType === 'role' && formData.id) {
          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/settings/roles/${formData.id}/permissions`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ permissions: selectedRolePermissions })
            });
          } catch (err) {
            console.error('Failed to update role permissions:', err);
          }
        }

        Swal.fire({ title: 'สำเร็จ', text: data.message, icon: 'success', timer: 1500, showConfirmButton: false });
        closeModal();
        fetchSettingsData(); // Refresh Data
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  const handleDelete = (type, id) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        let url = '';
        if (type === 'company') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/companies/${id}`;
        if (type === 'department') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/departments/${id}`;
        if (type === 'position') url = `${import.meta.env.VITE_API_BASE_URL}/api/settings/positions/${id}`;
        if (type === 'bcc_group') url = `${import.meta.env.VITE_API_BASE_URL}/api/bcc-groups/${id}`;
        if (type === 'it_category') url = `${import.meta.env.VITE_API_BASE_URL}/api/it-categories/${id}`;
        if (type === 'announcement_type') url = `${import.meta.env.VITE_API_BASE_URL}/api/announcement-types/${id}`;

        try {
          const res = await fetch(url, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.status === 'success') {
            Swal.fire({ title: 'ลบสำเร็จ!', text: data.message, icon: 'success', timer: 1500, showConfirmButton: false });
            fetchSettingsData();
          } else {
            throw new Error(data.message || 'เกิดข้อผิดพลาดในการลบ');
          }
        } catch (error) {
          Swal.fire('ลบไม่สำเร็จ', error.message, 'error');
        }
      }
    });
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const mockRole = localStorage.getItem('mockRole');
  const userRole = userInfo.role || userInfo.role_name || '';
  const isAdmin = String(userInfo.role_id) === '1' || mockRole === '1' || userRole === 'Admin' || (userInfo.permissions && userInfo.permissions.includes('manage_settings'));

  const TABS = [
    { id: 'company_dept', label: 'โครงสร้างบริษัทและแผนก', icon: Building2 },
    { id: 'roles_positions', label: 'ตำแหน่งและสิทธิ์', icon: Shield },
    { id: 'email_settings', label: 'ตั้งค่าการส่งอีเมล (SMTP)', icon: Mail },
    { id: 'bcc_groups', label: 'กลุ่มอีเมล (BCC Groups)', icon: Users },
    { id: 'automation', label: 'หมวดหมู่ต่างๆ', icon: Workflow },
  ];

  const handleEmailSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [activeEmailTab]: {
        ...prev[activeEmailTab],
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSaveEmailSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings[activeEmailTab])
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        Swal.fire('สำเร็จ', data.message, 'success');
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  const handleTestEmail = async () => {
    try {
      Swal.fire({ title: 'กำลังทดสอบส่งอีเมล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings[activeEmailTab])
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        Swal.fire('สำเร็จ!', data.message, 'success');
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ล้มเหลว', error.message, 'error');
    }
  };

  const handleResetPassword = async (accountId) => {
    const { value: formValues } = await Swal.fire({
      title: 'รีเซ็ตรหัสผ่าน',
      html: `
        <p class="text-sm text-slate-500 mb-4">กรุณาระบุรหัสผ่านใหม่สำหรับผู้ใช้นี้</p>
        <input type="password" id="swal-new-password" class="swal2-input" placeholder="รหัสผ่านใหม่">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ตรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const newPassword = document.getElementById('swal-new-password').value;
        if (!newPassword) {
          Swal.showValidationMessage('กรุณากรอกรหัสผ่านใหม่');
        }
        return { newPassword };
      }
    });

    if (formValues) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${accountId}/reset-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          Swal.fire('สำเร็จ', 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว', 'success');
        } else {
          throw new Error(data.message || 'เกิดข้อผิดพลาด');
        }
      } catch (err) {
        Swal.fire('ผิดพลาด', err.message, 'error');
      }
    }
  };

  // -------------------------
  // Filter & Pagination Logic
  // -------------------------
  const filteredSystemAccounts = systemAccounts.filter(acc => 
    (acc.employee_code || '').toLowerCase().includes(sysAccSearch.toLowerCase()) ||
    (acc.email || '').toLowerCase().includes(sysAccSearch.toLowerCase()) ||
    (acc.full_name_th || '').toLowerCase().includes(sysAccSearch.toLowerCase()) ||
    (acc.role_name || '').toLowerCase().includes(sysAccSearch.toLowerCase())
  );
  
  const sysAccItemsPerPage = 10;
  const sysAccTotalPages = Math.ceil(filteredSystemAccounts.length / sysAccItemsPerPage);
  const currentSystemAccounts = filteredSystemAccounts.slice(
    (sysAccPage - 1) * sysAccItemsPerPage, 
    sysAccPage * sysAccItemsPerPage
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-[#f89919]" />
          ตั้งค่าระบบองค์กร (System Settings)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">บริหารจัดการข้อมูลโครงสร้างบริษัท สิทธิ์ผู้ใช้งาน และค่าพื้นฐานของระบบ</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Sidebar Tabs (Horizontal scroll on mobile, vertical on desktop) */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm overflow-hidden p-1.5 sm:p-2 flex lg:flex-col overflow-x-auto gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`whitespace-nowrap flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 lg:shrink lg:w-full cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-orange-50 dark:bg-amber-950/40 text-[#f89919] shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c232f] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={17} className={activeTab === tab.id ? 'text-[#f89919]' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {isLoading ? (
            <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm p-16 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-[#f89919] border-r-[#f89919] border-b-transparent border-l-transparent mb-4"></div>
              <p className="font-medium">กำลังโหลดข้อมูลระบบ...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* TAB 1: Company & Dept */}
              {activeTab === 'company_dept' && (
                <div className="space-y-6">
                  {/* Companies Section */}
                  <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-[#364356] flex justify-between items-center bg-slate-50/50 dark:bg-[#1c232f]">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Building2 size={20} className="text-[#f89919]" />
                          บริษัทในเครือ (Companies)
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">รายชื่อบริษัทและรหัสอ้างอิงของบริษัท (Prefix)</p>
                      </div>
                      <button onClick={() => openModal('company', 'add')} className="flex items-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs">
                        <Plus size={16} /> เพิ่มบริษัท
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-[#1c232f] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[#364356]">
                          <tr>
                            <th className="px-6 py-4">Prefix</th>
                            <th className="px-6 py-4">ชื่อบริษัท</th>
                            <th className="px-6 py-4 text-center">สถานะ</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#364356]">
                          {companies.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#2e394b]/40 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{c.prefix}</td>
                              <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {c.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('company', 'edit', c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('company', c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {companies.length === 0 && (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลบริษัท</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Departments Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Users size={20} className="text-indigo-600" />
                          แผนกองค์กร (Departments)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">รายชื่อแผนกเพื่อใช้ในการจัดโครงสร้างและรายงาน</p>
                      </div>
                      <button onClick={() => openModal('department', 'add')} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> เพิ่มแผนก
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">รหัสแผนก</th>
                            <th className="px-6 py-4">ชื่อแผนก</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {departments.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{d.code}</td>
                              <td className="px-6 py-4 font-medium">{d.name}</td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('department', 'edit', d)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('department', d.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {departments.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลแผนก</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Roles & Positions */}
              {activeTab === 'roles_positions' && (
                <div className="space-y-6">
                  {/* Roles Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Shield size={20} className="text-emerald-600" />
                          สิทธิ์การใช้งาน (Roles)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">สิทธิ์ในการเข้าถึงระบบ เช่น Admin, HR, Employee</p>
                      </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 w-1/4">สิทธิ์การใช้งาน</th>
                            <th className="px-6 py-4">รายละเอียด</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {roles.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{r.name}</td>
                              <td className="px-6 py-4 text-slate-500">{r.description}</td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('role', 'edit', r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {roles.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลสิทธิ์</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Positions Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Briefcase size={20} className="text-amber-600" />
                          ตำแหน่งงาน (Positions)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">รายชื่อตำแหน่งงานทั้งหมดในบริษัท (เพิ่มอัตโนมัติเมื่อสร้างพนักงาน)</p>
                      </div>
                      <button onClick={() => openModal('position', 'add')} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> เพิ่มตำแหน่ง
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">ตำแหน่งงาน (Title)</th>
                            <th className="px-6 py-4">ระดับ (Level)</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {positions.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{p.title}</td>
                              <td className="px-6 py-4 font-medium text-slate-500">{p.level || '-'}</td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('position', 'edit', p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('position', p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {positions.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลตำแหน่งงาน</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Email Settings */}
              {activeTab === 'email_settings' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Mail size={20} className="text-rose-600" />
                        ตั้งค่าเซิร์ฟเวอร์อีเมล (SMTP)
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">ใช้สำหรับการส่งอีเมลแจ้งประกาศข่าวสารอัตโนมัติจากระบบ แยกส่วน IT และ HR</p>
                    </div>
                    <button type="button" onClick={handleTestEmail} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors border border-slate-300">
                      ทดสอบส่งอีเมล ({activeEmailTab})
                    </button>
                  </div>

                  <div className="flex gap-4 border-b border-slate-200 mb-6">
                    <button 
                      onClick={() => setActiveEmailTab('IT')}
                      className={`pb-3 px-2 text-sm font-semibold transition-colors ${activeEmailTab === 'IT' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      IT Email Settings
                    </button>
                    <button 
                      onClick={() => setActiveEmailTab('HR')}
                      className={`pb-3 px-2 text-sm font-semibold transition-colors ${activeEmailTab === 'HR' ? 'border-b-2 border-rose-600 text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      HR Email Settings
                    </button>
                  </div>

                  <form onSubmit={handleSaveEmailSettings}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="SMTP Host" name="smtp_host" value={emailSettings[activeEmailTab].smtp_host} onChange={handleEmailSettingsChange} required placeholder="เช่น smtp.gmail.com หรือ mail.company.com" />
                      <InputField label="SMTP Port" name="smtp_port" type="number" value={emailSettings[activeEmailTab].smtp_port} onChange={handleEmailSettingsChange} required placeholder="เช่น 587 หรือ 465" />
                      <InputField label="SMTP Username / Email" name="smtp_user" value={emailSettings[activeEmailTab].smtp_user} onChange={handleEmailSettingsChange} required placeholder="เช่น info@company.com" />
                      <InputField label="SMTP Password" name="smtp_pass" type="password" value={emailSettings[activeEmailTab].smtp_pass} onChange={handleEmailSettingsChange} required placeholder="รหัสผ่านของอีเมล" />
                      <InputField label="อีเมลผู้ส่ง (From Email)" name="from_email" value={emailSettings[activeEmailTab].from_email} onChange={handleEmailSettingsChange} required placeholder="เช่น noreply@company.com" />
                      <InputField label="ชื่อผู้ส่ง (From Name)" name="from_name" value={emailSettings[activeEmailTab].from_name} onChange={handleEmailSettingsChange} required placeholder="เช่น ASCG System" />
                      
                      {/* Section: IT Ticket Alert (Only for IT Tab) */}
                      {activeEmailTab === 'IT' && (
                        <div className="md:col-span-2 p-5 bg-amber-50/70 dark:bg-[#202938] rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-1">
                            <span>🛠️</span> อีเมลรับแจ้งเตือนปัญหา IT (IT Ticket Alert Recipients)
                          </h3>
                          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-4">
                            ระบบจะส่งอีเมลแจ้งเตือนหาทีมงานตามรายชื่อนี้ทันทีที่มีพนักงานแจ้งปัญหา IT เข้ามา (แยกอิสระ ไม่เกี่ยวกับประกาศ)
                          </p>
                          <EmailTagInput 
                            label="อีเมลทีม IT ผู้รับแจ้งเตือนเคสใหม่ (กด Enter เพื่อเพิ่ม)" 
                            name="ticket_emails" 
                            value={emailSettings[activeEmailTab].ticket_emails} 
                            onChange={handleEmailSettingsChange} 
                            placeholder="พิมพ์อีเมล เช่น keerakiat.k@ascggroup.com แล้วกด Enter" 
                            hint="สามารถระบุได้หลายอีเมล โดยระบบจะส่งแจ้งเตือนหาทุกคนที่อยู่ในรายการนี้" 
                          />
                        </div>
                      )}

                      {/* Section: Announcements Default Recipients */}
                      <div className="md:col-span-2 p-5 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200 dark:border-[#364356]">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
                          <span>📢</span> อีเมลรับประกาศองค์กรเริ่มต้น (Default Announcement Recipients)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          ใช้สำหรับส่งสำเนาประกาศข่าวสารองค์กร (Announcement) เมื่อกดส่งประกาศจากระบบ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <EmailTagInput 
                            label="ผู้รับหลัก (To Emails)" 
                            name="to_emails" 
                            value={emailSettings[activeEmailTab].to_emails} 
                            onChange={handleEmailSettingsChange} 
                            placeholder="พิมพ์อีเมลแล้วกด Enter เช่น info@company.com" 
                            hint="ผู้รับหลักของประกาศ" 
                          />
                          <EmailTagInput 
                            label="สำเนา (CC Emails) - ถ้ามี" 
                            name="cc_emails" 
                            value={emailSettings[activeEmailTab].cc_emails} 
                            onChange={handleEmailSettingsChange} 
                            placeholder="พิมพ์อีเมลแล้วกด Enter" 
                            hint="ผู้รับสำเนาเปิดเผยของประกาศ" 
                          />
                          <EmailTagInput 
                            label="สำเนาลับเริ่มต้น (BCC Emails) - ถ้ามี" 
                            name="bcc_emails" 
                            value={emailSettings[activeEmailTab].bcc_emails} 
                            onChange={handleEmailSettingsChange} 
                            placeholder="พิมพ์อีเมลแล้วกด Enter เช่น all-staff@company.com" 
                            hint="ผู้รับสำเนาลับเริ่มต้น (ผู้รับจะไม่เห็นอีเมลกัน)" 
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-center gap-2 mt-2">
                        <input type="checkbox" id="smtp_secure" name="smtp_secure" checked={emailSettings[activeEmailTab].smtp_secure} onChange={handleEmailSettingsChange} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                        <label htmlFor="smtp_secure" className="text-sm font-medium text-slate-700 dark:text-slate-300">ใช้ Secure Connection (SSL/TLS - Port 465)</label>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end pt-5 border-t border-slate-100">
                      <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors">
                        บันทึกการตั้งค่า
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: BCC Groups */}
              {activeTab === 'bcc_groups' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Users size={20} className="text-blue-600" />
                          กลุ่มอีเมล (BCC Groups)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">รายชื่อกลุ่มอีเมลสำหรับเลือกส่งแบบสำเนาลับ (BCC)</p>
                      </div>
                      <button onClick={() => openModal('bcc_group', 'add')} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> เพิ่มกลุ่ม BCC
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">ชื่อกลุ่ม (Label)</th>
                            <th className="px-6 py-4">อีเมล (Email)</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bccGroups.map(bg => (
                            <tr key={bg.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{bg.label}</td>
                              <td className="px-6 py-4 font-medium">{bg.email}</td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('bcc_group', 'edit', bg)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('bcc_group', bg.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {bccGroups.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลกลุ่ม BCC</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Automation & Categories */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  {/* IT Categories Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Workflow size={20} className="text-purple-600" />
                          หมวดหมู่ปัญหา IT (IT Support Categories)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">ใช้เป็นตัวเลือกตอนแจ้งซ่อม IT</p>
                      </div>
                      <button onClick={() => openModal('it_category', 'add')} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> เพิ่มหมวดหมู่ IT
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">ชื่อหมวดหมู่</th>
                            <th className="px-6 py-4 text-center">สถานะ</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itCategories.map(cat => (
                            <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{cat.name}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cat.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {cat.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('it_category', 'edit', cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('it_category', cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {itCategories.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลหมวดหมู่ IT</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Announcement Types Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Workflow size={20} className="text-pink-600" />
                          ประเภทประกาศ (Announcement Types)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">ใช้จัดหมวดหมู่ประกาศข่าวสาร</p>
                      </div>
                      <button onClick={() => openModal('announcement_type', 'add')} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> เพิ่มประเภทประกาศ
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">ชื่อประเภทประกาศ</th>
                            <th className="px-6 py-4 text-center">สถานะ</th>
                            <th className="px-6 py-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {announcementTypes.map(type => (
                            <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{type.name}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${type.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {type.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => openModal('announcement_type', 'edit', type)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('announcement_type', type.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {announcementTypes.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลประเภทประกาศ</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* --- Global Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-[#364356]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex justify-between items-center bg-slate-50 dark:bg-[#1c232f]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {modalMode === 'add' ? 'เพิ่ม' : 'แก้ไข'}
                {modalType === 'company' && 'บริษัท'}
                {modalType === 'department' && 'แผนก'}
                {modalType === 'role' && 'สิทธิ์การใช้งาน'}
                {modalType === 'position' && 'ตำแหน่งงาน'}
                {modalType === 'bcc_group' && 'กลุ่ม BCC'}
                {modalType === 'it_category' && 'หมวดหมู่ IT'}
                {modalType === 'announcement_type' && 'ประเภทประกาศ'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#262f3f] p-1 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {modalType === 'company' && (
                <>
                  <InputField label="ตัวย่อบริษัท (Prefix)" name="prefix" value={formData.prefix || ''} onChange={handleFormChange} required placeholder="เช่น AEP" />
                  <InputField label="ชื่อบริษัท" name="name" value={formData.name || ''} onChange={handleFormChange} required placeholder="บริษัท ตัวอย่าง จำกัด" />
                  <SelectField label="สถานะ" name="status" value={formData.status || 'Active'} onChange={handleFormChange} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} />
                </>
              )}

              {modalType === 'department' && (
                <>
                  <InputField label="รหัสแผนก" name="code" value={formData.code || ''} onChange={handleFormChange} required placeholder="เช่น IT, HR, FIN" />
                  <InputField label="ชื่อแผนก" name="name" value={formData.name || ''} onChange={handleFormChange} required placeholder="เทคโนโลยีสารสนเทศ" />
                </>
              )}

              {modalType === 'role' && (
                <>
                  <InputField label="ชื่อสิทธิ์" name="name" value={formData.name || ''} onChange={handleFormChange} required disabled={formData.id <= 3} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">รายละเอียด</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleFormChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919]/40 outline-none transition-all resize-y"></textarea>
                  </div>
                  {formData.id <= 3 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">* ไม่สามารถเปลี่ยนชื่อสิทธิ์พื้นฐานของระบบได้</p>}
                  
                  {/* Permission Matrix */}
                  <div className="mt-4 border-t border-slate-200 dark:border-[#364356] pt-4">
                    <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">กำหนดสิทธิ์การเข้าถึงเมนู (Permissions)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-[#1c232f] border border-slate-200 dark:border-[#364356] rounded-xl">
                      {allPermissions.map(perm => (
                        <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-[#262f3f] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#364356] hover:shadow-sm">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#f89919] rounded border-gray-300 dark:border-slate-600 focus:ring-[#f89919]"
                            checked={selectedRolePermissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRolePermissions([...selectedRolePermissions, perm.id]);
                              } else {
                                setSelectedRolePermissions(selectedRolePermissions.filter(id => id !== perm.id));
                              }
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800">{perm.label}</span>
                            <span className="text-xs text-slate-400">Module: {perm.module}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'position' && (
                <>
                  <InputField label="ชื่อตำแหน่งงาน" name="title" value={formData.title || ''} onChange={handleFormChange} required placeholder="เช่น Software Engineer" />
                  <InputField label="ระดับ (Level)" name="level" value={formData.level || ''} onChange={handleFormChange} placeholder="เช่น Junior, Senior, Manager" />
                </>
              )}

              {modalType === 'bcc_group' && (
                <>
                  <InputField label="ชื่อกลุ่ม (Label)" name="label" value={formData.label || ''} onChange={handleFormChange} required placeholder="เช่น AIC_ALL" />
                  <InputField label="อีเมล (Email)" name="email" value={formData.email || ''} onChange={handleFormChange} required placeholder="เช่น ascggroup_all@ascggroup.com" />
                </>
              )}

              {modalType === 'it_category' && (
                <>
                  <InputField label="ชื่อหมวดหมู่" name="name" value={formData.name || ''} onChange={handleFormChange} required placeholder="เช่น Software" />
                  <SelectField label="สถานะ" name="status" value={formData.status || 'Active'} onChange={handleFormChange} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} />
                </>
              )}

              {modalType === 'announcement_type' && (
                <>
                  <InputField label="ชื่อประเภทประกาศ" name="name" value={formData.name || ''} onChange={handleFormChange} required placeholder="เช่น ประกาศสำคัญ" />
                  <SelectField label="สถานะ" name="status" value={formData.status || 'Active'} onChange={handleFormChange} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} />
                </>
              )}

              {modalType === 'system_account' && (
                <>
                  <div className="bg-slate-50 dark:bg-[#1c232f] p-4 rounded-xl border border-slate-100 dark:border-[#364356] mb-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">ผู้ใช้: {formData.full_name_th}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">รหัสพนักงาน: {formData.employee_code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">อีเมล: {formData.email || '-'}</p>
                  </div>
                  <SelectField 
                    label="ระดับสิทธิ์การใช้งาน (Role)" 
                    name="role_id" 
                    value={formData.role_id || ''} 
                    onChange={handleFormChange} 
                    options={[
                      {value: '', label: '-- เลือกสิทธิ์ (ถ้าว่างคือ Employee) --'},
                      ...roles.map(r => ({ value: r.id, label: r.name }))
                    ]} 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">* หากไม่เลือก (ค่าว่าง) ระบบจะถือว่าเป็นระดับสิทธิ์พื้นฐาน (Employee)</p>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-[#364356] mt-6">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#262f3f] border border-slate-300 dark:border-[#364356] hover:bg-slate-50 dark:hover:bg-[#1c232f] transition-colors cursor-pointer">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#f89919] hover:bg-[#d97c08] shadow-sm transition-colors cursor-pointer">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
