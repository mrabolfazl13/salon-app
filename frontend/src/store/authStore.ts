import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth'
import type { RawUser } from '@/services/auth'

interface User {
  id: number
  fullName: string
  phone: string
  role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
  isVerified: boolean
  isActive: boolean
  createdAt?: string
}

// بک‌اند فیلدها را با snake_case برمی‌گرداند؛ در اینجا به camelCase تبدیل می‌کنیم
function normalizeUser(raw: RawUser | null | undefined): User | null {
  if (!raw) return null
  return {
    id: raw.id,
    fullName: raw.full_name || '',
    phone: raw.phone || '',
    role: raw.role || 'user',
    isVerified: raw.is_verified ?? false,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at,
  }
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasInitialized: boolean
  login: (phone: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  fetchUser: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasInitialized: false,

      initialize: async () => {
        const { token } = get()
        if (token) {
          try {
            const me = await authService.getMe()
            set({
              user: normalizeUser(me),
              isAuthenticated: true,
              hasInitialized: true,
            })
          } catch (error) {
            localStorage.removeItem('auth-token')
            set({ isAuthenticated: false, user: null, token: null, hasInitialized: true })
          }
        } else {
          set({ hasInitialized: true })
        }
      },

      login: async (phone: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login({ phone, password })

          // Store token in localStorage for API interceptor
          localStorage.setItem('auth-token', response.access_token)

          set({
            user: normalizeUser(response.user),
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            hasInitialized: true,
          })
        } catch (error) {
          set({ isLoading: false, hasInitialized: true })
          throw error
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          // بک‌اند پس از ثبت‌نام توکن برنمی‌گرداند؛ احراز هوایی انجام نمی‌شود
          await authService.register(data)
          set({
            isLoading: false,
            hasInitialized: true,
            isAuthenticated: false,
            token: null,
            user: null,
          })
        } catch (error) {
          set({ isLoading: false, hasInitialized: true })
          throw error
        }
      },

      logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('auth-token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...data } })
        }
      },

      fetchUser: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        set({ isLoading: true })
        try {
          const me = await authService.getMe()
          set({
            user: normalizeUser(me),
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          localStorage.removeItem('auth-token')
          set({ isAuthenticated: false, user: null, token: null, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      // فقط داده‌های ماندگار ذخیره می‌شوند (نه state‌های گذرا)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)