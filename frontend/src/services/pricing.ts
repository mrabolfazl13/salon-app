// frontend/src/services/pricing.ts
// قرارداد دقیق با backend/app/api/v1/pricing.py — موتور قیمت سمت سرور.
// معنای percent = درصد×۱۰۰ (۱۲٪ ⇒ 1200)، fixed = ریال با علامت، absolute = ریالِ جایگزین.
import apiClient from './api'

export type ModifierType = 'percent' | 'fixed' | 'absolute'

export interface PricingRule {
  id: number
  venue_id: number
  /** date.weekday() پایتون: 0=دوشنبه … 6=یکشنبه — null یعنی هر روز */
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  holiday_applies: boolean
  modifier_type: ModifierType
  /** percent×100 | fixed/absolute ریال */
  value: number
  priority: number
  is_active: boolean
  label: string
}

export interface PricingRulePayload {
  venue_id: number
  day_of_week: number | null
  start_time?: string | null
  end_time?: string | null
  holiday_applies: boolean
  modifier_type: ModifierType
  value: number
  priority: number
  label: string
  is_active: boolean
}

export interface PricingPreviewRule {
  rule_id: number
  label: string
  modifier_type: ModifierType
  value: number
  delta: number
}

export interface PricingPreview {
  venue_id: number
  slot_date: string
  start_time: string
  base_price: number
  final_price: number
  is_holiday: boolean
  rules: PricingPreviewRule[]
}

export const pricingService = {
  listRules: async (venueId: number, includeInactive = true): Promise<PricingRule[]> => {
    const response = await apiClient.get('/pricing/rules', {
      params: { venue_id: venueId, include_inactive: includeInactive },
    })
    return response.data
  },

  createRule: async (data: PricingRulePayload): Promise<PricingRule> => {
    const response = await apiClient.post('/pricing/rules', data)
    return response.data
  },

  updateRule: async (ruleId: number, data: Partial<PricingRulePayload>): Promise<PricingRule> => {
    const response = await apiClient.put(`/pricing/rules/${ruleId}`, data)
    return response.data
  },

  deleteRule: async (ruleId: number) => {
    const response = await apiClient.delete(`/pricing/rules/${ruleId}`)
    return response.data
  },

  preview: async (data: {
    venue_id: number
    slot_date: string
    start_time: string
    base_price?: number | null
    duration?: number
  }): Promise<PricingPreview> => {
    const response = await apiClient.post('/pricing/preview', {
      venue_id: data.venue_id,
      slot_date: data.slot_date,
      start_time: data.start_time,
      base_price: data.base_price ?? null,
      duration: data.duration ?? 90,
    })
    return response.data
  },

  setDefaultPrice: async (venueId: number, defaultSlotPrice: number) => {
    const response = await apiClient.put(`/pricing/venue/${venueId}/default-price`, {
      default_slot_price: defaultSlotPrice,
    })
    return response.data
  },
}