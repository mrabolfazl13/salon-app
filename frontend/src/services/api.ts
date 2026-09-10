// frontend/src/services/api.ts
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Helper to get token from zustand persist store
const getToken = (): string | null => {
  // First try direct localStorage key (set during login/register)
  const directToken = localStorage.getItem('auth-token')
  if (directToken) return directToken

  // Fallback: read from zustand persist store
  try {
    const persisted = localStorage.getItem('auth-storage')
    if (persisted) {
      const parsed = JSON.parse(persisted)
      const token = parsed?.state?.token
      if (token) {
        // Sync back to auth-token for consistency
        localStorage.setItem('auth-token', token)
        return token
      }
    }
  } catch {
    // Ignore parse errors
  }

  return null
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// پاسخ‌های 401 را فقط یک‌بار پردازش می‌کنیم تا از redirect loop جلوگیری شود
let isHandling401 = false

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isHandling401) {
      // فقط در صورتی که درخواست مربوط به خودِ ورود نباشد
      const url: string = error.config?.url || ''
      const isAuthCall = url.includes('/auth/login')
      if (!isAuthCall) {
        isHandling401 = true
        // پاک‌سازی کامل هر دو محل ذخیره‌سازی توکن
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-storage')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
