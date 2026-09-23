import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Megaphone, Image as ImageIcon, ShieldCheck, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function EditAnnouncementPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'ทั่วไป',
    content: '',
    status: 'Active'
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [announcementTypes, setAnnouncementTypes] = useState([]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/${id}`);
        const result = await response.json();
        if (response.ok && result.status === 'success') {
          const data = result.data;
          setFormData({
            title: data.title || '',
            type: data.type || 'ทั่วไป',
            content: data.content || '',
            status: data.status || 'Active'
          });
          if (data.cover_image) {
            setImagePreview(`${import.meta.env.VITE_API_BASE_URL}/uploads/announcements/${data.cover_image}`);
          }
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      }
    };

    const fetchAnnouncementTypes = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/announcement-types');
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          const activeTypes = data.data.filter(t => t.status === 'Active');
          setAnnouncementTypes(activeTypes);
        }
      } catch (error) {
        console.error('Error fetching announcement types:', error);
      }
    };

    fetchAnnouncement();
    fetchAnnouncementTypes();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('ขนาดไฟล์เกิน', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
        e.target.value = null;
        return;
      }
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อและเนื้อหาประกาศ', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('content', formData.content);
      submitData.append('status', formData.status);
      if (coverImage) {
        submitData.append('coverImage', coverImage);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });
      
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'อัปเดตประกาศเรียบร้อยแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/admin/announcements'); 
        });
      } else {
        throw new Error(result.message || 'ไม่สามารถอัปเดตได้');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('ผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/admin/announcements')} 
            className="p-2 hover:bg-white rounded-xl border border-slate-200 transition-colors text-slate-600 shadow-sm"
            title="กลับไปหน้ารายการประกาศ"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <div style={{ width: 36, height: 36, background: '#fff7ed', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={18} style={{ color: '#f89919' }} />
              </div>
              แก้ไขประกาศ & นโยบาย
            </h1>
            <p className="page-subtitle mt-0.5 text-slate-500 dark:text-slate-400 text-sm">แก้ไขรายละเอียด รูปภาพ หรือเปลี่ยนประเภทของประกาศ</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-[#e9ebee] dark:border-[#364356] shadow-xs overflow-hidden transition-colors">
          <form onSubmit={handleSubmit} className="p-7 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cover Image */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">ภาพหน้าปก (Cover Image)</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-[#364356] rounded-2xl p-6 text-center bg-slate-50 dark:bg-[#1c232f] hover:bg-amber-50/30 dark:hover:bg-[#2e394b]/30 transition-colors">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl shadow-sm border border-slate-200 dark:border-[#364356]" />
                      <button 
                        type="button"
                        onClick={() => { setCoverImage(null); setImagePreview(null); }}
                        className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }} className="bg-[#fff7ed] dark:bg-amber-950/40">
                        <ImageIcon size={24} style={{ color: '#f89919' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f89919' }}>คลิกเพื่ออัปโหลดรูปภาพ</span>
                      <span className="text-slate-400 text-xs mt-1">รองรับ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)</span>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  หัวข้อประกาศ / นโยบาย <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="เช่น นโยบายความปลอดภัยข้อมูล หรือ เชิญร่วมกิจกรรม..." 
                  className="input-base w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f89919]/40"
                  required
                />
              </div>

              {/* Type */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ประเภทประกาศ / หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-base w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f89919]/40 cursor-pointer"
                >
                  {announcementTypes.map(t => (
                    <option key={t.id} value={t.name} className="dark:bg-[#1c232f]">{t.name}</option>
                  ))}
                  {announcementTypes.length === 0 && (
                    <option value={formData.type} className="dark:bg-[#1c232f]">{formData.type || 'ทั่วไป'}</option>
                  )}
                </select>
              </div>

              {/* Content */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  รายละเอียดเนื้อหา <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  placeholder="รายละเอียดข้อความ หรือระเบียบปฏิบัติต่างๆ..."
                  className="input-base w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#364356] bg-slate-50 dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f89919]/40 resize-y"
                  style={{ minHeight: 140 }}
                  required
                ></textarea>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">สถานะการแสดงผล</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={handleChange}
                      style={{ accentColor: '#f89919' }}
                    />
                    <span>เปิดแสดงผล (Active)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={handleChange}
                      style={{ accentColor: '#f89919' }}
                    />
                    <span>ซ่อน / ปิดใช้งาน (Inactive)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => navigate('/admin/announcements')}
                className="btn-ghost"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
