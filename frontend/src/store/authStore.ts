import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth'

interface User {
  id: number
  fullName: string
  phone: string
  role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
  isVerified: boolean
  is_active?: boolean
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
            const response = await authService.getMe()
            set({
              user: response.user,
              isAuthenticated: true,
              hasInitialized: true,
            })
          } catch (error) {
            set({ isAuthenticated: false, user: null, hasInitialized: true })
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
            user: response.user,
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
          const response = await authService.register(data)
          
          // Store token in localStorage for API interceptor
          localStorage.setItem('auth-token', response.access_token)
          
          set({
            user: response.user,
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
          const response = await authService.getMe()
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isAuthenticated: false, user: null, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)