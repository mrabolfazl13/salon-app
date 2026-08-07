export type CompetitionStatus = 'active' | 'ended' | 'cancelled'

export interface Competition {
  id: number
  venueId: number
  venueName: string
  slotId: number
  date: string
  time: string
  currentPrice: number
  bestPrice: number
  bidsCount: number
  timeLeft: string
  status: CompetitionStatus
  createdAt: string
  expiresAt: string
}

export interface CompetitionCreate {
  slotId: number
  venueId: number
  offeredPrice: number
}

export interface CompetitionBid {
  slotId: number
  offeredPrice: number
}

export interface CompetitionBidResponse {
  id: number
  competitionId: number
  venueId: number
  offeredPrice: number
  createdAt: string
}