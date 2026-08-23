import apiClient from './api'

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

interface AuthResponse {
  user: {
    id: number
    fullName: string
    phone: string
    role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
    isActive: boolean
    isVerified: boolean
  }
  access_token: string
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },

  forgotPassword: async (data: { phone: string }) => {
    const response = await apiClient.post('/auth/forgot-password', data)
    return response.data
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const response = await apiClient.post('/auth/reset-password', data)
    return response.data
  },
}