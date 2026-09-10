// Central API Base URL helper for Production, Domain, LAN, and Localhost
export const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    // If accessing via domain name (e.g. portal.ascgglobalgroup.com), use relative path (standard HTTPS)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
      return '';
    }
    // Local dev fallback
    return `${protocol}//${hostname}:5000`;
  }
  return '';
};

export const API_BASE_URL = getApiBase();
export default API_BASE_URL;
