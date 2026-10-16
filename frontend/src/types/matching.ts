// frontend/src/types/matching.ts
// تایپ‌های حریف‌یابی و چالش بازی — آینهٔ app/schemas/matching.py (مسیرهای /matching)

export interface SignalScore {
  /** ۰..۱؛ null یعنی داده‌ای برای این سیگنال وجود ندارد (از مخرج امتیاز هم می‌رود) */
  value: number | null
  weight: number
  note: string | null
}

export interface MatchHomeVenue {
  id: number
  name: string
  latitude: number | null
  longitude: number | null
}

export interface MatchSuggestion {
  team_id: number
  team_name: string
  logo_url: string | null
  sport: string
  is_official: boolean
  member_count: number
  /** ۰..۱۰۰ — میانگین وزنی سیگنال‌های در دسترس */
  score: number
  level: SignalScore
  region: SignalScore
  schedule: SignalScore
  rank: number | null
  played: number
  won: number
  /** ٪ برد؛ null یعنی سابقۀ بازی ثبت‌شده ندارد */
  win_rate: number | null
  home_venue: MatchHomeVenue | null
  distance_km: number | null
  shared_time_slots: number
  has_open_challenge: boolean
  reasons: string[]
}

export interface MatchBasis {
  pool: number
  results_used: number
  bookings_scanned: number
}

export interface MatchListResponse {
  team_id: number
  items: MatchSuggestion[]
  total: number
  basis: MatchBasis
}

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
export type ChallengeDirection = 'inbox' | 'outbox'

export interface ChallengeRow {
  id: number
  from_team_id: number
  from_team_name: string
  to_team_id: number
  to_team_name: string
  created_by: number
  created_by_name: string | null
  accepted_by: number | null
  accepted_by_name: string | null
  responded_at: string | null
  message: string | null
  response_note: string | null
  /** YYYY-MM-DD */
  proposed_date: string | null
  /** HH:mm:ss */
  proposed_time: string | null
  proposed_venue_id: number | null
  proposed_venue_name: string | null
  status: ChallengeStatus
  expires_at: string
  created_at: string
  direction: ChallengeDirection
}

export interface ChallengeListResponse {
  team_id: number
  items: ChallengeRow[]
  total: number
}

export interface ChallengeCreatePayload {
  from_team_id: number
  to_team_id: number
  message?: string
  /** YYYY-MM-DD */
  proposed_date?: string
  /** HH:mm:ss */
  proposed_time?: string
  proposed_venue_id?: number
}

export interface ChallengeFilters {
  team_id: number
  status?: ChallengeStatus
  direction?: 'inbox' | 'outbox' | 'all'
}
