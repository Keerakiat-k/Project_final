import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import Button from '../ui/Button';
import { Star, Laptop, Car, Award, Plus, Trash2 } from 'lucide-react';

export default function SkillsAbilitiesForm({ formData, handleChange, setFormData, isLoading }) {
  
  // ==========================================
  // Logic สำหรับจัดการประวัติการฝึกอบรม (Array)
  // ==========================================
  const addTraining = () => {
    setFormData(prev => ({
      ...prev,
      trainings: [
        ...prev.trainings, 
        { course: '', institution: '', duration: '' }
      ]
    }));
  };

  const removeTraining = (index) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.filter((_, i) => i !== index)
    }));
  };

  const handleTrainingChange = (index, field, value) => {
    setFormData(prev => {
      const newTrainings = [...prev.trainings];
      newTrainings[index][field] = value;
      return { ...prev, trainings: newTrainings };
    });
  };

  const levelOptions = [
    { value: '', label: '-- เลือกระดับ --' },
    { value: 'ดี', label: 'ดี (Good)' },
    { value: 'ปานกลาง', label: 'ปานกลาง (Fair)' },
    { value: 'ไม่ได้', label: 'ไม่ได้ (Poor)' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================== */}
      {/* 1. ความสามารถทางภาษา (Language Ability) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Star size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ความสามารถทางภาษา (Language Ability)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">ภาษา (Language)</th>
                <th className="px-4 py-3 font-medium">การพูด (Speaking)</th>
                <th className="px-4 py-3 font-medium">การเขียน (Writing)</th>
                <th className="px-4 py-3 font-medium">การอ่าน (Reading)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* ภาษาไทย */}
              <tr>
                <td className="px-4 py-3 font-medium">ภาษาไทย (Thai)</td>
                <td className="px-4 py-3"><SelectField name="thaiSpeak" value={formData.thaiSpeak} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="thaiWrite" value={formData.thaiWrite} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="thaiRead" value={formData.thaiRead} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
              </tr>
              {/* ภาษาอังกฤษ */}
              <tr>
                <td className="px-4 py-3 font-medium">ภาษาอังกฤษ (English)</td>
                <td className="px-4 py-3"><SelectField name="engSpeak" value={formData.engSpeak} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="engWrite" value={formData.engWrite} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="engRead" value={formData.engRead} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
              </tr>
              {/* ภาษาอื่นๆ */}
              <tr>
                <td className="px-4 py-3">
                  <InputField placeholder="ระบุภาษาอื่นๆ" name="otherLangName" value={formData.otherLangName} onChange={handleChange} disabled={isLoading} />
                </td>
                <td className="px-4 py-3"><SelectField name="otherSpeak" value={formData.otherSpeak} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="otherWrite" value={formData.otherWrite} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
                <td className="px-4 py-3"><SelectField name="otherRead" value={formData.otherRead} onChange={handleChange} options={levelOptions} disabled={isLoading} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================== */}
      {/* 2. ทักษะคอมพิวเตอร์และสำนักงาน (Computer & Office) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Laptop size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">ทักษะคอมพิวเตอร์และสำนักงาน (Computer & Office Skills)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1"><InputField label="พิมพ์ดีดไทย (คำ/นาที)" type="number" name="typingThai" value={formData.typingThai} onChange={handleChange} disabled={isLoading} /></div>
            <div className="flex-1"><InputField label="พิมพ์ดีดอังกฤษ (คำ/นาที)" type="number" name="typingEng" value={formData.typingEng} onChange={handleChange} disabled={isLoading} /></div>
          </div>
          <InputField label="ความสามารถด้านคอมพิวเตอร์ (โปรแกรมที่ถนัด)" name="computerSkill" value={formData.computerSkill} onChange={handleChange} placeholder="เช่น MS Office, Photoshop, AutoCAD" disabled={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="การใช้เครื่องใช้สำนักงาน" name="officeMachine" value={formData.officeMachine} onChange={handleChange} placeholder="เช่น เครื่องถ่ายเอกสาร, เครื่องแฟกซ์" disabled={isLoading} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 3. การขับขี่ยานพาหนะ (Driving Ability) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <Car size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">การขับขี่ยานพาหนะ (Driving Ability)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <SelectField label="ขับรถยนต์" name="driveCar" value={formData.driveCar} onChange={handleChange} disabled={isLoading}
            options={[{ value: 'ได้', label: 'ได้' }, { value: 'ไม่ได้', label: 'ไม่ได้' }]} 
          />
          <InputField label="ใบขับขี่รถยนต์เลขที่" name="carLicense" value={formData.carLicense} onChange={handleChange} disabled={isLoading || formData.driveCar !== 'ได้'} />
          <InputField label="ทะเบียนรถยนต์ส่วนตัว" name="carReg" value={formData.carReg} onChange={handleChange} disabled={isLoading || formData.driveCar !== 'ได้'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <SelectField label="ขับรถจักรยานยนต์" name="driveMoto" value={formData.driveMoto} onChange={handleChange} disabled={isLoading}
            options={[{ value: 'ได้', label: 'ได้' }, { value: 'ไม่ได้', label: 'ไม่ได้' }]} 
          />
          <InputField label="ใบขับขี่รถจักรยานยนต์เลขที่" name="motoLicense" value={formData.motoLicense} onChange={handleChange} disabled={isLoading || formData.driveMoto !== 'ได้'} />
          <InputField label="ทะเบียนรถจักรยานยนต์ส่วนตัว" name="motoReg" value={formData.motoReg} onChange={handleChange} disabled={isLoading || formData.driveMoto !== 'ได้'} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 4. กีฬาและงานอดิเรก (Hobbies & Sports) */}
      {/* ============================================== */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="งานอดิเรก (Hobbies)" name="hobbies" value={formData.hobbies} onChange={handleChange} disabled={isLoading} />
          <InputField label="กีฬาที่ชอบ (Favourite Sport)" name="sports" value={formData.sports} onChange={handleChange} disabled={isLoading} />
        </div>
      </section>

      {/* ============================================== */}
      {/* 5. ประวัติการฝึกอบรม (Training History) */}
      {/* ============================================== */}
      <section>
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">ประวัติการฝึกอบรม (Training History)</h3>
          </div>
          <Button type="button" onClick={addTraining} disabled={isLoading} className="!w-auto !py-1.5 !px-3 text-sm flex items-center gap-1">
            <Plus size={16} /> เพิ่มประวัติการอบรม
          </Button>
        </div>

        {formData.trainings?.length === 0 && (
          <p className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">ไม่มีประวัติการฝึกอบรม หรือ กรุณากดปุ่มเพื่อเพิ่มข้อมูล</p>
        )}

        <div className="space-y-4">
          {formData.trainings?.map((training, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-white border border-gray-200 rounded-lg relative">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="หลักสูตร (Course)" name={`train-course-${index}`} value={training.course} onChange={(e) => handleTrainingChange(index, 'course', e.target.value)} disabled={isLoading} />
                <InputField label="สถาบันอบรม (Institution)" name={`train-inst-${index}`} value={training.institution} onChange={(e) => handleTrainingChange(index, 'institution', e.target.value)} disabled={isLoading} />
                <InputField label="ระยะเวลา (Duration)" name={`train-dur-${index}`} value={training.duration} onChange={(e) => handleTrainingChange(index, 'duration', e.target.value)} disabled={isLoading} />
              </div>
              <button type="button" onClick={() => removeTraining(index)} className="mt-7 text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-md transition-colors" title="ลบ">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}