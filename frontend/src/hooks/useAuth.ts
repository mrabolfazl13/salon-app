import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: number
  fullName: string
  email: string
  phone: string
  role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Mock API call
          await new Promise((resolve) => setTimeout(resolve, 1500))
          
          const user = {
            id: 1,
            fullName: 'علی محمدی',
            email,
            phone: '09123456789',
            role: 'user' as const,
            isVerified: true,
          }
          
          set({
            user,
            token: 'mock-token',
            isAuthenticated: true,
            isLoading: false,
          })
          
          toast.success('ورود موفقیت‌آمیز!')
        } catch (error) {
          set({ isLoading: false })
          toast.error('خطا در ورود')
          throw error
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500))
          toast.success('ثبت‌نام موفقیت‌آمیز!')
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          toast.error('خطا در ثبت‌نام')
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        toast.success('خروج موفقیت‌آمیز!')
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...data } })
          toast.success('اطلاعات به‌روزرسانی شد!')
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useAuthRedirect = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
}