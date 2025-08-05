// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // bu yerda kerakli path bo‘lsa yozing, default uchun '/' qoladi
})
