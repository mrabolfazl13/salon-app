export type UserRole = 'user' | 'venue_manager' | 'club_admin' | 'super_admin'

export interface User {
  id: number
  fullName: string
  email: string
  phone: string
  role: UserRole
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCreate {
  fullName: string
  email: string
  phone: string
  password: string
  role?: UserRole
}

export interface UserUpdate {
  fullName?: string
  email?: string
  phone?: string
  role?: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterRequest extends UserCreate {}

export interface RegisterResponse extends LoginResponse {}