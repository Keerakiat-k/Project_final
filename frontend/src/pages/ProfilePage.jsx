import { useState, useEffect } from 'react';
import { User, Briefcase, Phone, HeartPulse, Building, MapPin, ShieldAlert, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (!userInfo || !userInfo.id) {
          throw new Error('ไม่พบข้อมูลผู้ใช้งาน');
        }

        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/employees/${userInfo.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลส่วนตัวได้');
        }

        const data = await res.json();
        setProfile(data.data);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'ผิดพลาด',
          text: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
          confirmButtonColor: '#4f46e5'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f89919]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-slate-800">ไม่พบข้อมูลส่วนตัว</h2>
        <p className="text-slate-500 mt-2">กรุณาติดต่อฝ่ายบุคคล (HR)</p>
      </div>
    );
  }

  const SectionTitle = ({ icon: Icon, title }) => (
    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-[#364356] pb-2">
      <Icon size={20} className="text-[#f89919]" />
      {title}
    </h3>
  );

  const InfoRow = ({ label, value }) => (
    <div className="mb-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#1c232f] px-4 py-2 rounded-xl border border-slate-200 dark:border-[#364356] min-h-[40px] flex items-center">
        {value || '-'}
      </p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">โปรไฟล์ของฉัน</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">ข้อมูลส่วนบุคคลและข้อมูลการทำงาน</p>
        </div>
        <button 
          onClick={() => {
            Swal.fire({
              icon: 'info',
              title: 'แจ้งขอแก้ไขข้อมูล',
              text: 'หากต้องการแก้ไขข้อมูลส่วนตัว กรุณาติดต่อฝ่ายทรัพยากรบุคคล (HR)',
              confirmButtonText: 'รับทราบ',
              confirmButtonColor: '#f89919'
            });
          }}
          className="bg-orange-50 dark:bg-amber-950/30 hover:bg-orange-100 dark:hover:bg-amber-950/50 text-[#f89919] px-4 py-2 rounded-xl font-medium transition-colors border border-orange-200 dark:border-amber-800/60"
        >
          ขอแก้ไขข้อมูล
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้าย: ข้อมูลพื้นฐานแบบการ์ด */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm text-center">
            <div className="w-24 h-24 bg-orange-50 dark:bg-amber-950/40 text-[#f89919] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border-2 border-orange-200 dark:border-amber-900/60">
              {profile.first_name_th ? profile.first_name_th.charAt(0) : 'U'}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {profile.title_th}{profile.first_name_th} {profile.last_name_th}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {profile.first_name_en} {profile.last_name_en}
            </p>
            <div className="inline-block bg-orange-50 dark:bg-amber-950/30 text-[#f89919] px-3 py-1 rounded-full text-sm font-semibold border border-orange-200 dark:border-amber-900/40">
              {profile.employee_code}
            </div>
          </div>

          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm">
            <SectionTitle icon={Briefcase} title="ข้อมูลการทำงานเบื้องต้น" />
            <InfoRow label="บริษัท" value={profile.company_prefix} />
            <InfoRow label="แผนก" value={profile.department_name} />
            <InfoRow label="ตำแหน่ง" value={profile.position} />
            <InfoRow label="วันที่เริ่มงาน" value={profile.start_date ? new Date(profile.start_date).toLocaleDateString('th-TH') : '-'} />
            <InfoRow label="สถานะพนักงาน" value={profile.status === 'Active' ? 'ทำงานปกติ' : profile.status} />
          </div>
        </div>

        {/* คอลัมน์ขวา: ข้อมูลส่วนตัวอื่นๆ */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm">
            <SectionTitle icon={User} title="ข้อมูลส่วนบุคคล" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="ชื่อเล่น" value={profile.nickname} />
              <InfoRow label="เพศ" value={profile.gender} />
              <InfoRow label="วัน/เดือน/ปีเกิด" value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('th-TH') : '-'} />
              <InfoRow label="สัญชาติ" value={profile.nationality} />
              <InfoRow label="ศาสนา" value={profile.religion} />
              <InfoRow label="สถานภาพ" value={profile.marital_status} />
              <InfoRow label="กรุ๊ปเลือด" value={profile.blood_group} />
              <InfoRow label="สถานะทางทหาร" value={profile.military_status} />
              <div className="md:col-span-2">
                <InfoRow label="เลขบัตรประจำตัวประชาชน" value={profile.id_card_number} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm">
            <SectionTitle icon={Phone} title="ข้อมูลการติดต่อ" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="เบอร์โทรศัพท์" value={profile.phone_number} />
              <div className="md:col-span-2">
                <InfoRow label="ที่อยู่ปัจจุบัน" value={profile.address} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm">
            <SectionTitle icon={HeartPulse} title="บุคคลติดต่อฉุกเฉิน" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="ชื่อ-นามสกุล" value={profile.emergency_contact_name} />
              <InfoRow label="ความสัมพันธ์" value={profile.emergency_contact_relation} />
              <div className="md:col-span-2">
                <InfoRow label="เบอร์โทรศัพท์" value={profile.emergency_contact_phone} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#262f3f] rounded-2xl p-6 border border-slate-200 dark:border-[#364356] shadow-sm">
            <SectionTitle icon={CreditCard} title="ข้อมูลธนาคารและภาษี" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="ชื่อธนาคาร" value={profile.bank_name} />
              <InfoRow label="เลขบัญชีธนาคาร" value={profile.bank_account_number} />
              <InfoRow label="เลขประกันสังคม" value={profile.social_security_number} />
              <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={profile.tax_id} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
