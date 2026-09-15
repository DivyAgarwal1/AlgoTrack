import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/atcoder': {
        target: 'https://atcoder.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/atcoder/, '')
      },
      '/api/leetcode': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/leetcode/, '')
      }
    }
  }
})


