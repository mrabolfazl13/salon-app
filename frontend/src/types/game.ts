// frontend/src/types/game.ts
// تایپ‌های سیستم بازی گروهی — آینه‌ی پاسخ‌های snake_case بک‌اند (schemas/game.py)

export type GameVisibility = 'private' | 'public' | 'public_approval'
export type GameStatus = 'draft' | 'open' | 'full' | 'started' | 'completed' | 'cancelled'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro'
export type PaymentMode = 'organizer_pays' | 'split_payment' | 'free'
export type ParticipantRole = 'organizer' | 'admin' | 'member'
export type ParticipantStatus = 'invited' | 'pending' | 'accepted' | 'rejected' | 'left' | 'removed'
export type GameSort = 'soonest' | 'nearest' | 'cheapest' | 'most_available' | 'popular'

export interface Game {
  id: number
  booking_id: number
  organizer_id: number
  name: string
  description?: string | null
  sport: string
  visibility: GameVisibility
  join_policy: string
  max_players: number
  skill_level: SkillLevel
  payment_mode: PaymentMode
  status: GameStatus
  created_at: string
  updated_at: string

  organizer_name?: string | null
  current_players: number
  venue_id?: number | null
  venue_name?: string | null
  venue_address?: string | null
  latitude?: number | null
  longitude?: number | null
  slot_date?: string | null      // YYYY-MM-DD
  start_time?: string | null     // HH:MM[:SS]
  duration?: number | null       // دقیقه
  total_price?: number | null
  price_per_player?: number | null
  distance_km?: number | null

  my_participant_status?: ParticipantStatus | null
  my_role?: ParticipantRole | null
  my_waitlist_position?: number | null
  has_pending_join_request: boolean
  has_pending_invitation: boolean
}

export interface GameListResponse {
  items: Game[]
  total: number
  limit: number
  offset: number
}

export interface Participant {
  id: number
  game_id: number
  user_id: number
  full_name?: string | null
  role: ParticipantRole
  status: ParticipantStatus
  joined_at: string
  left_at?: string | null
  payment_status?: string | null
}

export interface JoinRequest {
  id: number
  game_id: number
  user_id: number
  full_name?: string | null
  status: string
  message?: string | null
  created_at: string
  reviewed_at?: string | null
}

export interface Invitation {
  id: number
  game_id: number
  invited_user_id: number
  invited_user_name?: string | null
  invited_by: number
  status: string
  expires_at?: string | null
  created_at: string
  game_name?: string | null
}

export interface InviteLink {
  id: number
  game_id: number
  token: string
  join_path: string
  expires_at?: string | null
  max_uses?: number | null
  uses_count: number
  is_active: boolean
  created_at: string
}

export interface TokenPreview {
  valid: boolean
  game?: Game | null
  reason?: string | null
}

export interface WaitlistEntry {
  id: number
  game_id: number
  user_id: number
  position: number
  status: string
  created_at: string
}

export interface GamePayment {
  id: number
  game_id: number
  participant_id: number
  user_id: number
  amount: number
  status: string
  gateway: string
  payment_reference?: string | null
  created_at: string
  paid_at?: string | null
}

export interface GamePaymentSummary {
  payment_mode: PaymentMode
  total_price: number
  price_per_player?: number | null
  paid_count: number
  pending_count: number
  payments: GamePayment[]
}

export interface GameActionResponse {
  game: Game
  message: string
}

export interface PayShareResponse {
  payment: GamePayment
  notifications: unknown[]
}

export interface MessageResponse {
  message: string
}

// ─────────────────────────── Payloads ───────────────────────────

export interface GameCreatePayload {
  booking_id: number
  name: string
  description?: string
  sport?: string
  max_players: number
  skill_level?: SkillLevel
  visibility?: GameVisibility
  payment_mode?: PaymentMode
}

export interface GameUpdatePayload {
  name?: string
  description?: string
  max_players?: number
  skill_level?: SkillLevel
  visibility?: GameVisibility
}

export interface ExploreParams {
  sport?: string
  skillLevel?: SkillLevel
  venueId?: number
  dateFrom?: string      // YYYY-MM-DD
  dateTo?: string
  timeFrom?: string      // HH:MM
  timeTo?: string
  maxPricePerPlayer?: number
  availabilityOnly?: boolean
  latitude?: number
  longitude?: number
  sort?: GameSort
  limit?: number
  offset?: number
}

export interface InviteLinkCreatePayload {
  expires_in_days?: number
  max_uses?: number
}

export interface InvitationCreatePayload {
  user_id: number
  expires_in_days?: number
}

// ─────────────────────────── برچسب‌های فارسی ───────────────────────────

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  draft: 'پیش‌نویس',
  open: 'باز',
  full: 'تکمیل شده',
  started: 'شروع شده',
  completed: 'به پایان رسیده',
  cancelled: 'لغو شده',
}

export const GAME_VISIBILITY_LABELS: Record<GameVisibility, string> = {
  private: 'خصوصی',
  public: 'عمومی',
  public_approval: 'عمومی با تأیید',
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
  pro: 'حرفه‌ای',
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  organizer_pays: 'پرداخت برگزارکننده',
  split_payment: 'سهمی (هر بازیکن)',
  free: 'رایگان',
}

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  invited: 'دعوت‌شده',
  pending: 'در انتظار',
  accepted: 'عضو',
  rejected: 'رد شده',
  left: 'خارج شده',
  removed: 'حذف شده',
}

export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  organizer: 'برگزارکننده',
  admin: 'ادمین',
  member: 'عضو',
}

export const GAME_SORT_LABELS: Record<GameSort, string> = {
  soonest: 'نزدیک‌ترین زمان',
  nearest: 'نزدیک‌ترین مکان',
  cheapest: 'ارزان‌ترین',
  most_available: 'بیشترین ظرفیت',
  popular: 'محبوب‌ترین',
}
