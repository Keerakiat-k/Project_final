import React, { forwardRef } from 'react';
import { COMPANY_EMAIL_CONFIGS, generatePassword, getPhoneticThai } from '../../utils/companyEmailConfig';
import aiaLogo from '../../assets/logo.svg'; // Fallback generic logo

const ITFormPrintTemplate = forwardRef(({ employee, printDate }, ref) => {
  if (!employee) return <div ref={ref} style={{ display: 'none' }}></div>;

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const mockRole = localStorage.getItem('mockRole');
  const isAdmin = String(userInfo.role_id) === '1' || mockRole === '1';

  // แปลงวันที่ให้อยู่ในรูปแบบ dd/mm/yyyy
  const formattedDate = printDate ? new Date(printDate).toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }) : new Date().toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // แยกชื่อจริง-นามสกุล โดยดึงจากฟิลด์แยก หรือ full_name
  const firstNameTh = employee.first_name_th || (employee.full_name_th || '').split(' ')[0] || '';
  const lastNameTh = employee.last_name_th || (employee.full_name_th || '').split(' ').slice(1).join(' ') || '';

  const firstNameEn = employee.first_name_en || (employee.full_name_en || '').split(' ')[0] || '';
  const lastNameEn = employee.last_name_en || (employee.full_name_en || '').split(' ').slice(1).join(' ') || '';

  let titleTh = employee.title_th || '';
  let titleEn = employee.title_en || '';
  if (!titleTh && firstNameTh.startsWith('นาย')) { titleTh = 'นาย'; }
  else if (!titleTh && firstNameTh.startsWith('นางสาว')) { titleTh = 'นางสาว'; }
  else if (!titleTh && firstNameTh.startsWith('นาง')) { titleTh = 'นาง'; }

  // ตัดคำนำหน้าออกจากชื่อ
  const cleanFirstNameTh = firstNameTh.replace(/^(นาย|นางสาว|นาง)/, '');

  // ดึงข้อมูลบริษัท
  const compConfig = COMPANY_EMAIL_CONFIGS[employee.company_prefix] || COMPANY_EMAIL_CONFIGS['AIA'];
  const domainUsername = employee.email ? employee.email.split('@')[0] : (employee.username || '-');
  const computedPassword = generatePassword(firstNameEn, lastNameEn);
  const phoneticPassword = getPhoneticThai(computedPassword);

  const displayFullNameTh = `${titleTh}${cleanFirstNameTh} ${lastNameTh}`.trim();
  const displayFullNameEn = `${titleEn ? titleEn + ' ' : ''}${firstNameEn} ${lastNameEn}`.trim();

  return (
    <div 
      ref={ref} 
      className="bg-white text-slate-900 mx-auto box-border"
      style={{ 
        width: '210mm', 
        padding: '8mm 12mm 6mm 12mm',
        fontFamily: '"Sarabun", "Inter", system-ui, -apple-system, sans-serif',
        fontSize: '11.5px',
        lineHeight: '1.4',
        color: '#0f172a',
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-center pb-2.5 border-b-2 border-slate-800 mb-2.5">
        {/* Left: Company Logo */}
        <div className="flex items-center gap-2.5 w-1/4">
          <img 
            src={compConfig.logo || aiaLogo} 
            alt={compConfig.nameEn} 
            className="h-11 max-w-[120px] object-contain shrink-0" 
          />
        </div>
        
        {/* Center: Company Name & Group Info */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
            {compConfig.nameEn}
          </h1>
          <h2 className="text-[11px] font-semibold text-slate-700 mt-0.5">
            {compConfig.nameTh}
          </h2>
          <p className="text-[9.5px] text-slate-500 font-medium tracking-wide uppercase">
            ASCG Global Group • Information Technology Department
          </p>
        </div>

        {/* Right: Document Control Box */}
        <div className="w-1/4 flex justify-end">
          <div className="border border-slate-400 rounded p-1.5 bg-slate-50/80 text-[10px] leading-tight text-right w-32 shadow-2xs">
            <div className="font-mono font-bold text-slate-900 text-[10.5px] pb-0.5 border-b border-slate-300">
              DOC: IT-FORM-002
            </div>
            <div className="pt-0.5 text-slate-600 flex justify-between">
              <span>Rev:</span>
              <span className="font-semibold text-slate-800">02 / 2026</span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Date:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div className="text-[9px] font-bold text-rose-700 uppercase tracking-wider text-center bg-rose-50 border border-rose-200 rounded mt-0.5">
              Confidential
            </div>
          </div>
        </div>
      </div>

      {/* 2. Title Banner */}
      <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-y border-slate-300 py-1.5 px-3 mb-2.5 flex items-center justify-between rounded-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-[#f89919] inline-block rounded-xs"></span>
            แบบแจ้งข้อมูลบัญชีผู้ใช้งานและอีเมล (User Account & Corporate Email Slip)
          </h3>
          <p className="text-[10px] text-slate-600 ml-3">
            สำหรับพนักงานใหม่และผู้ถือครองอุปกรณ์สารสนเทศ (เฉพาะฝ่าย IT / ภายในองค์กรเท่านั้น)
          </p>
        </div>
        <div className="text-[11px] font-bold font-mono px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800">
          ID: {employee.employee_code || '-'}
        </div>
      </div>

      {/* 3. Section 1: ข้อมูลผู้ถือครองบัญชี (Employee Information) */}
      <div className="mb-2.5 border border-slate-300 rounded overflow-hidden shadow-2xs">
        <div className="bg-slate-100 px-3 py-1 font-bold text-[11px] text-slate-800 border-b border-slate-300 flex items-center justify-between">
          <span>1. ข้อมูลผู้ถือครองบัญชี (Employee Identification)</span>
          <span className="text-[9.5px] text-slate-500 font-normal">*ข้อมูลสำหรับตรวจสอบสิทธิ์การเข้าใช้งาน</span>
        </div>
        <div className="p-2 grid grid-cols-6 gap-x-3 gap-y-1 text-[11px]">
          <div className="col-span-3 flex border-b border-slate-200 pb-1">
            <span className="w-28 text-slate-500 font-medium">ชื่อ-นามสกุล (ไทย):</span>
            <span className="font-bold text-slate-900 flex-1">{displayFullNameTh || '-'}</span>
          </div>
          <div className="col-span-3 flex border-b border-slate-200 pb-1">
            <span className="w-28 text-slate-500 font-medium">Full Name (English):</span>
            <span className="font-bold text-slate-900 flex-1 font-mono">{displayFullNameEn || '-'}</span>
          </div>
          <div className="col-span-2 flex pt-0.5">
            <span className="w-20 text-slate-500 font-medium">รหัสพนักงาน:</span>
            <span className="font-mono font-bold text-[#f89919]">{employee.employee_code || '-'}</span>
          </div>
          <div className="col-span-2 flex pt-0.5">
            <span className="w-12 text-slate-500 font-medium">แผนก:</span>
            <span className="font-semibold text-slate-800">{employee.department_name || '-'}</span>
          </div>
          <div className="col-span-2 flex pt-0.5">
            <span className="w-14 text-slate-500 font-medium">ตำแหน่ง:</span>
            <span className="font-semibold text-slate-800">{employee.position || '-'}</span>
          </div>
        </div>
      </div>

      {/* 4. Section 2: ข้อมูลการเข้าสู่ระบบคอมพิวเตอร์และเครือข่าย (Computer & Domain Login) */}
      <div className="mb-2.5 border border-slate-300 rounded overflow-hidden shadow-2xs">
        <div className="bg-slate-100 px-3 py-1 font-bold text-[11px] text-slate-800 border-b border-slate-300 flex items-center justify-between">
          <span>2. บัญชีเข้าสู่ระบบคอมพิวเตอร์และโดเมน (Active Directory / Windows Domain Login)</span>
          <span className="text-[9.5px] text-slate-500 font-normal">สำหรับเครื่องประจำตัวและเครือข่ายภายใน</span>
        </div>
        <div className="p-2 grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">ชื่อผู้ใช้งาน (User Name):</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {employee.use_domain ? domainUsername : (employee.email ? domainUsername : '-')}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">โดเมนเครือข่าย (Domain):</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {employee.use_domain ? 'ASCGGROUP' : 'Local Workstation'}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">รหัสผ่านเริ่มต้น (Initial Password):</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {computedPassword}
            </span>
          </div>
          <div className="col-span-3 text-[10.5px] text-slate-600 bg-amber-50/70 p-1.5 rounded border border-amber-200/70 flex items-center justify-between">
            <div>
              <strong>วิธีเปลี่ยนรหัสผ่านคอมพิวเตอร์:</strong> กดปุ่มพร้อมกัน <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9.5px]">Ctrl</kbd> + <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9.5px]">Alt</kbd> + <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9.5px]">Del</kbd> แล้วเลือกเมนู <strong>"Change a password"</strong>
            </div>
            
          </div>
        </div>
      </div>

      {/* 5. Section 3: บัญชีอีเมลองค์กรและการตั้งค่า (Corporate Email & Server Configuration) */}
      <div className="mb-2.5 border border-slate-300 rounded overflow-hidden shadow-2xs">
        <div className="bg-slate-100 px-3 py-1 font-bold text-[11px] text-slate-800 border-b border-slate-300 flex items-center justify-between">
          <span>3. ข้อมูลบัญชีอีเมลองค์กร (Corporate Email & Client Configuration)</span>
          <span className="text-[9.5px] text-slate-500 font-normal">Microsoft Outlook / Thunderbird / Smartphone</span>
        </div>
        <div className="grid grid-cols-5 divide-x divide-slate-300 text-[11px]">
          
          {/* Left Column: Email Credentials */}
          <div className="col-span-3 p-2.5 space-y-1.5">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">ที่อยู่อีเมลทางการ (Corporate Email Address):</span>
              <div className="font-mono font-bold text-xs text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 select-all">
                {employee.email || '-'}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">รหัสผ่านตั้งต้น (Initial Password):</span>
              <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-mono font-extrabold text-xs text-[#f89919] tracking-wider select-all">
                  {computedPassword}
                </span>
                
              </div>
            </div>

            <div className="text-[10px] text-slate-600 bg-slate-100/70 p-1 rounded border border-slate-200 leading-normal">
              <strong>คำอ่านออกเสียง:</strong> <span className="font-medium text-slate-800">{phoneticPassword}</span>
            </div>

            <div className="text-[10.5px] text-slate-600 pt-0.5">
              <strong>เข้าใช้งานผ่านเว็บ (Webmail URL):</strong> <span className="font-mono text-blue-700 underline font-semibold">http://mail.${compConfig.domain}</span>
            </div>
          </div>

          {/* Right Column: Mail Server Setup (POP3/SMTP) */}
          <div className="col-span-2 p-2.5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-800 text-[11px] pb-1 mb-1.5 border-b border-slate-200 text-center">
                การตั้งค่าโปรแกรมรับ-ส่งอีเมล (Outlook Setting)
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-medium">Incoming Server (POP3):</span>
                  <span className="font-mono font-bold text-slate-800 text-[10.5px]">{compConfig.pop3?.server}</span>
                  <div className="text-[9.5px] text-slate-600 flex justify-between mt-0.5 pt-0.5 border-t border-slate-100">
                    <span>Port: <strong>{compConfig.pop3?.port}</strong></span>
                    <span>Security: <strong>{compConfig.pop3?.ssl}</strong></span>
                  </div>
                </div>

                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-medium">Outgoing Server (SMTP):</span>
                  <span className="font-mono font-bold text-slate-800 text-[10.5px]">{compConfig.smtp?.server}</span>
                  <div className="text-[9.5px] text-slate-600 flex justify-between mt-0.5 pt-0.5 border-t border-slate-100">
                    <span>Port: <strong>{compConfig.smtp?.port}</strong></span>
                    <span>Security: <strong>{compConfig.smtp?.ssl}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-slate-500 text-center pt-1">
              *Authentication: ใช้ User และ Password เดียวกับบัญชีอีเมล
            </div>
          </div>

        </div>
      </div>

      {/* 6. Section 4: คำแนะนำและข้อกำหนดความปลอดภัยสารสนเทศ (Security Guidelines & Instructions) */}
      <div className="bg-slate-50 p-2.5 rounded border border-slate-300 text-[10.5px] leading-relaxed mb-2.5">
        <div className="font-bold text-slate-900 mb-1 flex items-center justify-between pb-0.5 border-b border-slate-200">
          <span>คำแนะนำการใช้งานและข้อปฏิบัติความปลอดภัย (Instructions & Security Policy):</span>
          <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
            นโยบายความมั่นคงปลอดภัยสารสนเทศ & PDPA
          </span>
        </div>
        <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
          <li>
            <strong>การเปลี่ยนรหัสผ่านอีเมล:</strong> เปิด Webmail <span className="font-mono text-blue-700">http://mail.${compConfig.domain}</span> แล้ว Login ด้วยอีเมลและรหัสผ่านเริ่มต้น ไปที่เมนู <strong>Setting &gt; Password</strong> จากนั้นใส่รหัสผ่านปัจจุบัน และตั้งรหัสผ่านใหม่ แล้วกด <strong>ตกลง (Save)</strong>
          </li>
          <li>
            <strong>การเปลี่ยนรหัสผ่านคอมพิวเตอร์:</strong> ให้กดปุ่ม <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9px]">Ctrl</kbd> + <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9px]">Alt</kbd> + <kbd className="bg-white border border-slate-300 px-1 py-0.2 rounded font-mono text-[9px]">Del</kbd> แล้วเลือก <strong>"Change a password"</strong>
          </li>
          <li>
            <strong>การรักษาความลับ:</strong> รหัสผ่านที่กำหนดให้เบื้องต้นห้ามแบ่งปันหรือเปิดเผยแก่ผู้อื่นโดยเด็ดขาด
          </li>
          <li>
            <strong>กรณีฉุกเฉิน / มีข้อสงสัย:</strong> หากพบปัญหาในการเข้าสู่ระบบ ลืมรหัสผ่าน หรือต้องการความช่วยเหลือ สามารถติดต่อฝ่าย IT โทรศัพท์ภายใน <strong>Ext. 2233</strong>
          </li>
        </ol>
      </div>

    

    </div>
  );
});

ITFormPrintTemplate.displayName = 'ITFormPrintTemplate';

export default ITFormPrintTemplate;
