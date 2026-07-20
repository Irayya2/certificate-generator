import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://certificate-p5lg.onrender.com',
        changeOrigin: true,
      },
      '/generated': {
        target: 'https://certificate-p5lg.onrender.com',
        changeOrigin: true,
      },
      '/downloads': {
        target: 'https://certificate-p5lg.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
