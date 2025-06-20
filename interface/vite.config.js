import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/currently-playing': 'http://127.0.0.1:8888',
      '/lastfm': 'http://localhost:8888',
    }
  }
})
