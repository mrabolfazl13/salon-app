// frontend/src/hooks/useStaffMe.ts
// خودسرویس کارکنان (GET /staff/me) + ادغام دامنه‌ی سالن‌های «تحت مدیریت» (مالکیت
// مدیر + انتصاب کارمند) برای کنسول‌های مالی/قیمت‌گذاری/قراردادها.
// الگو: همان isForbidden/ForbiddenPanel کنسول CRM — بک‌اند per-permission تصمیم
// می‌گیرد؛ فرانت فقط دامنه و ناوبری را باز/بسته می‌کند.

import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'

import { venueService } from '@/services/venue'
import { staffService, type StaffMeRow } from '@/services/staff'
import { useAuthStore } from '@/store/authStore'

export const staffMeKeys = {
  all: ['staff-me'] as const,
}

/** انتصاب‌های فعال خودِ کاربر — [] یعنی کارمند انتصابی نیست */
export function useStaffMe(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: staffMeKeys.all,
    queryFn: async (): Promise<StaffMeRow[]> => {
      const rows = await staffService.me()
      return Array.isArray(rows) ? rows.filter((r) => r.is_active) : []
    },
    enabled: enabled && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

/** آیا کاربر حداقل یک انتصاب کارمندی فعال دارد؟ (خطا → false) */
export function useIsStaff(enabled = true): boolean {
  const q = useStaffMe(enabled)
  return (q.data?.length ?? 0) > 0
}

export interface ManagedVenue {
  id: number
  name: string
  /** null = مالک/سرپرست سالن (دسترسی کامل)؛ لیست کدهای مؤثر کارمند */
  permissions: string[] | null
}

export function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403
}

/**
 * دامنه‌ی سالن‌های کنسول‌های مدیر = my-venues (مدیران) + انتصاب‌های /staff/me (کارکنان).
 * allSettled: ۴۰۳ِ my-venues برای کارمندِ role=user منبع دیگر را بازنمی‌دارد؛
 * فقط وقتی هر دو منبع خطا بدهند کوئری در حالت error قرار می‌گیرد.
 */
export function useManagedVenues(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['managed-venues'],
    queryFn: async (): Promise<ManagedVenue[]> => {
      const [myV, meV] = await Promise.allSettled([venueService.getMyVenues(), staffService.me()])
      if (myV.status === 'rejected' && meV.status === 'rejected') throw myV.reason
      const map = new Map<number, ManagedVenue>()
      for (const v of myV.status === 'fulfilled' && Array.isArray(myV.value) ? myV.value : []) {
        map.set(v.id, { id: v.id, name: v.name, permissions: null })
      }
      if (meV.status === 'fulfilled' && Array.isArray(meV.value)) {
        for (const row of meV.value) {
          if (!row.is_active) continue
          const prev = map.get(row.venue_id)
          if (!prev) {
            map.set(row.venue_id, {
              id: row.venue_id,
              name: row.venue_name || `سالن #${row.venue_id}`,
              permissions: row.permissions ?? [],
            })
          }
        }
      }
      return Array.from(map.values()).sort((a, b) => a.id - b.id)
    },
    enabled: enabled && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}