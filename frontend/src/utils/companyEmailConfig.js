import logoSvg from '../assets/logo.svg';

export const COMPANY_EMAIL_CONFIGS = {
  'CORP': {
    nameEn: 'CorpHub Group Co., Ltd.',
    nameTh: 'บริษัท คอร์ปฮับ กรุ๊ป จำกัด',
    domain: 'corphub.com',
    pop3: { server: 'mail.corphub.com', port: '995', ssl: 'SSL' },
    smtp: { server: 'mail.corphub.com', port: '465', ssl: 'SSL' },
    logo: logoSvg
  },
  'TECH': {
    nameEn: 'CorpHub Technology Co., Ltd.',
    nameTh: 'บริษัท คอร์ปฮับ เทคโนโลยี จำกัด',
    domain: 'tech.corphub.com',
    pop3: { server: 'mail.tech.corphub.com', port: '995', ssl: 'SSL' },
    smtp: { server: 'mail.tech.corphub.com', port: '465', ssl: 'SSL' },
    logo: logoSvg
  },
  'INNO': {
    nameEn: 'CorpHub Innovation Co., Ltd.',
    nameTh: 'บริษัท คอร์ปฮับ อินโนเวชั่น จำกัด',
    domain: 'inno.corphub.com',
    pop3: { server: 'mail.inno.corphub.com', port: '995', ssl: 'SSL' },
    smtp: { server: 'mail.inno.corphub.com', port: '465', ssl: 'SSL' },
    logo: logoSvg
  }
};

export const getCompanyConfig = (prefix) => {
  return COMPANY_EMAIL_CONFIGS[prefix] || COMPANY_EMAIL_CONFIGS['CORP'];
};

const phoneticMap = {
  'A': 'เอใหญ่', 'B': 'บีใหญ่', 'C': 'ซีใหญ่', 'D': 'ดีใหญ่', 'E': 'อีใหญ่', 'F': 'เอฟใหญ่', 'G': 'จีใหญ่', 'H': 'เอชใหญ่', 'I': 'ไอใหญ่', 'J': 'เจใหญ่', 'K': 'เคใหญ่', 'L': 'แอลใหญ่', 'M': 'เอ็มใหญ่', 'N': 'เอ็นใหญ่', 'O': 'โอใหญ่', 'P': 'พีใหญ่', 'Q': 'คิวใหญ่', 'R': 'อาร์ใหญ่', 'S': 'เอสใหญ่', 'T': 'ทีใหญ่', 'U': 'ยูใหญ่', 'V': 'วีใหญ่', 'W': 'ดับบลิวใหญ่', 'X': 'เอ็กซ์ใหญ่', 'Y': 'วายใหญ่', 'Z': 'แซดใหญ่',
  'a': 'เอ', 'b': 'บี', 'c': 'ซี', 'd': 'ดี', 'e': 'อี', 'f': 'เอฟ', 'g': 'จี', 'h': 'เอช', 'i': 'ไอ', 'j': 'เจ', 'k': 'เค', 'l': 'แอล', 'm': 'เอ็ม', 'n': 'เอ็น', 'o': 'โอ', 'p': 'พี', 'q': 'คิว', 'r': 'อาร์', 's': 'เอส', 't': 'ที', 'u': 'ยู', 'v': 'วี', 'w': 'ดับบลิว', 'x': 'เอ็กซ์', 'y': 'วาย', 'z': 'แซด',
  '0': 'ศูนย์', '1': 'หนึ่ง', '2': 'สอง', '3': 'สาม', '4': 'สี่', '5': 'ห้า', '6': 'หก', '7': 'เจ็ด', '8': 'แปด', '9': 'เก้า',
  '@': 'แอดไซต์', '!': 'ตกใจ', '#': 'ชาร์ป', '$': 'ดอลลาร์', '%': 'เปอร์เซ็นต์', '&': 'แอนด์', '*': 'ดอกจัน'
};

export const getPhoneticThai = (text) => {
  if (!text) return '';
  let result = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result.push(phoneticMap[char] || char);
  }
  return result.join(' ');
};

export const generateEmail = (firstNameEn, lastNameEn, companyPrefix) => {
  if (!firstNameEn || !lastNameEn) return '';
  const domain = COMPANY_EMAIL_CONFIGS[companyPrefix]?.domain || 'corphub.com';
  const fName = firstNameEn.trim().toLowerCase();
  const lInitial = lastNameEn.trim().charAt(0).toLowerCase();
  return `${fName}.${lInitial}@${domain}`;
};

export const generatePassword = (firstNameEn, lastNameEn) => {
  if (!firstNameEn || !lastNameEn) return 'P@ssw0rd';
  const fInitial = firstNameEn.trim().charAt(0).toUpperCase();
  const lInitial = lastNameEn.trim().charAt(0).toUpperCase();
  return `P@ssw0rd${fInitial}${lInitial}`;
};
