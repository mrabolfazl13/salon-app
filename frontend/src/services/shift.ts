// frontend/src/services/shift.ts
// سرویس ماژول /api/v1/shifts — آینهٔ backend/app/api/v1/shift.py
// نام پارامترهای بازهٔ زمانی `from`/`to` است (alias در بک‌اند)، نه date_from.

import apiClient from './api'

import type {
  ShiftCreatePayload, ShiftListParams, ShiftListResponse, ShiftRow,
  ShiftSummaryResponse, ShiftUpdatePayload,
} from '@/types/shift'

export const shiftService = {
  list: async (venueId: number, params: ShiftListParams = {}): Promise<ShiftListResponse> => {
    const response = await apiClient.get('/shifts', { params: { venue_id: venueId, ...params } })
    return response.data
  },

  summary: async (venueId: number, from: string, to: string): Promise<ShiftSummaryResponse> => {
    const response = await apiClient.get('/shifts/summary', {
      params: { venue_id: venueId, from, to },
    })
    return response.data
  },

  create: async (data: ShiftCreatePayload): Promise<ShiftRow> => {
    const response = await apiClient.post('/shifts', data)
    return response.data
  },

  update: async (shiftId: number, data: ShiftUpdatePayload): Promise<ShiftRow> => {
    const response = await apiClient.put(`/shifts/${shiftId}`, data)
    return response.data
  },

  cancel: async (shiftId: number): Promise<ShiftRow> => {
    const response = await apiClient.post(`/shifts/${shiftId}/cancel`)
    return response.data
  },

  /** خروجی CSV ماهانه (BOM ⇒ در Excel فارسی باز می‌شود) — قالب month=YYYY-MM */
  exportCsv: async (venueId: number, month: string): Promise<Blob> => {
    const response = await apiClient.get('/shifts/export', {
      params: { venue_id: venueId, month },
      responseType: 'blob',
    })
    return response.data
  },
}
