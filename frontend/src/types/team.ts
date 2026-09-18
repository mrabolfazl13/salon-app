// frontend/src/types/team.ts
// تایپ‌های سیستم تیم — آینه‌ی پاسخ‌های snake_case بک‌اند (schemas/team.py + api/v1/teams.py)

export type TeamVisibility = 'private' | 'public' | 'invite_only'
export type TeamRole = 'captain' | 'admin' | 'member'
export type TeamMemberStatus = 'pending' | 'active' | 'removed' | 'declined'
export type DuesPayMethod = 'cash' | 'gateway' | 'card_to_card'

export interface Team {
  id: number
  name: string
  description?: string | null
  sport: string
  logo_url?: string | null
  visibility: TeamVisibility
  captain_id: number
  captain_name?: string | null
  is_active: boolean
  member_count: number
  quota: number
  is_official: boolean
  official_since?: string | null
  created_at: string
  updated_at: string
  my_role: TeamRole | null
  my_status: TeamMemberStatus | null
  has_open_join_request: boolean
  has_pending_invitation: boolean
}

export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  full_name?: string | null
  phone?: string | null
  role: TeamRole
  status: TeamMemberStatus
  invited_by?: number | null
  joined_at: string
  left_at?: string | null
}

export interface TeamInvitation {
  id: number
  team_id: number
  team_name?: string | null
  member_id?: number | null
  invitee_user_id: number
  invitee_name?: string | null
  invited_by: number
  status: string
  expires_at?: string | null
  created_at: string
  answered_at?: string | null
}

export interface TeamJoinRequest {
  id: number
  team_id: number
  user_id: number
  full_name?: string | null
  status: string
  message?: string | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  created_at: string
}

export interface TeamDue {
  id: number
  team_id: number
  user_id: number
  full_name?: string | null
  title: string
  amount: number
  due_date: string // YYYY-MM-DD
  is_paid: boolean
  is_voided: boolean
  overdue: boolean
  paid_at?: string | null
  paid_by?: number | null
  payment_method?: DuesPayMethod | null
  payment_reference?: string | null
  transaction_id?: number | null
  void_reason?: string | null
  created_at: string
}

export interface TeamDuesGeneratePayload {
  amount: number // ریال — سهم سرانه هر عضو
  title: string
  due_date: string // YYYY-MM-DD
  member_user_ids?: number[]
}

export interface TeamDuesGenerateResult {
  created: number
  skipped: number
  per_user_amount: number
  total_amount: number
  items: TeamDue[]
}

export interface TeamDuesPayPayload {
  method: DuesPayMethod
  reference?: string | null
}

export interface TeamBalance {
  team_id: number
  dues_total: number
  dues_paid: number
  dues_unpaid: number
  dues_overdue_amount: number
  team_ledger_income: number
  team_ledger_expense: number
  team_account_balance: number
  net_balance: number
  as_of: string
}

export interface TeamBookingItem {
  id: number
  team_id: number
  booking_id: number
  created_at: string
  paid_by_user_id?: number | null
  booking_user_id?: number | null
  booking_user_name?: string | null
  venue_id?: number | null
  venue_name?: string | null
  slot_date?: string | null
  start_time?: string | null
  status?: string | null
  payment_amount?: number | null
}

export interface TeamAuditItem {
  id: number
  team_id: number
  actor_id?: number | null
  actor_name?: string | null
  action: string
  data: Record<string, unknown>
  created_at: string
}

export interface TeamPartner {
  team_id: number
  name: string
  sport: string
  captain_id: number
  captain_name?: string | null
  captain_phone?: string | null
  members_count: number
  member_count: number
  quota: number
  is_official: boolean
  official_since?: string | null
  total_bookings_at_my_venues: number
  upcoming_bookings_at_my_venues: number
  spent_at_my_venues: number
  last_booking_date?: string | null
}

// ─────────────────────────── Chat (پیام‌های تیمی) ───────────────────────────

export interface TeamMessage {
  id: number
  user_id: number
  full_name?: string | null
  content: string
  created_at: string
}

export interface TeamMessageList {
  items: TeamMessage[]
  has_more: boolean
}

export interface TeamUnreadCount {
  unread: number
}

// ─────────────────────────── Payloads ───────────────────────────

export interface TeamCreatePayload {
  name: string
  description?: string
  sport?: string
  visibility: TeamVisibility
  logo_url?: string
}

export interface TeamUpdatePayload {
  name?: string
  description?: string
  sport?: string
  visibility?: TeamVisibility
  logo_url?: string
}

export interface TeamInvitePayload {
  phone?: string
  user_id?: number
  expires_in_days?: number
}

export interface TeamActionResponse {
  message: string
}

export interface TeamDeactivateResponse {
  message: string
  open_dues: number
  team: Team
}

export interface TeamDiscoverParams {
  search?: string
  sport?: string
  limit?: number
  offset?: number
}

export interface TeamDuesFilters {
  status?: 'pending' | 'paid' | 'voided' | 'overdue'
  limit?: number
  offset?: number
}

// ─────────────────────────── برچسب‌های فارسی ───────────────────────────

export const TEAM_VISIBILITY_LABELS: Record<TeamVisibility, string> = {
  private: 'خصوصی',
  public: 'عمومی',
  invite_only: 'فقط با دعوت',
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  captain: 'کاپیتان',
  admin: 'مدیر',
  member: 'عضو',
}

export const TEAM_MEMBER_STATUS_LABELS: Record<TeamMemberStatus, string> = {
  pending: 'در انتظار پاسخ',
  active: 'فعال',
  removed: 'خارج شده',
  declined: 'رد کرده',
}

export const DUE_METHOD_LABELS: Record<DuesPayMethod, string> = {
  cash: 'نقدی',
  gateway: 'درگاه',
  card_to_card: 'کارت‌به‌کارت',
}

export const TEAM_AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'ساخت تیم',
  updated: 'ویرایش اطلاعات',
  deactivated: 'غیرفعال‌سازی تیم',
  member_invited: 'دعوت عضو',
  member_accepted: 'پذیرش دعوت',
  member_declined: 'رد دعوت',
  member_removed: 'حذف عضو',
  member_left: 'خروج عضو',
  role_changed: 'تغییر نقش',
  captain_transferred: 'انتقال کاپیتانی',
  join_requested: 'درخواست پیوستن',
  join_approved: 'تأیید درخواست',
  join_rejected: 'رد درخواست',
  dues_generated: 'ایجاد حصه',
  dues_paid: 'پرداخت حصه',
  dues_voided: 'ابطال حصه',
  booking_linked: 'اتصال رزرو',
}
