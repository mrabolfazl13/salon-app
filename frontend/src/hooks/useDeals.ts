// frontend/src/hooks/useDeals.ts
// هوک‌های دیل (سانس لحظه آخری) + وفاداری کاربر — الگوی useFinance.ts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dealService, type DealAvailableParams, type DealPublishPayload } from '@/services/deals'
import { loyaltyService } from '@/services/loyalty'

export const dealKeys = {
  all: ['deals'] as const,
  available: (p: DealAvailableParams) => ['deals', 'available', p] as const,
  subscription: ['deals', 'subscription'] as const,
}

export const loyaltyKeys = {
  all: ['loyalty'] as const,
  me: ['loyalty', 'me'] as const,
}

export function useAvailableDeals(params: DealAvailableParams, enabled = true, intervalMs = 60000) {
  return useQuery({
    queryKey: dealKeys.available(params),
    queryFn: () => dealService.available(params),
    enabled,
    staleTime: 15000,
    refetchInterval: intervalMs,
  })
}

export function usePublishDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DealPublishPayload) => dealService.publish(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useUnpublishDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: number) => dealService.unpublish(slotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealKeys.all }),
  })
}

export function useDealSubscription(enabled = true) {
  return useQuery({
    queryKey: dealKeys.subscription,
    queryFn: () => dealService.getSubscription(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSetDealSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => dealService.setSubscription(enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealKeys.subscription }),
  })
}

export function useMyLoyalty(limit = 10, enabled = true) {
  return useQuery({
    queryKey: loyaltyKeys.me,
    queryFn: () => loyaltyService.me(limit),
    enabled,
    staleTime: 30 * 1000,
  })
}