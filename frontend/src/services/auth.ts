import apiClient from './api'

// شکل خام کاربر از سمت بک‌اند (snake_case)
export interface RawUser {
  id: number
  phone: string
  full_name: string
  role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
  is_active?: boolean
  is_verified?: boolean
  created_at?: string
  last_login?: string | null
}

interface LoginData {
  phone: string
  password: string
}

interface RegisterData {
  phone: string
  full_name: string
  password: string
  role: 'user' | 'venue_manager'
}

interface LoginResponse {
  access_token: string
  token_type?: string
  user: RawUser
}

export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  // توجه: بک‌اند پس از ثبت‌نام توکن برنمی‌گرداند؛ کاربر باید وارد شود.
  register: async (data: RegisterData): Promise<RawUser> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  // پاسخ GET /auth/me مستقیماً خودِ شیء کاربر است
  getMe: async (): Promise<RawUser> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  // ===== مدیریت حساب کاربری =====

  updateProfile: async (data: { full_name?: string }): Promise<RawUser> => {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    // بک‌اند snake_case را انتظار دارد
    const response = await apiClient.post('/auth/change-password', {
      old_password: data.oldPassword,
      new_password: data.newPassword,
    })
    return response.data as { message: string }
  },

  forgotPassword: async (data: { phone: string }) => {
    const response = await apiClient.post('/auth/forgot-password', data)
    return response.data as { message: string; dev_code?: string }
  },

  resetPassword: async (data: { phone: string; code: string; newPassword: string }) => {
    const response = await apiClient.post('/auth/reset-password', {
      phone: data.phone,
      code: data.code,
      new_password: data.newPassword,
    })
    return response.data as { message: string }
  },

  // ===== تایید ایمیل (کد یکبار مصرف) — لازم برای رزرو =====

  requestEmailVerify: async (data: { phone: string; email: string }) => {
    const response = await apiClient.post('/auth/verify/email/request', data)
    return response.data as { message: string; dev_code?: string }
  },

  confirmEmailVerify: async (data: { phone: string; code: string }) => {
    const response = await apiClient.post('/auth/verify/email/confirm', data)
    return response.data as { message: string }
  },
}