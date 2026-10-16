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

// ─────────── C5 — تحلیل تقاضا و پیشنهاد قیمت (فقط‌خواندنی) ───────────

export interface OccupancyBucket {
  /** date.weekday() پایتون: 0=دوشنبه … 6=یکشنبه — همان کلید قوانین */
  weekday: number
  hour: number
  label: string
  slots: number
  bookings: number
  /** null یعنی مخرجی برای تقسیم نبود (نه صفرِ گمراه‌کننده) */
  occupancy: number | null
  avg_paid: number | null
}

export interface OccupancyReport {
  venue_id: number
  days: number
  start_date: string
  end_date: string
  total_slots: number
  total_bookings: number
  overall_occupancy: number | null
  overall_avg_paid: number | null
  buckets: OccupancyBucket[]
}

export type SuggestionConfidence = 'high' | 'medium' | 'low'

export interface PriceSuggestion {
  venue_id: number
  slot_date: string
  start_time: string
  weekday: number
  hour: number
  days: number
  duration: number
  base_price: number
  engine_price: number
  rules: PricingPreviewRule[]
  floor_price: number
  ceiling_price: number
  recommended_price: number
  /** false ⇒ پیشنهاد = قیمت موتور (داده کم است یا clamp برابرش کرده) */
  applies: boolean
  confidence: SuggestionConfidence
  delta_percent: number
  demand_gap: number | null
  bucket: OccupancyBucket | null
  overall_occupancy: number | null
  reasons: string[]
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

  occupancy: async (venueId: number, days?: number): Promise<OccupancyReport> => {
    const response = await apiClient.get('/pricing/occupancy', {
      params: { venue_id: venueId, days: days ?? null },
    })
    return response.data
  },

  suggestion: async (data: {
    venue_id: number
    slot_date: string
    start_time: string
    duration?: number
    days?: number
  }): Promise<PriceSuggestion> => {
    const response = await apiClient.get('/pricing/suggestion', {
      params: {
        venue_id: data.venue_id,
        slot_date: data.slot_date,
        start_time: data.start_time,
        duration: data.duration ?? 90,
        days: data.days ?? null,
      },
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