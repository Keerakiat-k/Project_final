import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import TextareaField from '../ui/TextareaField';
import { HeartPulse, Users, Home, FileText } from 'lucide-react';

export default function OthersReferencesForm({ formData, handleChange, isLoading }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================== */}
      {/* 1. ข้อมูลสุขภาพและประวัติการสมัคร (Health & Application) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <HeartPulse size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ข้อมูลสุขภาพและประวัติการสมัคร</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
            <SelectField label="เคยป่วยหนักหรือเป็นโรคติดต่อร้ายแรงหรือไม่?" name="severeIllness" value={formData.severeIllness} onChange={handleChange} disabled={isLoading}
              options={[{ value: 'ไม่เคย', label: 'ไม่เคย' }, { value: 'เคย', label: 'เคย (โปรดระบุ)' }]} 
            />
            <InputField label="ระบุชื่อโรค (ถ้ามี)" name="illnessDetail" value={formData.illnessDetail} onChange={handleChange} disabled={isLoading || formData.severeIllness !== 'เคย'} />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
            <SelectField label="เคยสมัครงานกับบริษัทฯ นี้มาก่อนหรือไม่?" name="prevApplied" value={formData.prevApplied} onChange={handleChange} disabled={isLoading}
              options={[{ value: 'ไม่เคย', label: 'ไม่เคย' }, { value: 'เคย', label: 'เคย (โปรดระบุ)' }]} 
            />
            <InputField label="ระบุช่วงเวลาที่เคยสมัคร (ถ้ามี)" name="prevAppliedWhen" value={formData.prevAppliedWhen} onChange={handleChange} disabled={isLoading || formData.prevApplied !== 'เคย'} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="ทราบข่าวการรับสมัครจาก (Sources of job info)" name="jobSource" value={formData.jobSource} onChange={handleChange} disabled={isLoading} placeholder="เช่น Facebook, JobThai, คนรู้จักแนะนำ" />
          <InputField label="เงินเดือนที่ต้องการ (Expected Salary)" type="number" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} required disabled={isLoading} placeholder="บาท/เดือน" />
        </div>
      </section>

      {/* ============================================== */}
      {/* 2. บุคคลอ้างอิงและคนรู้จัก (References & Acquaintances) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Users size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">บุคคลอ้างอิงและคนรู้จัก (References & Acquaintances)</h3>
        </div>

        <div className="mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-semibold text-blue-800 mb-4">ชื่อญาติ / เพื่อน ที่ทำงานอยู่ในบริษัทฯ (ถ้ามี)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="ชื่อ-นามสกุล" name="friendInCompany" value={formData.friendInCompany} onChange={handleChange} disabled={isLoading} />
            <InputField label="ความเกี่ยวข้อง" name="friendRelation" value={formData.friendRelation} onChange={handleChange} disabled={isLoading} />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-700 mb-4">บุคคลอ้างอิง 2 ท่าน (ญาติ หรือนายจ้างเดิม ที่รู้จักคุ้นเคย)</h4>
        
        {/* Reference 1 */}
        <div className="p-4 border border-gray-200 rounded-lg mb-4">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">บุคคลอ้างอิงท่านที่ 1</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InputField label="ชื่อ-นามสกุล" name="ref1Name" value={formData.ref1Name} onChange={handleChange} disabled={isLoading} />
            <InputField label="อาชีพ" name="ref1Occupation" value={formData.ref1Occupation} onChange={handleChange} disabled={isLoading} />
            <InputField label="เกี่ยวข้องเป็น" name="ref1Relation" value={formData.ref1Relation} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="ที่อยู่" name="ref1Address" value={formData.ref1Address} onChange={handleChange} disabled={isLoading} />
            <InputField label="เบอร์โทรศัพท์" name="ref1Phone" value={formData.ref1Phone} onChange={handleChange} disabled={isLoading} />
          </div>
        </div>

        {/* Reference 2 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">บุคคลอ้างอิงท่านที่ 2</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InputField label="ชื่อ-นามสกุล" name="ref2Name" value={formData.ref2Name} onChange={handleChange} disabled={isLoading} />
            <InputField label="อาชีพ" name="ref2Occupation" value={formData.ref2Occupation} onChange={handleChange} disabled={isLoading} />
            <InputField label="เกี่ยวข้องเป็น" name="ref2Relation" value={formData.ref2Relation} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="ที่อยู่" name="ref2Address" value={formData.ref2Address} onChange={handleChange} disabled={isLoading} />
            <InputField label="เบอร์โทรศัพท์" name="ref2Phone" value={formData.ref2Phone} onChange={handleChange} disabled={isLoading} />
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* 3. ข้อมูลที่พักอาศัย (Accommodation Details) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Home size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ลักษณะที่พักอาศัย (Accommodation)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SelectField label="ลักษณะบ้านที่อยู่ปัจจุบัน" name="houseType" value={formData.houseType} onChange={handleChange} disabled={isLoading}
            options={[
              { value: 'บ้านตนเอง', label: 'บ้านตนเอง' },
              { value: 'บ้านเช่า/หอพัก', label: 'บ้านเช่า / หอพัก' },
              { value: 'บ้านบิดามารดา', label: 'บ้านของบิดา-มารดา' },
              { value: 'บ้านญาติ/เพื่อน', label: 'บ้านของญาติ / เพื่อน' }
            ]}
          />
          <SelectField label="การโยกย้ายบ้านในวันข้างหน้า" name="relocationPlan" value={formData.relocationPlan} onChange={handleChange} disabled={isLoading}
            options={[
              { value: 'ไม่โยกย้ายแน่ๆ', label: 'ไม่โยกย้ายแน่ๆ' },
              { value: 'ยังไม่แน่จะไปอยู่ที่', label: 'ยังไม่แน่จะไปอยู่ที่ (โปรดระบุ)' },
              { value: 'จะย้ายแน่ๆ ไปอยู่ที่', label: 'จะย้ายแน่ๆ ไปอยู่ที่ (โปรดระบุ)' }
            ]}
          />
        </div>
        <div className="grid grid-cols-1">
          <InputField label="ระบุสถานที่ หากมีการโยกย้าย" name="relocationDetail" value={formData.relocationDetail} onChange={handleChange} disabled={isLoading || formData.relocationPlan === 'ไม่โยกย้ายแน่ๆ' || formData.relocationPlan === ''} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 4. ข้อมูลเพิ่มเติม (Additional Information) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <FileText size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">แนะนำตัวเพิ่มเติม (Self Introduction)</h3>
        </div>
        
        <TextareaField
          label="กรุณาแนะนำตัวท่านเอง เพื่อให้บริษัทรู้จักตัวท่านดีขึ้น"
          name="selfIntroduction"
          value={formData.selfIntroduction}
          onChange={handleChange}
          rows={4}
          disabled={isLoading}
          placeholder="พิมพ์ข้อความแนะนำตัว..."
        />
      </section>

    </div>
  );
}