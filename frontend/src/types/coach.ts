// frontend/src/types/coach.ts
// قرارداد نوعی نقش مربی (P004) — آینهٔ پاسخ‌های app/services/coach_service.py
// بک‌اند snake_case برمی‌گرداند؛ همان‌جا نگه داشته شده تا تبدیلِ بی‌مورد اضافه نشود.

export type CoachSessionStatus = 'scheduled' | 'attended' | 'absent' | 'cancelled'

export interface CoachSession {
  id: number
  coach_id: number
  coach_name: string | null
  client_id: number
  client_name: string | null
  client_phone: string | null
  venue_id: number | null
  slot_id: number | null
  starts_at: string
  ends_at: string
  duration_min: number
  status: CoachSessionStatus
  fee: number
  fee_settled: boolean
  notes: string | null
  attended_at: string | null
}

export interface CoachSessionList {
  total: number
  items: CoachSession[]
}

export interface CoachDashboardData {
  today: CoachSession[]
  upcoming: CoachSession[]
  today_count: number
  month_sessions: number
  month_revenue: number
  month_outstanding: number
  active_clients: number
}

export interface CoachClient {
  user_id: number
  full_name: string
  phone: string
  sessions: number
  last_session_at: string | null
  fee_total: number
}

export interface CoachSessionCreatePayload {
  client_phone: string
  starts_at: string
  duration_min: number
  fee?: number
  venue_id?: number | null
  slot_id?: number | null
  notes?: string | null
}

export interface CoachSessionUpdatePayload {
  starts_at?: string
  duration_min?: number
  fee?: number
  venue_id?: number | null
  slot_id?: number | null
  notes?: string | null
}

export interface CoachSessionsParams {
  status?: CoachSessionStatus
  date_from?: string
  date_to?: string
  coach_id?: number
  as_client?: boolean
  limit?: number
  offset?: number
}
