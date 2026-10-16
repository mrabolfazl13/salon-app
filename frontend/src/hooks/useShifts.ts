// frontend/src/hooks/useShifts.ts
// هوک‌های TanStack Query برای شیفت پرسنل (P020) — استراتژی cache مثل useCoach/useTournament
// خلاصهٔ ساعت کاری از همان ردیف‌های بازه ساخته می‌شود ⇒ هر نوشتن، هر دو کوئری
// دامنهٔ shift باطل می‌شوند (وگرنه عدد «ساعت این هفته» با سرور نمی‌خواند).

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { shiftService } from '@/services/shift'
import type { ShiftCreatePayload, ShiftListParams, ShiftUpdatePayload } from '@/types/shift'

// ─────────────────────────── Query Keys ───────────────────────────

export const shiftKeys = {
  all: ['shifts'] as const,
  list: (venueId: number, params: ShiftListParams) => ['shifts', 'list', venueId, params] as const,
  summary: (venueId: number, from: string, to: string) =>
    ['shifts', 'summary', venueId, from, to] as const,
}

function invalidateShiftScope(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: shiftKeys.all })
}

// ─────────────────────────── Queries ───────────────────────────

export function useShifts(venueId: number | null, params: ShiftListParams = {}, enabled = true) {
  return useQuery({
    queryKey: shiftKeys.list(venueId ?? 0, params),
    queryFn: () => shiftService.list(venueId as number, params),
    enabled: enabled && venueId !== null && venueId > 0,
  })
}

export function useShiftSummary(venueId: number | null, from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: shiftKeys.summary(venueId ?? 0, from, to),
    queryFn: () => shiftService.summary(venueId as number, from, to),
    enabled: enabled && venueId !== null && venueId > 0,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShiftCreatePayload) => shiftService.create(data),
    onSuccess: () => invalidateShiftScope(qc),
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShiftUpdatePayload }) =>
      shiftService.update(id, data),
    onSuccess: () => invalidateShiftScope(qc),
  })
}

export function useCancelShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shiftService.cancel(id),
    onSuccess: () => invalidateShiftScope(qc),
  })
}

export function useExportShifts() {
  return useMutation({
    mutationFn: ({ venueId, month }: { venueId: number; month: string }) =>
      shiftService.exportCsv(venueId, month),
  })
}
