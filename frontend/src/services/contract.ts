import apiClient from './api'

// شکل پاسخ قرارداد از سمت بک‌اند (snake_case)
export interface ContractData {
  id: number
  venue_id: number
  start_date: string
  end_date: string
  day_of_week: number
  start_time: string
  recurrence: 'weekly' | 'biweekly' | 'monthly'
  original_price: number
  discounted_price: number
  total_amount: number
  status: string
  description: string | null
}

export interface ContractCreateData {
  venueId: number
  startDate: string
  endDate: string
  dayOfWeek: number
  startTime: string
  recurrence: 'weekly' | 'biweekly' | 'monthly'
  discountedPrice: number
  description?: string
}

export const contractService = {
  // لیست قراردادهای کاربر فعلی
  getAll: async (): Promise<ContractData[]> => {
    const response = await apiClient.get('/contracts')
    return response.data
  },

  // جزئیات یک قرارداد
  getById: async (id: number): Promise<ContractData> => {
    const response = await apiClient.get(`/contracts/${id}`)
    return response.data
  },

  // ثبت قرارداد بلندمدت جدید
  create: async (data: ContractCreateData): Promise<ContractData> => {
    const response = await apiClient.post('/contracts', {
      venue_id: data.venueId,
      start_date: data.startDate,
      end_date: data.endDate,
      day_of_week: data.dayOfWeek,
      start_time: data.startTime,
      recurrence: data.recurrence,
      discounted_price: data.discountedPrice,
      description: data.description || null,
    })
    return response.data
  },
}