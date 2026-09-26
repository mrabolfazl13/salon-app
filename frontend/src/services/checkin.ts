import { api } from './api'

export interface QrCodeData {
  booking_id: number
  check_in_code: string
  qr_data: string
  checked_in: boolean
  checked_in_at?: string
}

export interface CheckInStatus {
  booking_id: number
  checked_in: boolean
  checked_in_at?: string
  checked_in_by?: number
}

export interface VerifyCheckInResponse {
  success: boolean
  message: string
  booking_id: number
  checked_in_at: string
}

export const checkinService = {
  /** Get QR code data for a booking */
  async getQrCode(bookingId: number): Promise<QrCodeData> {
    const { data } = await api.get(`/checkin/booking/${bookingId}/qr-code`)
    return data
  },

  /** Verify check-in code (manager only) */
  async verifyCheckIn(checkInCode: string): Promise<VerifyCheckInResponse> {
    const { data } = await api.post('/checkin/verify', null, {
      params: { check_in_code: checkInCode },
    })
    return data
  },

  /** Get check-in status */
  async getStatus(bookingId: number): Promise<CheckInStatus> {
    const { data } = await api.get(`/checkin/booking/${bookingId}/status`)
    return data
  },
}
