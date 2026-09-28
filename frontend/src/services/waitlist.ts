import { apiClient as api } from './api'

export interface WaitlistEntry {
  id: number
  slot_id: number
  venue_name: string
  slot_date?: string
  start_time?: string
  position: number
  status: 'pending' | 'notified'
  created_at: string
  expires_at?: string
}

export interface WaitlistJoinResponse {
  id: number
  position: number
  message: string
}

export const waitlistService = {
  /** Join waitlist for a fully-booked slot */
  async join(slotId: number): Promise<WaitlistJoinResponse> {
    const { data } = await api.post(`/waitlist/join/${slotId}`)
    return data
  },

  /** Leave waitlist */
  async leave(slotId: number): Promise<{ message: string }> {
    const { data } = await api.post(`/waitlist/leave/${slotId}`)
    return data
  },

  /** Get user's active waitlist entries */
  async getMyWaitlist(): Promise<WaitlistEntry[]> {
    const { data } = await api.get('/waitlist/my')
    return data
  },

  /** Get waitlist for a specific slot (manager only) */
  async getSlotWaitlist(slotId: number): Promise<{ slot_id: number; total_waiting: number; entries: any[] }> {
    const { data } = await api.get(`/waitlist/slot/${slotId}`)
    return data
  },
}
