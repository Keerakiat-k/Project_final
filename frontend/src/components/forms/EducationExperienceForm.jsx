import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import TextareaField from '../ui/TextareaField';
import Button from '../ui/Button';
import { GraduationCap, Briefcase, Plus, Trash2 } from 'lucide-react';

export default function EducationExperienceForm({ formData, setFormData, isLoading }) {
  
  // ==========================================
  // Logic สำหรับจัดการประวัติการศึกษา (Array)
  // ==========================================
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [
        ...prev.educations, 
        { level: '', institution: '', major: '', startDate: '', endDate: '', gpa: '' }
      ]
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const newEducations = [...prev.educations];
      newEducations[index][field] = value;
      return { ...prev, educations: newEducations };
    });
  };

  // ==========================================
  // Logic สำหรับจัดการประสบการณ์ทำงาน (Array)
  // ==========================================
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [
        ...prev.experiences, 
        { company: '', businessType: '', startPosition: '', endPosition: '', startSalary: '', endSalary: '', startDate: '', endDate: '', description: '', reasonToLeave: '' }
      ]
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const newExperiences = [...prev.experiences];
      newExperiences[index][field] = value;
      return { ...prev, experiences: newExperiences };
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================== */}
      {/* 1. ประวัติการศึกษา (Education Background) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">ประวัติการศึกษา (Education Background)</h3>
          </div>
          <Button type="button" onClick={addEducation} disabled={isLoading} className="!w-auto !py-1.5 !px-3 text-sm flex items-center gap-1">
            <Plus size={16} /> เพิ่มวุฒิการศึกษา
          </Button>
        </div>

        {formData.educations?.length === 0 && (
          <p className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">ไม่มีข้อมูลการศึกษา กรุณากดปุ่มเพิ่มวุฒิการศึกษา</p>
        )}

        <div className="space-y-6">
          {formData.educations?.map((edu, index) => (
            <div key={index} className="p-6 bg-gray-50/50 border border-gray-200 rounded-xl relative">
              
              <button type="button" onClick={() => removeEducation(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-md transition-colors" title="ลบข้อมูลนี้">
                <Trash2 size={18} />
              </button>
              
              <h4 className="text-sm font-semibold text-gray-700 mb-4">ข้อมูลการศึกษาลำดับที่ {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <SelectField label="ระดับการศึกษา" name={`edu-level-${index}`} value={edu.level} onChange={(e) => handleEducationChange(index, 'level', e.target.value)} disabled={isLoading}
                  options={[
                    { value: 'มัธยมศึกษาตอนปลาย', label: 'มัธยมศึกษาตอนปลาย (High School)' },
                    { value: 'ปวช.', label: 'ปวช. (Vocational)' },
                    { value: 'ปวส./ปวท.', label: 'ปวส./ปวท. (Diploma)' },
                    { value: 'ปริญญาตรี', label: 'ปริญญาตรี (Bachelor)' },
                    { value: 'ปริญญาโท', label: 'ปริญญาโท (Master)' },
                    { value: 'ปริญญาเอก', label: 'ปริญญาเอก (Ph.D.)' },
                  ]}
                />
                <InputField label="สถาบันการศึกษา" name={`edu-inst-${index}`} value={edu.institution} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} disabled={isLoading} />
                <InputField label="คณะ/สาขาวิชา" name={`edu-major-${index}`} value={edu.major} onChange={(e) => handleEducationChange(index, 'major', e.target.value)} disabled={isLoading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="ปีที่เริ่มศึกษา (ด/ว/ป)" type="date" name={`edu-start-${index}`} value={edu.startDate} onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)} disabled={isLoading} />
                <InputField label="ปีที่สำเร็จศึกษา (ด/ว/ป)" type="date" name={`edu-end-${index}`} value={edu.endDate} onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)} disabled={isLoading} />
                <InputField label="เกรดเฉลี่ย (GPA)" type="number" step="0.01" name={`edu-gpa-${index}`} value={edu.gpa} onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)} disabled={isLoading} placeholder="เช่น 3.50" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================== */}
      {/* 2. ประวัติการทำงาน (Working Experience) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">ประวัติการทำงาน (Working Experience)</h3>
          </div>
          <Button type="button" onClick={addExperience} disabled={isLoading} className="!w-auto !py-1.5 !px-3 text-sm flex items-center gap-1 bg-green-600 hover:bg-green-700 focus:ring-green-500">
            <Plus size={16} /> เพิ่มประวัติการทำงาน
          </Button>
        </div>

        {formData.experiences?.length === 0 && (
          <p className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">ไม่มีประวัติการทำงาน (เด็กจบใหม่) หรือ กรุณากดปุ่มเพื่อเพิ่มข้อมูล</p>
        )}

        <div className="space-y-6">
          {formData.experiences?.map((exp, index) => (
            <div key={index} className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl relative">
              
              <button type="button" onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-md transition-colors" title="ลบข้อมูลนี้">
                <Trash2 size={18} />
              </button>
              
              <h4 className="text-sm font-semibold text-gray-700 mb-4">ประสบการณ์ทำงานลำดับที่ {index + 1} (ล่าสุด)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <TextareaField label="ชื่อ-ที่อยู่สถานที่ทำงาน (Company Name & Address)" name={`exp-company-${index}`} value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} rows={2} disabled={isLoading} />
                <InputField label="ประเภทธุรกิจ (Type of Business)" name={`exp-business-${index}`} value={exp.businessType} onChange={(e) => handleExperienceChange(index, 'businessType', e.target.value)} disabled={isLoading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                <InputField label="วันที่เริ่มงาน" type="date" name={`exp-start-${index}`} value={exp.startDate} onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)} disabled={isLoading} />
                <InputField label="ถึงวันที่ (ลาออก)" type="date" name={`exp-end-${index}`} value={exp.endDate} onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)} disabled={isLoading} />
                <InputField label="ตำแหน่งเริ่มต้น" name={`exp-startpos-${index}`} value={exp.startPosition} onChange={(e) => handleExperienceChange(index, 'startPosition', e.target.value)} disabled={isLoading} />
                <InputField label="ตำแหน่งสุดท้าย" name={`exp-endpos-${index}`} value={exp.endPosition} onChange={(e) => handleExperienceChange(index, 'endPosition', e.target.value)} disabled={isLoading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <InputField label="เงินเดือนเริ่มต้น (บาท)" type="number" name={`exp-startsal-${index}`} value={exp.startSalary} onChange={(e) => handleExperienceChange(index, 'startSalary', e.target.value)} disabled={isLoading} />
                <InputField label="เงินเดือนสุดท้าย (บาท)" type="number" name={`exp-endsal-${index}`} value={exp.endSalary} onChange={(e) => handleExperienceChange(index, 'endSalary', e.target.value)} disabled={isLoading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextareaField label="ลักษณะงาน (Job Description)" name={`exp-desc-${index}`} value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} rows={2} disabled={isLoading} />
                <TextareaField label="สาเหตุที่ลาออก (Reason of Resignation)" name={`exp-reason-${index}`} value={exp.reasonToLeave} onChange={(e) => handleExperienceChange(index, 'reasonToLeave', e.target.value)} rows={2} disabled={isLoading} />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}