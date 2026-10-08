import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // مقصد پروکسی dev: VITE_PROXY_TARGET ← origin آدرس مطلق VITE_API_URL ← بک‌اند لوکال
  const absApi = /^https?:\/\//.test(env.VITE_API_URL || '') ? env.VITE_API_URL : ''
  const proxyTarget = env.VITE_PROXY_TARGET || (absApi ? new URL(absApi).origin : 'http://localhost:8000')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // Code splitting optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/icons-material'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-utils': ['date-fns', 'jalaali-js', 'framer-motion'],
          },
        },
      },
      // Enable source maps for production debugging
      sourcemap: true,
      // Minify with terser
      minify: 'terser',
      // Chunk size warning limit (500KB)
      chunkSizeWarningLimit: 500,
      // Target modern browsers for smaller bundles
      target: 'es2020',
    },
    server: {
      host: '0.0.0.0',
      port: 3001,
      open: false,
      proxy: {
        // API بک‌اند به‌صورت same-origin → بدون درگیری CORS کلاینت (localhost:3001)
        // هر Location مطلقِ ریدایرکت (مثل 307 اسلش انتهایی) را نسبی می‌کنیم تا مرورگر
        // همان origin دِو را حفظ کند — nginx بک‌اند Host را بدون پورت بازمی‌گرداند
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, req) => {
              const loc = proxyRes.headers['location']
              if (loc && /^https?:\/\//.test(loc)) {
                try {
                  const u = new URL(loc)
                  if (u.host !== req.headers.host) {
                    proxyRes.headers['location'] = u.pathname + u.search
                  }
                } catch {
                  /* Location نامعتبر را دست نمی‌زنیم */
                }
              }
            })
          },
        },
        // WebSocket اعلان‌ها (کلوز 4401/4403 مطابق بک‌اند)
        '/ws': {
          target: proxyTarget,
          ws: true,
          changeOrigin: false,
        },
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
  }
})