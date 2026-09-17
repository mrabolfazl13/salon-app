// frontend/src/services/holidays.ts
// قرارداد با backend/app/api/v1/holidays.py — یکتایی تاریخ روی کل تقویم؛
// مناسبت سراسری (venue_id=null) فقط توسط سرپرست سیستم قابل ثبت است.
import apiClient from './api'

export interface Holiday {
  id: number
  holiday_date: string
  name: string
  is_national: boolean
  venue_id: number | null
}

export interface HolidayBulkItem {
  date: string
  name: string
  is_national: boolean
  venue_id: number | null
}

export const holidayService = {
  list: async (params?: { start?: string; end?: string }): Promise<Holiday[]> => {
    const response = await apiClient.get('/holidays/', { params: params ?? {} })
    return response.data
  },

  create: async (data: {
    holiday_date: string
    name: string
    is_national: boolean
    venue_id: number | null
  }): Promise<Holiday> => {
    const response = await apiClient.post('/holidays/', data)
    return response.data
  },

  bulkCreate: async (items: HolidayBulkItem[]): Promise<{ requested: number; created: number; ids: number[] }> => {
    const response = await apiClient.post('/holidays/bulk', { items })
    return response.data
  },

  remove: async (holidayId: number) => {
    const response = await apiClient.delete(`/holidays/${holidayId}`)
    return response.data
  },
}