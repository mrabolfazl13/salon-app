// frontend/src/hooks/useTournament.ts
// هوک‌های TanStack Query برای تورنمنت (P005) — استراتژی cache مثل useCoach
// نکته: نتایج و قرعه‌کشی ساختار براکت را عوض می‌کنند ⇒ هر mutation کل دامنهٔ
// tournament را باطل می‌کند (فهرست شمارش تیم‌ها را از همان ردیف‌ها می‌سازد).

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { tournamentService, type TournamentsParams } from '@/services/tournament'
import type { TournamentCreatePayload } from '@/types/tournament'

// ─────────────────────────── Query Keys ───────────────────────────

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: (params: TournamentsParams) => ['tournaments', 'list', params] as const,
  detail: (id: number) => ['tournaments', 'detail', id] as const,
  bracket: (id: number) => ['tournaments', 'bracket', id] as const,
  standings: (id: number) => ['tournaments', 'standings', id] as const,
}

function invalidateTournamentScope(qc: QueryClient, id?: number) {
  qc.invalidateQueries({ queryKey: tournamentKeys.all })
  if (id) {
    qc.invalidateQueries({ queryKey: tournamentKeys.detail(id) })
    qc.invalidateQueries({ queryKey: tournamentKeys.bracket(id) })
    qc.invalidateQueries({ queryKey: tournamentKeys.standings(id) })
  }
}

// ─────────────────────────── Queries ───────────────────────────

export function useTournaments(params: TournamentsParams = {}, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.list(params),
    queryFn: () => tournamentService.list(params),
    enabled,
  })
}

export function useTournament(id: number | null, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.detail(id ?? 0),
    queryFn: () => tournamentService.get(id as number),
    enabled: enabled && id !== null && id > 0,
  })
}

export function useTournamentBracket(id: number | null, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.bracket(id ?? 0),
    queryFn: () => tournamentService.bracket(id as number),
    enabled: enabled && id !== null && id > 0,
  })
}

export function useTournamentStandings(id: number | null, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.standings(id ?? 0),
    queryFn: () => tournamentService.standings(id as number),
    enabled: enabled && id !== null && id > 0,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TournamentCreatePayload) => tournamentService.create(data),
    onSuccess: () => invalidateTournamentScope(qc),
  })
}

export function useOpenRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tournamentService.openRegistration(id),
    onSuccess: (_data, id) => invalidateTournamentScope(qc, id),
  })
}

export function useRegisterTournamentTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teamId, seed }: { id: number; teamId: number; seed?: number | null }) =>
      tournamentService.registerTeam(id, teamId, seed),
    onSuccess: (_data, { id }) => invalidateTournamentScope(qc, id),
  })
}

export function useWithdrawTournamentTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teamId }: { id: number; teamId: number }) =>
      tournamentService.withdrawTeam(id, teamId),
    onSuccess: (_data, { id }) => invalidateTournamentScope(qc, id),
  })
}

export function useDrawTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tournamentService.draw(id),
    onSuccess: (_data, id) => invalidateTournamentScope(qc, id),
  })
}

export function useSetMatchResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ matchId, scoreA, scoreB }:
      { matchId: number; scoreA: number; scoreB: number }) =>
      tournamentService.setResult(matchId, scoreA, scoreB),
    // پاسخ دیدار شناسهٔ تورنمنت ندارد ⇒ کل دامنه باطل می‌شود (براکت + فهرست + رتبه‌ها)
    onSuccess: () => invalidateTournamentScope(qc),
  })
}

export function useCancelTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tournamentService.cancel(id),
    onSuccess: (_data, id) => invalidateTournamentScope(qc, id),
  })
}
