// frontend/src/services/team.ts
// سرویس API سیستم تیم — تمام مسیرهای /teams بک‌اند (api/v1/teams.py)
// الگو: هم‌راستا با services/game.ts (camelCase ورودی → snake_case payload)

import apiClient from './api'
import type {
  Paginated,
  Team,
  TeamActionResponse,
  TeamAuditItem,
  TeamBalance,
  TeamBookingItem,
  TeamCreatePayload,
  TeamDeactivateResponse,
  TeamDiscoverParams,
  TeamDue,
  TeamDuesFilters,
  TeamDuesGeneratePayload,
  TeamDuesGenerateResult,
  TeamDuesPayPayload,
  TeamInvitation,
  TeamInvitePayload,
  TeamJoinRequest,
  TeamMember,
  TeamMessage,
  TeamMessageList,
  TeamPartner,
  TeamRole,
  TeamUnreadCount,
  TeamUpdatePayload,
} from '@/types/team'

export const teamService = {
  // ─────────────────────────── ساخت / لیست من ───────────────────────────

  create: async (data: TeamCreatePayload): Promise<Team> => {
    const response = await apiClient.post('/teams/', data)
    return response.data
  },

  getMyTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get('/teams/')
    return response.data
  },

  // ─────────────────────────── کاوش / دعوت‌های من / شرکای مدیر ───────────────────────────

  discover: async (params?: TeamDiscoverParams): Promise<Paginated<Team>> => {
    const response = await apiClient.get('/teams/discover', {
      params: params
        ? {
            search: params.search,
            sport: params.sport,
            limit: params.limit,
            offset: params.offset,
          }
        : undefined,
    })
    return response.data
  },

  getMyInvitations: async (): Promise<TeamInvitation[]> => {
    const response = await apiClient.get('/teams/invitations/me')
    return response.data
  },

  getManagerPartners: async (venueId?: number): Promise<{ items: TeamPartner[]; total: number }> => {
    const response = await apiClient.get('/teams/manager/partners', {
      params: venueId ? { venue_id: venueId } : undefined,
    })
    return response.data
  },

  // ─────────────────────────── جزئیات / ویرایش / غیرفعال‌سازی ───────────────────────────

  getById: async (teamId: number): Promise<Team> => {
    const response = await apiClient.get(`/teams/${teamId}`)
    return response.data
  },

  update: async (teamId: number, data: TeamUpdatePayload): Promise<Team> => {
    const response = await apiClient.put(`/teams/${teamId}`, data)
    return response.data
  },

  deactivate: async (teamId: number): Promise<TeamDeactivateResponse> => {
    const response = await apiClient.delete(`/teams/${teamId}/deactivate`)
    return response.data
  },

  // ─────────────────────────── اعضا / دعوت ───────────────────────────

  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    const response = await apiClient.get(`/teams/${teamId}/members`)
    return response.data
  },

  invite: async (teamId: number, data: TeamInvitePayload): Promise<TeamInvitation> => {
    const response = await apiClient.post(`/teams/${teamId}/invite`, data)
    return response.data
  },

  acceptInvitation: async (teamId: number, memberId: number): Promise<Team> => {
    const response = await apiClient.post(`/teams/${teamId}/invitations/${memberId}/accept`)
    return response.data
  },

  declineInvitation: async (teamId: number, memberId: number): Promise<TeamActionResponse> => {
    const response = await apiClient.post(`/teams/${teamId}/invitations/${memberId}/decline`)
    return response.data
  },

  removeMember: async (teamId: number, memberId: number): Promise<TeamActionResponse> => {
    const response = await apiClient.post(`/teams/${teamId}/members/${memberId}/remove`)
    return response.data
  },

  setMemberRole: async (teamId: number, memberId: number, role: Exclude<TeamRole, 'captain'>): Promise<TeamMember> => {
    const response = await apiClient.post(`/teams/${teamId}/members/${memberId}/role`, { role })
    return response.data
  },

  leave: async (teamId: number): Promise<TeamActionResponse> => {
    const response = await apiClient.post(`/teams/${teamId}/leave`)
    return response.data
  },

  transferCaptain: async (teamId: number, userId: number): Promise<Team> => {
    const response = await apiClient.post(`/teams/${teamId}/transfer-captain`, { user_id: userId })
    return response.data
  },

  // ─────────────────────────── درخواست‌های پیوستن ───────────────────────────

  requestJoin: async (teamId: number, message?: string): Promise<{ id: number; pending: boolean; team_id: number; message: string }> => {
    const response = await apiClient.post(`/teams/${teamId}/join-request`, { message: message || undefined })
    return response.data
  },

  getJoinRequests: async (teamId: number): Promise<TeamJoinRequest[]> => {
    const response = await apiClient.get(`/teams/${teamId}/join-requests`)
    return response.data
  },

  approveJoinRequest: async (teamId: number, requestId: number): Promise<TeamActionResponse> => {
    const response = await apiClient.post(`/teams/${teamId}/join-requests/${requestId}/approve`)
    return response.data
  },

  rejectJoinRequest: async (teamId: number, requestId: number): Promise<TeamActionResponse> => {
    const response = await apiClient.post(`/teams/${teamId}/join-requests/${requestId}/reject`)
    return response.data
  },

  // ─────────────────────────── چت تیم ───────────────────────────

  getMessages: async (teamId: number, limit = 50, beforeId?: number): Promise<TeamMessageList> => {
    const response = await apiClient.get(`/teams/${teamId}/messages`, {
      params: beforeId ? { limit, before_id: beforeId } : { limit },
    })
    return response.data
  },

  postMessage: async (teamId: number, content: string): Promise<TeamMessage> => {
    const response = await apiClient.post(`/teams/${teamId}/messages`, { content })
    return response.data
  },

  markMessagesRead: async (teamId: number): Promise<TeamUnreadCount> => {
    const response = await apiClient.post(`/teams/${teamId}/messages/read`)
    return response.data
  },

  getUnreadCount: async (teamId: number): Promise<TeamUnreadCount> => {
    const response = await apiClient.get(`/teams/${teamId}/unread-count`)
    return response.data
  },

  // ─────────────────────────── حصه‌ها / تراز ───────────────────────────

  getDues: async (teamId: number, filters?: TeamDuesFilters): Promise<Paginated<TeamDue>> => {
    const response = await apiClient.get(`/teams/${teamId}/dues`, {
      params: filters
        ? { status: filters.status, limit: filters.limit, offset: filters.offset }
        : undefined,
    })
    return response.data
  },

  generateDues: async (teamId: number, data: TeamDuesGeneratePayload): Promise<TeamDuesGenerateResult> => {
    const response = await apiClient.post(`/teams/${teamId}/dues/generate`, data)
    return response.data
  },

  payDue: async (teamId: number, dueId: number, data: TeamDuesPayPayload): Promise<TeamDue> => {
    const response = await apiClient.post(`/teams/${teamId}/dues/${dueId}/pay`, data)
    return response.data
  },

  // دلیل به‌صورت query param ارسال می‌شود (قرارداد بک‌اند: DELETE .../dues/{id}?reason=)
  voidDue: async (teamId: number, dueId: number, reason?: string): Promise<TeamDue> => {
    const response = await apiClient.delete(`/teams/${teamId}/dues/${dueId}`, {
      params: reason ? { reason } : undefined,
    })
    return response.data
  },

  getBalance: async (teamId: number): Promise<TeamBalance> => {
    const response = await apiClient.get(`/teams/${teamId}/balance`)
    return response.data
  },

  // ─────────────────────────── رزروها / ممیزی ───────────────────────────

  getBookings: async (teamId: number, limit = 50, offset = 0): Promise<Paginated<TeamBookingItem>> => {
    const response = await apiClient.get(`/teams/${teamId}/bookings`, { params: { limit, offset } })
    return response.data
  },

  linkBooking: async (teamId: number, bookingId: number): Promise<TeamBookingItem> => {
    const response = await apiClient.post(`/teams/${teamId}/bookings/${bookingId}/link`)
    return response.data
  },

  getAudit: async (teamId: number, limit = 50, offset = 0): Promise<Paginated<TeamAuditItem>> => {
    const response = await apiClient.get(`/teams/${teamId}/audit`, { params: { limit, offset } })
    return response.data
  },
}
