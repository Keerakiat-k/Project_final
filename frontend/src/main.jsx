import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// --- Global Fetch Interceptor for JWT Token ---
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  if (typeof url === 'string' && url.includes('/api/') && !url.includes('/api/auth/login')) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return originalFetch(url, options);
};
// --------------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
