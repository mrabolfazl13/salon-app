// frontend/src/hooks/useMatching.ts
// هوک‌های TanStack Query برای حریف‌یابی و چالش بازی (P010)
// چالش روی فهرست پیشنهادها «پرچم چالش باز» می‌گذارد ⇒ هر نوشتن چالش، هر دو دامنه
// (match + challenges) باطل می‌شود؛ وگرنه دکمهٔ «چالش بفرست» بعد از ارسال فعال می‌ماند.

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { matchingService } from '@/services/matching'
import type { ChallengeCreatePayload, ChallengeFilters } from '@/types/matching'

// ─────────────────────────── Query Keys ───────────────────────────

export const matchingKeys = {
  all: ['matching'] as const,
  suggestions: (teamId: number, params: { limit?: number; sport?: string }) =>
    ['matching', 'suggestions', teamId, params] as const,
  challenges: (filters: ChallengeFilters) => ['matching', 'challenges', filters] as const,
}

function invalidateMatchingScope(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: matchingKeys.all })
}

// ─────────────────────────── Queries ───────────────────────────

export function useMatchSuggestions(
  teamId: number | null,
  params: { limit?: number; sport?: string } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: matchingKeys.suggestions(teamId ?? 0, params),
    queryFn: () => matchingService.suggestions(teamId as number, params),
    enabled: enabled && teamId !== null && teamId > 0,
  })
}

export function useChallenges(filters: ChallengeFilters, enabled = true) {
  return useQuery({
    queryKey: matchingKeys.challenges(filters),
    queryFn: () => matchingService.challenges(filters),
    enabled: enabled && filters.team_id > 0,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useSendChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChallengeCreatePayload) => matchingService.sendChallenge(data),
    onSuccess: () => invalidateMatchingScope(qc),
  })
}

export function useAcceptChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      matchingService.acceptChallenge(id, note),
    onSuccess: () => invalidateMatchingScope(qc),
  })
}

export function useDeclineChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      matchingService.declineChallenge(id, note),
    onSuccess: () => invalidateMatchingScope(qc),
  })
}

export function useCancelChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => matchingService.cancelChallenge(id),
    onSuccess: () => invalidateMatchingScope(qc),
  })
}
