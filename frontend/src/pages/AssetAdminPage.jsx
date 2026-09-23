import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Package, Search, Plus, Edit, Trash2, Box, PackageOpen, AlertTriangle, 
  ArrowRightLeft, Wrench, RotateCcw, Eye, Download, Printer, RefreshCw,
  CheckCircle2, Clock, Shield, Laptop, Monitor, Server, HardDrive, 
  Building2, MapPin, Tag, UserCheck, Calendar, DollarSign, X, Check,
  Copy, Cpu, FileText, Layers, Sparkles, Image, UploadCloud, Camera,
  ArrowDown, ArrowUp, ArrowUpDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Select from 'react-select';
import { TableSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';
import { useTheme } from '../context/ThemeContext';

export default function AssetAdminPage() {
  const [searchParams] = useSearchParams();
  const initialCompany = searchParams.get('company') || 'All';
  const initialStatus = searchParams.get('status') || 'All';
  const initialCategory = searchParams.get('category') || 'All';

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [masterCompanies, setMasterCompanies] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    departments: [],
    locations: [],
    categories: [],
    statuses: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(initialCompany);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (มากไปน้อย) | 'asc' (น้อยไปมาก)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync searchParams when URL changes
  useEffect(() => {
    const comp = searchParams.get('company');
    if (comp) setSelectedCompany(comp);
    const stat = searchParams.get('status');
    if (stat) setSelectedStatus(stat);
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const [activeAsset, setActiveAsset] = useState(null);
  const [assetDetail, setAssetDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Form Data State for Add/Edit
  const [formData, setFormData] = useState({
    id: null,
    asset_code: '',
    name: '',
    category: 'PC',
    company: 'AIC',
    owner_company: 'AIC',
    department: '',
    location: '8-BD',
    brand: '',
    model: '',
    serial_number: '',
    cpu: '',
    ram: '',
    storage: '',
    display_size: '',
    image_url: '',
    status: 'Available',
    assigned_to: '',
    parent_asset_id: '',
    purchase_date: '',
    price: '',
    po_number: '',
    warranty_period: '',
    warranty_expire_date: '',
    notes: '',
    os_name: '',
    os_key: '',
    office_name: '',
    office_key: '',
    extra_name: '',
    extra_key: '',
    extra_email: '',
    extra_password: '',
    extra_notes: '',
    licenses: []
  });

  // Transfer Modal Form Data
  const [transferData, setTransferData] = useState({
    transfer_type: 'Transfer', // 'Transfer' or 'Loan'
    to_company: '',
    to_department: '',
    to_location: '',
    to_user_id: '',
    return_due_date: '',
    reason: '',
    action_by: 'IT Support',
    new_asset_code: ''
  });

  // Maintenance Modal Form Data
  const [maintenanceData, setMaintenanceData] = useState({
    action_type: 'Repair',
    description: '',
    cost: '',
    technician: '',
    service_date: new Date().toISOString().split('T')[0],
    new_ram: '',
    new_storage: '',
    set_status: 'Maintenance'
  });

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
    fetchCompanies();
    fetchFilterOptions();
  }, []);

  // -------------------------------------------------------------
  // API Fetchers
  // -------------------------------------------------------------
  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/companies`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setMasterCompanies(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setAssets(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setEmployees(result.data.filter(emp => emp.status === 'Active'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/filter-options`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchSuggestedCode = async (company) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/suggest-code?company=${company || 'AIC'}`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setFormData(prev => ({ ...prev, asset_code: result.suggested_code }));
      }
    } catch (error) {
      console.error('Error suggesting code:', error);
    }
  };

  const fetchAssetDetail = async (id) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${id}`);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setAssetDetail(result.data);
      }
    } catch (error) {
      console.error('Error fetching asset detail:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Smart Handlers for Forms
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    const initialCompany = masterCompanies[0]?.prefix || 'AIC';
    setFormData({
      id: null,
      asset_code: '',
      name: '',
      category: 'PC',
      company: initialCompany,
      owner_company: initialCompany,
      department: '',
      location: '8-BD',
      brand: '',
      model: '',
      serial_number: '',
      cpu: '',
      ram: '',
      storage: '',
      display_size: '',
      image_url: '',
      status: 'Available',
      assigned_to: '',
      parent_asset_id: '',
      purchase_date: '',
      price: '',
      po_number: '',
      warranty_period: '',
      warranty_expire_date: '',
      notes: '',
      os_name: 'Windows 10 Pro',
      os_key: '',
      office_name: 'Office 2019 Home & Business',
      office_key: '',
      extra_name: '',
      extra_key: '',
      extra_email: '',
      extra_password: '',
      extra_notes: '',
      licenses: []
    });
    fetchSuggestedCode(initialCompany);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (asset) => {
    setIsEditMode(true);
    const licList = asset.licenses || [];
    const osLic = licList.find(l => l.software_type === 'OS');
    const officeLic = licList.find(l => l.software_type === 'Office');
    const extraLic = licList.find(l => l.software_type === 'Extra Software');

    setFormData({
      id: asset.id,
      asset_code: asset.asset_code || '',
      name: asset.name || '',
      category: asset.category || 'PC',
      company: asset.company || 'AIC',
      owner_company: asset.owner_company || asset.company || 'AIC',
      department: asset.department || '',
      location: asset.location || '8-BD',
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      cpu: asset.cpu || '',
      ram: asset.ram || '',
      storage: asset.storage || '',
      display_size: asset.display_size || '',
      image_url: asset.image_url || '',
      status: asset.status || 'Available',
      assigned_to: asset.assigned_to || '',
      parent_asset_id: asset.parent_asset_id || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
      price: asset.price || '',
      po_number: asset.po_number || '',
      warranty_period: asset.warranty_period || '',
      warranty_expire_date: asset.warranty_expire_date ? asset.warranty_expire_date.split('T')[0] : '',
      notes: asset.notes || '',
      os_name: osLic?.software_name || '',
      os_key: osLic?.license_key || '',
      office_name: officeLic?.software_name || '',
      office_key: officeLic?.license_key || '',
      extra_name: extraLic?.software_name || '',
      extra_key: extraLic?.license_key || '',
      extra_email: extraLic?.login_email || '',
      extra_password: extraLic?.login_password || '',
      extra_notes: extraLic?.notes || '',
      licenses: licList
    });
    setIsFormModalOpen(true);
  };

  // Upload Asset Image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)', 'warning');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    setIsUploadingImage(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/upload-image`, {
        method: 'POST',
        body: uploadFormData
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setFormData(prev => ({ ...prev, image_url: data.data.url }));
        Swal.fire({
          title: 'อัปโหลดรูปภาพสำเร็จ',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCompanyChange = (e) => {
    const comp = e.target.value;
    setFormData(prev => ({
      ...prev,
      company: comp,
      owner_company: isEditMode ? prev.owner_company : comp
    }));
    if (!isEditMode) {
      fetchSuggestedCode(comp);
    }
  };

  const { isDark } = useTheme();

  // React-Select Custom Styling (Hybrid Comfort Theme)
  const selectCustomStyles = {
    control: (base, state) => ({
      ...base,
      fontSize: '12px',
      minHeight: '38px',
      paddingLeft: '2px',
      paddingRight: '2px',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#f89919' : (isDark ? '#364356' : '#cbd5e1'),
      boxShadow: state.isFocused ? '0 0 0 2px rgba(248, 153, 25, 0.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#f89919' : (isDark ? '#4b5b75' : '#94a3b8')
      },
      backgroundColor: isDark ? '#1c232f' : '#ffffff',
      cursor: 'pointer'
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 99999,
      fontSize: '12px',
      borderRadius: '0.75rem',
      boxShadow: isDark 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isDark ? '#364356' : '#e2e8f0'}`,
      backgroundColor: isDark ? '#262f3f' : '#ffffff',
      overflow: 'hidden'
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: isDark ? '#262f3f' : '#ffffff',
      padding: '4px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#f89919' 
        : state.isFocused 
          ? (isDark ? '#364356' : '#fff8f0') 
          : 'transparent',
      color: state.isSelected ? 'white' : (isDark ? '#f8fafc' : '#0f172a'),
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '12px',
      borderRadius: '0.375rem',
      '&:active': {
        backgroundColor: '#f89919',
        color: 'white'
      }
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? '#364356' : '#e2e8f0',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      '&:hover': {
        color: isDark ? '#cbd5e1' : '#475569',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      '&:hover': {
        color: isDark ? '#cbd5e1' : '#475569',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '12px'
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontWeight: 500,
      fontSize: '12px'
    })
  };

  // Options for Searchable Employee Select
  const employeeOptions = [
    { value: '', label: '-- ยังไม่มีผู้ถือครอง (เก็บในคลัง / Available) --' },
    ...employees.map(emp => ({
      value: String(emp.id),
      label: `${emp.first_name_th || ''} ${emp.last_name_th || ''} (${emp.company_prefix || 'ASCG'} - ${emp.department_name || emp.department || 'ทั่วไป'})`,
      employee: emp
    }))
  ];

  const transferEmployeeOptions = [
    { value: '', label: '-- เก็บเข้าคลังปลายทาง (Stock) --' },
    ...employees.map(emp => ({
      value: String(emp.id),
      label: `${emp.first_name_th || ''} ${emp.last_name_th || ''} (${emp.company_prefix || 'ASCG'} - ${emp.department_name || emp.department || 'ทั่วไป'})`,
      employee: emp
    }))
  ];

  // Smart Auto-fill: เมื่อเลือกพนักงาน ดึงบริษัท แผนก และสาขา มาให้อัตโนมัติ
  const handleSelectEmployee = (selectedOption) => {
    const empId = selectedOption?.value;
    if (!empId) {
      setFormData(prev => ({ ...prev, assigned_to: '', status: 'Available' }));
      return;
    }

    const emp = selectedOption.employee || employees.find(x => String(x.id) === String(empId));
    if (emp) {
      setFormData(prev => ({
        ...prev,
        assigned_to: emp.id,
        status: 'In Use',
        company: emp.company_prefix || prev.company,
        department: emp.department_name || emp.department || prev.department,
        location: emp.branch || prev.location
      }));
    } else {
      setFormData(prev => ({ ...prev, assigned_to: empId, status: 'In Use' }));
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    handleSelectEmployee(empId ? { value: empId } : null);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.asset_code) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสทรัพย์สินและชื่ออุปกรณ์', 'warning');
      return;
    }

    try {
      const url = isEditMode 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/assets/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/assets`;

      const method = isEditMode ? 'PUT' : 'POST';

      // Package licenses
      const payloadLicenses = [];
      if (formData.os_name || formData.os_key) {
        payloadLicenses.push({ software_type: 'OS', software_name: formData.os_name, license_key: formData.os_key });
      }
      if (formData.office_name || formData.office_key) {
        payloadLicenses.push({ software_type: 'Office', software_name: formData.office_name, license_key: formData.office_key });
      }
      if (formData.extra_name || formData.extra_key || formData.extra_email) {
        payloadLicenses.push({
          software_type: 'Extra Software',
          software_name: formData.extra_name,
          license_key: formData.extra_key,
          login_email: formData.extra_email,
          login_password: formData.extra_password,
          notes: formData.extra_notes
        });
      }

      const payload = {
        ...formData,
        licenses: payloadLicenses
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire({
          title: isEditMode ? 'แก้ไขสำเร็จ' : 'เพิ่มทรัพย์สินสำเร็จ',
          text: result.message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        setIsFormModalOpen(false);
        fetchAssets();
        fetchFilterOptions();
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Open Transfer / Loan Modal
  const handleOpenTransferModal = (asset) => {
    setActiveAsset(asset);
    setTransferData({
      transfer_type: 'Transfer',
      to_company: asset.company || 'AIC',
      to_department: asset.department || '',
      to_location: asset.location || '8-BD',
      to_user_id: '',
      return_due_date: '',
      reason: '',
      action_by: 'IT Support',
      new_asset_code: ''
    });
    setIsTransferModalOpen(true);
  };

  // Submit Transfer / Loan
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!activeAsset) return;

    if (transferData.transfer_type === 'Loan' && !transferData.return_due_date) {
      Swal.fire('กรุณาระบุวันกำหนดส่งคืน', 'สำหรับการยืมใช้งานชั่วคราวต้องระบุวันกำหนดคืนเครื่อง', 'warning');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${activeAsset.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire({
          title: transferData.transfer_type === 'Loan' ? 'บันทึกการยืมสำเร็จ' : 'โอนย้ายสำเร็จ',
          text: result.message,
          icon: 'success',
          timer: 1800,
          showConfirmButton: false
        });
        setIsTransferModalOpen(false);
        fetchAssets();
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Return Asset to Stock
  const handleReturnAsset = async (asset) => {
    const confirm = await Swal.fire({
      title: `รับคืนทรัพย์สิน [${asset.asset_code}]?`,
      text: `เครื่องจะถูกปลดออกจากผู้ถือครอง และส่งกลับเข้าคลังสถานะ 'พร้อมใช้งาน (Available)'`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันรับคืนคลัง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#10b981'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${asset.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_by: 'IT Support',
          return_location: asset.location || '8-BD'
        })
      });

      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', result.message, 'success');
        fetchAssets();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Retire Asset (ปลดระวางทรัพย์สิน)
  const handleRetireAsset = async (asset) => {
    const confirm = await Swal.fire({
      title: `ยืนยันปลดระวาง [${asset.asset_code}]?`,
      text: `ทรัพย์สิน "${asset.name}" จะถูกปรับสถานะเป็น 'ปลดระวาง (Retired)' และนำออกจากผู้ถือครอง`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปลดระวาง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#64748b'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...asset,
          status: 'Retired',
          assigned_to: null,
          location: asset.location || 'คลังปลดระวาง / จำหน่ายออก'
        })
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire({
          title: 'ปลดระวางสำเร็จ',
          text: `ปรับสถานะ [${asset.asset_code}] เป็น 'ปลดระวาง' เรียบร้อยแล้ว`,
          icon: 'success',
          timer: 1800,
          showConfirmButton: false
        });
        fetchAssets();
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Open Maintenance Modal
  const handleOpenMaintenanceModal = (asset) => {
    setActiveAsset(asset);
    setMaintenanceData({
      action_type: 'Repair',
      description: '',
      cost: '',
      technician: 'IT Support',
      service_date: new Date().toISOString().split('T')[0],
      new_ram: asset.ram || '',
      new_storage: asset.storage || '',
      set_status: 'Maintenance'
    });
    setIsMaintenanceModalOpen(true);
  };

  // Submit Maintenance
  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    if (!activeAsset) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${activeAsset.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData)
      });

      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire('สำเร็จ', result.message, 'success');
        setIsMaintenanceModalOpen(false);
        fetchAssets();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Open Detail View
  const handleOpenDetailModal = (asset) => {
    setActiveAsset(asset);
    setIsDetailModalOpen(true);
    fetchAssetDetail(asset.id);
  };

  // Delete Asset
  const handleDeleteAsset = async (asset) => {
    const confirm = await Swal.fire({
      title: `ลบทรัพย์สิน [${asset.asset_code}]?`,
      text: 'ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assets/${asset.id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        Swal.fire('ลบสำเร็จ', result.message, 'success');
        fetchAssets();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', error.message, 'error');
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('IT_Assets');

    worksheet.columns = [
      { header: 'รหัสทรัพย์สิน', key: 'asset_code', width: 16 },
      { header: 'ชื่ออุปกรณ์', key: 'name', width: 22 },
      { header: 'หมวดหมู่', key: 'category', width: 16 },
      { header: 'บริษัท', key: 'company', width: 12 },
      { header: 'แผนก', key: 'department', width: 18 },
      { header: 'สาขา/สถานที่', key: 'location', width: 16 },
      { header: 'ยี่ห้อ', key: 'brand', width: 14 },
      { header: 'รุ่น', key: 'model', width: 16 },
      { header: 'Serial Number', key: 'serial_number', width: 20 },
      { header: 'CPU', key: 'cpu', width: 14 },
      { header: 'RAM', key: 'ram', width: 10 },
      { header: 'Storage', key: 'storage', width: 16 },
      { header: 'สถานะ', key: 'status', width: 14 },
      { header: 'ผู้ถือครอง', key: 'assigned_to', width: 24 },
      { header: 'เลขที่ PO', key: 'po_number', width: 18 },
      { header: 'วันที่จัดซื้อ', key: 'purchase_date', width: 15 },
      { header: 'ราคา (บาท)', key: 'price', width: 15 },
      { header: 'ระยะเวลารับประกัน', key: 'warranty_period', width: 20 },
      { header: 'วันหมดอายุประกัน', key: 'warranty_expire_date', width: 18 },
      { header: 'หมายเหตุ', key: 'notes', width: 30 },
    ];

    // Header style
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF89919' }
    };

    filteredAssets.forEach(a => {
      worksheet.addRow({
        asset_code: a.asset_code || '',
        name: a.name || '',
        category: a.category || '',
        company: a.company || a.owner_company || '',
        department: a.department || '',
        location: a.location || '',
        brand: a.brand || '',
        model: a.model || '',
        serial_number: a.serial_number || '',
        cpu: a.cpu || '',
        ram: a.ram || '',
        storage: a.storage || '',
        status: a.status || '',
        assigned_to: a.assigned_employee_name || 'คลังส่วนกลาง',
        po_number: a.po_number || '',
        purchase_date: a.purchase_date ? a.purchase_date.split('T')[0] : '',
        price: a.price ? Number(a.price).toLocaleString() : '',
        warranty_period: a.warranty_period || '',
        warranty_expire_date: a.warranty_expire_date ? a.warranty_expire_date.split('T')[0] : '',
        notes: a.notes || ''
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `IT_Assets_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // -------------------------------------------------------------
  // Filter & Pagination Computation
  // -------------------------------------------------------------
  const filteredAssets = assets.filter(item => {
    // Search
    if (searchTerm.trim() !== '') {
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        (item.asset_code && item.asset_code.toLowerCase().includes(s)) ||
        (item.name && item.name.toLowerCase().includes(s)) ||
        (item.brand && item.brand.toLowerCase().includes(s)) ||
        (item.model && item.model.toLowerCase().includes(s)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(s)) ||
        (item.assigned_employee_name && item.assigned_employee_name.toLowerCase().includes(s)) ||
        (item.company && item.company.toLowerCase().includes(s)) ||
        (item.department && item.department.toLowerCase().includes(s)) ||
        (item.location && item.location.toLowerCase().includes(s));
      if (!matchSearch) return false;
    }

    // Company
    if (selectedCompany !== 'All' && item.company !== selectedCompany && item.owner_company !== selectedCompany) {
      return false;
    }

    // Department
    if (selectedDept !== 'All' && item.department !== selectedDept) {
      return false;
    }

    // Location
    if (selectedLocation !== 'All' && item.location !== selectedLocation) {
      return false;
    }

    // Category
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== 'All' && item.status !== selectedStatus) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const codeA = (a.asset_code || '').toString();
    const codeB = (b.asset_code || '').toString();
    if (sortOrder === 'asc') {
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    }
    return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const currentAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Statistics counters
  const totalCount = assets.length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const inUseCount = assets.filter(a => a.status === 'In Use').length;
  const onLoanCount = assets.filter(a => a.status === 'On Loan').length;
  const maintenanceCount = assets.filter(a => a.status === 'Maintenance').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">พร้อมใช้งาน</span>;
      case 'In Use':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">กำลังใช้งาน</span>;
      case 'On Loan':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60">ยืมใช้งานชั่วคราว</span>;
      case 'Maintenance':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">ส่งซ่อม/อัปเกรด</span>;
      case 'Retired':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">ปลดระวาง</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* 1. Header & Quick Actions */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100/80 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200 dark:border-orange-800/50">
              <Package size={22} />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold text-slate-900 dark:text-slate-100">ทะเบียนทรัพย์สินไอที (IT Asset Management)</h1>
              <p className="page-subtitle text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ระบบจัดการอุปกรณ์คอมพิวเตอร์และเน็ตเวิร์กแบบรวมศูนย์ ทุกบริษัทในเครือ ASCG Group
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] hover:bg-slate-50 dark:hover:bg-[#252e3d] text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="ส่งออกรายงาน Excel"
          >
            <Download size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">ส่งออก Excel</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4 shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มทรัพย์สินใหม่</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Stat Metric Cards */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total */}
        <div 
          onClick={() => { setSelectedStatus('All'); setSelectedCompany('All'); setSelectedDept('All'); setSelectedLocation('All'); }}
          className={`card p-4 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500 transition-all ${selectedStatus === 'All' ? 'ring-2 ring-orange-400 bg-orange-50/20 dark:bg-orange-950/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ทรัพย์สินทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Box size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">รายการ</span>
          </div>
        </div>

        {/* Available */}
        <div 
          onClick={() => setSelectedStatus('Available')}
          className={`card p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500 transition-all ${selectedStatus === 'Available' ? 'ring-2 ring-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">พร้อมใช้งาน (ในคลัง)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{availableCount}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-500 font-medium">เครื่อง</span>
          </div>
        </div>

        {/* In Use */}
        <div 
          onClick={() => setSelectedStatus('In Use')}
          className={`card p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-all ${selectedStatus === 'In Use' ? 'ring-2 ring-blue-400 bg-blue-50/20 dark:bg-blue-950/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">กำลังใช้งาน</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{inUseCount}</span>
            <span className="text-xs text-blue-600/70 dark:text-blue-500 font-medium">เครื่อง</span>
          </div>
        </div>

        {/* On Loan */}
        <div 
          onClick={() => setSelectedStatus('On Loan')}
          className={`card p-4 cursor-pointer hover:border-purple-300 dark:hover:border-purple-500 transition-all ${selectedStatus === 'On Loan' ? 'ring-2 ring-purple-400 bg-purple-50/20 dark:bg-purple-950/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">ยืมใช้งานชั่วคราว</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ArrowRightLeft size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-700 dark:text-purple-400">{onLoanCount}</span>
            <span className="text-xs text-purple-600/70 dark:text-purple-500 font-medium">เครื่อง</span>
          </div>
        </div>

        {/* Maintenance */}
        <div 
          onClick={() => setSelectedStatus('Maintenance')}
          className={`card p-4 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500 transition-all ${selectedStatus === 'Maintenance' ? 'ring-2 ring-amber-400 bg-amber-50/20 dark:bg-amber-950/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">ส่งซ่อม/อัปเกรด</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{maintenanceCount}</span>
            <span className="text-xs text-amber-600/70 dark:text-amber-500 font-medium">เครื่อง</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. Multi-dimensional Filters Bar */}
      {/* ========================================================= */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-2">
            <input 
              type="text"
              placeholder="ค้นหา Asset Code, Serial, ชื่อเครื่อง, พนักงาน, สเปก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base text-xs px-3 py-2 dark:bg-[#1c232f] dark:text-slate-100 dark:border-[#364356] dark:placeholder-slate-500"
            />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setCurrentPage(1); }}
              className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] dark:text-slate-100 dark:border-[#364356]"
            >
              <option value="All" className="dark:bg-[#1c232f]">ทุกบริษัท ({masterCompanies.length || filterOptions.companies.length})</option>
              {masterCompanies.length > 0 ? (
                masterCompanies.map(c => (
                  <option key={c.prefix} value={c.prefix} className="dark:bg-[#1c232f]">{c.prefix}</option>
                ))
              ) : (
                filterOptions.companies.map(c => (
                  <option key={c} value={c} className="dark:bg-[#1c232f]">{c}</option>
                ))
              )}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] dark:text-slate-100 dark:border-[#364356]"
            >
              <option value="All" className="dark:bg-[#1c232f]">ทุกแผนก ({filterOptions.departments.length})</option>
              {filterOptions.departments.map(d => (
                <option key={d} value={d} className="dark:bg-[#1c232f]">{d}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
              className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] dark:text-slate-100 dark:border-[#364356]"
            >
              <option value="All" className="dark:bg-[#1c232f]">ทุกสาขา ({filterOptions.locations.length})</option>
              {filterOptions.locations.map(l => (
                <option key={l} value={l} className="dark:bg-[#1c232f]">{l}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] dark:text-slate-100 dark:border-[#364356]"
            >
              <option value="All" className="dark:bg-[#1c232f]">ทุกสถานะ</option>
              <option value="Available" className="dark:bg-[#1c232f]">พร้อมใช้งาน (Available)</option>
              <option value="In Use" className="dark:bg-[#1c232f]">กำลังใช้งาน (In Use)</option>
              <option value="On Loan" className="dark:bg-[#1c232f]">ยืมใช้งาน (On Loan)</option>
              <option value="Maintenance" className="dark:bg-[#1c232f]">ส่งซ่อม (Maintenance)</option>
              <option value="Retired" className="dark:bg-[#1c232f]">ปลดระวาง (Retired)</option>
            </select>
          </div>

        </div>

        {/* Filter Summary, Sort Toggle & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#364356] text-xs text-slate-500 dark:text-slate-400">
          <div>
            พบผลลัพธ์ <strong className="text-slate-900 dark:text-slate-100">{filteredAssets.length}</strong> รายการ จากทั้งหมด {totalCount} รายการ
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                sortOrder === 'desc'
                  ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-800/60 dark:text-orange-300 dark:hover:bg-orange-900/40'
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800/60 dark:text-blue-300 dark:hover:bg-blue-900/40'
              }`}
              title="คลิกเพื่อสลับการเรียงลำดับรหัสทรัพย์สิน"
            >
              <ArrowUpDown size={13} />
              <span>รหัส: {sortOrder === 'desc' ? 'มาก → น้อย (DESC)' : 'น้อย → มาก (ASC)'}</span>
            </button>

            {(searchTerm || selectedCompany !== 'All' || selectedDept !== 'All' || selectedLocation !== 'All' || selectedCategory !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCompany('All');
                  setSelectedDept('All');
                  setSelectedLocation('All');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setCurrentPage(1);
                }}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. Asset Data Table & Mobile Cards */}
      {/* ========================================================= */}
      <div className="card overflow-hidden shadow-sm">
        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#364356] bg-slate-50/80 dark:bg-[#1c232f]">
                <th 
                  onClick={() => { setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); setCurrentPage(1); }}
                  className="table-header-cell cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-[#252e3d] transition-colors group text-slate-700 dark:text-slate-300"
                  title={sortOrder === 'desc' ? 'คลิกเพื่อสลับเป็น: เรียงจากน้อยไปมาก' : 'คลิกเพื่อสลับเป็น: เรียงจากมากไปน้อย'}
                >
                  <div className="flex items-center gap-1.5">
                    <span>รหัสทรัพย์สิน</span>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-xs font-bold transition-all ${
                      sortOrder === 'desc' ? 'text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 group-hover:bg-orange-200' : 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-200'
                    }`}>
                      {sortOrder === 'desc' ? <ArrowDown size={13} className="stroke-[2.5]" /> : <ArrowUp size={13} className="stroke-[2.5]" />}
                    </span>
                  </div>
                </th>
                <th className="table-header-cell text-slate-700 dark:text-slate-300">อุปกรณ์ / รุ่น</th>
                <th className="table-header-cell text-slate-700 dark:text-slate-300">สเปกฮาร์ดแวร์</th>
                <th className="table-header-cell text-slate-700 dark:text-slate-300">สังกัด & สถานที่</th>
                <th className="table-header-cell text-slate-700 dark:text-slate-300">ผู้ถือครอง</th>
                <th className="table-header-cell text-slate-700 dark:text-slate-300">สถานะ</th>
                <th className="table-header-cell text-right text-slate-700 dark:text-slate-300">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#364356] text-xs">
              {isLoading ? (
                <TableSkeleton rows={6} cols={7} />
              ) : currentAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <Box size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <div className="font-semibold text-slate-600 dark:text-slate-300">ไม่พบรายการทรัพย์สิน</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองด้านบน</div>
                  </td>
                </tr>
              ) : (
                currentAssets.map((asset) => {
                  const isCST = asset.company === 'CST' || (asset.asset_code && asset.asset_code.startsWith('CST'));
                  const hasAttached = asset.attached_devices && asset.attached_devices.length > 0;
                  
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1c232f]/60 transition-colors group">
                      
                      {/* Asset Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${isCST ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60' : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'}`}>
                            {asset.asset_code || '-'}
                          </span>
                        </div>
                        {hasAttached && (
                          <div className="mt-1 flex items-center gap-1 text-[10.5px] text-blue-600 dark:text-blue-400 font-medium">
                            <Monitor size={11} /> +มีจอภาพพ่วง ({asset.attached_devices.length})
                          </div>
                        )}
                        {asset.parent_asset_code && (
                          <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            ต่อพ่วงกับ: {asset.parent_asset_code}
                          </div>
                        )}
                      </td>

                      {/* Name & Model */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {asset.image_url ? (
                            <img
                              src={asset.image_url.startsWith('http') ? asset.image_url : `${import.meta.env.VITE_API_BASE_URL}${asset.image_url}`}
                              alt={asset.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-[#364356] shadow-2xs shrink-0 cursor-pointer hover:opacity-80 transition"
                              onClick={() => handleOpenDetailModal(asset)}
                              title="คลิกดูภาพขยาย"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1c232f] border border-slate-200/80 dark:border-[#364356] flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                              {asset.category === 'Notebook' ? <Laptop size={16} /> : asset.category === 'Monitor' ? <Monitor size={16} /> : asset.category === 'Server' ? <Server size={16} /> : <Package size={16} />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{asset.name || '-'}</div>
                            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{asset.brand}</span>
                              {asset.model && <span>• {asset.model}</span>}
                            </div>
                            {asset.serial_number && (
                              <div className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500">S/N: {asset.serial_number}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="py-3 px-4">
                        {asset.cpu || asset.ram || asset.storage ? (
                          <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                            {asset.cpu && <div className="font-medium text-slate-700 dark:text-slate-200">{asset.cpu}</div>}
                            <div className="text-slate-500 dark:text-slate-400">
                              {asset.ram && <span>RAM {asset.ram}GB</span>}
                              {asset.ram && asset.storage && <span> • </span>}
                              {asset.storage && <span>{asset.storage}</span>}
                            </div>
                            {asset.display_size && <div className="text-[10px] text-slate-400 dark:text-slate-500">จอ: {asset.display_size}"</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                        )}
                      </td>

                      {/* Company & Department & Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                          <Building2 size={12} className="text-slate-400 dark:text-slate-500" />
                          <span>{asset.company || asset.owner_company || '-'}</span>
                        </div>
                        {asset.department && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{asset.department}</div>
                        )}
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-400 dark:text-slate-400 mt-0.5">
                          <MapPin size={11} />
                          <span>{asset.location || '-'}</span>
                        </div>
                      </td>

                      {/* Custodian */}
                      <td className="py-3 px-4">
                        {asset.assigned_employee_name ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{asset.assigned_employee_name}</div>
                            {asset.assigned_employee_dept && (
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400">{asset.assigned_employee_dept}</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                            <Box size={12} /> สต็อกคลัง IT
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(asset.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Detail */}
                          <button
                            onClick={() => handleOpenDetailModal(asset)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                            title="ดูรายละเอียด & ไทม์ไลน์ประวัติ"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Transfer / Loan */}
                          <button
                            onClick={() => handleOpenTransferModal(asset)}
                            className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors cursor-pointer"
                            title="ยืม - โอนย้ายข้ามบริษัท"
                          >
                            <ArrowRightLeft size={14} />
                          </button>

                          {/* Maintenance */}
                          <button
                            onClick={() => handleOpenMaintenanceModal(asset)}
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                            title="ส่งซ่อม / อัปเกรดสเปก"
                          >
                            <Wrench size={14} />
                          </button>

                          {/* Return to Stock */}
                          {asset.assigned_to && (
                            <button
                              onClick={() => handleReturnAsset(asset)}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="รับคืนเข้าคลัง (Return)"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c232f] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-red-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="ลบข้อมูล"
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Responsive Asset Cards (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#364356]">
          {isLoading ? (
            <MobileCardSkeleton count={4} />
          ) : currentAssets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Box size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <div className="font-semibold text-slate-600 dark:text-slate-300 text-xs">ไม่พบรายการทรัพย์สิน</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">ลองปรับตัวกรองหรือคำค้นหา</div>
            </div>
          ) : (
            currentAssets.map((asset) => {
              const isCST = asset.company === 'CST' || (asset.asset_code && asset.asset_code.startsWith('CST'));
              const hasAttached = asset.attached_devices && asset.attached_devices.length > 0;

              return (
                <div key={asset.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/80 dark:hover:bg-[#1c232f]/60 transition-colors">
                  {/* Row 1: Code + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${isCST ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60' : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'}`}>
                        {asset.asset_code || '-'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{asset.company || '-'}</span>
                    </div>
                    {getStatusBadge(asset.status)}
                  </div>

                  {/* Row 2: Equipment Name */}
                  <div className="flex items-center gap-2.5">
                    {asset.image_url ? (
                      <img
                        src={asset.image_url.startsWith('http') ? asset.image_url : `${import.meta.env.VITE_API_BASE_URL}${asset.image_url}`}
                        alt={asset.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#364356] shadow-2xs shrink-0 cursor-pointer"
                        onClick={() => handleOpenDetailModal(asset)}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">{asset.name || '-'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{asset.brand}</span>
                        {asset.model && <span>• {asset.model}</span>}
                        {asset.serial_number && <span className="font-mono text-slate-400 dark:text-slate-500">({asset.serial_number})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Specs & Location */}
                  <div className="p-2.5 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200/70 dark:border-[#364356] text-xs space-y-1">
                    {(asset.cpu || asset.ram || asset.storage) && (
                      <div className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1">
                        <Cpu size={12} className="text-slate-400 shrink-0" />
                        <span>{asset.cpu} {asset.ram && `• RAM ${asset.ram}GB`} {asset.storage && `• ${asset.storage}`}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-0.5 border-t border-slate-200/40 dark:border-[#364356]">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" /> {asset.location || '-'} {asset.department && `(${asset.department})`}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                        <UserCheck size={11} className="text-blue-500 dark:text-blue-400" /> {asset.assigned_employee_name || 'คลัง IT'}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Action Buttons Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenDetailModal(asset)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={13} /> ดูละเอียด/Key
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenTransferModal(asset)}
                        className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors cursor-pointer"
                        title="ยืม-โอนย้าย"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenMaintenanceModal(asset)}
                        className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        title="ส่งซ่อม"
                      >
                        <Wrench size={15} />
                      </button>
                      {asset.assigned_to && (
                        <button
                          onClick={() => handleReturnAsset(asset)}
                          className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="รับคืนคลัง"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(asset)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c232f] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-red-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-[#364356] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAssets.length)} จาก {filteredAssets.length} รายการ
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] hover:bg-slate-50 dark:hover:bg-[#252e3d] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← ก่อนหน้า
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-semibold cursor-pointer ${currentPage === pageNum ? 'bg-orange-500 text-white shadow-xs' : 'border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] hover:bg-slate-50 dark:hover:bg-[#252e3d] text-slate-700 dark:text-slate-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#1c232f] hover:bg-slate-50 dark:hover:bg-[#252e3d] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. Modal: เพิ่ม / แก้ไขทรัพย์สิน (Add/Edit Asset Form) */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 print:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFormModalOpen(false); }}
        >
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-[#364356] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50/80 dark:bg-[#1c232f]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {isEditMode ? 'แก้ไขข้อมูลทรัพย์สิน' : 'ลงทะเบียนทรัพย์สินใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEditMode ? `แก้ไขรายละเอียดรหัส [${formData.asset_code}]` : 'สร้างรหัสและบันทึกสเปกอุปกรณ์เข้าสู่ระบบ'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
              
              {/* Image Upload Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera size={14} className="text-orange-600" />
                    <span>รูปภาพทรัพย์สิน (Asset Photo)</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-normal">รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 10MB</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.image_url ? (
                    <div className="relative group w-32 h-24 rounded-xl overflow-hidden border-2 border-orange-300 shadow-sm bg-white shrink-0">
                      <img 
                        src={formData.image_url.startsWith('http') ? formData.image_url : `${import.meta.env.VITE_API_BASE_URL}${formData.image_url}`} 
                        alt="Asset preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs shadow transition"
                        title="ลบรูปภาพ"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Image size={24} className="mb-1 text-slate-300" />
                      <span className="text-[10px]">ยังไม่มีรูป</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full sm:w-auto">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} className="text-orange-600" />
                            <span>{formData.image_url ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพอุปกรณ์'}</span>
                          </>
                        )}
                      </button>
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium transition"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      อัปโหลดรูปตัวเครื่องจริง ป้ายแท็ก หรือสภาพอุปกรณ์เพื่อใช้ในการตรวจสอบและบันทึกประวัติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: สังกัดและรหัสทรัพย์สิน */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 size={14} className="text-orange-600" />
                  <span>1. สังกัดบริษัทและรหัสทรัพย์สิน (Company & Asset Code)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Company */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">บริษัทเจ้าของ (Company) *</label>
                    <select
                      value={formData.company}
                      onChange={handleCompanyChange}
                      className="input-base text-xs py-2 bg-white"
                      required
                    >
                      {masterCompanies.length > 0 ? (
                        masterCompanies.map(c => (
                          <option key={c.prefix} value={c.prefix}>
                            {c.prefix}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="AIC">AIC</option>
                          <option value="AIA">AIA</option>
                          <option value="CST">CST</option>
                          <option value="SQT">SQT</option>
                          <option value="AEP">AEP</option>
                          <option value="ASPD">ASPD</option>
                          <option value="QPM">QPM</option>
                          <option value="AGC">AGC</option>
                          <option value="ASCG">ASCG</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Asset Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600">รหัสทรัพย์สิน (Asset Code) *</label>
                      {!isEditMode && (
                        <button
                          type="button"
                          onClick={() => fetchSuggestedCode(formData.company)}
                          className="text-[10px] text-orange-600 hover:text-orange-700 flex items-center gap-0.5 font-semibold"
                        >
                          <RefreshCw size={10} /> Auto-suggest
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.asset_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, asset_code: e.target.value }))}
                      placeholder={formData.company === 'CST' ? 'CST005' : 'ASCG100'}
                      className="input-base text-xs py-2 font-mono font-bold"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">หมวดหมู่อุปกรณ์ *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-base text-xs py-2 bg-white"
                      required
                    >
                      <option value="PC">PC (เครื่องคอมพิวเตอร์ตั้งโต๊ะ)</option>
                      <option value="Notebook">Notebook / Laptop</option>
                      <option value="AIO">All-in-One (AIO)</option>
                      <option value="Monitor">Monitor (จอมอนิเตอร์)</option>
                      <option value="Printer">Printer (เครื่องพิมพ์)</option>
                      <option value="Server">Server & Storage (1U, Blade, NAS)</option>
                      <option value="Access Point">Access Point / Wi-Fi</option>
                      <option value="CCTV">CCTV / Recorder (DVR/NVR)</option>
                      <option value="Others">อื่นๆ (Others)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">สถานะทรัพย์สิน (Status) *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="input-base text-xs py-2 bg-white font-semibold"
                      required
                    >
                      <option value="Available">พร้อมใช้งาน (ในคลัง)</option>
                      <option value="In Use">กำลังใช้งาน (มีผู้ถือครอง)</option>
                      <option value="On Loan">ยืมใช้งานชั่วคราว</option>
                      <option value="Maintenance">ส่งซ่อม / อัปเกรด</option>
                      <option value="Retired">ปลดระวาง (Retired)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Section 2: ผู้ถือครองและสถานที่ (Smart Auto-populate) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-blue-600" />
                    <span>2. ผู้ถือครองและสถานที่จัดวาง (Custodian & Location)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    *เลือกพนักงาน ระบบจะดึง แผนก & สาขา ให้อัตโนมัติ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Assigned Employee (Searchable / Filterable Autocomplete) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">พนักงานผู้ถือครอง</label>
                    <Select
                      value={employeeOptions.find(opt => String(opt.value) === String(formData.assigned_to)) || null}
                      onChange={handleSelectEmployee}
                      options={employeeOptions}
                      placeholder="พิมพ์เพื่อค้นหาชื่อพนักงาน..."
                      isClearable
                      isSearchable
                      styles={selectCustomStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      noOptionsMessage={() => "ไม่พบรายชื่อพนักงาน"}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">แผนก (Department)</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="เช่น IT, บัญชี, จัดซื้อ, HR"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">สาขา / สถานที่ตั้ง</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="เช่น Soi-10, 8-BD, 15-BD, Rayong"
                      className="input-base text-xs py-2"
                    />
                  </div>

                </div>
              </div>

              {/* Section 3: สเปกฮาร์ดแวร์ละเอียด */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Laptop size={14} className="text-slate-600" />
                  <span>3. ข้อมูลสเปกอุปกรณ์ (Hardware Specifications)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อเรียกอุปกรณ์ *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น Lenovo C360, Dell Vostro"
                      className="input-base text-xs py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ยี่ห้อ (Brand)</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="เช่น Lenovo, Dell, HP, Acer"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">รุ่น (Model)</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="เช่น OptiPlex 3050, ThinkPad E14"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Serial Number (S/N)</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                      placeholder="เช่น VS81545403"
                      className="input-base text-xs py-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CPU Processor</label>
                    <input
                      type="text"
                      value={formData.cpu}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpu: e.target.value }))}
                      placeholder="เช่น Core-i5 12400, Core-i3"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">RAM (GB)</label>
                    <input
                      type="text"
                      value={formData.ram}
                      onChange={(e) => setFormData(prev => ({ ...prev, ram: e.target.value }))}
                      placeholder="เช่น 8, 16, 32"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Harddisk / SSD Storage</label>
                    <input
                      type="text"
                      value={formData.storage}
                      onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value }))}
                      placeholder="เช่น SSD 500GB, HDD 1TB"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ขนาดหน้าจอ (นิ้ว)</label>
                    <input
                      type="text"
                      value={formData.display_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_size: e.target.value }))}
                      placeholder="เช่น 19.5, 21.5, 24"
                      className="input-base text-xs py-2"
                    />
                  </div>

                  {/* Parent Asset (ผูกกับ PC เครื่องไหน) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อุปกรณ์หลักที่ผูกต่อพ่วง (Parent)</label>
                    <select
                      value={formData.parent_asset_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_asset_id: e.target.value }))}
                      className="input-base text-xs py-2 bg-white"
                    >
                      <option value="">-- เป็นอุปกรณ์เดี่ยว (Standalone) --</option>
                      {assets.filter(a => a.id !== formData.id && (a.category === 'PC' || a.category === 'Server')).map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.asset_code}] {p.name} ({p.assigned_employee_name || 'คลัง'})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Section 4: ข้อมูลการจัดซื้อ เลขที่ PO และการรับประกัน */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-amber-600" />
                    <span>4. ข้อมูลการจัดซื้อ เลขที่ PO และการรับประกัน (PO & Warranty)</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-normal">บันทึกเลขที่ใบสั่งซื้อ ราคา และวันหมดอายุประกัน</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Left Box: ข้อมูลการสั่งซื้อ */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200/60 space-y-2.5">
                    <div className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                      <FileText size={13} className="text-blue-600" />
                      <span>ข้อมูลการสั่งซื้อ (Purchase Details)</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">เลขที่ใบสั่งซื้อ (PO Number)</label>
                        <input
                          type="text"
                          value={formData.po_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, po_number: e.target.value }))}
                          placeholder="เช่น PO67-0012, PO-AIC-2024"
                          className="input-base text-xs py-1.5 font-mono font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">วันที่จัดซื้อ</label>
                          <input
                            type="date"
                            value={formData.purchase_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                            className="input-base text-xs py-1.5 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">ราคาจัดซื้อ (บาท)</label>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                            className="input-base text-xs py-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Box: ข้อมูลการรับประกัน */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200/60 space-y-2.5">
                    <div className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                      <Shield size={13} className="text-amber-600" />
                      <span>ข้อมูลการรับประกัน (Warranty Details)</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">ระยะเวลารับประกัน (Warranty Period)</label>
                        <input
                          type="text"
                          value={formData.warranty_period}
                          onChange={(e) => setFormData(prev => ({ ...prev, warranty_period: e.target.value }))}
                          placeholder="เช่น 1 ปี, 3 ปี, 36 เดือน Onsite Service"
                          className="input-base text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">วันหมดอายุประกัน (Expiry Date)</label>
                        <input
                          type="date"
                          value={formData.warranty_expire_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, warranty_expire_date: e.target.value }))}
                          className="input-base text-xs py-1.5 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: ข้อมูลลิขสิทธิ์ซอฟต์แวร์ (Software Licenses) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-600" />
                    <span>5. ลิขสิทธิ์ซอฟต์แวร์ประจำเครื่อง (Software Licenses & Keys)</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-normal">บันทึก Key และบัญชีเข้าใช้งาน</span>
                </div>

                {/* Windows OS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200/60">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Laptop size={13} className="text-sky-600" />
                      <span>ระบบปฏิบัติการ (OS License)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.os_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, os_name: e.target.value }))}
                      placeholder="เช่น Windows 10 Pro, Win8.1 Pro OEI"
                      className="input-base text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">OS Product Key</label>
                    <input
                      type="text"
                      value={formData.os_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, os_key: e.target.value }))}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      className="input-base text-xs py-1.5 font-mono"
                    />
                  </div>
                </div>

                {/* Microsoft Office */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200/60">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <FileText size={13} className="text-amber-600" />
                      <span>โปรแกรมออฟฟิศ (Office License)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.office_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, office_name: e.target.value }))}
                      placeholder="เช่น Office 2019 Home & Business, M365"
                      className="input-base text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Office Product Key</label>
                    <input
                      type="text"
                      value={formData.office_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, office_key: e.target.value }))}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      className="input-base text-xs py-1.5 font-mono"
                    />
                  </div>
                </div>

                {/* Extra Software */}
                <div className="p-3 bg-white rounded-lg border border-slate-200/60 space-y-2.5">
                  <div className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                    <Package size={13} className="text-purple-600" />
                    <span>ซอฟต์แวร์เฉพาะทางเพิ่มเติม (Extra Software):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">ชื่อโปรแกรม</label>
                      <input
                        type="text"
                        value={formData.extra_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, extra_name: e.target.value }))}
                        placeholder="เช่น Acrobat Pro 2017, AutoCAD, Photoshop"
                        className="input-base text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Serial / License Key</label>
                      <input
                        type="text"
                        value={formData.extra_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, extra_key: e.target.value }))}
                        placeholder="Key หรือ Serial Number"
                        className="input-base text-xs py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">อีเมลบัญชี Login</label>
                      <input
                        type="text"
                        value={formData.extra_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, extra_email: e.target.value }))}
                        placeholder="เช่น itd@ascggroup.com"
                        className="input-base text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">รหัสผ่านบัญชี Login</label>
                      <input
                        type="text"
                        value={formData.extra_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, extra_password: e.target.value }))}
                        placeholder="••••••••"
                        className="input-base text-xs py-1.5"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Section 6: หมายเหตุเพิ่มเติม */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ประวัติการอัปเกรด / หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="เช่น อัปเกรด RAM 8GB วันที่ 10/05/2021, เปลี่ยน SSD WD 500GB..."
                  rows={2}
                  className="input-base text-xs py-2 resize-y"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5 shadow-sm"
                >
                  {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลทรัพย์สิน'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. Modal: ยืม - โอนย้ายทรัพย์สิน (Transfer & Loan Modal) */}
      {/* ========================================================= */}
      {isTransferModalOpen && activeAsset && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 print:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setIsTransferModalOpen(false); }}
        >
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-[#364356] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-purple-50/60 dark:bg-[#1c232f]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">ยืม - โอนย้ายทรัพย์สินข้ามบริษัท/แผนก</h3>
                  <p className="text-xs text-purple-800 dark:text-purple-300">
                    จัดการส่งต่อเครื่อง [{activeAsset.asset_code}] {activeAsset.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="p-6 space-y-4 overflow-y-auto bg-white dark:bg-[#262f3f]">
              
              {/* Type selector: Permanent vs Loan */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-[#1c232f] rounded-xl border border-slate-200 dark:border-[#364356]">
                <button
                  type="button"
                  onClick={() => setTransferData(prev => ({ ...prev, transfer_type: 'Transfer' }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    transferData.transfer_type === 'Transfer' 
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Building2 size={14} />
                  <span>1. โอนย้ายถาวร (Transfer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferData(prev => ({ ...prev, transfer_type: 'Loan' }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    transferData.transfer_type === 'Loan' 
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock size={14} />
                  <span>2. ยืมใช้งานชั่วคราว (Loan)</span>
                </button>
              </div>

              {/* Current Asset Info Summary */}
              <div className="p-3 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200 dark:border-[#364356] text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">ข้อมูลปัจจุบัน (ต้นทาง):</div>
                <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>สังกัดเดิม: <strong className="text-slate-900 dark:text-white">{activeAsset.company} ({activeAsset.department || 'ไม่ระบุแผนก'})</strong></span>
                  <span>สาขาเดิม: <strong className="text-slate-900 dark:text-white">{activeAsset.location}</strong></span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  ผู้ถือครองเดิม: <strong className="text-slate-900 dark:text-white">{activeAsset.assigned_employee_name || 'คลังส่วนกลาง (Stock)'}</strong>
                </div>
              </div>

              {/* Destination Form */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">ระบุปลายทางใหม่:</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">บริษัทปลายทาง *</label>
                    <select
                      value={transferData.to_company}
                      onChange={(e) => setTransferData(prev => ({ ...prev, to_company: e.target.value }))}
                      className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#364356]"
                      required
                    >
                      {masterCompanies.length > 0 ? (
                        masterCompanies.map(c => (
                          <option key={c.prefix} value={c.prefix}>
                            {c.prefix}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="AIC">AIC</option>
                          <option value="AIA">AIA</option>
                          <option value="CST">CST</option>
                          <option value="SQT">SQT</option>
                          <option value="AEP">AEP</option>
                          <option value="ASPD">ASPD</option>
                          <option value="QPM">QPM</option>
                          <option value="AGC">AGC</option>
                          <option value="ASCG">ASCG</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">สาขาปลายทาง *</label>
                    <input
                      type="text"
                      value={transferData.to_location}
                      onChange={(e) => setTransferData(prev => ({ ...prev, to_location: e.target.value }))}
                      placeholder="เช่น Soi-10, 8-BD, Rayong"
                      className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#364356]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">แผนกปลายทาง</label>
                    <input
                      type="text"
                      value={transferData.to_department}
                      onChange={(e) => setTransferData(prev => ({ ...prev, to_department: e.target.value }))}
                      placeholder="เช่น บัญชี, IT, HR"
                      className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#364356]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ผู้รับมอบปลายทาง</label>
                    <Select
                      value={transferEmployeeOptions.find(opt => String(opt.value) === String(transferData.to_user_id)) || null}
                      onChange={(opt) => setTransferData(prev => ({ ...prev, to_user_id: opt ? opt.value : '' }))}
                      options={transferEmployeeOptions}
                      placeholder="พิมพ์เพื่อค้นหาผู้รับมอบ..."
                      isClearable
                      isSearchable
                      styles={selectCustomStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      noOptionsMessage={() => "ไม่พบรายชื่อพนักงาน"}
                    />
                  </div>
                </div>

                {/* If Loan: Return Due Date */}
                {transferData.transfer_type === 'Loan' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60">
                    <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-300 mb-1">
                      กำหนดวันที่ต้องส่งคืน (Return Due Date) *
                    </label>
                    <input
                      type="date"
                      value={transferData.return_due_date}
                      onChange={(e) => setTransferData(prev => ({ ...prev, return_due_date: e.target.value }))}
                      className="input-base text-xs py-2 bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#364356]"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">เหตุผลการโอนย้าย/ยืมใช้งาน</label>
                  <textarea
                    value={transferData.reason}
                    onChange={(e) => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="เช่น พนักงานย้ายสาขาปฏิบัติงาน, ขอยืมใช้ในโครงการพิเศษ 1 เดือน..."
                    rows={2}
                    className="input-base text-xs py-2 resize-none bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#364356]"
                  />
                </div>

              </div>

              {/* Submit buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#364356] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#364356] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1c232f] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={15} />
                  <span>ยืนยันการทำรายการ</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. Modal: ดูรายละเอียด & ไทม์ไลน์ประวัติ (Asset Detail Sheet) */}
      {/* ========================================================= */}
      {isDetailModalOpen && activeAsset && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 print:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50 dark:bg-[#1c232f]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-black px-3 py-1 rounded-lg bg-orange-500 text-white shadow-sm">
                  {activeAsset.asset_code}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activeAsset.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeAsset.category} • {activeAsset.brand} {activeAsset.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activeAsset.status)}
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#303b4e] flex items-center justify-center ml-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {isDetailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <div>กำลังดึงข้อมูลประวัติ...</div>
                </div>
              ) : (
                <>
                  {/* Asset Photo & Grid 1: Basic Specs */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {activeAsset.image_url && (
                      <div className="sm:w-44 h-40 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 shrink-0">
                        <img 
                          src={activeAsset.image_url.startsWith('http') ? activeAsset.image_url : `${import.meta.env.VITE_API_BASE_URL}${activeAsset.image_url}`} 
                          alt={activeAsset.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-[#1c232f] rounded-xl border border-slate-200/80 dark:border-[#364356] text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">บริษัทเจ้าของ</span>
                        <strong className="text-slate-800 dark:text-slate-100">{activeAsset.owner_company || activeAsset.company || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">แผนกปัจจุบัน</span>
                        <strong className="text-slate-800 dark:text-slate-100">{activeAsset.department || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">สาขา / สถานที่</span>
                        <strong className="text-slate-800 dark:text-slate-100">{activeAsset.location || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">ผู้ถือครองปัจจุบัน</span>
                        <strong className="text-slate-900 dark:text-slate-100">{activeAsset.assigned_employee_name || 'คลังส่วนกลาง'}</strong>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">Serial Number</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-100">{activeAsset.serial_number || '-'}</strong>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10.5px]">สเปกฮาร์ดแวร์</span>
                        <strong className="text-slate-800 dark:text-slate-100">
                          {activeAsset.cpu || '-'} | RAM {activeAsset.ram || '-'}GB | {activeAsset.storage || '-'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Purchase & Warranty Information Card */}
                  {(activeAsset.po_number || activeAsset.purchase_date || activeAsset.warranty_period || activeAsset.warranty_expire_date) && (
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2.5">
                        <DollarSign size={14} className="text-amber-600" />
                        <span>ข้อมูลการจัดซื้อและระยะเวลารับประกัน (PO & Warranty Info):</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#1c232f] p-3 rounded-lg border border-amber-100 dark:border-amber-900/40">
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">เลขที่ใบสั่งซื้อ (PO)</span>
                          <strong className="font-mono text-slate-800">{activeAsset.po_number || '-'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">วันที่จัดซื้อ</span>
                          <strong className="text-slate-800">{activeAsset.purchase_date ? new Date(activeAsset.purchase_date).toLocaleDateString('th-TH') : '-'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">ระยะเวลารับประกัน</span>
                          <strong className="text-slate-800">{activeAsset.warranty_period || '-'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">วันหมดอายุประกัน</span>
                          {activeAsset.warranty_expire_date ? (
                            <strong className={`font-semibold ${new Date(activeAsset.warranty_expire_date) < new Date() ? 'text-red-600' : 'text-emerald-600'}`}>
                              {new Date(activeAsset.warranty_expire_date).toLocaleDateString('th-TH')}
                              {new Date(activeAsset.warranty_expire_date) < new Date() ? ' (หมดประกัน)' : ' (อยู่ในประกัน)'}
                            </strong>
                          ) : (
                            <strong className="text-slate-800">-</strong>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attached Devices */}
                  {assetDetail && assetDetail.attached_devices && assetDetail.attached_devices.length > 0 && (
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/50 text-xs">
                      <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-2">
                        <Monitor size={14} className="text-blue-600" />
                        <span>อุปกรณ์พ่วงต่อ (Attached Monitors & Peripherals):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assetDetail.attached_devices.map(child => (
                          <div key={child.id} className="p-2 bg-white dark:bg-[#1c232f] rounded-lg border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">[{child.asset_code}]</span> <span className="text-slate-800 dark:text-slate-100">{child.name}</span>
                              <div className="text-[10.5px] text-slate-500">{child.brand} {child.model} S/N: {child.serial_number || '-'}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{child.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Software Licenses & Product Keys Card */}
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 text-xs space-y-3">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield size={15} className="text-emerald-600" />
                        <span>ลิขสิทธิ์ซอฟต์แวร์ประจำเครื่อง (Software Licenses & Product Keys)</span>
                      </div>
                      <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {assetDetail?.licenses?.length || 0} รายการ
                      </span>
                    </div>

                    {assetDetail?.licenses && assetDetail.licenses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {assetDetail.licenses.map((lic) => {
                          const isOS = lic.software_type === 'OS';
                          const isOffice = lic.software_type === 'Office';
                          const isExtra = lic.software_type === 'Extra Software';

                          return (
                            <div key={lic.id} className="p-3 bg-white dark:bg-[#1c232f] rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-2xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1.5 ${isOS ? 'bg-sky-50 text-sky-700 border border-sky-200' : isOffice ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                  {isOS ? <Laptop size={12} className="text-sky-600" /> : isOffice ? <FileText size={12} className="text-amber-600" /> : <Package size={12} className="text-purple-600" />}
                                  <span>{isOS ? 'Windows OS' : isOffice ? 'Microsoft Office' : 'Extra Software'}</span>
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100 text-[11.5px]">{lic.software_name || '-'}</span>
                              </div>

                              {lic.license_key && (
                                <div className="p-1.5 bg-slate-100/90 dark:bg-[#262f3f] rounded-lg border border-slate-200 dark:border-[#364356] flex items-center justify-between gap-1 font-mono text-[11px] text-slate-800 dark:text-slate-100 font-bold">
                                  <span className="truncate select-all">{lic.license_key}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(lic.license_key);
                                      Swal.fire({ title: 'คัดลอก Key แล้ว', icon: 'success', timer: 1000, showConfirmButton: false });
                                    }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-[#303b4e] rounded text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors shrink-0 flex items-center gap-1 text-[10px] cursor-pointer"
                                    title="คัดลอก Product Key"
                                  >
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </button>
                                </div>
                              )}

                              {(lic.login_email || lic.login_password) && (
                                <div className="text-[10.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#262f3f] p-2 rounded border border-slate-100 dark:border-[#364356] space-y-0.5">
                                  {lic.login_email && <div><strong>User:</strong> {lic.login_email}</div>}
                                  {lic.login_password && <div><strong>Pass:</strong> {lic.login_password}</div>}
                                </div>
                              )}

                              {lic.notes && (
                                <div className="text-[10.5px] text-slate-500 italic whitespace-pre-line mt-1">
                                  {lic.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                        ยังไม่มีการบันทึก Key หรือลิขสิทธิ์สำหรับเครื่องนี้ (สามารถกด "แก้ไข" เพื่อเพิ่มข้อมูลได้)
                      </div>
                    )}
                  </div>

                  {/* Timeline 1: Transfer & Loan History */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ArrowRightLeft size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>ประวัติการยืม - โอนย้ายข้ามบริษัท (Transfer & Loan Timeline)</span>
                    </div>

                    {assetDetail && assetDetail.transfer_history && assetDetail.transfer_history.length > 0 ? (
                      <div className="space-y-2 border-l-2 border-purple-200 dark:border-purple-800 ml-2 pl-4">
                        {assetDetail.transfer_history.map((log) => (
                          <div key={log.id} className="relative text-xs bg-slate-50 dark:bg-[#1c232f] p-3 rounded-xl border border-slate-200 dark:border-[#364356]">
                            <div className="absolute -left-[23px] top-3.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-xs" />
                            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-100">
                              <span className="text-purple-700 font-bold">
                                {log.transfer_type === 'Loan' ? 'ยืมใช้งานชั่วคราว' : 'โอนย้ายข้ามสาขา/บริษัท'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {new Date(log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="mt-1 text-slate-600 dark:text-slate-300">
                              จาก <strong>{log.from_company} ({log.from_department || '-'})</strong> [{log.from_user || 'คลัง'}] 
                              {' → '} 
                              ถึง <strong>{log.to_company} ({log.to_department || '-'})</strong> [{log.to_user || 'คลัง'}]
                            </div>
                            {log.return_due_date && (
                              <div className="mt-1 text-purple-700 text-[11px] font-medium">
                                กำหนดส่งคืน: {new Date(log.return_due_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {log.reason && (
                              <div className="mt-1 text-slate-500 italic text-[11px]">
                                เหตุผล: "{log.reason}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-400 italic bg-slate-50 dark:bg-[#1c232f] p-3 rounded-xl border border-slate-100 dark:border-[#364356] text-center">
                        ยังไม่มีประวัติการโอนย้ายข้ามบริษัท
                      </div>
                    )}
                  </div>

                  {/* Timeline 2: Maintenance History */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Wrench size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>ประวัติการซ่อมบำรุงและอัปเกรด (Maintenance History)</span>
                    </div>

                    {assetDetail && assetDetail.maintenance_history && assetDetail.maintenance_history.length > 0 ? (
                      <div className="space-y-2 border-l-2 border-amber-200 dark:border-amber-800 ml-2 pl-4">
                        {assetDetail.maintenance_history.map((log) => (
                          <div key={log.id} className="relative text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="absolute -left-[23px] top-3.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="text-amber-700 font-bold">{log.action_type}</span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {new Date(log.service_date || log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="mt-1 text-slate-700 dark:text-slate-200 font-medium">{log.description}</div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                              <span>ช่าง/ผู้ดำเนินการ: {log.technician || 'IT Support'}</span>
                              {log.cost > 0 && <span className="font-bold text-slate-900 dark:text-slate-100">ค่าใช้จ่าย: ฿{parseFloat(log.cost).toLocaleString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        ยังไม่มีประวัติการซ่อมบำรุง
                      </div>
                    )}
                  </div>

                </>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-[#364356] flex items-center justify-between bg-slate-50 dark:bg-[#1c232f]">
              <span className="text-[11px] text-slate-400 font-mono">ID: #{activeAsset.id}</span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-[#262f3f] hover:bg-slate-300 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 border border-transparent dark:border-[#364356] text-xs font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. Modal: ส่งซ่อม / อัปเกรด (Maintenance Form) */}
      {/* ========================================================= */}
      {isMaintenanceModalOpen && activeAsset && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 print:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMaintenanceModalOpen(false); }}
        >
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-[#364356] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#364356] flex items-center justify-between bg-amber-50/70 dark:bg-[#1c232f]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">บันทึกส่งซ่อม / อัปเกรดสเปก</h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300">เครื่อง [{activeAsset.asset_code}] {activeAsset.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="p-6 space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ประเภทการซ่อม/บริการ *</label>
                  <select
                    value={maintenanceData.action_type}
                    onChange={(e) => setMaintenanceData(prev => ({ ...prev, action_type: e.target.value }))}
                    className="input-base text-xs py-2 bg-white"
                  >
                    <option value="Repair">ส่งซ่อมแซม (Repair)</option>
                    <option value="Upgrade">อัปเกรดสเปก (Upgrade RAM/SSD)</option>
                    <option value="Maintenance">ตรวจเช็คสภาพประจำปี (Maintenance)</option>
                    <option value="Clean">ทำความสะอาดเครื่อง (Cleaning)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">วันที่ดำเนินการ *</label>
                  <input
                    type="date"
                    value={maintenanceData.service_date}
                    onChange={(e) => setMaintenanceData(prev => ({ ...prev, service_date: e.target.value }))}
                    className="input-base text-xs py-2 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">รายละเอียดการซ่อม / อะไหล่ที่เปลี่ยน *</label>
                <textarea
                  value={maintenanceData.description}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="เช่น เปลี่ยนพัดลม CPU, เพิ่ม RAM จาก 8GB เป็น 16GB, ลง Windows ใหม่..."
                  rows={3}
                  className="input-base text-xs py-2"
                  required
                />
              </div>

              {/* Upgrade values */}
              {maintenanceData.action_type === 'Upgrade' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="text-[11px] font-bold text-amber-900">อัปเดตสเปกในระบบอัตโนมัติ:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] text-slate-600 mb-0.5">RAM ใหม่ (GB)</label>
                      <input
                        type="text"
                        value={maintenanceData.new_ram}
                        onChange={(e) => setMaintenanceData(prev => ({ ...prev, new_ram: e.target.value }))}
                        placeholder="เช่น 16"
                        className="input-base text-xs py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-slate-600 mb-0.5">Storage ใหม่</label>
                      <input
                        type="text"
                        value={maintenanceData.new_storage}
                        onChange={(e) => setMaintenanceData(prev => ({ ...prev, new_storage: e.target.value }))}
                        placeholder="เช่น SSD 1TB"
                        className="input-base text-xs py-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ช่าง / ผู้ดำเนินการ</label>
                  <input
                    type="text"
                    value={maintenanceData.technician}
                    onChange={(e) => setMaintenanceData(prev => ({ ...prev, technician: e.target.value }))}
                    placeholder="เช่น IT Support, ช่าง Dell"
                    className="input-base text-xs py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ค่าใช้จ่าย (บาท)</label>
                  <input
                    type="number"
                    value={maintenanceData.cost}
                    onChange={(e) => setMaintenanceData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="เช่น 1500"
                    className="input-base text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ปรับสถานะเครื่อง</label>
                <select
                  value={maintenanceData.set_status}
                  onChange={(e) => setMaintenanceData(prev => ({ ...prev, set_status: e.target.value }))}
                  className="input-base text-xs py-2 bg-white"
                >
                  <option value="Maintenance">ส่งซ่อมบำรุง (Maintenance)</option>
                  <option value="Available">ซ่อมเสร็จแล้ว ส่งกลับเข้าคลัง (Available)</option>
                  <option value="In Use">ซ่อมเสร็จแล้ว ส่งคืนผู้ใช้เดิม (In Use)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                >
                  บันทึกประวัติซ่อม
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
