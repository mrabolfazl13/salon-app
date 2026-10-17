// frontend/src/types/membership.ts
// تایپ‌های سیستم اشتراک باشگاه‌های بدنسازی — آینه‌ی پاسخ‌های snake_case بک‌اند (schemas/membership.py)

export type PlanType = 'session' | 'sessions_pack' | 'monthly'
export type PurchaseStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export interface MembershipPlan {
  id: number
  venue_id: number
  title: string
  plan_type: PlanType
  price: number // ریال
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

export type SessionEventType = 'consumed' | 'refunded'

// ردیفِ ممیزیِ «چه کسی، کِی» — فقط مدیرِ همان سالن می‌تواند بخواندش
export interface MembershipSessionEvent {
  id: number
  purchase_id: number
  venue_id: number
  actor_id: number | null
  actor_name: string | null
  event_type: SessionEventType
  sessions_remaining_after: number | null
  amount: number | null
  detail: string | null
  created_at: string
}

export const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  session: 'جلسه‌ای',
  sessions_pack: 'پک جلسه‌ای',
  monthly: 'ماهانه',
}
