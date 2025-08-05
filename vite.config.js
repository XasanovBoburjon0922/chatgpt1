import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host:true,
    proxy: {
      '/api': {
        target: 'https://edutest.al-jabr-edu.uz/', // Your backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
