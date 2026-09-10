// frontend/src/services/game.ts
// سرویس API سیستم بازی گروهی — تمام مسیرهای /games بک‌اند (api/v1/games.py)
// الگو: هم‌راستا با services/booking.ts (camelCase ورودی → snake_case payload)

import apiClient from './api'
import type {
  Game,
  GameListResponse,
  GameActionResponse,
  GameCreatePayload,
  GameUpdatePayload,
  ExploreParams,
  Participant,
  ParticipantRole,
  JoinRequest,
  Invitation,
  InvitationCreatePayload,
  InviteLink,
  InviteLinkCreatePayload,
  TokenPreview,
  WaitlistEntry,
  GamePaymentSummary,
  PayShareResponse,
  MessageResponse,
} from '@/types/game'

export const gameService = {
  // ─────────────────────────── ساخت / لیست ───────────────────────────

  create: async (data: GameCreatePayload): Promise<Game> => {
    const response = await apiClient.post('/games/', data)
    return response.data
  },

  explore: async (params?: ExploreParams): Promise<GameListResponse> => {
    const query = params
      ? {
          sport: params.sport,
          skill_level: params.skillLevel,
          venue_id: params.venueId,
          date_from: params.dateFrom,
          date_to: params.dateTo,
          time_from: params.timeFrom,
          time_to: params.timeTo,
          max_price_per_player: params.maxPricePerPlayer,
          availability_only: params.availabilityOnly,
          latitude: params.latitude,
          longitude: params.longitude,
          sort: params.sort,
          limit: params.limit,
          offset: params.offset,
        }
      : undefined
    const response = await apiClient.get('/games/', { params: query })
    return response.data
  },

  getMyGames: async (): Promise<Game[]> => {
    const response = await apiClient.get('/games/my')
    return response.data
  },

  // ─────────────────────────── دعوت‌نامه‌های من ───────────────────────────

  getMyInvitations: async (): Promise<Invitation[]> => {
    const response = await apiClient.get('/games/invitations/my')
    return response.data
  },

  acceptInvitation: async (invitationId: number): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/invitations/${invitationId}/accept`)
    return response.data
  },

  rejectInvitation: async (invitationId: number): Promise<MessageResponse> => {
    const response = await apiClient.post(`/games/invitations/${invitationId}/reject`)
    return response.data
  },

  // ─────────────────────────── لینک دعوت (توکن) ───────────────────────────

  previewToken: async (token: string): Promise<TokenPreview> => {
    const response = await apiClient.get(`/games/join/${token}`)
    return response.data
  },

  joinByToken: async (token: string): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/join/${token}`)
    return response.data
  },

  // ─────────────────────────── جزئیات / ویرایش / لغو ───────────────────────────

  getById: async (gameId: number): Promise<Game> => {
    const response = await apiClient.get(`/games/${gameId}`)
    return response.data
  },

  update: async (gameId: number, data: GameUpdatePayload): Promise<Game> => {
    const response = await apiClient.patch(`/games/${gameId}`, data)
    return response.data
  },

  cancel: async (gameId: number): Promise<Game> => {
    const response = await apiClient.delete(`/games/${gameId}`)
    return response.data
  },

  start: async (gameId: number): Promise<Game> => {
    const response = await apiClient.post(`/games/${gameId}/start`)
    return response.data
  },

  complete: async (gameId: number): Promise<Game> => {
    const response = await apiClient.post(`/games/${gameId}/complete`)
    return response.data
  },

  // ─────────────────────────── Join / Leave ───────────────────────────

  join: async (gameId: number): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/${gameId}/join`)
    return response.data
  },

  leave: async (gameId: number): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/${gameId}/leave`)
    return response.data
  },

  // ─────────────────────────── شرکت‌کننده‌ها ───────────────────────────

  getParticipants: async (gameId: number): Promise<Participant[]> => {
    const response = await apiClient.get(`/games/${gameId}/participants`)
    return response.data
  },

  setParticipantRole: async (
    gameId: number,
    userId: number,
    role: ParticipantRole,
  ): Promise<Participant> => {
    const response = await apiClient.patch(`/games/${gameId}/participants/${userId}`, { role })
    return response.data
  },

  removeParticipant: async (gameId: number, userId: number): Promise<GameActionResponse> => {
    const response = await apiClient.delete(`/games/${gameId}/participants/${userId}`)
    return response.data
  },

  // ─────────────────────────── درخواست‌های پیوستن ───────────────────────────

  getJoinRequests: async (gameId: number): Promise<JoinRequest[]> => {
    const response = await apiClient.get(`/games/${gameId}/join-requests`)
    return response.data
  },

  approveJoinRequest: async (gameId: number, requestId: number): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/${gameId}/join-requests/${requestId}/approve`)
    return response.data
  },

  rejectJoinRequest: async (gameId: number, requestId: number): Promise<GameActionResponse> => {
    const response = await apiClient.post(`/games/${gameId}/join-requests/${requestId}/reject`)
    return response.data
  },

  // ─────────────────────────── دعوت مستقیم ───────────────────────────

  inviteUser: async (gameId: number, data: InvitationCreatePayload): Promise<Invitation> => {
    const response = await apiClient.post(`/games/${gameId}/invitations`, data)
    return response.data
  },

  getGameInvitations: async (gameId: number): Promise<Invitation[]> => {
    const response = await apiClient.get(`/games/${gameId}/invitations`)
    return response.data
  },

  // ─────────────────────────── لینک‌های دعوت ───────────────────────────

  createInviteLink: async (
    gameId: number,
    data: InviteLinkCreatePayload = {},
  ): Promise<InviteLink> => {
    const response = await apiClient.post(`/games/${gameId}/invite-links`, data)
    return response.data
  },

  getInviteLinks: async (gameId: number): Promise<InviteLink[]> => {
    const response = await apiClient.get(`/games/${gameId}/invite-links`)
    return response.data
  },

  disableInviteLink: async (gameId: number, linkId: number): Promise<InviteLink> => {
    const response = await apiClient.post(`/games/${gameId}/invite-links/${linkId}/disable`)
    return response.data
  },

  regenerateInviteLink: async (gameId: number, linkId: number): Promise<InviteLink> => {
    const response = await apiClient.post(`/games/${gameId}/invite-links/${linkId}/regenerate`)
    return response.data
  },

  // ─────────────────────────── لیست انتظار ───────────────────────────

  getWaitlist: async (gameId: number): Promise<WaitlistEntry[]> => {
    const response = await apiClient.get(`/games/${gameId}/waitlist`)
    return response.data
  },

  joinWaitlist: async (gameId: number): Promise<WaitlistEntry> => {
    const response = await apiClient.post(`/games/${gameId}/waitlist`)
    return response.data
  },

  leaveWaitlist: async (gameId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete(`/games/${gameId}/waitlist`)
    return response.data
  },

  // ─────────────────────────── پرداخت سهم ───────────────────────────

  getPaymentSummary: async (gameId: number): Promise<GamePaymentSummary> => {
    const response = await apiClient.get(`/games/${gameId}/payments`)
    return response.data
  },

  payShare: async (gameId: number, participantId: number): Promise<PayShareResponse> => {
    const response = await apiClient.post(`/games/${gameId}/payments/${participantId}/pay`)
    return response.data
  },
}
