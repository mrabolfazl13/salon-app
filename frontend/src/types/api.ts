export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  pages: number
}

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}