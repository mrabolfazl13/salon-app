// frontend/src/types/shift.ts
// قرارداد نوعی شیفت پرسنل (P020) — آینهٔ backend/app/schemas/staff_shift.py
// بک‌اند تاریخ‌ها را به وقت تهران (+03:30) برمی‌گرداند؛ ورودی naive هم همان‌جا وقت
// تهران تلقی می‌شود، پس datetime-local مستقیم و بدون تبدیل ارسال می‌شود.

export type ShiftStatus = 'scheduled' | 'done' | 'cancelled'

export interface ShiftRow {
  id: number
  venue_id: number
  user_id: number
  user_name: string | null
  position: string | null
  starts_at: string
  ends_at: string
  duration_min: number
  status: ShiftStatus
  notes: string | null
  created_by: number | null
}

export interface ShiftListResponse {
  items: ShiftRow[]
  total: number
}

export interface ShiftStaffSummary {
  user_id: number
  user_name: string | null
  position: string | null
  shifts: number
  scheduled_min: number
  done_min: number
  cancelled: number
}

export interface ShiftSummaryResponse {
  venue_id: number
  date_from: string
  date_to: string
  total_shifts: number
  total_min: number
  per_staff: ShiftStaffSummary[]
}

export interface ShiftCreatePayload {
  venue_id: number
  user_id: number
  starts_at: string
  ends_at: string
  notes?: string | null
}

export interface ShiftUpdatePayload {
  starts_at?: string
  ends_at?: string
  status?: ShiftStatus
  notes?: string | null
}

export interface ShiftListParams {
  from?: string
  to?: string
  status?: ShiftStatus
  user_id?: number
}
