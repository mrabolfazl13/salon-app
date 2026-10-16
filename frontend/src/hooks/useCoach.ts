// frontend/src/hooks/useCoach.ts
// هوک‌های TanStack Query برای نقش مربی (P004) — state سمت سرور (الگوی useTeams/useGames)
// استراتژی: هر mutation موفق → داشبورد + لیست جلسات باطل می‌شود؛ داشبورد از همین
// ردیف‌ها ساخته می‌شود، پس staleness یعنی عدد روی صفحه با سرور نمی‌خواند.

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { coachService } from '@/services/coach'
import type {
  CoachSessionCreatePayload,
  CoachSessionsParams,
  CoachSessionStatus,
  CoachSessionUpdatePayload,
} from '@/types/coach'

// ─────────────────────────── Query Keys ───────────────────────────

export const coachKeys = {
  all: ['coach'] as const,
  dashboard: () => ['coach', 'dashboard'] as const,
  sessions: (params: CoachSessionsParams) => ['coach', 'sessions', params] as const,
  clients: () => ['coach', 'clients'] as const,
  detail: (id: number) => ['coach', 'sessions', 'detail', id] as const,
}

/** ابطال دامنهٔ مربی (داشبورد شمارش‌ها را از همان ردیف‌ها می‌سازد) */
function invalidateCoachScope(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: coachKeys.dashboard() })
  qc.invalidateQueries({ queryKey: ['coach', 'sessions'] })
  qc.invalidateQueries({ queryKey: coachKeys.clients() })
}

// ─────────────────────────── Queries ───────────────────────────

export function useCoachDashboard(enabled = true) {
  return useQuery({
    queryKey: coachKeys.dashboard(),
    queryFn: () => coachService.getDashboard(),
    enabled,
  })
}

export function useCoachSessions(params: CoachSessionsParams = {}, enabled = true) {
  return useQuery({
    queryKey: coachKeys.sessions(params),
    queryFn: () => coachService.listSessions(params),
    enabled,
  })
}

export function useCoachClients(enabled = true) {
  return useQuery({
    queryKey: coachKeys.clients(),
    queryFn: () => coachService.getClients(),
    enabled,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateCoachSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CoachSessionCreatePayload) => coachService.createSession(data),
    onSuccess: () => invalidateCoachScope(qc),
  })
}

export function useUpdateCoachSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CoachSessionUpdatePayload }) =>
      coachService.updateSession(id, data),
    onSuccess: (session) => {
      qc.setQueryData(coachKeys.detail(session.id), session)
      invalidateCoachScope(qc)
    },
  })
}

export function useSetCoachAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CoachSessionStatus }) =>
      coachService.setAttendance(id, status),
    onSuccess: (session) => {
      qc.setQueryData(coachKeys.detail(session.id), session)
      invalidateCoachScope(qc)
    },
  })
}

export function useSetCoachSettled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settled }: { id: number; settled: boolean }) =>
      coachService.setSettled(id, settled),
    onSuccess: (session) => {
      qc.setQueryData(coachKeys.detail(session.id), session)
      invalidateCoachScope(qc)
    },
  })
}
