import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, User, Save, Building, Hash, 
  Briefcase, Mail, Camera, Phone, Edit, RefreshCw
} from 'lucide-react';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import SearchableSelectField from '../components/ui/SearchableSelectField';
import Swal from 'sweetalert2';
import { generateEmail } from '../utils/companyEmailConfig';
import { getApiBase } from '../config/api';

export default function EditEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([
    { value: '1', label: 'Admin (ผู้ดูแลระบบ)' },
    { value: '2', label: 'IT Support (เจ้าหน้าที่ไอที)' },
    { value: '3', label: 'Employee (พนักงานทั่วไป)' },
    { value: '4', label: 'HR (ฝ่ายบุคคล)' },
    { value: '5', label: 'Manager (หัวหน้างาน)' }
  ]);

  const [formData, setFormData] = useState({
    id: '',
    companyPrefix: '',
    employeeCode: '',
    email: '',
    position: '',
    departmentName: '',
    roleId: '3',
    startDate: '',
    status: 'Active',

    titleThai: 'นาย',
    firstName: '',
    lastName: '',
    englishFirstName: '',
    englishLastName: '',
    nickname: '',
    mobile: ''
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 1. ดึงข้อมูลผู้ใช้งานที่ต้องการแก้ไข
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const baseUrl = getApiBase();
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const fetchUserData = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`${baseUrl}/api/employees/${id}`, { headers: authHeaders });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          const emp = result.data;
          setFormData({
            id: emp.id,
            companyPrefix: emp.company_prefix || '',
            employeeCode: emp.employee_code || '',
            email: emp.email || '',
            position: emp.position || '',
            departmentName: emp.department_name || '',
            roleId: String(emp.role_id || 3),
            startDate: emp.start_date ? emp.start_date.split('T')[0] : '',
            status: emp.status || 'Active',

            titleThai: emp.title_th || 'นาย',
            firstName: emp.first_name_th || '',
            lastName: emp.last_name_th || '',
            englishFirstName: emp.first_name_en || '',
            englishLastName: emp.last_name_en || '',
            nickname: emp.nickname || '',
            mobile: emp.mobile || emp.phone || ''
          });

          if (emp.profile_image) {
            setProfileImagePreview(`${baseUrl}${emp.profile_image}`);
          }
        } else {
          Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลผู้ใช้งาน', 'error');
          navigate('/employee-list');
        }
      } catch (err) {
        console.error('Fetch User Error:', err);
        Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
      } finally {
        setIsFetching(false);
      }
    };

    const fetchMasterData = async () => {
      try {
        const compRes = await fetch(`${baseUrl}/api/companies`, { headers: authHeaders });
        const compData = await compRes.json();
        if (compRes.ok && compData.status === 'success') {
          setCompanyOptions(compData.data.map(c => ({ value: c.prefix, label: c.name })));
        }

        const deptRes = await fetch(`${baseUrl}/api/employees/departments`, { headers: authHeaders });
        const deptData = await deptRes.json();
        if (deptRes.ok && deptData.status === 'success') {
          setDepartments(deptData.data.map(d => d.name));
        }

        const posRes = await fetch(`${baseUrl}/api/settings/positions`, { headers: authHeaders });
        const posData = await posRes.json();
        if (posRes.ok && posData.status === 'success') {
          setPositions(posData.data.map(p => p.title));
        }
      } catch (err) {
        console.error('Fetch Master Error:', err);
      }
    };

    fetchUserData();
    fetchMasterData();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      Swal.fire('ประเภทไฟล์ไม่ถูกต้อง', 'กรุณาอัปโหลดไฟล์รูปภาพ (JPEG, PNG, WEBP) เท่านั้น', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('ขนาดไฟล์ใหญ่เกินไป', 'ขนาดรูปภาพต้องไม่เกิน 5MB', 'warning');
      return;
    }

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const baseUrl = getApiBase();
      const response = await fetch(`${baseUrl}/api/employees/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        if (profileImageFile) {
          try {
            const imgFormData = new FormData();
            imgFormData.append('profile_image', profileImageFile);

            await fetch(`${baseUrl}/api/employees/${id}/profile-image`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: imgFormData
            });
          } catch (imgErr) {
            console.error('Error uploading profile image:', imgErr);
          }
        }

        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/employee-list');
        });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการปรับปรุงข้อมูล');
      }
    } catch (err) {
      console.error('Update User Error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12">
        <RefreshCw size={36} className="animate-spin text-[#f89919] mx-auto mb-3" />
        <p className="text-slate-600 font-semibold text-sm">กำลังโหลดข้อมูลผู้ใช้งานระบบ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/employee-list')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm mb-2"
          >
            <ArrowLeft size={16} /> ย้อนกลับไปยังรายการผู้ใช้งาน
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit className="text-[#f89919]" />
            แก้ไขข้อมูลผู้ใช้งานระบบ (Edit System User)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">อัปเดตข้อมูลผู้ใช้งานและสิทธิ์ระบบของ {formData.firstName} {formData.lastName}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Company Affiliation, Position & Details */}
        <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#364356] pb-3">
            <Building size={18} className="text-[#f89919]" />
            <span>1. ข้อมูลบริษัทสังกัด และตำแหน่งงาน</span>
          </div>

          {/* Row 1: Company, Code, Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">บริษัทสังกัด</label>
              <select
                name="companyPrefix"
                value={formData.companyPrefix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-[#364356] rounded-xl outline-none text-sm bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100 font-bold"
              >
                {companyOptions.map(c => (
                  <option key={c.value} value={c.value} className="dark:bg-[#1c232f]">{c.label}</option>
                ))}
              </select>
            </div>

            <InputField
              label="รหัสผู้ใช้งาน (User Code)"
              name="employeeCode"
              value={formData.employeeCode}
              onChange={handleChange}
              readOnly
              icon={Hash}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่เริ่มงาน / เปิดใช้บัญชี</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm bg-white"
              />
            </div>
          </div>

          {/* Row 2: Department & Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <SearchableSelectField
              label="แผนกสังกัด"
              name="departmentName"
              options={departments.map(d => ({ value: d, label: d }))}
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="เลือกหรือพิมพ์ชื่อแผนก..."
              allowCustom
            />

            <SearchableSelectField
              label="ตำแหน่งงาน"
              name="position"
              options={positions.map(p => ({ value: p, label: p }))}
              value={formData.position}
              onChange={handleChange}
              placeholder="เลือกหรือพิมพ์ชื่อตำแหน่ง..."
              allowCustom
            />
          </div>

          {/* Row 3: Email & Account Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <InputField
              label="อีเมลองค์กร (Company Email)"
              name="email"
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">สถานะบัญชี</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-slate-300 dark:border-[#364356] rounded-xl outline-none text-sm bg-white dark:bg-[#1c232f] font-bold ${
                  formData.status === 'Active' 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : formData.status === 'Resigned'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <option value="Active" className="dark:bg-[#1c232f]">เปิดใช้งาน (Active)</option>
                <option value="Resigned" className="dark:bg-[#1c232f]">พ้นสภาพพนักงาน (Resigned)</option>
                <option value="Inactive" className="dark:bg-[#1c232f]">ปิดใช้งานชั่วคราว (Inactive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: User Profile & Contact Info */}
        <div className="bg-white dark:bg-[#262f3f] p-6 rounded-2xl border border-slate-200 dark:border-[#364356] shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-[#364356] pb-3">
            <User size={18} className="text-[#f89919]" />
            <span>2. ข้อมูลผู้ใช้งาน และช่องทางติดต่อ</span>
          </div>

          {/* Profile Avatar Upload */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#1c232f] p-4 rounded-xl border border-slate-200 dark:border-[#364356]">
            <div className="relative">
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#f89919]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
                  <User size={28} />
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-1.5 bg-[#f89919] text-white rounded-full cursor-pointer shadow-sm hover:bg-[#d97c08] transition-colors">
                <Camera size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">รูปภาพโปรไฟล์ผู้ใช้งาน</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">รองรับไฟล์ PNG, JPG (ขนาดไม่เกิน 5MB)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">คำนำหน้า</label>
              <select
                name="titleThai"
                value={formData.titleThai}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-[#364356] rounded-xl outline-none text-sm bg-white dark:bg-[#1c232f] text-slate-900 dark:text-slate-100"
              >
                <option value="นาย" className="dark:bg-[#1c232f]">นาย</option>
                <option value="นาง" className="dark:bg-[#1c232f]">นาง</option>
                <option value="นางสาว" className="dark:bg-[#1c232f]">นางสาว</option>
              </select>
            </div>

            <InputField
              label="ชื่อจริง (ภาษาไทย) *"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <InputField
              label="นามสกุล (ภาษาไทย) *"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <InputField
              label="ชื่อเล่น"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="First Name (Eng)"
              name="englishFirstName"
              value={formData.englishFirstName}
              onChange={handleChange}
            />

            <InputField
              label="Last Name (Eng)"
              name="englishLastName"
              value={formData.englishLastName}
              onChange={handleChange}
            />

            <InputField
              label="เบอร์โทรศัพท์ / ต่อภายใน"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              icon={Phone}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/employee-list')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-semibold"
          >
            ยกเลิก
          </button>

          <Button
            type="submit"
            isLoading={isLoading}
            className="bg-[#f89919] hover:bg-[#d97c08] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#f89919]/20 text-sm font-bold"
          >
            <Save size={18} />
            <span>บันทึกการแก้ไข</span>
          </Button>
        </div>

      </form>
    </div>
  );
}