// frontend/src/services/crm.ts
// تایپ‌ها و سرویس ماژول /api/v1/crm — آینه‌ی backend/app/api/v1/crm.py + schemas/customer.py
// + app/services/crm_service.py (ردیف مشتری و آمار — پاسخ دیکشنری ساختارمند).

import apiClient from './api'
import type { FinanceTransaction, AccountStatementResponse } from './finance'

// ─────────────── Enum‌ها ───────────────

export type CrmSegment = 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant' | (string & {})
export type CrmListStatus = 'active' | 'inactive' | 'all'
export type CrmSort = 'spend' | 'last_visit' | 'bookings'

// ─────────────── ردیف مشتری (compute_customer_rows) ───────────────

export interface CrmCustomerRow {
  user_id: number
  full_name: string | null
  phone: string | null
  bookings_count: number
  total_spend: number
  /** مثبت = بدهکار (الگوی حساب‌های مالی) */
  balance_due: number
  /** موجودی امتیاز وفاداری (=SUM(points)) — بک‌اند crm_service */
  loyalty_balance?: number | null
  /** ISO تاریخ میلادی (YYYY-MM-DD) یا null */
  last_booking_date: string | null
  first_seen: string | null
  customer_since_days: number | null
  is_vip: boolean
  tags: string[]
  notes: string | null
  marketing_consent: boolean
  inactive_days: number | null
  segment: CrmSegment
}

export interface CrmCustomerListResponse {
  items: CrmCustomerRow[]
  total: number
  limit: number
  offset: number
}

export interface CrmCustomerParams {
  venue_id: number
  search?: string
  is_vip?: boolean
  tag?: string
  segment?: string
  status?: CrmListStatus
  sort?: CrmSort
  limit?: number
  offset?: number
}

// ─────────────── جزئیات مشتری (GET /crm/customers/{user_id}) ───────────────

export interface CrmRecentBooking {
  id: number
  slot_id: number
  slot_date: string
  start_time: string
  status: string
  payment_amount: number | null
  booked_at: string
}

export interface CrmVenueCustomerFlags {
  is_vip: boolean
  /** رشته‌ی ویرگولی ذخیره‌شده در دیتابیس */
  tags: string
  notes: string | null
  marketing_consent: boolean
}

export interface CrmCustomerDetail {
  customer: CrmCustomerRow
  recent_bookings: CrmRecentBooking[]
  recent_payments: FinanceTransaction[]
  statement: AccountStatementResponse
  venue_customer: CrmVenueCustomerFlags | null
}

export interface CrmCustomerUpdatePayload {
  is_vip?: boolean
  tags?: string[]
  notes?: string
}

// ─────────────── آمار (stats_for) ───────────────

export interface CrmStats {
  total_customers: number
  segments: Record<string, number>
  inactive_count: number
  top_spenders: { user_id: number; full_name: string | null; total_spend: number }[]
  recent_new_customers: { user_id: number; full_name: string | null; first_seen: string | null }[]
}

// ─────────────── کمپین ───────────────

export interface CampaignCreatePayload {
  venue_id: number
  segment?: string | null
  customer_ids?: number[] | null
  title: string
  message: string
  discount_code?: string | null
}

export interface CampaignCreateResponse {
  campaign_id: number
  sent_count: number
  skipped_no_consent: number
}

export interface CampaignRow {
  id: number
  title: string
  message: string
  segment: string | null
  discount_code: string | null
  sent_count: number
  skipped_no_consent: number
  created_by: number | null
  created_by_name: string | null
  created_at: string | null
}

export interface CampaignListResponse {
  items: CampaignRow[]
  total: number
}

// ─────────────── consent ───────────────

export interface ConsentUpdatePayload {
  marketing_consent: boolean
  /** None ⇒ روی همه رکوردهای کاربر */
  venue_id?: number | null
}

export interface ConsentUpdateResponse {
  marketing_consent: boolean
  updated: number
}

// ─────────────── سرویس ───────────────

export const crmService = {
  listCustomers: async (params: CrmCustomerParams): Promise<CrmCustomerListResponse> => {
    const response = await apiClient.get('/crm/customers', { params })
    return response.data
  },

  getCustomer: async (userId: number, venueId: number): Promise<CrmCustomerDetail> => {
    const response = await apiClient.get(`/crm/customers/${userId}`, {
      params: { venue_id: venueId },
    })
    return response.data
  },

  updateCustomer: async (
    userId: number,
    venueId: number,
    data: CrmCustomerUpdatePayload,
  ): Promise<CrmCustomerRow> => {
    const response = await apiClient.put(`/crm/customers/${userId}`, data, {
      params: { venue_id: venueId },
    })
    return response.data
  },

  getStats: async (venueId: number): Promise<CrmStats> => {
    const response = await apiClient.get('/crm/stats', { params: { venue_id: venueId } })
    return response.data
  },

  createCampaign: async (
    data: CampaignCreatePayload,
  ): Promise<CampaignCreateResponse> => {
    const response = await apiClient.post('/crm/campaigns', data)
    return response.data
  },

  listCampaigns: async (
    venueId: number,
    limit = 50,
    offset = 0,
  ): Promise<CampaignListResponse> => {
    const response = await apiClient.get('/crm/campaigns', {
      params: { venue_id: venueId, limit, offset },
    })
    return response.data
  },

  // self-service رضایت بازاریابی — فقط PUT در بک‌اند وجود دارد (GET ندارد)
  setConsent: async (data: ConsentUpdatePayload): Promise<ConsentUpdateResponse> => {
    const response = await apiClient.put('/crm/consent', data)
    return response.data
  },
}