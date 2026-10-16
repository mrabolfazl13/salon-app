// frontend/src/services/coach.ts
// سرویس API جلسات مربی — تمام مسیرهای /coach (app/api/v1/coach.py)
// الگو: هم‌راستا با services/team.ts (متدهای async، پاسخ خامِ snake_case بک‌اند)

import apiClient from './api'
import type {
  CoachClient,
  CoachDashboardData,
  CoachSession,
  CoachSessionCreatePayload,
  CoachSessionList,
  CoachSessionsParams,
  CoachSessionStatus,
  CoachSessionUpdatePayload,
} from '@/types/coach'

export const coachService = {
  createSession: async (data: CoachSessionCreatePayload): Promise<CoachSession> => {
    const response = await apiClient.post('/coach/sessions', data)
    return response.data
  },

  listSessions: async (params: CoachSessionsParams = {}): Promise<CoachSessionList> => {
    const response = await apiClient.get('/coach/sessions', { params })
    return response.data
  },

  getSession: async (id: number): Promise<CoachSession> => {
    const response = await apiClient.get(`/coach/sessions/${id}`)
    return response.data
  },

  updateSession: async (id: number, data: CoachSessionUpdatePayload): Promise<CoachSession> => {
    const response = await apiClient.put(`/coach/sessions/${id}`, data)
    return response.data
  },

  setAttendance: async (id: number, status: CoachSessionStatus): Promise<CoachSession> => {
    const response = await apiClient.put(`/coach/sessions/${id}/attendance`, { status })
    return response.data
  },

  setSettled: async (id: number, settled: boolean): Promise<CoachSession> => {
    const response = await apiClient.put(`/coach/sessions/${id}/settle`, { settled })
    return response.data
  },

  getDashboard: async (): Promise<CoachDashboardData> => {
    const response = await apiClient.get('/coach/dashboard')
    return response.data
  },

  getClients: async (): Promise<{ items: CoachClient[] }> => {
    const response = await apiClient.get('/coach/clients')
    return response.data
  },
}
