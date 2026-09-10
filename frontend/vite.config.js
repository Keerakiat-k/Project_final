import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // เพิ่มบรรทัดนี้

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // เพิ่ม plugin นี้เข้าไป
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})