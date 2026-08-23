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
    console.log("Token", token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient