// frontend/src/services/matching.ts
// سرویس ماژول /api/v1/matching — آینهٔ backend/app/api/v1/matching.py
// هویت کاربر از توکن می‌آید؛ در body فقط شناسۀ تیم‌ها و پیشنهاد (اختیاری) می‌رود.

import apiClient from './api'

import type {
  ChallengeCreatePayload, ChallengeFilters, ChallengeListResponse, ChallengeRow,
  MatchListResponse,
} from '@/types/matching'

export const matchingService = {
  suggestions: async (
    teamId: number,
    params: { limit?: number; sport?: string } = {},
  ): Promise<MatchListResponse> => {
    const response = await apiClient.get(`/matching/teams/${teamId}`, { params })
    return response.data
  },

  challenges: async (filters: ChallengeFilters): Promise<ChallengeListResponse> => {
    const { team_id, ...rest } = filters
    const response = await apiClient.get('/matching/challenges', {
      params: { team_id, ...rest },
    })
    return response.data
  },

  sendChallenge: async (data: ChallengeCreatePayload): Promise<ChallengeRow> => {
    const response = await apiClient.post('/matching/challenges', data)
    return response.data
  },

  acceptChallenge: async (challengeId: number, note?: string): Promise<ChallengeRow> => {
    const response = await apiClient.post(`/matching/challenges/${challengeId}/accept`, {
      note: note ?? null,
    })
    return response.data
  },

  declineChallenge: async (challengeId: number, note?: string): Promise<ChallengeRow> => {
    const response = await apiClient.post(`/matching/challenges/${challengeId}/decline`, {
      note: note ?? null,
    })
    return response.data
  },

  cancelChallenge: async (challengeId: number): Promise<ChallengeRow> => {
    const response = await apiClient.post(`/matching/challenges/${challengeId}/cancel`)
    return response.data
  },
}
