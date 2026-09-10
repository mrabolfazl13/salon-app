// frontend/src/types/membership.ts
// تایپ‌های سیستم اشتراک باشگاه‌های بدنسازی — آینه‌ی پاسخ‌های snake_case بک‌اند (schemas/membership.py)

export type PlanType = 'session' | 'sessions_pack' | 'monthly'
export type PurchaseStatus = 'pending' | 'paid' | 'cancelled'

export interface MembershipPlan {
  id: number
  venue_id: number
  title: string
  plan_type: PlanType
  price: number // تومان
  sessions_count: number | null
  duration_days: number | null
  description: string | null
  is_active: boolean
  created_at: string
}

export interface MembershipPlanCreate {
  venue_id: number
  title: string
  plan_type: PlanType
  price: number
  sessions_count?: number | null
  duration_days?: number | null
  description?: string | null
}

export interface MembershipPlanUpdate {
  title?: string
  price?: number
  sessions_count?: number | null
  duration_days?: number | null
  description?: string | null
  is_active?: boolean
}

export interface MembershipPurchase {
  id: number
  plan_id: number
  user_id: number
  venue_id: number
  plan_title: string | null
  plan_type: PlanType | null
  venue_name: string | null
  amount: number
  status: PurchaseStatus
  transaction_id: string | null
  card_pan: string | null
  sessions_remaining: number | null
  starts_at: string | null
  expires_at: string | null
  created_at: string
  paid_at: string | null
}

export const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  session: 'جلسه‌ای',
  sessions_pack: 'پک جلسه‌ای',
  monthly: 'ماهانه',
}
