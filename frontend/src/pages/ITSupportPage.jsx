import { useState, useEffect } from 'react';
import { ArrowLeft, Wrench, Send, Monitor, Download, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logo from '../assets/logo.svg';

export default function ITSupportPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // ตรวจสอบว่าเข้ามาจากไหน
    const isFromAdmin = location.state?.fromAdmin;
    const isPublic = location.pathname === '/report-it'; // เข้าโดยไม่ล็อคอิน (จากหน้าประกาศ)
    const returnPath = isPublic ? '/' : (isFromAdmin ? '/admin/it-support' : '/it-support');

    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        category: '',
        urgency: 'ปานกลาง',
        description: ''
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/it-categories');
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    const activeCategories = result.data.filter(cat => cat.status === 'Active');
                    setCategories(activeCategories);
                    if (activeCategories.length > 0) {
                        setFormData(prev => ({ ...prev, category: activeCategories[0].name }));
                    }
                }
            } catch (error) {
                console.error('Error fetching IT categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleResetForm = () => {
        setFormData({
            name: '',
            department: '',
            category: categories.length > 0 ? categories[0].name : '',
            urgency: 'ปานกลาง',
            description: ''
        });
    };

    const handleCancel = () => {
        if (isPublic) {
            navigate('/');
        } else if (isFromAdmin) {
            navigate('/admin/it-support');
        } else {
            handleResetForm();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/it-support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'ส่งเรื่องสำเร็จ!',
                    text: `รหัสอ้างอิงของคุณคือ: ${result.ticket_no}`,
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#f89919'
                }).then(() => {
                    handleResetForm();
                    if (isPublic) {
                        navigate('/');
                    } else if (isFromAdmin) {
                        navigate('/admin/it-support');
                    }
                });
            } else {
                Swal.fire('ผิดพลาด', result.message || 'ไม่สามารถส่งข้อมูลได้', 'error');
            }

        } catch (error) {
            console.error('Submit Error:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formContent = (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto ${isPublic ? 'py-8 px-4' : ''}`}>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Wrench className="text-[#f89919]" size={24} />
                    แจ้งปัญหา IT (IT Helpdesk)
                </h1>
                <p className="text-[#ae8a68] dark:text-amber-200/70 mt-1">กรอกรายละเอียดเพื่อแจ้งปัญหาให้ทีม IT เข้าตรวจสอบและแก้ไข</p>
            </div>

            {/* AnyDesk Remote Support Helper Box */}
            <div className="mb-6 bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 dark:text-red-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                        <Download size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-red-950 dark:text-red-100 flex items-center gap-1.5">
                            โปรแกรมรีโมทช่วยเหลือระยะไกล (AnyDesk สำหรับ Windows)
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300/80 mt-0.5">
                            หากต้องการให้เจ้าหน้าที่ IT รีโมทเข้ามาตรวจสอบและแก้ไขที่เครื่อง สามารถดาวน์โหลดโปรแกรมและแจ้งหมายเลข 9 หลักให้เจ้าหน้าที่ได้ทันที
                        </p>
                    </div>
                </div>
                <a
                    href="https://anydesk.com/en/downloads/windows"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 self-end sm:self-auto cursor-pointer"
                >
                    <Download size={14} />
                    <span>ดาวน์โหลด AnyDesk</span>
                </a>
            </div>

            {/* --- MAIN FORM --- */}
            <div className="bg-white dark:bg-[#262f3f] rounded-2xl border border-[#dfe0df] dark:border-[#364356] shadow-sm overflow-hidden transition-colors">
                <div className="bg-[#231a14] dark:bg-[#1c232f] px-8 py-6 text-white border-b border-[#dfe0df] dark:border-[#364356]">
                    <h2 className="text-xl font-bold mb-2 text-white dark:text-slate-100">เปิดทิกเก็ตแจ้งปัญหาใหม่</h2>
                    <p className="text-[#ae8a68] dark:text-amber-200/70 text-sm">กรุณากรอกรายละเอียดให้ครบถ้วน เพื่อความรวดเร็วในการตรวจสอบและแก้ไขปัญหา</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* ข้อมูลผู้แจ้ง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">ชื่อ-นามสกุล (ผู้แจ้ง) *</label>
                            <input
                                type="text" required name="name" value={formData.name} onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#dfe0df] dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919]/40 focus:border-[#f89919] outline-none transition-all text-sm"
                                placeholder="เช่น สมชาย ใจดี"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">แผนก / ฝ่าย *</label>
                            <input
                                type="text" required name="department" value={formData.department} onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#dfe0df] dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#f89919]/40 focus:border-[#f89919] outline-none transition-all text-sm"
                                placeholder="เช่น บัญชี"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-[#364356] mb-8" />

                    {/* รายละเอียดปัญหา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">หมวดหมู่ปัญหา *</label>
                            <div className="relative">
                                <select
                                    required name="category" value={formData.category} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                                >
                                    {categories.map((cat, idx) => (
                                        <option key={idx} value={cat.name} className="dark:bg-[#1c232f]">{cat.name}</option>
                                    ))}
                                    {categories.length === 0 && (
                                        <option value="" disabled className="dark:bg-[#1c232f]">ไม่มีข้อมูลหมวดหมู่</option>
                                    )}
                                </select>
                                <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">ระดับความเร่งด่วน *</label>
                            <select
                                required name="urgency" value={formData.urgency} onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="ต่ำ (ไม่กระทบการทำงาน)" className="dark:bg-[#1c232f]">🟢 ต่ำ (ไม่กระทบการทำงานหลัก)</option>
                                <option value="ปานกลาง" className="dark:bg-[#1c232f]">🟡 ปานกลาง (พอทำงานอื่นทดแทนได้)</option>
                                <option value="สูง (ทำงานต่อไม่ได้)" className="dark:bg-[#1c232f]">🔴 สูง (ทำงานต่อไม่ได้เลย)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">รายละเอียดปัญหาที่พบ (ระบุให้ชัดเจน) *</label>
                        <textarea
                            required name="description" value={formData.description} onChange={handleChange} rows="5"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-[#364356] bg-white dark:bg-[#1c232f] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                            placeholder="เช่น เปิดคอมพิวเตอร์ไม่ติด มีเสียงร้องตี๊ดๆ 3 ครั้ง, ปรินเตอร์ชั้น 2 พิมพ์ไม่ออก..."
                        ></textarea>
                    </div>

                    {/* ปุ่ม Submit */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-[#303b4e] transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit" disabled={isLoading}
                            className="flex items-center gap-2 bg-[#f89919] hover:bg-[#d97c08] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm disabled:opacity-70 text-sm"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-white border-r-white border-b-transparent border-l-transparent"></div>
                            ) : (
                                <Send size={18} />
                            )}
                            {isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งแจ้งปัญหา'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // กรณีเข้าโดยไม่ล็อคอิน → ครอบด้วย layout แบบ Public (มี Navbar)
    if (isPublic) {
        return (
            <div className="min-h-screen bg-[#fff8f0] dark:bg-[#1e2430]">
                <nav className="bg-white/80 dark:bg-[#232b3a]/90 backdrop-blur-md border-b border-[#dfe0df] dark:border-[#364356] sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <img src={logo} alt="ASCG Group Logo" className="h-8 w-auto object-contain" />
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">ASCG Group</span>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#303b4e]"
                        >
                            <ArrowLeft size={16} />
                            กลับหน้าประกาศ
                        </button>
                    </div>
                </nav>
                {formContent}
            </div>
        );
    }

    // กรณีเข้าโดยล็อคอิน → แสดงแค่ form (AdminLayout จัดการ Navbar+Sidebar อยู่แล้ว)
    return formContent;
}