import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://web-production-85cbf.up.railway.app',
        changeOrigin: true,
        ws: true,
      },
      '/static': {
        target: 'https://web-production-85cbf.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
