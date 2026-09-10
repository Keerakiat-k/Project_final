import { useEffect, useState } from 'react';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import TextareaField from '../ui/TextareaField';
import { 
  User, Briefcase, Building, Hash, Mail, 
  ShieldCheck, CreditCard, Phone, MapPin, Heart 
} from 'lucide-react';

export default function PersonalInfoForm({ formData, handleChange, isLoading }) {
  const [companyOptions, setCompanyOptions] = useState([]);

  useEffect(() => {
    // จำลองการดึงรายชื่อบริษัทจาก API
    const fetchCompanies = async () => {
      try {
        const mockDataFromDB = [
          { value: 'CORP', label: 'CorpHub Group Co., Ltd.' },
          { value: 'TECH', label: 'CorpHub Technology Co., Ltd.' },
          { value: 'INNO', label: 'CorpHub Innovation Co., Ltd.' }
        ];
        setCompanyOptions(mockDataFromDB);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  // ฟังก์ชันคำนวณอายุแบบ Real-time
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================== */}
      {/* 1. ข้อมูลส่วนบุคคลพื้นฐาน (Personal Information) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <User size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ข้อมูลส่วนบุคคล (Personal Information)</h3>
        </div>
        
        {/* ชื่อ-นามสกุล ภาษาไทย */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SelectField
            label="คำนำหน้า (TH)" name="titleThai" value={formData.titleThai} onChange={handleChange} disabled={isLoading}
            options={[{ value: 'นาย', label: 'นาย' }, { value: 'นาง', label: 'นาง' }, { value: 'นางสาว', label: 'นางสาว' }]}
            required
          />
          <InputField label="ชื่อจริง (TH)" name="firstName" value={formData.firstName} onChange={handleChange} required disabled={isLoading} />
          <InputField label="นามสกุล (TH)" name="lastName" value={formData.lastName} onChange={handleChange} required disabled={isLoading} />
        </div>

        {/* ชื่อ-นามสกุล ภาษาอังกฤษ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SelectField
            label="คำนำหน้า (EN)" name="titleEnglish" value={formData.titleEnglish} onChange={handleChange} disabled={isLoading}
            options={[{ value: 'Mr.', label: 'Mr.' }, { value: 'Mrs.', label: 'Mrs.' }, { value: 'Ms.', label: 'Ms.' }]}
          />
          <InputField label="ชื่อจริง (EN)" name="englishFirstName" value={formData.englishFirstName} onChange={handleChange} disabled={isLoading} />
          <InputField label="นามสกุล (EN)" name="englishLastName" value={formData.englishLastName} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* วันเกิดและบัตรประชาชน */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <InputField label="ชื่อเล่น" name="nickname" value={formData.nickname} onChange={handleChange} disabled={isLoading} />
          <InputField label="วันเกิด (ด/ว/ป)" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required disabled={isLoading} />
          <InputField label="อายุ (ปี)" name="age" value={calculateAge(formData.dateOfBirth)} onChange={() => {}} disabled={true} />
          <InputField label="เลขประจำตัวประชาชน" name="nationalId" icon={CreditCard} value={formData.nationalId} onChange={handleChange} required disabled={isLoading} />
        </div>

        {/* ข้อมูลทางกายภาพและสถานภาพ (จากใบสมัคร) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-6">
          <InputField label="ส่วนสูง (ซม.)" type="number" name="height" value={formData.height} onChange={handleChange} disabled={isLoading} />
          <InputField label="น้ำหนัก (กก.)" type="number" name="weight" value={formData.weight} onChange={handleChange} disabled={isLoading} />
          <SelectField label="กรุ๊ปเลือด" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} disabled={isLoading}
            options={[{value:'A',label:'A'}, {value:'B',label:'B'}, {value:'O',label:'O'}, {value:'AB',label:'AB'}]} 
          />
          <SelectField label="ศาสนา" name="religion" value={formData.religion} onChange={handleChange} disabled={isLoading}
            options={[{value:'พุทธ',label:'พุทธ'}, {value:'คริสต์',label:'คริสต์'}, {value:'อิสลาม',label:'อิสลาม'}, {value:'อื่นๆ',label:'อื่นๆ'}]} 
          />
          <SelectField label="สถานภาพ" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} disabled={isLoading}
            options={[{value:'โสด',label:'โสด'}, {value:'สมรส',label:'สมรส'}, {value:'หม้าย',label:'หม้าย'}, {value:'หย่าร้าง',label:'หย่าร้าง'}]} 
          />
          <SelectField label="เกณฑ์ทหาร" name="militaryStatus" value={formData.militaryStatus} onChange={handleChange} disabled={isLoading}
            options={[{value:'ผ่านเกณฑ์',label:'ผ่านเกณฑ์'}, {value:'ได้รับข้อยกเว้น',label:'ได้รับข้อยกเว้น'}, {value:'ยังไม่เกณฑ์',label:'ยังไม่เกณฑ์'}, {value:'หญิง (ได้รับการยกเว้น)',label:'หญิง (ได้รับการยกเว้น)'}]} 
          />
        </div>
      </section>

      {/* ============================================== */}
      {/* 2. ข้อมูลการติดต่อและที่อยู่ (Contact & Address) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Phone size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">การติดต่อและที่พักอาศัย (Contact & Address)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InputField label="เบอร์โทรศัพท์มือถือ" name="mobile" icon={Phone} value={formData.mobile} onChange={handleChange} required disabled={isLoading} />
          <InputField label="เบอร์โทรศัพท์บ้าน" name="homePhone" icon={Phone} value={formData.homePhone} onChange={handleChange} disabled={isLoading} />
          <InputField label="อีเมลส่วนตัว" type="email" name="personalEmail" icon={Mail} value={formData.personalEmail} onChange={handleChange} disabled={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextareaField
            label="ที่อยู่ตามทะเบียนบ้าน"
            name="homeAddress"
            value={formData.homeAddress}
            onChange={handleChange}
            placeholder="เลขที่ หมู่บ้าน ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
            required
            disabled={isLoading}
          />
          <TextareaField
            label="ที่อยู่ปัจจุบัน (ที่ติดต่อได้สะดวก)"
            name="currentAddress"
            value={formData.currentAddress}
            onChange={handleChange}
            placeholder="หากเหมือนที่อยู่ตามทะเบียนบ้าน สามารถเว้นว่างไว้ได้"
            disabled={isLoading}
          />
        </div>
      </section>

      

    </div>
  );
}