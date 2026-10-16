// frontend/src/types/tournament.ts
// تایپ‌های تورنمنت — آینهٔ پاسخ‌های snake_case بک‌اند (app/api/v1/tournament.py + tournament_service)

export type TournamentStatus = 'draft' | 'registration' | 'drawn' | 'in_progress' | 'completed' | 'cancelled'
export type TournamentFormat = 'single_elimination' | 'round_robin' | 'double_elimination'
export type MatchStatus = 'pending' | 'ready' | 'live' | 'final' | 'bye'
export type TournamentBracketHalf = 'winners' | 'losers' | 'grand_final'
export type TournamentParticipantStatus = 'registered' | 'withdrawn'

export interface Tournament {
  id: number
  name: string
  description?: string | null
  sport: string
  organizer_id: number
  organizer_name?: string | null
  venue_id?: number | null
  status: TournamentStatus
  format: TournamentFormat
  starts_at?: string | null
  entry_fee: number
  drawn_at?: string | null
  completed_at?: string | null
  winner_team_id?: number | null
  winner_team_name?: string | null
  team_count: number
}

export interface TournamentMatch {
  id: number
  round_id: number
  position: number
  team_a_id?: number | null
  team_a_name?: string | null
  team_b_id?: number | null
  team_b_name?: string | null
  score_a?: number | null
  score_b?: number | null
  status: MatchStatus
  winner_team_id?: number | null
  next_match_id?: number | null
  next_slot?: string | null
  // در دو-حذفی «بازنده به کجا می‌افتد» هم ذخیره شده است (براکتِ بازندگان)
  loser_next_match_id?: number | null
  loser_next_slot?: string | null
  played_at?: string | null
}

export interface TournamentRound {
  id: number
  number: number
  name: string
  // نیمهٔ براکت: تک‌حذفی همه را 'winners' دارد؛ دو-حذفی 'losers' و 'grand_final' هم دارد
  bracket?: TournamentBracketHalf
  matches: TournamentMatch[]
  // در لیگِ تیم‌فرد، یک تیم در هر هفته استراحت می‌کند؛ بک‌اند آن را از خودِ برنامهٔ هفته می‌خواند
  bye_team_id?: number | null
  bye_team_name?: string | null
}

export interface TournamentBracket {
  tournament: Tournament
  rounds: TournamentRound[]
  participants: {
    team_id: number
    team_name?: string | null
    seed?: number | null
    status: TournamentParticipantStatus
  }[]
}

export interface TournamentStanding {
  rank: number
  team_id: number
  team_name?: string | null
  label: string
}

/** ردیف جدول لیگ (round_robin) — رتبهٔ مشترک با `tied` معلوم می‌شود، نه با ترتیب ساختگی. */
export interface LeagueStanding {
  rank: number
  team_id: number
  team_name?: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  tied: boolean
}

export type StandingRow = TournamentStanding | LeagueStanding

export interface TournamentList {
  total: number
  items: Tournament[]
}

export interface TournamentCreatePayload {
  name: string
  description?: string | null
  sport?: string
  venue_id?: number | null
  starts_at?: string | null
  entry_fee?: number
  format?: TournamentFormat
}
