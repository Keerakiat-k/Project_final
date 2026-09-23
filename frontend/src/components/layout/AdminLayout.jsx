import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, UserMinus, ShieldAlert, 
  Settings, Megaphone, LogOut, Menu, X, Bell, CheckCircle,
  User as UserIcon, Workflow, FileText, Server, Package, Network,
  Calendar, ClipboardList, ChevronDown, ChevronRight, History, Activity,
  ChevronLeft, Sun, Moon, UserCog, Clock
} from 'lucide-react';
import Swal from 'sweetalert2';
import logoSvg from '../../assets/logo.svg';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only collapse on desktop (md screen and above). Mobile drawer is always full width with text.
  const showCollapsed = isCollapsed && !isMobile;
  
  const [simulationRoles, setSimulationRoles] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);
  const [notifications, setNotifications] = useState({
    newEmployees: [],
    resignedEmployees: [],
    pendingTickets: [],
    expiringHostings: []
  });
  
  const getSafeUserInfo = () => {
    try {
      const stored = localStorage.getItem('user_info');
      if (!stored || stored === 'undefined' || stored === 'null') return {};
      return JSON.parse(stored);
    } catch (e) {
      return {};
    }
  };
  
  const [userInfo, setUserInfo] = useState(getSafeUserInfo());
  const userRole = userInfo.role || 'Guest';
  const userName = userInfo.email ? userInfo.email.split('@')[0] : 'Guest';
  const permissions = userInfo.permissions || [];

  const fallbackRoles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Manager' },
    { id: 4, name: 'IT Support' },
    { id: 5, name: 'Employee' }
  ];
  const displayRoles = simulationRoles && simulationRoles.length > 0 ? simulationRoles : fallbackRoles;
  // แถบจำลองสิทธิ์แสดงเฉพาะผู้ดูแลระบบ (Admin) เท่านั้น (User / HR / Employee อื่นๆ จะมองไม่เห็น)
  const canSimulate = Boolean(
    userInfo?.original_role === 'Admin' || 
    (userInfo?.role === 'Admin' && !userInfo?.original_role) || 
    String(userInfo?.role_id) === '1' || 
    userInfo?.email === 'admin@ascggroup.com' ||
    userInfo?.username === 'admin'
  );

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

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const baseUrl = getApiBase();

    fetch(`${baseUrl}/api/settings/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setSimulationRoles(data.data || []);
        }
      })
      .catch(err => console.error('Error fetching roles for simulation:', err));

    // Fetch Notifications (New Employees, Resigned Employees, IT Helpdesk & Expiring Hostings)
    const fetchNotifications = async () => {
      try {
        const authHeaders = { 'Authorization': `Bearer ${token}` };
        if (userRole === 'Admin' || userRole === 'IT Support' || userRole === 'HR') {
          const fetchPromises = [
            fetch(`${baseUrl}/api/it-support`, { headers: authHeaders }),
            fetch(`${baseUrl}/api/employees/new/current-month`, { headers: authHeaders }),
            fetch(`${baseUrl}/api/employees/resigned/current-month`, { headers: authHeaders })
          ];

          if (userRole === 'Admin' || userRole === 'IT Support') {
            fetchPromises.push(fetch(`${baseUrl}/api/hostings`, { headers: authHeaders }));
          }

          const results = await Promise.all(fetchPromises);
          const ticketRes = results[0];
          const newEmpRes = results[1];
          const resignedRes = results[2];
          const hostingsRes = results[3];

          const tickets = ticketRes && ticketRes.ok ? (await ticketRes.json()).data || [] : [];
          const newEmps = newEmpRes && newEmpRes.ok ? (await newEmpRes.json()).data || [] : [];
          const resignedEmps = resignedRes && resignedRes.ok ? (await resignedRes.json()).data || [] : [];
          const hostingsData = hostingsRes && hostingsRes.ok ? (await hostingsRes.json()).data || [] : [];

          // คัดเฉพาะทิกเก็ตแจ้งซ่อมที่รอรับเรื่อง / กำลังดำเนินการ
          const activeTickets = tickets.filter(t => 
            t.status !== 'แก้ไขเสร็จสิ้น' && 
            t.status !== 'เสร็จสิ้น' && 
            t.status !== 'ยกเลิกรายการ' &&
            t.status !== 'ยกเลิก' &&
            t.status !== 'Closed' &&
            t.status !== 'Resolved'
          );

          // คัดเฉพาะ Hosting / Domain ที่ใกล้หมดอายุใน 30 วัน หรือหมดอายุแล้ว
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

          const expiringHostings = hostingsData.filter(item => {
            if (!item.expiration_date || item.status === 'Cancelled') return false;
            const expDate = new Date(item.expiration_date);
            return expDate <= thirtyDaysLater;
          }).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

          setNotifications({
            pendingTickets: activeTickets,
            newEmployees: newEmps,
            resignedEmployees: resignedEmps,
            expiringHostings: expiringHostings
          });
        }
      } catch (err) {
        // Silent catch to prevent red console errors on minor network disconnect
      }
    };

    fetchNotifications();

    // ตั้งระบบ Auto-refresh ข้อมูลการแจ้งเตือนทุกๆ 8 วินาที
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [userRole, location.pathname]);

  const ticketCount = (notifications && Array.isArray(notifications.pendingTickets)) ? notifications.pendingTickets.length : 0;
  const newEmpCount = (notifications && Array.isArray(notifications.newEmployees)) ? notifications.newEmployees.length : 0;
  const resignedCount = (notifications && Array.isArray(notifications.resignedEmployees)) ? notifications.resignedEmployees.length : 0;
  const hostingCount = (notifications && Array.isArray(notifications.expiringHostings)) ? notifications.expiringHostings.length : 0;
  const totalNotifs = ticketCount + newEmpCount + resignedCount + hostingCount;

  // Handle Direct Action Popups from Notification Dropdown (Original Full Rich Modal)
  const handleGrantAccessFromNotif = async (emp) => {
    setIsNotifOpen(false);
    const domainMap = {
      'AEP': '@ascgengineering.com',
      'AGC': '@ascggroup.com',
      'AIA': '@interprocorp.com',
      'AIC': '@ascggroup.com',
      'CST': '@cstintergroup.com',
      'QPM': '@qpmprevention.com',
      'SQT': '@synergyqthai.com'
    };
    const suggestedDomain = domainMap[emp.company_prefix] || '';
    
    let autoUsername = '';
    if (emp.first_name_en && emp.last_name_en) {
      autoUsername = `${emp.first_name_en.trim().toLowerCase()}.${emp.last_name_en.trim().charAt(0).toLowerCase()}`;
    }
    const suggestedEmail = autoUsername ? `${autoUsername}${suggestedDomain}` : suggestedDomain;
    const roleOptions = (simulationRoles || []).map(r => `<option value="${r.id}" ${r.name === 'Employee' ? 'selected' : ''}>${r.name}</option>`).join('');

    await Swal.fire({
      title: '',
      width: 520,
      padding: '0',
      showCancelButton: false,
      showConfirmButton: false,
      background: 'transparent',
      backdrop: 'rgba(15,23,42,0.6)',
      customClass: { popup: '!bg-transparent !border-none !shadow-none !p-0' },
      html: `
        <div style="background: white; border-radius: 20px; overflow: hidden; font-family: 'Inter', 'Prompt', sans-serif; box-shadow: 0 25px 60px rgba(0,0,0,0.2); text-align: left;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%); padding: 28px 32px 24px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -20px; left: 40px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h2a2 2 0 0 1 2 2v1"/><line x1="19" y1="8" x2="19" y2="14"/></svg>
              </div>
              <div>
                <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">สร้างสิทธิ์การเข้าใช้งาน</h2>
                <p style="color: rgba(255,255,255,0.75); font-size: 13px; margin: 3px 0 0 0;">${emp.full_name_th}</p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px 28px;">
            
            <!-- Email Section -->
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label style="font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  อีเมลบริษัท (Company Email)
                </label>
                <label style="display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #6b7280; cursor: pointer; background: #f3f4f6; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; transition: all 0.2s;">
                  <input type="checkbox" id="swal-no-email" style="width: 13px; height: 13px; cursor: pointer; accent-color: #ef4444;"
                    onchange="const emailInput = document.getElementById('swal-input-email'); emailInput.value = this.checked ? '-' : '${suggestedEmail}'; emailInput.disabled = this.checked; emailInput.style.opacity = this.checked ? '0.5' : '1';">
                  ไม่ใช้อีเมล
                </label>
              </div>
              <div style="position: relative;">
                <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;" width="16" height="16" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input id="swal-input-email" type="email" value="${suggestedEmail}" placeholder="เช่น firstname.l${suggestedDomain}"
                  style="width: 100%; height: 44px; padding: 0 14px 0 42px; font-size: 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; outline: none; box-sizing: border-box; color: #111827; background: #fafafa; transition: all 0.2s;"
                  onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; this.style.background='white';"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'; this.style.background='#fafafa';">
              </div>
              <p style="font-size: 11.5px; color: #9ca3af; margin: 6px 0 0 4px;">* สามารถแก้ไขชื่ออีเมลได้ตามต้องการ</p>
            </div>

            <!-- Role Section -->
            <div style="margin-bottom: 20px;">
              <label style="font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <svg width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                สิทธิ์การใช้งานระบบ (Role)
              </label>
              <div style="position: relative;">
                <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;" width="16" height="16" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <select id="swal-input-role"
                  style="width: 100%; height: 44px; padding: 0 14px 0 42px; font-size: 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; outline: none; box-sizing: border-box; color: #111827; background: #fafafa; appearance: none; cursor: pointer; transition: all 0.2s;"
                  onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; this.style.background='white';"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'; this.style.background='#fafafa';">
                  ${roleOptions}
                </select>
                <svg style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;" width="16" height="16" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <!-- Domain Checkbox -->
            <div style="background: #f8faff; border: 1.5px solid #e0e7ff; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="swal-input-domain" checked style="width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; flex-shrink: 0;">
                <div>
                  <span style="font-size: 13px; font-weight: 600; color: #1e40af; display: block;">ใช้งาน Login Domain (ASCGGROUP)</span>
                  <span style="font-size: 11.5px; color: #6b7280;">Login ผ่าน Windows Domain ของบริษัท</span>
                </div>
              </label>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px;">
              <button id="swal-cancel-btn" type="button"
                style="flex: 1; height: 44px; border: 1.5px solid #e5e7eb; background: white; color: #6b7280; font-size: 14px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
                ยกเลิก
              </button>
              <button id="swal-confirm-btn" type="button"
                style="flex: 2; height: 44px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; font-size: 14px; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(37,99,235,0.35);">
                บันทึกและสร้างสิทธิ์
              </button>
            </div>

            <!-- Validation msg -->
            <div id="swal-validation" style="display: none; margin-top: 10px; background: #fef2f2; color: #dc2626; font-size: 12.5px; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecaca;"></div>
          </div>
        </div>
      `,
      didOpen: () => {
        document.getElementById('swal-cancel-btn').addEventListener('click', () => {
          Swal.close();
        });
        document.getElementById('swal-confirm-btn').addEventListener('click', () => {
          const email = document.getElementById('swal-input-email').value;
          const useDomain = document.getElementById('swal-input-domain').checked;
          const roleId = document.getElementById('swal-input-role').value;
          const validationEl = document.getElementById('swal-validation');
          if (!email) {
            validationEl.innerText = 'กรุณากรอกอีเมล หรือเลือก "ไม่ใช้อีเมล"';
            validationEl.style.display = 'block';
            return;
          }
          if (!roleId) {
            validationEl.innerText = 'กรุณาเลือกสิทธิ์การใช้งาน';
            validationEl.style.display = 'block';
            return;
          }
          validationEl.style.display = 'none';
          Swal.fire({
            title: 'กำลังบันทึกข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${emp.id}/grant-access`, {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, useDomain, roleId })
          }).then(async res => {
            const data = await res.json();
            if (res.ok) {
              setNotifications(prev => ({
                ...prev,
                newEmployees: (prev.newEmployees || []).filter(e => e.id !== emp.id)
              }));
              Swal.fire({ title: 'สำเร็จ!', text: data.message || 'บันทึกอีเมลและสร้างสิทธิ์เรียบร้อยแล้ว', icon: 'success' });
            } else {
              Swal.fire('ผิดพลาด', data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
          }).catch(() => {
            Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
          });
        });
      }
    });
  };

  const handleRevokeAccessFromNotif = async (emp) => {
    setIsNotifOpen(false);
    
    await Swal.fire({
      title: '',
      width: 520,
      padding: '0',
      showCancelButton: false,
      showConfirmButton: false,
      background: 'transparent',
      backdrop: 'rgba(15,23,42,0.6)',
      customClass: { popup: '!bg-transparent !border-none !shadow-none !p-0' },
      html: `
        <div style="background: white; border-radius: 20px; overflow: hidden; font-family: 'Inter', 'Prompt', sans-serif; box-shadow: 0 25px 60px rgba(0,0,0,0.2); text-align: left;">
          
          <!-- Header Red Gradient -->
          <div style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #f43f5e 100%); padding: 28px 32px 24px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
              </div>
              <div>
                <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">ถอดสิทธิ์การเข้าใช้งานระบบ</h2>
                <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 3px 0 0 0;">${emp.full_name_th} (${emp.employee_code || 'พนักงาน'})</p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px 28px;">
            
            <!-- Employee Detail Card -->
            <div style="background: #fdf2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 6px;">รายละเอียดการถอดสิทธิ์:</div>
              <div style="font-size: 12.5px; color: #4b5563; space-y: 4px;">
                <div>สังกัด: <span style="font-weight: 600; color: #111827;">${emp.company_prefix || '-'}</span> | แผนก: <span style="font-weight: 600; color: #111827;">${emp.department_name || 'ทั่วไป'}</span></div>
                <div>ตำแหน่ง: <span style="font-weight: 600; color: #111827;">${emp.position || '-'}</span></div>
                <div>อีเมล: <span style="font-weight: 600; color: #111827;">${emp.email || '-'}</span></div>
              </div>
            </div>

            <!-- Warning Notice -->
            <div style="background: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 700; color: #9f1239;">ข้อควรระวัง:</div>
              <div style="font-size: 11.5px; color: #be123c; margin-top: 2px;">เมื่อกดถอดสิทธิ์ บัญชีผู้ใช้งานนี้จะไม่สามารถเข้าสู่ระบบหรือเข้าถึงข้อมูลทรัพย์สินบริษัทได้อีกต่อไป</div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px;">
              <button id="swal-revoke-cancel" type="button"
                style="flex: 1; height: 44px; border: 1.5px solid #e5e7eb; background: white; color: #6b7280; font-size: 14px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
                ยกเลิก
              </button>
              <button id="swal-revoke-confirm" type="button"
                style="flex: 2; height: 44px; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; font-size: 14px; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(220,38,38,0.35);">
                ยืนยันถอดสิทธิ์การเข้าใช้งาน
              </button>
            </div>

          </div>
        </div>
      `,
      didOpen: () => {
        document.getElementById('swal-revoke-cancel').addEventListener('click', () => {
          Swal.close();
        });
        document.getElementById('swal-revoke-confirm').addEventListener('click', async () => {
          Swal.fire({
            title: 'กำลังถอดสิทธิ์...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          try {
            const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${emp.id}/revoke-access`, {
              method: 'PUT',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
              }
            });

            if (res.ok) {
              setNotifications(prev => ({
                ...prev,
                resignedEmployees: (prev.resignedEmployees || []).filter(e => e.id !== emp.id)
              }));
              Swal.fire({ title: 'สำเร็จ!', text: 'ถอดสิทธิ์การเข้าใช้งานเรียบร้อยแล้ว', icon: 'success' });
            } else {
              throw new Error('Server error');
            }
          } catch (error) {
            console.error('Error revoking access:', error);
            Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการถอดสิทธิ์', 'error');
          }
        });
      }
    });
  };

  // เคลียร์การแจ้งเตือนทั้งหมด
  const handleClearAllNotifications = async () => {
    Swal.fire({
      title: 'เคลียร์การแจ้งเตือนทั้งหมด?',
      text: 'คุณต้องการล้างการแจ้งเตือนที่ค้างอยู่ทั้งหมดใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f89919',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'เคลียร์ทั้งหมด',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
          const res = await fetch(`${getApiBase()}/api/employees/clear-notifications`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setNotifications({
              pendingTickets: [],
              newEmployees: [],
              resignedEmployees: [],
              expiringHostings: []
            });
            Swal.fire('สำเร็จ', 'เคลียร์การแจ้งเตือนทั้งหมดเรียบร้อยแล้ว', 'success');
          }
        } catch (e) {
          console.error('Failed to clear notifications:', e);
        }
      }
    });
  };

  const simulateRole = async (roleObj) => {
    try {
      Swal.fire({
        title: 'กำลังสลับสิทธิ์ทดสอบ...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const baseUrl = getApiBase();
      
      let rolePerms = [];
      try {
        const res = await fetch(`${baseUrl}/api/settings/roles/${roleObj.id}/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data.data) {
          const permRes = await fetch(`${baseUrl}/api/settings/permissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const permData = await permRes.json();
          if (permRes.ok && permData.data) {
            const allPerms = permData.data;
            rolePerms = data.data.map(id => {
              const p = allPerms.find(x => x.id === id);
              return p ? p.key_name : null;
            }).filter(Boolean);
          }
        }
      } catch (fetchErr) {
        console.warn('Could not fetch remote permissions list, using fallback:', fetchErr);
      }

      const realRole = userInfo.original_role || userInfo.role || 'Admin';
      const realPerms = userInfo.original_permissions || userInfo.permissions || [];
      const mockUser = {
        ...userInfo,
        role: roleObj.name,
        role_id: roleObj.id,
        permissions: rolePerms,
        original_role: realRole,
        original_permissions: realPerms
      };
      
      localStorage.setItem('user_info', JSON.stringify(mockUser));
      localStorage.setItem('mockRole', String(roleObj.id));

      Swal.fire({
        icon: 'success',
        title: 'จำลองสิทธิ์สำเร็จ!',
        text: `สลับสิทธิ์การใช้งานเป็น: ${roleObj.name}`,
        timer: 1000,
        showConfirmButton: false
      }).then(() => {
        // นำผู้ใช้กลับสู่หน้า Dashboard เสมอ เพื่อป้องกันการติดหน้า 403 จากหน้าที่สิทธิ์ใหม่เข้าไม่ได้
        window.location.href = '/dashboard';
      });
      
    } catch (e) {
      console.error('Simulate Role Error:', e);
      Swal.fire('ผิดพลาด', 'ไม่สามารถจำลองสิทธิ์ได้', 'error');
    }
  };

  const resetRole = () => {
    const realRole = userInfo.original_role || 'Admin';
    const realPerms = userInfo.original_permissions || [
      'view_dashboard', 'manage_employees', 'manage_announcements', 'manage_assets', 'manage_it_support', 'manage_settings'
    ];
    const resetUser = {
      ...userInfo,
      role: realRole,
      role_id: 1,
      permissions: realPerms,
      original_role: undefined,
      original_permissions: undefined
    };
    localStorage.setItem('user_info', JSON.stringify(resetUser));
    localStorage.removeItem('mockRole');
    Swal.fire({
      icon: 'info',
      title: 'คืนค่าสิทธิ์ดั้งเดิม',
      text: `กลับสู่สิทธิ์: ${realRole} เรียบร้อยแล้ว`,
      timer: 1000,
      showConfirmButton: false
    }).then(() => {
      window.location.href = '/dashboard';
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบสำเร็จ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('mockRole');
      navigate('/login');
    });
  };

  const hasPermission = (item) => {
    // Admin Mode -> Full Access
    if (userRole === 'Admin') return true;

    // Employee (พนักงานทั่วไป) -> ให้เห็นเฉพาะ หน้าหลัก และ แจ้งปัญหา IT
    if (userRole === 'Employee') {
      return ['/dashboard', '/it-support'].includes(item.path);
    }

    // Manager (หัวหน้างาน) -> ให้เห็นเฉพาะ หน้าหลัก และ แจ้งปัญหา IT
    if (userRole === 'Manager') {
      return ['/dashboard', '/it-support'].includes(item.path);
    }

    // HR Mode
    if (userRole === 'HR') {
      return ['/dashboard', '/it-support', '/employee-list', '/employees/new', '/admin/time-attendance', '/admin/announcements'].includes(item.path);
    }

    // IT Support Mode
    if (userRole === 'IT Support') {
      return ['/dashboard', '/it-support', '/admin/it-health-check', '/admin/it-support', '/admin/network', '/admin/assets', '/admin/hostings', '/admin/time-attendance'].includes(item.path);
    }

    if (!item.perm) return true;
    return permissions.includes(item.perm);
  };

  const menuGroups = [
    {
      group: 'ทั่วไป',
      items: [
        { path: '/dashboard', name: 'หน้าหลัก', icon: LayoutDashboard },
        { path: '/it-support', name: 'แจ้งปัญหา IT', icon: ShieldAlert },
      ]
    },
    {
      group: 'จัดการผู้ใช้งานระบบ (Users)',
      items: [
        { path: '/employee-list', name: 'รายการผู้ใช้งานระบบ', icon: Users, perm: 'manage_employees' },
        { path: '/employees/new', name: 'เพิ่มผู้ใช้งานใหม่', icon: UserPlus, perm: 'manage_employees' },
        { path: '/admin/time-attendance', name: 'บันทึกเวลาเข้า-ออกงาน', icon: Clock, perm: 'manage_employees' },
        { path: '/admin/system-accounts', name: 'บัญชีระบบ & รหัสผ่าน', icon: UserCog, perm: 'manage_settings' },
      ]
    },
    {
      group: 'ระบบจัดการส่วนกลาง (Admin)',
      items: [
        { path: '/admin/announcements', name: 'จัดการประกาศ', icon: Megaphone, perm: 'manage_announcements' },
        { path: '/admin/it-health-check', name: 'สถานะระบบ IT (Health Check)', icon: Activity, perm: 'manage_it_support' },
        { path: '/admin/it-support', name: 'ระบบรับแจ้งซ่อม IT', icon: Workflow, perm: 'manage_it_support' },
        { path: '/admin/network', name: 'จัดการเครือข่าย & IP', icon: Network, perm: 'manage_it_support' },
        { path: '/admin/assets', name: 'ทะเบียนทรัพย์สิน', icon: Package, perm: 'manage_assets' },
        { path: '/admin/hostings', name: 'จัดการ Hosting', icon: Server, perm: 'manage_assets' },
      ]
    },
    {
      group: 'ตั้งค่าระบบ',
      items: [
        { path: '/settings', name: 'ตั้งค่าทั่วไป', icon: Settings, perm: 'manage_settings' },
        { path: '/settings/email-templates', name: 'เทมเพลตอีเมล', icon: FileText, perm: 'manage_settings' },
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] dark:bg-[#1e2430] text-slate-900 dark:text-slate-100 transition-colors duration-200 print:block print:h-auto print:overflow-visible print:bg-white" style={{ fontFamily: "'Inter', 'Prompt', system-ui, sans-serif" }}>
      
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col bg-white dark:bg-[#232b3a] border-r border-[#e9ebee] dark:border-[#364356] shadow-xs dark:shadow-none print:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${showCollapsed ? 'md:w-[70px]' : 'w-72 md:w-60'}`}
      >
        {/* Logo Area */}
        <div className={`h-[60px] border-b border-[#f0f2f5] dark:border-[#364356] flex items-center shrink-0 ${showCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <div className={`flex items-center ${showCollapsed ? 'justify-center w-full' : 'gap-2.5'} overflow-hidden`}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center p-2 shadow-2xs shrink-0">
              <img src={logoSvg} alt="CorpHub Logo" className="w-full h-full object-contain" />
            </div>
            {!showCollapsed && (
              <div className="whitespace-nowrap overflow-hidden animate-fade-in">
                <div className="text-sm font-bold text-[#111827] dark:text-white tracking-tight leading-tight">CorpHub</div>
                <div className="text-[10px] text-[#9ca3af] dark:text-slate-400 font-medium tracking-wide">Enterprise Portal</div>
              </div>
            )}
          </div>
          <button 
            style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }} 
            className="md:hidden text-[#9ca3af] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#303b4e] hover:text-slate-700 dark:hover:text-slate-200 transition-colors" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Area */}
        <div className={`border-b border-[#f0f2f5] dark:border-[#364356] bg-[#fafbfc] dark:bg-[#1c232f] shrink-0 ${showCollapsed ? 'p-2' : 'px-3.5 py-3'}`}>
          <div className={`flex items-center ${showCollapsed ? 'justify-center' : 'gap-2.5'}`} title={showCollapsed ? `${userName} (${userRole})` : ''}>
            {userInfo.profile_image ? (
              <img src={`${import.meta.env.VITE_API_BASE_URL}${userInfo.profile_image}`} alt="Profile"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f89919', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #f89919, #d97c08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14, flexShrink: 0 }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {!showCollapsed && (
              <div style={{ minWidth: 0 }} className="animate-fade-in">
                <div className="text-[13px] font-semibold text-[#111827] dark:text-slate-100 truncate">{userName}</div>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 7px', borderRadius: 9999, marginTop: 2,
                  ...(userRole === 'Admin' ? { background: '#fff3dc', color: '#b45309', border: '1px solid #fde68a' } :
                     userRole === 'HR' ? { background: '#fff7ed', color: '#c2690a', border: '1px solid #fed7aa' } :
                     userRole === 'Manager' ? { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } :
                     { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' })
                }}>
                  {userRole}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: showCollapsed ? '10px 8px 16px' : '10px 10px 16px' }}>
          {menuGroups.map((group, idx) => {
            const groupItems = group.items.filter(item => hasPermission(item));
            if (groupItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: showCollapsed ? 12 : 20 }}>
                {!showCollapsed ? (
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 pb-1.5">
                    {group.group}
                  </div>
                ) : (
                  idx > 0 && <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      title={showCollapsed ? item.name : ''}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      style={({ isActive }) => ({
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: showCollapsed ? 'center' : 'flex-start',
                        gap: showCollapsed ? 0 : 8,
                        padding: showCollapsed ? '9px 0' : '7px 10px', 
                        borderRadius: 10,
                        fontSize: 13, 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? (isDark ? '#fbbf24' : '#c2690a') : (isDark ? '#94a3b8' : '#4b5563'),
                        background: isActive ? (isDark ? 'rgba(248, 153, 25, 0.15)' : '#fff7ed') : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      })}
                      className="sidebar-navlink-item group"
                    >
                      {({ isActive }) => {
                        const isHostingMenu = item.path === '/admin/hostings' && hostingCount > 0;
                        const isTicketMenu = item.path === '/admin/it-support' && ticketCount > 0;
                        const badgeNum = isHostingMenu ? hostingCount : (isTicketMenu ? ticketCount : 0);

                        return (
                          <>
                            <item.icon size={18} style={{ color: isActive ? '#f89919' : (isDark ? '#64748b' : '#9ca3af'), flexShrink: 0, transition: 'color 0.12s' }} />
                            {!showCollapsed ? (
                              <>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                {badgeNum > 0 && (
                                  <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-2xs ${
                                    isHostingMenu 
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60'
                                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60'
                                  }`}>
                                    {badgeNum}
                                  </span>
                                )}
                                {isActive && !badgeNum && <div style={{ width: 3, height: 14, background: '#f89919', borderRadius: 99, marginLeft: 'auto', flexShrink: 0 }} />}
                              </>
                            ) : (
                              badgeNum > 0 && (
                                <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#232b3a] ${
                                  isHostingMenu ? 'bg-amber-500' : 'bg-indigo-500'
                                }`} />
                              )
                            )}
                          </>
                        );
                      }}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse Toggle Footer Button for Desktop */}
        <div className="hidden md:flex items-center border-t border-slate-100 dark:border-[#364356] p-2 shrink-0 bg-slate-50/60 dark:bg-[#1c232f]">
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`w-full flex items-center ${showCollapsed ? 'justify-center' : 'justify-between px-3'} py-2 text-slate-500 dark:text-slate-300 hover:text-[#f89919] dark:hover:text-[#f89919] hover:bg-orange-50 dark:hover:bg-[#303b4e] rounded-xl transition-all cursor-pointer text-xs font-semibold`}
            title={showCollapsed ? 'ขยายแถบเมนู (Expand)' : 'ย่อแถบเมนูเหลือเฉพาะไอคอน (Collapse)'}
          >
            {!showCollapsed && <span>ย่อแถบเมนู</span>}
            {showCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* --- Overlay for Mobile --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:w-full print:h-auto print:overflow-visible">

        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between px-3 sm:px-7 z-30 h-[60px] bg-white dark:bg-[#232b3a] border-b border-[#eef0f4] dark:border-[#364356] shadow-xs dark:shadow-none transition-colors duration-200 print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Open Menu */}
            <button 
              className="text-slate-500 dark:text-slate-400 hover:text-[#f89919] hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors md:hidden shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button 
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#f89919] hover:bg-orange-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-slate-700 shrink-0"
              title={isCollapsed ? 'ขยายแถบเมนู (Expand Menu)' : 'ย่อแถบเมนูเหลือเฉพาะไอคอน (Collapse Menu)'}
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Role Simulation Bar */}
            {canSimulate && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs bg-slate-100 dark:bg-[#1c232f] p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-[#364356] max-w-[55vw] sm:max-w-none">
                <span className="font-semibold text-slate-500 dark:text-slate-400 px-1.5 flex items-center shrink-0 text-[11px] sm:text-xs">
                  <span>จำลองสิทธิ์:</span>
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-[420px] custom-scrollbar pb-0.5">
                  {displayRoles.filter(r => r.name !== 'Employee' && r.name !== 'Manager').map(r => {
                    const isCurrent = String(userRole).toLowerCase() === String(r.name).toLowerCase() || 
                                      (localStorage.getItem('mockRole') === String(r.id));
                    return (
                      <button 
                        key={r.id}
                        type="button"
                        onClick={() => simulateRole(r)} 
                        className={`whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#f89919] text-white shadow-xs font-bold ring-1 ring-orange-400' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#262f3f] hover:text-[#f89919] dark:hover:text-[#f89919]'
                        }`}
                        title={`จำลองสิทธิ์เป็น ${r.name}`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                  {(Boolean(userInfo?.original_role) || Boolean(localStorage.getItem('mockRole'))) && (
                    <button
                      type="button"
                      onClick={resetRole}
                      className="whitespace-nowrap px-2 py-1 rounded-lg text-[10.5px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer shrink-0 ml-0.5"
                      title="คืนค่าสิทธิ์ดั้งเดิม (Reset Role)"
                    >
                      คืนค่า
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#f89919] dark:hover:text-[#f89919] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'เปลี่ยนเป็นโหมดมืด (Dark Mode)'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun size={20} className="text-amber-400 hover:rotate-45 transition-transform duration-200" />
              ) : (
                <Moon size={20} className="text-slate-600 hover:-rotate-12 transition-transform duration-200" />
              )}
            </button>

            {/* Interactive Notification Dropdown */}
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-400 dark:text-slate-400 hover:text-[#f89919] dark:hover:text-[#f89919] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="การแจ้งเตือนระบบ"
              >
                <Bell size={20} />
                {totalNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-pulse">
                    {totalNotifs}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  {/* Mobile Backdrop */}
                  <div 
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] sm:hidden"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  
                  {/* Dropdown Container */}
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 max-w-sm mx-auto sm:mx-0 bg-white dark:bg-[#262f3f] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#364356] z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-slate-900 dark:bg-[#1c232f] text-white font-bold flex items-center justify-between border-b border-transparent dark:border-[#364356]">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-[#f89919]" />
                        <span>การแจ้งเตือนระบบ ({totalNotifs})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalNotifs > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllNotifications}
                            className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-normal"
                            title="ล้างการแจ้งเตือนทั้งหมด"
                          >
                            เคลียร์ทั้งหมด
                          </button>
                        )}
                        <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer" aria-label="Close notifications"><X size={16} /></button>
                      </div>
                    </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#364356]">
                    {totalNotifs === 0 ? (
                      <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                        <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                        <span>ไม่มีรายการแจ้งเตือนค้างอยู่</span>
                      </div>
                    ) : (
                      <>
                        {/* 1. New Employees Notification */}
                        {(notifications?.newEmployees || []).map(emp => (
                          <div 
                            key={`new-emp-${emp.id}`}
                            onClick={() => handleGrantAccessFromNotif(emp)}
                            className="p-3 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 cursor-pointer flex items-start gap-3 transition-colors group border-l-4 border-emerald-500"
                          >
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <UserPlus size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                <span>พนักงานใหม่: {emp.full_name_th}</span>
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">รอให้สิทธิ์</span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 font-semibold text-[11px] mt-0.5">
                                {emp.company_prefix} • เริ่มงาน: {emp.start_date ? new Date(emp.start_date).toLocaleDateString('th-TH') : '-'}
                              </div>
                              <div className="text-[#f89919] font-bold text-[11px] mt-1 flex items-center gap-1">
                                คลิกเพื่อสร้างสิทธิ์และบันทึกอีเมล →
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 2. Resigned Employees Notification */}
                        {(notifications?.resignedEmployees || []).map(emp => (
                          <div 
                            key={`resigned-emp-${emp.id}`}
                            onClick={() => handleRevokeAccessFromNotif(emp)}
                            className="p-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 cursor-pointer flex items-start gap-3 transition-colors group border-l-4 border-rose-500"
                          >
                            <div className="p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <UserMinus size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>พนักงานพ้นสภาพ: {emp.full_name_th}</span>
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">พ้นสภาพ</span>
                              </div>
                              <div className="text-slate-600 font-semibold text-[11px] mt-0.5">
                                {emp.company_prefix} • ลาออก: {emp.resignation_date ? new Date(emp.resignation_date).toLocaleDateString('th-TH') : '-'}
                              </div>
                              <div className="text-rose-600 font-bold text-[11px] mt-1 flex items-center gap-1">
                                คลิกเพื่อถอดสิทธิ์และเรียกคืนทรัพย์สิน →
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 3. IT Helpdesk Pending Tickets */}
                        {(notifications?.pendingTickets || []).map(t => (
                          <div 
                            key={`ticket-${t.id}`}
                            onClick={() => { setIsNotifOpen(false); navigate('/admin/it-support'); }}
                            className="p-3 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 cursor-pointer flex items-start gap-3 transition-colors border-l-4 border-amber-500"
                          >
                            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                              <ShieldAlert size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100">แจ้งซ่อม IT: {t.ticket_no || 'Helpdesk'}</div>
                              <div className="text-slate-600 dark:text-slate-400 font-semibold text-[11px]">{t.name} • {t.category}</div>
                              <div className={`font-bold text-[11px] mt-0.5 ${t.status === 'กำลังดำเนินการ' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {t.status === 'กำลังดำเนินการ' ? 'กำลังดำเนินการ' : 'รอรับเรื่อง'}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 4. Expiring Hosting & Domain Notification */}
                        {(notifications?.expiringHostings || []).map(h => {
                          const isExpired = new Date(h.expiration_date) < new Date();
                          const expDateFormatted = new Date(h.expiration_date).toLocaleDateString('th-TH');
                          return (
                            <div 
                              key={`hosting-${h.id}`}
                              onClick={() => { setIsNotifOpen(false); navigate('/admin/hostings'); }}
                              className="p-3 hover:bg-orange-50/60 dark:hover:bg-orange-950/20 cursor-pointer flex items-start gap-3 transition-colors border-l-4 border-[#f89919] group"
                            >
                              <div className="p-2 bg-orange-100 dark:bg-amber-950/50 text-[#f89919] rounded-xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                <Server size={16} />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                  <span>โดเมน: {h.domain_name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    isExpired 
                                      ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' 
                                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    {isExpired ? 'หมดอายุแล้ว' : 'ใกล้หมดอายุ'}
                                  </span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 font-semibold text-[11px] mt-0.5">
                                  วันหมดอายุ: {expDateFormatted} {h.website_url ? `• ${h.website_url}` : ''}
                                </div>
                                <div className="text-[#f89919] font-bold text-[11px] mt-1 flex items-center gap-1">
                                  คลิกเพื่อตรวจสอบและจัดการโดเมน →
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
                </>
              )}
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto custom-scrollbar main-content-area transition-colors duration-200 print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:bg-white" style={{ padding: '24px 24px 32px' }}>
          <Outlet context={{ userRole, userName }} />
        </main>
        
      </div>
    </div>
  );
}
