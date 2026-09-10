import { useState, useEffect } from 'react';
import { Mail, Megaphone, Save, Info } from 'lucide-react';
import Swal from 'sweetalert2';

export default function EmailTemplatesPage() {
  const [activeTab, setActiveTab] = useState('it_announcement'); // 'it_announcement', 'hr_announcement' (welcome hidden for now)
  const [settings, setSettings] = useState({
    IT: null,
    HR: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/email');
      const data = await res.json();
      if (data.status === 'success') {
        setSettings({
          IT: data.data.IT || { type: 'IT', announcement_template: '' },
          HR: data.data.HR || { type: 'HR', welcome_template: '', announcement_template: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    if (activeTab === 'welcome') {
      setSettings(prev => ({
        ...prev,
        HR: { ...prev.HR, [name]: value }
      }));
    } else if (activeTab === 'it_announcement') {
      setSettings(prev => ({
        ...prev,
        IT: { ...prev.IT, [name]: value }
      }));
    } else if (activeTab === 'hr_announcement') {
      setSettings(prev => ({
        ...prev,
        HR: { ...prev.HR, [name]: value }
      }));
    }
  };

  const handleSave = async () => {
    try {
      const typeToSave = (activeTab === 'welcome' || activeTab === 'hr_announcement') ? 'HR' : 'IT';
      const dataToSave = settings[typeToSave];

      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          text: 'บันทึกเทมเพลตอีเมลเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกได้', 'error');
    }
  };

  const getPreviewHtml = () => {
    let template = '';
    if (activeTab === 'welcome') {
      template = settings.HR?.welcome_template || '<div style="color: #64748b; text-align: center; padding: 20px;">ไม่มีข้อมูลเทมเพลต (จะใช้ค่าเริ่มต้นของระบบ)</div>';
      return template
        .replace(/{{first_name}}/g, 'สมชาย')
        .replace(/{{last_name}}/g, 'ใจดี')
        .replace(/{{employee_code}}/g, 'EMP001')
        .replace(/{{position}}/g, 'Software Developer')
        .replace(/{{department}}/g, 'IT')
        .replace(/{{company}}/g, 'ASCG Co., Ltd.')
        .replace(/{{email}}/g, 'somchai@ascggroup.com')
        .replace(/{{start_date}}/g, '15/07/2569');
    } else if (activeTab === 'it_announcement') {
      template = settings.IT?.announcement_template || '<div style="color: #64748b; text-align: center; padding: 20px;">ไม่มีข้อมูลเทมเพลต (จะใช้ค่าเริ่มต้นของระบบ)</div>';
      const imgHtml = `<div style="text-align: center; margin: 20px 0;"><img src="https://portal.ascgglobalgroup.com/uploads/announcements/sample.jpg" alt="Announcement Image" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; color: #64748b; font-size: 13px; text-align: center;\'>🖼️ รูปภาพหน้าปกประกาศจะแสดงที่นี่ (https://portal.ascgglobalgroup.com/uploads/announcements/...)</div>';" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" /></div>`;
      return template
        .replace(/{{title}}/g, 'ประกาศปรับปรุงระบบเครือข่ายและเซิร์ฟเวอร์ประจำเดือน')
        .replace(/{{content}}/g, 'เรียน ทีมงานที่เกี่ยวข้องทุกท่าน,\n\nขอแจ้งให้ทราบว่าฝ่าย IT จะดำเนินการปรับปรุงระบบ Firewall และสลับสัญญาณเครือข่ายในคืนวันเสาร์ เวลา 23:00 - 01:00 น.\nจึงขออภัยในความไม่สะดวกมา ณ ที่นี้')
        .replace(/{{cover_image}}/g, imgHtml)
        .replace(/{{created_at}}/g, '03/09/2569');
    } else {
      template = settings.HR?.announcement_template || '<div style="color: #64748b; text-align: center; padding: 20px;">ไม่มีข้อมูลเทมเพลต (จะใช้ค่าเริ่มต้นของระบบ)</div>';
      const imgHtml = `<div style="text-align: center; margin: 20px 0;"><img src="https://portal.ascgglobalgroup.com/uploads/announcements/sample.jpg" alt="Announcement Image" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; color: #64748b; font-size: 13px; text-align: center;\'>🖼️ รูปภาพหน้าปกประกาศจะแสดงที่นี่ (https://portal.ascgglobalgroup.com/uploads/announcements/...)</div>';" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" /></div>`;
      return template
        .replace(/{{title}}/g, 'ประกาศวันหยุดพิเศษและกิจกรรม Townhall ประจำไตรมาส')
        .replace(/{{content}}/g, 'เรียน พนักงานทุกท่าน,\n\nขอเรียนเชิญพนักงานทุกสังกัดเข้าร่วมประชุม Townhall ประจำไตรมาส ณ ห้องประชุมใหญ่ หรือผ่านช่องทางออนไลน์\nพร้อมแจ้งกำหนดการวันหยุดตามประกาศบริษัท')
        .replace(/{{cover_image}}/g, imgHtml)
        .replace(/{{created_at}}/g, '03/09/2569');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">เทมเพลตอีเมล</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">จัดการรูปแบบอีเมลอัตโนมัติที่ส่งจากระบบ (HTML & Styling)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#262f3f] rounded-2xl shadow-sm border border-slate-200 dark:border-[#364356] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#364356] overflow-x-auto">
          {/* ซ่อนไว้ก่อน: แท็บแจ้งพนักงานใหม่ (HR) */}
          {/* <button
            onClick={() => setActiveTab('welcome')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'welcome' 
                ? 'border-b-2 border-[#f89919] text-[#f89919] bg-orange-50/50 dark:bg-amber-950/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c232f]'
            }`}
          >
            <Mail size={18} /> แจ้งพนักงานใหม่ (HR)
          </button> */}
          <button
            onClick={() => setActiveTab('it_announcement')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'it_announcement' 
                ? 'border-b-2 border-[#f89919] text-[#f89919] bg-orange-50/50 dark:bg-amber-950/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c232f]'
            }`}
          >
            <Megaphone size={18} /> ประกาศองค์กร (IT)
          </button>
          <button
            onClick={() => setActiveTab('hr_announcement')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'hr_announcement' 
                ? 'border-b-2 border-[#3b82f6] text-[#3b82f6] bg-blue-50/50 dark:bg-blue-950/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c232f]'
            }`}
          >
            <Megaphone size={18} /> ประกาศองค์กร (HR)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: Editor */}
            <div>
              {activeTab === 'welcome' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">เทมเพลตอีเมลต้อนรับพนักงานใหม่ (HTML / Text)</label>
                    <textarea 
                      name="welcome_template"
                      value={settings.HR?.welcome_template || ''}
                      onChange={handleTemplateChange}
                      rows={18}
                      className="w-full p-4 border border-slate-300 dark:border-[#364356] rounded-xl focus:ring-2 focus:ring-[#f89919]/40 outline-none text-sm font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#1c232f]"
                      placeholder="วางโค้ด HTML ของเทมเพลตที่นี่... หากปล่อยว่างระบบจะใช้ค่าเริ่มต้น"
                    ></textarea>
                  </div>
                  <div className="bg-indigo-50 dark:bg-[#1c232f] p-4 rounded-xl border border-indigo-100 dark:border-[#364356] flex gap-3 items-start">
                    <Info className="text-[#f89919] shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">ตัวแปรที่ใช้งานได้:</p>
                      <div className="flex flex-wrap gap-2 text-xs font-mono text-[#f89919]">
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{first_name}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{last_name}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{employee_code}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{position}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{department}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{company}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{email}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{start_date}}"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'it_announcement' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">เทมเพลตประกาศฝ่าย IT (HTML / Text)</label>
                    <textarea 
                      name="announcement_template"
                      value={settings.IT?.announcement_template || ''}
                      onChange={handleTemplateChange}
                      rows={18}
                      className="w-full p-4 border border-slate-300 dark:border-[#364356] rounded-xl focus:ring-2 focus:ring-[#f89919]/40 outline-none text-sm font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#1c232f]"
                      placeholder="วางโค้ด HTML ของเทมเพลตที่นี่... หากปล่อยว่างระบบจะใช้ค่าเริ่มต้น"
                    ></textarea>
                  </div>
                  <div className="bg-amber-50 dark:bg-[#1c232f] p-4 rounded-xl border border-amber-200 dark:border-[#364356] flex gap-3 items-start">
                    <Info className="text-[#f89919] shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">ตัวแปรที่ใช้งานได้:</p>
                      <div className="flex flex-wrap gap-2 text-xs font-mono text-[#f89919]">
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{title}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{cover_image}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{content}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{created_at}}"}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2">
                        * รูปภาพหน้าปกจะถูกเรียกใช้งานผ่าน URL: <code className="text-indigo-600 dark:text-indigo-400">https://portal.ascgglobalgroup.com/uploads/announcements/[ชื่อไฟล์]</code>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">เทมเพลตประกาศฝ่าย HR (HTML / Text)</label>
                    <textarea 
                      name="announcement_template"
                      value={settings.HR?.announcement_template || ''}
                      onChange={handleTemplateChange}
                      rows={18}
                      className="w-full p-4 border border-slate-300 dark:border-[#364356] rounded-xl focus:ring-2 focus:ring-[#3b82f6]/40 outline-none text-sm font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#1c232f]"
                      placeholder="วางโค้ด HTML ของเทมเพลตที่นี่... หากปล่อยว่างระบบจะใช้ค่าเริ่มต้น"
                    ></textarea>
                  </div>
                  <div className="bg-blue-50 dark:bg-[#1c232f] p-4 rounded-xl border border-blue-200 dark:border-[#364356] flex gap-3 items-start">
                    <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">ตัวแปรที่ใช้งานได้:</p>
                      <div className="flex flex-wrap gap-2 text-xs font-mono text-blue-600 dark:text-blue-400">
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{title}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{cover_image}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{content}}"}</span>
                        <span className="bg-white dark:bg-[#262f3f] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#364356] shadow-2xs">{"{{created_at}}"}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2">
                        * รูปภาพหน้าปกจะถูกเรียกใช้งานผ่าน URL: <code className="text-indigo-600 dark:text-indigo-400">https://portal.ascgglobalgroup.com/uploads/announcements/[ชื่อไฟล์]</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Preview */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ตัวอย่างการแสดงผล (Preview)</label>
              <div className="flex-1 w-full border border-slate-300 dark:border-[#364356] rounded-xl bg-white dark:bg-[#1c232f] relative shadow-inner overflow-hidden flex flex-col min-h-[500px]">
                {/* Browser-like header */}
                <div className="bg-slate-100 dark:bg-[#1c232f] border-b border-slate-200 dark:border-[#364356] px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 bg-white dark:bg-[#262f3f] px-3 py-1 text-xs text-slate-500 dark:text-slate-300 rounded-md shadow-sm border border-slate-200 dark:border-[#364356] flex-1 truncate font-medium">
                    Preview: {activeTab === 'welcome' ? 'Welcome Email (HR)' : activeTab === 'it_announcement' ? 'IT Announcement Email' : 'HR Announcement Email'}
                  </div>
                </div>
                {/* Email Body */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#181e28] flex-1 overflow-y-auto">
                  <div className="rounded shadow-sm p-2 sm:p-4 mx-auto max-w-2xl text-slate-800 dark:text-slate-100" 
                       dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end pt-6 border-t border-slate-100 dark:border-[#364356]">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#f89919] hover:bg-[#d97c08] text-white font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save size={18} /> บันทึกเทมเพลต
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}