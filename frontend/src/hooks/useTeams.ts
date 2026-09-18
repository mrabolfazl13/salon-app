// frontend/src/hooks/useTeams.ts
// هوک‌های TanStack Query برای سیستم تیم (state سمت سرور — الگوی useGames/useContracts)
// استراتژی: هر mutation موفق → invalidation دامنه تیم؛ خطای 409 (تعارض ظرفیت/وضعیت)
// → refetch تا UI با وضعیت واقعی سرور همگام شود.

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { teamService } from '@/services/team'
import type {
  TeamCreatePayload,
  TeamDiscoverParams,
  TeamDuesFilters,
  TeamDuesGeneratePayload,
  TeamDuesPayPayload,
  TeamInvitePayload,
  TeamRole,
  TeamUpdatePayload,
} from '@/types/team'

// ─────────────────────────── Query Keys ───────────────────────────

export const teamKeys = {
  all: ['teams'] as const,
  my: () => ['teams', 'my'] as const,
  discover: (params?: TeamDiscoverParams) => ['teams', 'discover', params ?? {}] as const,
  detail: (id: number) => ['teams', 'detail', id] as const,
  members: (id: number) => ['teams', id, 'members'] as const,
  joinRequests: (id: number) => ['teams', id, 'join-requests'] as const,
  dues: (id: number, filters: TeamDuesFilters) => ['teams', id, 'dues', filters] as const,
  balance: (id: number) => ['teams', id, 'balance'] as const,
  bookings: (id: number, page: { limit: number; offset: number }) => ['teams', id, 'bookings', page] as const,
  audit: (id: number, page: { limit: number; offset: number }) => ['teams', id, 'audit', page] as const,
  messages: (id: number) => ['teams', id, 'messages'] as const,
  unreadCount: (id: number) => ['teams', id, 'unread-count'] as const,
  myInvitations: () => ['teams', 'my-invitations'] as const,
  partners: (venueId?: number) => ['teams', 'manager', 'partners', { venueId: venueId ?? 'all' }] as const,
}

/** ابطال همه‌ی کوئری‌های وابسته به یک تیم + لیست‌های عمومی/من */
function invalidateTeamScope(qc: QueryClient, teamId: number) {
  qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
  qc.invalidateQueries({ queryKey: teamKeys.members(teamId) })
  qc.invalidateQueries({ queryKey: teamKeys.joinRequests(teamId) })
  qc.invalidateQueries({ queryKey: ['teams', teamId, 'dues'] })
  qc.invalidateQueries({ queryKey: teamKeys.balance(teamId) })
  qc.invalidateQueries({ queryKey: ['teams', teamId, 'bookings'] })
  qc.invalidateQueries({ queryKey: ['teams', teamId, 'audit'] })
  qc.invalidateQueries({ queryKey: teamKeys.my() })
  qc.invalidateQueries({ queryKey: ['teams', 'discover'] })
  qc.invalidateQueries({ queryKey: teamKeys.myInvitations() })
}

/** خطای 409 یعنی وضعیت سرور تغییر کرده (پرشدن ظرفیت، پاسخ دعوت و...) → refresh */
function syncOnConflict(qc: QueryClient, error: unknown, teamId?: number) {
  if (isAxiosError(error) && error.response?.status === 409) {
    if (teamId) invalidateTeamScope(qc, teamId)
    else qc.invalidateQueries({ queryKey: teamKeys.all })
  }
}

// ─────────────────────────── Queries ───────────────────────────

export function useMyTeams(enabled = true) {
  return useQuery({
    queryKey: teamKeys.my(),
    queryFn: () => teamService.getMyTeams(),
    enabled,
  })
}

export function useTeamsDiscover(params?: TeamDiscoverParams, enabled = true) {
  return useQuery({
    queryKey: teamKeys.discover(params),
    queryFn: () => teamService.discover(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useTeam(teamId: number | null, enabled = true) {
  return useQuery({
    queryKey: teamKeys.detail(teamId ?? 0),
    queryFn: () => teamService.getById(teamId as number),
    enabled: enabled && teamId !== null && teamId > 0,
  })
}

export function useTeamMembers(teamId: number | null, enabled = true) {
  return useQuery({
    queryKey: teamKeys.members(teamId ?? 0),
    queryFn: () => teamService.getMembers(teamId as number),
    enabled: enabled && teamId !== null && teamId > 0,
  })
}

export function useTeamJoinRequests(teamId: number | null, enabled = true) {
  return useQuery({
    queryKey: teamKeys.joinRequests(teamId ?? 0),
    queryFn: () => teamService.getJoinRequests(teamId as number),
    enabled: enabled && teamId !== null && teamId > 0,
  })
}

export function useTeamDues(teamId: number | null, filters: TeamDuesFilters = {}, enabled = true) {
  return useQuery({
    queryKey: teamKeys.dues(teamId ?? 0, filters),
    queryFn: () => teamService.getDues(teamId as number, filters),
    enabled: enabled && teamId !== null && teamId > 0,
    placeholderData: keepPreviousData,
  })
}

export function useTeamBalance(teamId: number | null, enabled = true) {
  return useQuery({
    queryKey: teamKeys.balance(teamId ?? 0),
    queryFn: () => teamService.getBalance(teamId as number),
    enabled: enabled && teamId !== null && teamId > 0,
  })
}

export function useTeamBookings(
  teamId: number | null,
  page: { limit: number; offset: number } = { limit: 50, offset: 0 },
  enabled = true,
) {
  return useQuery({
    queryKey: teamKeys.bookings(teamId ?? 0, page),
    queryFn: () => teamService.getBookings(teamId as number, page.limit, page.offset),
    enabled: enabled && teamId !== null && teamId > 0,
    placeholderData: keepPreviousData,
  })
}

export function useTeamAudit(
  teamId: number | null,
  page: { limit: number; offset: number } = { limit: 50, offset: 0 },
  enabled = true,
) {
  return useQuery({
    queryKey: teamKeys.audit(teamId ?? 0, page),
    queryFn: () => teamService.getAudit(teamId as number, page.limit, page.offset),
    enabled: enabled && teamId !== null && teamId > 0,
    placeholderData: keepPreviousData,
  })
}

/** پیام‌های چت تیم — صفحه‌بندی cursor جدیدترین‌اول (before_id)؛ polling اختیاری */
export function useTeamMessages(teamId: number | null, enabled = true, refetchInterval: number | false = false) {
  return useInfiniteQuery({
    queryKey: teamKeys.messages(teamId ?? 0),
    queryFn: ({ pageParam }) => teamService.getMessages(teamId as number, 50, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.items.length === 0) return undefined
      return lastPage.items[lastPage.items.length - 1].id
    },
    enabled: enabled && teamId !== null && teamId > 0,
    refetchInterval,
  })
}

export function useTeamUnreadCount(teamId: number | null, enabled = true, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: teamKeys.unreadCount(teamId ?? 0),
    queryFn: () => teamService.getUnreadCount(teamId as number),
    enabled: enabled && teamId !== null && teamId > 0,
    refetchInterval,
  })
}

/** دعوت‌های باز من در همه‌ی تیم‌ها (بج «دعوت‌نامه‌ها» + accept/decline با member_id) */
export function useMyTeamInvitations(enabled = true) {
  return useQuery({
    queryKey: teamKeys.myInvitations(),
    queryFn: () => teamService.getMyInvitations(),
    enabled,
  })
}

export function useManagerTeamPartners(venueId?: number, enabled = true) {
  return useQuery({
    queryKey: teamKeys.partners(venueId),
    queryFn: () => teamService.getManagerPartners(venueId),
    enabled,
    placeholderData: keepPreviousData,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeamCreatePayload) => teamService.create(data),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(team.id), team)
      qc.invalidateQueries({ queryKey: teamKeys.my() })
      qc.invalidateQueries({ queryKey: ['teams', 'discover'] })
    },
  })
}

export function useUpdateTeam(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeamUpdatePayload) => teamService.update(teamId, data),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(teamId), team)
      invalidateTeamScope(qc, teamId)
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useDeactivateTeam(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => teamService.deactivate(teamId),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(teamId), team.team)
      invalidateTeamScope(qc, teamId)
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useInviteTeamMember(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeamInvitePayload) => teamService.invite(teamId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId) })
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useAcceptTeamInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      teamService.acceptInvitation(teamId, memberId),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(team.id), team)
      invalidateTeamScope(qc, team.id)
    },
    onError: (error) => {
      syncOnConflict(qc, error)
      qc.invalidateQueries({ queryKey: teamKeys.myInvitations() })
    },
  })
}

export function useDeclineTeamInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      teamService.declineInvitation(teamId, memberId),
    onSuccess: (_data, vars) => {
      invalidateTeamScope(qc, vars.teamId)
    },
    onError: (error, vars) => {
      syncOnConflict(qc, error, vars.teamId)
    },
  })
}

export function useRemoveTeamMember(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: number) => teamService.removeMember(teamId, memberId),
    onSuccess: () => invalidateTeamScope(qc, teamId),
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useSetTeamMemberRole(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: Exclude<TeamRole, 'captain'> }) =>
      teamService.setMemberRole(teamId, memberId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId) })
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useLeaveTeam(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => teamService.leave(teamId),
    onSuccess: () => invalidateTeamScope(qc, teamId),
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useTransferTeamCaptain(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => teamService.transferCaptain(teamId, userId),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(teamId), team)
      invalidateTeamScope(qc, teamId)
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useRequestJoinTeam(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message?: string) => teamService.requestJoin(teamId, message),
    onSuccess: () => {
      invalidateTeamScope(qc, teamId)
      qc.invalidateQueries({ queryKey: teamKeys.partners() })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useApproveTeamJoinRequest(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => teamService.approveJoinRequest(teamId, requestId),
    onSuccess: () => invalidateTeamScope(qc, teamId),
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useRejectTeamJoinRequest(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => teamService.rejectJoinRequest(teamId, requestId),
    onSuccess: () => invalidateTeamScope(qc, teamId),
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useGenerateTeamDues(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeamDuesGeneratePayload) => teamService.generateDues(teamId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'dues'] })
      qc.invalidateQueries({ queryKey: teamKeys.balance(teamId) })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function usePayTeamDue(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dueId, data }: { dueId: number; data: TeamDuesPayPayload }) =>
      teamService.payDue(teamId, dueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'dues'] })
      qc.invalidateQueries({ queryKey: teamKeys.balance(teamId) })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function useVoidTeamDue(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dueId, reason }: { dueId: number; reason?: string }) =>
      teamService.voidDue(teamId, dueId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'dues'] })
      qc.invalidateQueries({ queryKey: teamKeys.balance(teamId) })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}

export function usePostTeamMessage(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => teamService.postMessage(teamId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.messages(teamId) })
      qc.invalidateQueries({ queryKey: teamKeys.unreadCount(teamId) })
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    },
  })
}

export function useMarkTeamMessagesRead(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => teamService.markMessagesRead(teamId),
    onSuccess: (res) => {
      qc.setQueryData(teamKeys.unreadCount(teamId), res)
    },
  })
}

export function useLinkTeamBooking(teamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: number) => teamService.linkBooking(teamId, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'bookings'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => syncOnConflict(qc, error, teamId),
  })
}
