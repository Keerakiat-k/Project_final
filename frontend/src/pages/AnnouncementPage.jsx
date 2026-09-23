import { useState, useEffect } from 'react';
import {
  Megaphone, Calendar, Info, Clock, LogIn, ArrowRight, Headset, X, Search, Bell,
  ShieldCheck, ChevronLeft, ChevronRight, Newspaper, LayoutGrid, Sparkles,
  ExternalLink, Building2, Layers, CheckCircle2, Bookmark, Share2, HelpCircle,
  FileText, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Brand Assets
import logo from '../assets/logo.svg';

const COMPANIES = [
  { prefix: 'CORP', name: 'CorpHub Group Co., Ltd.', logo: logo, desc: 'ผู้นำด้านการบริหารจัดการและเทคโนโลยีองค์กร' },
  { prefix: 'TECH', name: 'CorpHub Technology Co., Ltd.', logo: logo, desc: 'พัฒนานวัตกรรมดิจิทัลและระบบสารสนเทศ' },
  { prefix: 'INNO', name: 'CorpHub Innovation Co., Ltd.', logo: logo, desc: 'การวิจัยและพัฒนาโซลูชันธุรกิจสมัยใหม่' },
];

export default function AnnouncementPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  
  // View Mode: 'news' (ข่าวสารและกิจกรรม) | 'policies' (นโยบายองค์กร)
  const [viewMode, setViewMode] = useState('news');
  const [filter, setFilter] = useState('ทั้งหมด');
  const [announcementTypes, setAnnouncementTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Esc key listener for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedAnnouncement(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annRes, typeRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_BASE_URL + '/api/announcements'),
          fetch(import.meta.env.VITE_API_BASE_URL + '/api/announcement-types'),
        ]);
        const annResult = await annRes.json();
        const typeResult = await typeRes.json();
        if (annRes.ok && annResult.status === 'success') setAnnouncements(annResult.data || []);
        if (typeRes.ok && typeResult.status === 'success') {
          const types = typeResult.data.filter((t) => t.status === 'Active').map((t) => t.name);
          setAnnouncementTypes(types);
        } else {
          setAnnouncementTypes(['ประกาศสำคัญ', 'กิจกรรม', 'ทั่วไป']);
        }
      } catch (e) {
        console.error(e);
        setAnnouncementTypes(['ประกาศสำคัญ', 'กิจกรรม', 'ทั่วไป']);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset page when mode, filter or search term changes
  useEffect(() => { 
    setCurrentPage(1); 
  }, [viewMode, filter, searchTerm]);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'ประกาศสำคัญ': return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', icon: <Megaphone size={11} />, dot: '#ef4444' };
      case 'กิจกรรม':     return { bg: '#fff7ed', text: '#c2690a', border: '#fed7aa', icon: <Calendar size={11} />, dot: '#f97316' };
      case 'นโยบายองค์กร': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: <ShieldCheck size={11} />, dot: '#3b82f6' };
      default:            return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0', icon: <Info size={11} />, dot: '#64748b' };
    }
  };

  const handleSwitchMode = (mode) => {
    setViewMode(mode);
    setFilter('ทั้งหมด');
    setSearchTerm('');
  };

  // Filter datasets
  const newsAnnouncements = announcements.filter(item => item.type !== 'นโยบายองค์กร');
  const policyAnnouncements = announcements.filter(item => item.type === 'นโยบายองค์กร');
  const newsCategories = ['ทั้งหมด', ...announcementTypes.filter(t => t !== 'นโยบายองค์กร')];
  const activeDataset = viewMode === 'news' ? newsAnnouncements : policyAnnouncements;

  const filteredData = activeDataset
    .filter((item) => {
      if (viewMode === 'policies') return true;
      if (filter === 'ทั้งหมด') return true;
      return item.type === filter;
    })
    .filter((item) =>
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const latestNewsItem = newsAnnouncements[0];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const todayStr = new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e2430] text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-white" style={{ fontFamily: "'Inter', 'Prompt', system-ui, sans-serif" }}>

      {/* ========== 1. TOP HEADER / NAVBAR ========== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1c232f]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#364356] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0" onClick={() => handleSwitchMode('news')}>
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-xs group-hover:border-blue-400 transition">
              <img src={logo} alt="CorpHub" className="h-7 sm:h-8 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 tracking-tight text-sm sm:text-base leading-none">
                CorpHub
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-normal mt-0.5 hidden sm:block">
                ระบบจัดการข้อมูลและทรัพยากรองค์กร
              </p>
            </div>
          </div>

          {/* Desktop Center Navigation Mode Switcher (hidden on < md) */}
          <div className="hidden md:flex items-center bg-slate-100/90 dark:bg-[#1c232f] p-1 rounded-xl border border-slate-200 dark:border-[#364356] shadow-inner">
            <button
              onClick={() => handleSwitchMode('news')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'news'
                  ? 'bg-white dark:bg-[#262f3f] text-orange-700 dark:text-[#f89919] shadow-xs ring-1 ring-black/5 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-[#262f3f]/50'
              }`}
            >
              <Newspaper size={14} className={viewMode === 'news' ? 'text-amber-500' : 'text-slate-500'} />
              <span>ข่าวสาร & กิจกรรม</span>
              {newsAnnouncements.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewMode === 'news' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {newsAnnouncements.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSwitchMode('policies')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'policies'
                  ? 'bg-white dark:bg-[#262f3f] text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-black/5 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-[#262f3f]/50'
              }`}
            >
              <ShieldCheck size={14} className={viewMode === 'policies' ? 'text-blue-600' : 'text-slate-500'} />
              <span>นโยบายองค์กร</span>
              {policyAnnouncements.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewMode === 'policies' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {policyAnnouncements.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/report-it')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#262f3f] text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 hover:shadow-xs transition whitespace-nowrap cursor-pointer"
            >
              <Headset size={14} className="text-amber-500" />
              <span>แจ้งปัญหา IT</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
            >
              <LogIn size={15} />
              <span>เข้าสู่ระบบ</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navbar Mode Switcher (< md) */}
        <div className="md:hidden bg-slate-50/95 border-t border-slate-200/70 px-3 py-2 flex items-center justify-center">
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 w-full">
            <button
              onClick={() => handleSwitchMode('news')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'news'
                  ? 'bg-white text-orange-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Newspaper size={13} className={viewMode === 'news' ? 'text-amber-500' : 'text-slate-500'} />
              <span>ข่าวสาร & กิจกรรม</span>
              {newsAnnouncements.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewMode === 'news' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {newsAnnouncements.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSwitchMode('policies')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'policies'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={13} className={viewMode === 'policies' ? 'text-blue-600' : 'text-slate-500'} />
              <span>นโยบายองค์กร</span>
              {policyAnnouncements.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${viewMode === 'policies' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                  {policyAnnouncements.length}
                </span>
              )}
            </button>
          </div>
        </div>

      </header>

      {/* ========== 2. HERO SHOWCASE WITH MODERN AMBIENT ========== */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-12 sm:py-16">
        <div className={`absolute inset-0 ${
          viewMode === 'policies'
            ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
            : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900'
        }`} />

        {/* Ambient Glow Orbs */}
        <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          viewMode === 'policies' ? 'bg-blue-600/20' : 'bg-amber-500/20'
        }`} />
        <div className="absolute -bottom-10 left-10 w-72 h-72 rounded-full bg-orange-600/15 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Top Live Date Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-semibold text-white/90 mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{todayStr}</span>
              <span className="text-white/30">•</span>
              <span className="text-amber-300 font-medium">CorpHub Enterprise</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
              {viewMode === 'policies' ? (
                <>
                  นโยบายและระเบียบปฏิบัติองค์กร <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">
                    Corporate Governance & Policy
                  </span>
                </>
              ) : (
                <>
                  ศูนย์กลางข่าวสารและความเคลื่อนไหว <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400">
                    กลุ่มบริษัทและหน่วยงานในเครือ CorpHub
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 font-normal leading-relaxed max-w-2xl mx-auto mb-8">
              {viewMode === 'policies'
                ? 'คู่มือระเบียบข้อบังคับ มาตรฐานการปฏิบัติงาน และความปลอดภัยทางสารสนเทศสำหรับพนักงานในเครือทุกท่าน'
                : 'เกาะติดทุกประกาศสำคัญ กิจกรรมสานสัมพันธ์ และการเติบโตร่วมกันของพวกเราชาว ASCG'}
            </p>

            {/* Modern Floating Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={viewMode === 'policies' ? "ค้นหาชื่อนโยบาย, ระเบียบปฏิบัติ, ข้อบังคับ..." : "ค้นหาประกาศ, กิจกรรม, หัวข้อข่าว..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/20 shadow-xl transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========== 3. SPOTLIGHT HERO (When viewing News with 1+ items) ========== */}
      {viewMode === 'news' && latestNewsItem && !isLoading && searchTerm === '' && filter === 'ทั้งหมด' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-8">
          <div 
            onClick={() => setSelectedAnnouncement(latestNewsItem)}
            className="group relative bg-white dark:bg-[#262f3f] rounded-3xl border border-slate-200/90 dark:border-[#364356] shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
              
              {/* Left Details Column */}
              <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
                <div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                      <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} /> ข่าวล่าสุด Spotlight
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#f89919] border border-amber-200/80 dark:border-amber-800/60">
                      {latestNewsItem.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug mb-3">
                    {latestNewsItem.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-6 font-normal">
                    {latestNewsItem.content}
                  </p>

                </div>

                {/* Footer Metadata & CTA */}
                <div className="pt-4 border-t border-slate-100 dark:border-[#364356] flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {formatDate(latestNewsItem.created_at)}
                    </span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                    <span className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Building2 size={13} /> ASCG Official
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-600 dark:text-[#f89919] group-hover:text-amber-700 group-hover:translate-x-1 transition-all">
                    <span>อ่านรายละเอียดฉบับเต็ม</span>
                    <ArrowRight size={15} />
                  </div>
                </div>

              </div>

              {/* Right Media Column - Full Bleed Image */}
              <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[340px] lg:min-h-[400px] overflow-hidden bg-slate-100 dark:bg-[#1c232f]">
                {latestNewsItem.cover_image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/uploads/announcements/${latestNewsItem.cover_image}`}
                    alt={latestNewsItem.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-amber-950/60 text-white/40">
                    <Megaphone size={56} className="mb-3 text-amber-500/40" />
                    <span className="text-xs font-semibold text-white/50">ASCG Group Announcement</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========== 4. MAIN CONTENT & CARDS GRID ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Navigation & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-[#364356]">
          
          {/* Left Title & Status */}
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {viewMode === 'policies' ? (
                <>
                  <ShieldCheck className="text-blue-600 dark:text-blue-400" size={22} />
                  <span>สารบัญนโยบายและระเบียบปฏิบัติ</span>
                </>
              ) : (
                <>
                  <Layers className="text-[#f89919]" size={20} />
                  <span>รายการประกาศ & ข่าวสารทั้งหมด</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal mt-0.5">
              {viewMode === 'policies'
                ? 'ค้นหาและเปิดดูเอกสารนโยบายความปลอดภัยและคู่มือการปฏิบัติงาน'
                : 'ข่าวสารอัปเดตและประกาศทางการจากฝ่ายบริหารและทรัพยากรบุคคล'}
            </p>
          </div>

          {/* Right Category Filter Pills */}
          {viewMode === 'news' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {newsCategories.map((type) => {
                const active = filter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                        : 'bg-white dark:bg-[#262f3f] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#364356] hover:border-amber-300 hover:text-amber-700 dark:hover:text-[#f89919]'
                    }`}
                  >
                    {type === 'ประกาศสำคัญ' && <Megaphone size={12} />}
                    {type === 'กิจกรรม' && <Calendar size={12} />}
                    {type === 'ทั้งหมด' && <LayoutGrid size={12} />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-slate-200 dark:border-[#364356] border-t-amber-500 rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400">กำลังโหลดข้อมูลสารสนเทศ...</span>
          </div>
        ) : currentItems.length > 0 ? (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((item) => {
                const badge = getBadgeStyle(item.type);
                const isPolicyItem = item.type === 'นโยบายองค์กร';
                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className="group bg-white dark:bg-[#262f3f] rounded-2xl border border-slate-200/90 dark:border-[#364356] shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
                  >
                    {/* Card Cover Media with Full Fit */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-[#1c232f]">
                      {item.cover_image ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}/uploads/announcements/${item.cover_image}`}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-amber-50/40 dark:from-slate-800 dark:to-slate-900 text-slate-300 dark:text-slate-600">
                          {isPolicyItem ? (
                            <ShieldCheck size={40} className="text-blue-300 dark:text-blue-600" />
                          ) : (
                            <Megaphone size={36} className="text-amber-300 dark:text-amber-600" />
                          )}
                        </div>
                      )}

                      {/* Category Badge Floating */}
                      <div className="absolute top-3 left-3 z-20">
                        <span 
                          style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                          <Clock size={11} className="text-slate-400" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
                          {item.title}
                        </h4>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal mb-4">
                          {item.content}
                        </p>
                      </div>

                      {/* Card Footer Link */}
                      <div className="pt-3 border-t border-slate-100 dark:border-[#364356] flex items-center justify-between text-xs font-bold">
                        <span className={isPolicyItem ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-[#f89919]'}>
                          {isPolicyItem ? 'อ่านข้อกำหนดนโยบาย' : 'อ่านรายละเอียด'}
                        </span>
                        <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 dark:group-hover:text-[#f89919] transition" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#262f3f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c232f] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft size={14} className="inline mr-1" /> ก่อนหน้า
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white dark:bg-[#262f3f] border border-slate-200 dark:border-[#364356] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c232f]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#364356] bg-white dark:bg-[#262f3f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c232f] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  ถัดไป <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="py-16 text-center bg-white dark:bg-[#262f3f] rounded-3xl border border-dashed border-slate-200 dark:border-[#364356] p-8 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-[#f89919] mx-auto flex items-center justify-center mb-4">
              {viewMode === 'policies' ? <ShieldCheck size={32} /> : <Megaphone size={32} />}
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {searchTerm 
                ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` 
                : (viewMode === 'policies' ? 'ยังไม่มีเอกสารนโยบายในขณะนี้' : 'ยังไม่มีประกาศในหมวดหมู่นี้')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal max-w-xs mx-auto mb-4">
              {viewMode === 'policies'
                ? 'เมื่อผู้ดูแลระบบเผยแพร่นโยบายและระเบียบปฏิบัติใหม่ ข้อมูลจะแสดงให้เห็นที่นี่ทันที'
                : 'สามารถตรวจสอบประกาศอื่น ๆ หรือกดล้างการค้นหาเพื่อดูข้อมูลทั้งหมด'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1c232f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        )}

      </main>

      {/* ========== 5. COMPANY DIRECTORY & AFFILIATES SHOWCASE ========== */}
      <section className="bg-slate-100/70 dark:bg-[#181e28] border-t border-slate-200 dark:border-[#364356] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-[#f89919] bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60">
              Corporate Affiliates
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              กลุ่มบริษัทในเครือ ASCG Group
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              เครือข่ายธุรกิจด้านวิศวกรรม เทคโนโลยี และการบริหารโครงการแบบครบวงจร
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {COMPANIES.map((c) => (
              <div
                key={c.prefix}
                className="bg-white dark:bg-[#262f3f] p-4 rounded-2xl border border-slate-200/80 dark:border-[#364356] shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center group"
              >
                <div className="h-12 w-full flex items-center justify-center mb-2">
                  <img src={c.logo} alt={c.name} className="max-h-10 max-w-full object-contain grayscale group-hover:grayscale-0 transition" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.prefix}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1 font-normal">{c.name.replace('บริษัท ', '').replace(' จำกัด', '')}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========== 6. QUICK SERVICES & SUPPORT FOOTER ========== */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800/80">
            
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-base mb-3">
                <img src={logo} alt="ASCG Group" className="h-6 w-auto object-contain brightness-0 invert" />
                <span>ASCG Global Group Co., Ltd.</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md font-normal mb-4">
                ศูนย์กลางระบบสารสนเทศและการบริหารจัดการทรัพยากรบุคคล (Enterprise Portal & IT Infrastructure Hub) 
                เพื่อประสิทธิภาพสูงสุดของบุคลากรในเครือ
              </p>
              <div className="flex items-center gap-3 text-slate-500">
                <span>© {new Date().getFullYear()} ASCG Group. All Rights Reserved.</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">บริการด่วน</h5>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/report-it')} className="hover:text-amber-400 transition flex items-center gap-1.5">
                    <Headset size={13} /> แจ้งซ่อมและบริการ IT
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSwitchMode('policies')} className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ShieldCheck size={13} /> นโยบายและระเบียบปฏิบัติ
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-amber-400 transition flex items-center gap-1.5">
                    <LogIn size={13} /> เข้าสู่ระบบพอร์ทัล
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: IT Support Contact */}
            <div>
              <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">ติดต่อทีมสนับสนุน IT</h5>
              <p className="text-slate-400 leading-relaxed font-normal mb-1">
                ฝ่ายเทคโนโลยีสารสนเทศ (IT Department)
              </p>
              <p className="text-slate-400">
                เวลาทำการ: จันทร์ - ศุกร์ 08:30 - 17:30 น.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-slate-400">
            <div>ASCG Enterprise Portal — ระบบสารสนเทศและบริการกลางองค์กร</div>
            <div className="text-slate-400">ดูแลและพัฒนาโดย ฝ่ายเทคโนโลยีสารสนเทศ (IT Department)</div>
          </div>
        </div>
      </footer>

      {/* ========== 7. RICH READER MODAL (LARGE FULL-RESOLUTION VIEW) ========== */}
      {selectedAnnouncement && (() => {
        const badge = getBadgeStyle(selectedAnnouncement.type);
        const isPolicyModal = selectedAnnouncement.type === 'นโยบายองค์กร';
        const imageUrl = selectedAnnouncement.cover_image 
          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/announcements/${selectedAnnouncement.cover_image}` 
          : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
            
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
              onClick={() => setSelectedAnnouncement(null)}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-[#262f3f] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#364356] overflow-hidden flex flex-col max-h-[94vh] z-10 animate-scale-in">
              
              {/* Modal Sticky Header Bar */}
              <div className="p-4 sm:p-5 bg-white dark:bg-[#1c232f] border-b border-slate-100 dark:border-[#364356] flex items-center justify-between gap-4 flex-shrink-0 z-20">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span 
                    style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                    {selectedAnnouncement.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock size={12} className="text-slate-400" />
                    {formatDate(selectedAnnouncement.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {imageUrl && (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#262f3f] hover:bg-slate-200 dark:hover:bg-[#303b4e] transition cursor-pointer"
                      title="เปิดดูรูปภาพขนาดเต็มในแท็บใหม่"
                    >
                      <ArrowUpRight size={14} />
                      <span className="hidden sm:inline">ดูรูปขนาดเต็ม</span>
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-[#262f3f] hover:bg-slate-200 dark:hover:bg-[#303b4e] text-slate-700 dark:text-slate-200 transition active:scale-95 ml-1 cursor-pointer"
                    title="ปิดหน้าต่าง (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50 dark:bg-[#1e2430]">
                
                {/* Main Title */}
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug mb-3">
                  {selectedAnnouncement.title}
                </h3>

                {/* Content Text (if any) */}
                {selectedAnnouncement.content && (
                  <div className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal mb-6 bg-white dark:bg-[#262f3f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#364356] shadow-2xs">
                    {selectedAnnouncement.content}
                  </div>
                )}

                {/* Large High-Resolution Poster / Image */}
                {imageUrl && (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="relative group w-full flex justify-center bg-white dark:bg-[#262f3f] p-2 sm:p-4 rounded-3xl border border-slate-200 dark:border-[#364356] shadow-md">
                      <img
                        src={imageUrl}
                        alt={selectedAnnouncement.title}
                        className="w-full max-w-3xl h-auto object-contain rounded-2xl shadow-xs"
                      />
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-6 right-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md shadow-lg transition transform hover:scale-105 cursor-pointer"
                      >
                        <ArrowUpRight size={14} />
                        <span>ขยายรูปภาพเต็มจอ</span>
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-white dark:bg-[#1c232f] border-t border-slate-100 dark:border-[#364356] flex items-center justify-between gap-3 flex-shrink-0">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Building2 size={14} className="text-slate-400" />
                  <span>ฝ่ายบริหารและทรัพยากรบุคคลส่วนกลาง (CorpHub Management)</span>
                </div>

                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                    isPolicyModal
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-[#f89919] hover:bg-[#d97c08] shadow-amber-500/20'
                  }`}
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
