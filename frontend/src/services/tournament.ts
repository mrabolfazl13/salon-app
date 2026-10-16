// frontend/src/services/tournament.ts
// سرویس API تورنمنت — تمام مسیرهای /tournaments (app/api/v1/tournament.py)
// الگو: هم‌راستا با services/coach.ts (apiClient default، پاسخ خام snake_case)

import apiClient from './api'
import type {
  Tournament,
  TournamentBracket,
  TournamentCreatePayload,
  TournamentList,
  TournamentMatch,
  TournamentStanding,
} from '@/types/tournament'

export interface TournamentsParams {
  status?: string
  mine?: boolean
  limit?: number
  offset?: number
}

export const tournamentService = {
  list: async (params: TournamentsParams = {}): Promise<TournamentList> => {
    const response = await apiClient.get('/tournaments', { params })
    return response.data
  },

  get: async (id: number): Promise<Tournament> => {
    const response = await apiClient.get(`/tournaments/${id}`)
    return response.data
  },

  bracket: async (id: number): Promise<TournamentBracket> => {
    const response = await apiClient.get(`/tournaments/${id}/bracket`)
    return response.data
  },

  standings: async (id: number): Promise<{ items: TournamentStanding[] }> => {
    const response = await apiClient.get(`/tournaments/${id}/standings`)
    return response.data
  },

  create: async (data: TournamentCreatePayload): Promise<Tournament> => {
    const response = await apiClient.post('/tournaments', data)
    return response.data
  },

  openRegistration: async (id: number): Promise<Tournament> => {
    const response = await apiClient.put(`/tournaments/${id}/open`)
    return response.data
  },

  registerTeam: async (id: number, teamId: number, seed?: number | null): Promise<{
    participant_id: number
    team_id: number
    team_name?: string | null
    seed?: number | null
  }> => {
    const response = await apiClient.post(`/tournaments/${id}/participants`, {
      team_id: teamId,
      seed: seed ?? null,
    })
    return response.data
  },

  withdrawTeam: async (id: number, teamId: number): Promise<{ participant_id: number }> => {
    const response = await apiClient.delete(`/tournaments/${id}/participants/${teamId}`)
    return response.data
  },

  draw: async (id: number): Promise<TournamentBracket> => {
    const response = await apiClient.post(`/tournaments/${id}/draw`)
    return response.data
  },

  setResult: async (matchId: number, scoreA: number, scoreB: number): Promise<TournamentMatch> => {
    const response = await apiClient.put(`/tournaments/matches/${matchId}/result`, {
      score_a: scoreA,
      score_b: scoreB,
    })
    return response.data
  },

  cancel: async (id: number): Promise<Tournament> => {
    const response = await apiClient.post(`/tournaments/${id}/cancel`)
    return response.data
  },
}
