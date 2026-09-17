// frontend/src/hooks/usePricing.ts
// هوک‌های TanStack Query بخش قیمت‌گذاری مدیر: قوانین، پیش‌نمایش، قیمت پایه،
// کدهای تخفیف و مناسبت‌ها — الگوی style/useFinance.ts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  pricingService,
  type PricingPreview,
  type PricingRulePayload,
} from '@/services/pricing'
import {
  couponService,
  type CouponCreatePayload,
  type CouponUpdatePayload,
} from '@/services/coupons'
import {
  holidayService,
  type HolidayBulkItem,
} from '@/services/holidays'

export const pricingRuleKeys = {
  all: ['pricing-rules'] as const,
  list: (venueId: number | null) => ['pricing-rules', 'list', venueId] as const,
}

export const couponKeys = {
  all: ['coupons'] as const,
  list: (venueId: number | null) => ['coupons', 'list', venueId] as const,
}

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (start: string, end: string) => ['holidays', 'list', { start, end }] as const,
}

// ─────────────────────────── قوانین قیمت ───────────────────────────

export function usePricingRules(venueId: number | null, enabled = true) {
  return useQuery({
    queryKey: pricingRuleKeys.list(venueId),
    queryFn: () => pricingService.listRules(venueId as number, true),
    enabled: enabled && venueId != null,
  })
}

export function useCreatePricingRule(_venueId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PricingRulePayload) => pricingService.createRule(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all }),
  })
}

export function useUpdatePricingRule(_venueId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: number; data: Partial<PricingRulePayload> }) =>
      pricingService.updateRule(ruleId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all }),
  })
}

export function useDeletePricingRule(_venueId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: number) => pricingService.deleteRule(ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all }),
  })
}

export function useSetDefaultPrice(venueId: number | null) {
  return useMutation({
    mutationFn: (defaultSlotPrice: number) =>
      pricingService.setDefaultPrice(venueId as number, defaultSlotPrice),
  })
}

/** پیش‌نمایش موتور قیمت — دستی (mutation) چون با هر کلیک محاسبه می‌شود */
export function usePricingPreview() {
  return useMutation({
    mutationFn: (data: {
      venue_id: number
      slot_date: string
      start_time: string
      base_price?: number | null
      duration?: number
    }) => pricingService.preview(data),
  })
}

export type { PricingPreview }

// ─────────────────────────── کدهای تخفیف ───────────────────────────

export function useCoupons(venueId: number | null, enabled = true) {
  return useQuery({
    queryKey: couponKeys.list(venueId),
    // venueId=null → «همه‌ی دامنه‌ی من» (بک‌اند خودش scope می‌کند)
    queryFn: () => couponService.list(venueId ?? undefined),
    enabled,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CouponCreatePayload) => couponService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ couponId, data }: { couponId: number; data: CouponUpdatePayload }) =>
      couponService.update(couponId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  })
}

export function useDisableCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (couponId: number) => couponService.disable(couponId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.all }),
  })
}

// ─────────────────────────── مناسبت‌ها ───────────────────────────

export function useHolidays(start: string, end: string, enabled = true) {
  return useQuery({
    queryKey: holidayKeys.list(start, end),
    queryFn: () => holidayService.list({ start, end }),
    enabled,
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      holiday_date: string
      name: string
      is_national: boolean
      venue_id: number | null
    }) => holidayService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayKeys.all }),
  })
}

export function useBulkHolidays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: HolidayBulkItem[]) => holidayService.bulkCreate(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayKeys.all }),
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (holidayId: number) => holidayService.remove(holidayId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayKeys.all }),
  })
}