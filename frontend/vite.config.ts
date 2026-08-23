import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    proxy: {
      '/api/varzesh3': {
        target: 'https://web-api.varzesh3.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/varzesh3/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://web-api.varzesh3.com')
            proxyReq.setHeader('Referer', 'https://web-api.varzesh3.com/')
          })
        },
      },
      '/api/varzesh3-v2': {
        target: 'https://web-api.varzesh3.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/varzesh3-v2/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://web-api.varzesh3.com')
            proxyReq.setHeader('Referer', 'https://web-api.varzesh3.com/')
          })
        },
      },
    },
  },
})