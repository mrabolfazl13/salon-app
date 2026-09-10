// frontend/src/services/membership.ts
// سرویس API سیستم اشتراک بدنسازی — تمام مسیرهای /memberships بک‌اند (api/v1/memberships.py)

import apiClient from './api'
import type {
  MembershipPlan,
  MembershipPlanCreate,
  MembershipPlanUpdate,
  MembershipPurchase,
} from '@/types/membership'

export interface CardPayData {
  card_number: string
  cvv: string
  month: number
  year: number
}

export const membershipService = {
  // ─────────────────────────── پلن‌ها ───────────────────────────

  getPlans: async (venueId: number, includeInactive = false): Promise<MembershipPlan[]> => {
    const { data } = await apiClient.get('/memberships/plans', {
      params: { venue_id: venueId, include_inactive: includeInactive },
    })
    return data
  },

  createPlan: async (payload: MembershipPlanCreate): Promise<MembershipPlan> => {
    const { data } = await apiClient.post('/memberships/plans', payload)
    return data
  },

  updatePlan: async (planId: number, payload: MembershipPlanUpdate): Promise<MembershipPlan> => {
    const { data } = await apiClient.put(`/memberships/plans/${planId}`, payload)
    return data
  },

  deactivatePlan: async (planId: number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/memberships/plans/${planId}`)
    return data
  },

  // ─────────────────────────── خرید / پرداخت ───────────────────────────

  createPurchase: async (planId: number): Promise<MembershipPurchase> => {
    const { data } = await apiClient.post('/memberships/purchases', { plan_id: planId })
    return data
  },

  payPurchase: async (purchaseId: number, card: CardPayData): Promise<MembershipPurchase> => {
    const { data } = await apiClient.post(`/memberships/purchases/${purchaseId}/pay`, card)
    return data
  },

  getMyPurchases: async (): Promise<MembershipPurchase[]> => {
    const { data } = await apiClient.get('/memberships/my')
    return data
  },

  // ─────────────────────────── مدیر سالن ───────────────────────────

  consumeSession: async (purchaseId: number): Promise<MembershipPurchase> => {
    const { data } = await apiClient.post(`/memberships/purchases/${purchaseId}/consume`)
    return data
  },

  getVenuePurchases: async (venueId: number): Promise<MembershipPurchase[]> => {
    const { data } = await apiClient.get(`/memberships/venue/${venueId}/purchases`)
    return data
  },
}
