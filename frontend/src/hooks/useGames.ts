// frontend/src/hooks/useGames.ts
// هوک‌های TanStack Query برای سیستم بازی گروهی (state سمت سرور — بدون Zustand)
// استراتژی: هر mutation موفق → invalidation دامنه‌ی بازی؛ خطای 409 (تعارض ظرفیت/وضعیت)
// → refetch تا UI با وضعیت واقعی سرور همگام شود (به‌جای optimistic stale).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { gameService } from '@/services/game'
import type {
  ExploreParams,
  GameCreatePayload,
  GameUpdatePayload,
  InvitationCreatePayload,
  InviteLinkCreatePayload,
  ParticipantRole,
} from '@/types/game'

// ─────────────────────────── Query Keys ───────────────────────────

export const gameKeys = {
  all: ['games'] as const,
  explore: (params?: ExploreParams) => ['games', 'explore', params ?? {}] as const,
  my: () => ['games', 'my'] as const,
  detail: (id: number) => ['games', 'detail', id] as const,
  participants: (id: number) => ['games', id, 'participants'] as const,
  joinRequests: (id: number) => ['games', id, 'join-requests'] as const,
  invitations: (id: number) => ['games', id, 'invitations'] as const,
  inviteLinks: (id: number) => ['games', id, 'invite-links'] as const,
  waitlist: (id: number) => ['games', id, 'waitlist'] as const,
  payments: (id: number) => ['games', id, 'payments'] as const,
  myInvitations: () => ['games', 'my-invitations'] as const,
  tokenPreview: (token: string) => ['games', 'token', token] as const,
}

/** ابطال همه‌ی کوئری‌های وابسته به یک بازی + لیست‌های عمومی/من */
function invalidateGameScope(qc: QueryClient, gameId: number) {
  qc.invalidateQueries({ queryKey: gameKeys.detail(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.participants(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.joinRequests(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.invitations(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.inviteLinks(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.waitlist(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.payments(gameId) })
  qc.invalidateQueries({ queryKey: gameKeys.my() })
  qc.invalidateQueries({ queryKey: ['games', 'explore'] })
}

/** خطای 409 یعنی وضعیت سرور تغییر کرده (پرشدن ظرفیت، شروع/لغو بازی و...) → refresh */
function syncOnConflict(qc: QueryClient, error: unknown, gameId?: number) {
  if (isAxiosError(error) && error.response?.status === 409) {
    if (gameId) invalidateGameScope(qc, gameId)
    else qc.invalidateQueries({ queryKey: gameKeys.all })
  }
}

// ─────────────────────────── Queries ───────────────────────────

export function useGames(params?: ExploreParams, enabled = true) {
  return useQuery({
    queryKey: gameKeys.explore(params),
    queryFn: () => gameService.explore(params),
    enabled,
  })
}

export function useGame(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.detail(gameId ?? 0),
    queryFn: () => gameService.getById(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useMyGames(enabled = true) {
  return useQuery({
    queryKey: gameKeys.my(),
    queryFn: () => gameService.getMyGames(),
    enabled,
  })
}

export function useMyInvitations(enabled = true) {
  return useQuery({
    queryKey: gameKeys.myInvitations(),
    queryFn: () => gameService.getMyInvitations(),
    enabled,
  })
}

export function useGameParticipants(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.participants(gameId ?? 0),
    queryFn: () => gameService.getParticipants(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useJoinRequests(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.joinRequests(gameId ?? 0),
    queryFn: () => gameService.getJoinRequests(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useGameInvitations(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.invitations(gameId ?? 0),
    queryFn: () => gameService.getGameInvitations(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useInviteLinks(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.inviteLinks(gameId ?? 0),
    queryFn: () => gameService.getInviteLinks(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useWaitlist(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.waitlist(gameId ?? 0),
    queryFn: () => gameService.getWaitlist(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function usePaymentSummary(gameId: number | null, enabled = true) {
  return useQuery({
    queryKey: gameKeys.payments(gameId ?? 0),
    queryFn: () => gameService.getPaymentSummary(gameId as number),
    enabled: enabled && gameId !== null && gameId > 0,
  })
}

export function useTokenPreview(token: string | null) {
  return useQuery({
    queryKey: gameKeys.tokenPreview(token ?? ''),
    queryFn: () => gameService.previewToken(token as string),
    enabled: !!token,
    retry: false,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GameCreatePayload) => gameService.create(data),
    onSuccess: (game) => {
      qc.invalidateQueries({ queryKey: gameKeys.my() })
      qc.invalidateQueries({ queryKey: ['games', 'explore'] })
      qc.setQueryData(gameKeys.detail(game.id), game)
    },
  })
}

export function useUpdateGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GameUpdatePayload) => gameService.update(gameId, data),
    onSuccess: (game) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useCancelGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.cancel(gameId),
    onSuccess: (game) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useStartGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.start(gameId),
    onSuccess: (game) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useCompleteGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.complete(gameId),
    onSuccess: (game) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useJoinGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.join(gameId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useLeaveGame(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.leave(gameId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useJoinByToken(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.joinByToken(token),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(game.id), game)
      invalidateGameScope(qc, game.id)
      qc.invalidateQueries({ queryKey: gameKeys.tokenPreview(token) })
    },
    onError: (error) => syncOnConflict(qc, error),
  })
}

export function useApproveJoinRequest(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => gameService.approveJoinRequest(gameId, requestId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
      qc.invalidateQueries({ queryKey: gameKeys.joinRequests(gameId) })
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useRejectJoinRequest(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => gameService.rejectJoinRequest(gameId, requestId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      qc.invalidateQueries({ queryKey: gameKeys.joinRequests(gameId) })
      invalidateGameScope(qc, gameId)
    },
  })
}

export function useRemoveParticipant(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => gameService.removeParticipant(gameId, userId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(gameId), game)
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useSetParticipantRole(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: ParticipantRole }) =>
      gameService.setParticipantRole(gameId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.participants(gameId) })
      qc.invalidateQueries({ queryKey: gameKeys.detail(gameId) })
    },
  })
}

export function useInviteUser(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InvitationCreatePayload) => gameService.inviteUser(gameId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.invitations(gameId) })
      qc.invalidateQueries({ queryKey: gameKeys.participants(gameId) })
      qc.invalidateQueries({ queryKey: gameKeys.myInvitations() })
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useAcceptInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: number) => gameService.acceptInvitation(invitationId),
    onSuccess: ({ game }) => {
      qc.setQueryData(gameKeys.detail(game.id), game)
      invalidateGameScope(qc, game.id)
      qc.invalidateQueries({ queryKey: gameKeys.myInvitations() })
    },
    onError: (error) => {
      syncOnConflict(qc, error)
      qc.invalidateQueries({ queryKey: gameKeys.myInvitations() })
    },
  })
}

export function useRejectInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: number) => gameService.rejectInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.myInvitations() })
    },
  })
}

export function useCreateInviteLink(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteLinkCreatePayload = {}) => gameService.createInviteLink(gameId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.inviteLinks(gameId) })
    },
  })
}

export function useDisableInviteLink(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (linkId: number) => gameService.disableInviteLink(gameId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.inviteLinks(gameId) })
    },
  })
}

export function useRegenerateInviteLink(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (linkId: number) => gameService.regenerateInviteLink(gameId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.inviteLinks(gameId) })
    },
  })
}

export function useJoinWaitlist(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.joinWaitlist(gameId),
    onSuccess: () => {
      invalidateGameScope(qc, gameId)
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}

export function useLeaveWaitlist(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gameService.leaveWaitlist(gameId),
    onSuccess: () => {
      invalidateGameScope(qc, gameId)
    },
  })
}

export function usePayShare(gameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (participantId: number) => gameService.payShare(gameId, participantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.payments(gameId) })
      qc.invalidateQueries({ queryKey: gameKeys.participants(gameId) })
      qc.invalidateQueries({ queryKey: gameKeys.detail(gameId) })
    },
    onError: (error) => syncOnConflict(qc, error, gameId),
  })
}
