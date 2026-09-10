import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { Users, AlertTriangle, Heart } from 'lucide-react';

export default function FamilyInfoForm({ formData, handleChange, isLoading }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================== */}
      {/* 1. ข้อมูลบิดา-มารดา (Parents Information) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Users size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ข้อมูลบิดา-มารดา (Parents Information)</h3>
        </div>
        
        <div className="mb-6">
          <SelectField
            label="สถานภาพบิดามารดา" name="parentStatus" value={formData.parentStatus} onChange={handleChange} disabled={isLoading}
            options={[
              { value: 'อยู่ด้วยกัน', label: 'อยู่ด้วยกัน' },
              { value: 'หย่าร้าง', label: 'หย่าร้าง' },
              { value: 'บิดาถึงแก่กรรม', label: 'บิดาถึงแก่กรรม' },
              { value: 'มารดาถึงแก่กรรม', label: 'มารดาถึงแก่กรรม' },
              { value: 'ถึงแก่กรรมทั้งคู่', label: 'ถึงแก่กรรมทั้งคู่' }
            ]}
          />
        </div>

        {/* ข้อมูลบิดา */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2">
            <InputField label="ชื่อ-นามสกุล บิดา" name="fatherName" value={formData.fatherName} onChange={handleChange} disabled={isLoading} />
          </div>
          <InputField label="อายุ (ปี)" type="number" name="fatherAge" value={formData.fatherAge} onChange={handleChange} disabled={isLoading} />
          <InputField label="อาชีพ/ตำแหน่ง" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* ข้อมูลมารดา */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2">
            <InputField label="ชื่อ-นามสกุล มารดา" name="motherName" value={formData.motherName} onChange={handleChange} disabled={isLoading} />
          </div>
          <InputField label="อายุ (ปี)" type="number" name="motherAge" value={formData.motherAge} onChange={handleChange} disabled={isLoading} />
          <InputField label="อาชีพ/ตำแหน่ง" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* ข้อมูลพี่น้อง */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InputField label="จำนวนพี่น้องทั้งหมด (คน)" type="number" name="totalSiblings" value={formData.totalSiblings} onChange={handleChange} disabled={isLoading} />
          <InputField label="ชาย (คน)" type="number" name="maleSiblings" value={formData.maleSiblings} onChange={handleChange} disabled={isLoading} />
          <InputField label="หญิง (คน)" type="number" name="femaleSiblings" value={formData.femaleSiblings} onChange={handleChange} disabled={isLoading} />
          <InputField label="ผู้สมัครเป็นบุตรคนที่" type="number" name="siblingRank" value={formData.siblingRank} onChange={handleChange} disabled={isLoading} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 2. ข้อมูลคู่สมรสและบุตร (Spouse & Children) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Heart size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ข้อมูลคู่สมรสและบุตร (Spouse & Children)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InputField label="ชื่อ-นามสกุล คู่สมรส" name="spouseName" value={formData.spouseName} onChange={handleChange} disabled={isLoading} />
          <InputField label="สถานที่ทำงาน/ตำแหน่ง" name="spouseWorkplace" value={formData.spouseWorkplace} onChange={handleChange} disabled={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="จำนวนบุตรทั้งหมด (คน)" type="number" name="totalChildren" value={formData.totalChildren} onChange={handleChange} disabled={isLoading} />
          <InputField label="บุตรที่กำลังศึกษาอยู่ (คน)" type="number" name="studyingChildren" value={formData.studyingChildren} onChange={handleChange} disabled={isLoading} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 3. บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน (Emergency Contact) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <AlertTriangle size={20} className="text-red-500" />
          <h3 className="text-lg font-bold text-gray-900">บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน (Emergency Contact)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InputField label="ชื่อ-นามสกุล (Emergency Contact Name)" name="emergencyName" value={formData.emergencyName} onChange={handleChange} required disabled={isLoading} />
          <InputField label="ความสัมพันธ์ (Relationship)" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} required disabled={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="เบอร์โทรศัพท์ (Phone Number)" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} required disabled={isLoading} />
          <InputField label="สถานที่ทำงาน (Workplace)" name="emergencyWorkplace" value={formData.emergencyWorkplace} onChange={handleChange} disabled={isLoading} />
        </div>
      </section>

    </div>
  );
}