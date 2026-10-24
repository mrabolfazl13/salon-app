// frontend/src/hooks/useStaffMe.ts
// خودسرویس کارکنان (GET /staff/me) + ادغام دامنه‌ی سالن‌های «تحت مدیریت» (مالکیت
// مدیر + انتصاب کارمند) برای کنسول‌های مالی/قیمت‌گذاری/قراردادها.
// الگو: همان isForbidden/ForbiddenPanel کنسول CRM — بک‌اند per-permission تصمیم
// می‌گیرد؛ فرانت فقط دامنه و ناوبری را باز/بسته می‌کند.

import { isAxiosError } from 'axios'
import { useMemo } from 'react'
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
  /* فقط برای سالن‌های مالکیت مدیر از my-venues پر می‌شود؛ کارمند فقط نام دارد */
  address?: string
  category?: 'futsal' | 'gym'
  images?: string[]
  phone?: string | null
  is_verified?: boolean
  payment_mode?: string | null
}

export function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403
}

/** کدهای دسترسی مؤثر کاربر — سرهمِ همهٔ انتصاب‌های فعال (خالی اگر کارمند نیست) */
export function useStaffCodes(): string[] {
  const q = useStaffMe()
  return useMemo(() => {
    const set = new Set<string>()
    for (const row of q.data ?? []) for (const code of row.permissions ?? []) set.add(code)
    return Array.from(set)
  }, [q.data])
}

/**
 * آیا کاربر کد دسترسی لازم را دارد؟
 * مالک سالن و ادمین کل در دامنهٔ خود همهٔ کدها را دارند (بک‌اند هم همین‌طور گیت می‌کند)؛
 * کارمند فقط کدهای انتصاب فعالش. پیش از پاسخ دادن، `codesReady` را بررسی کنید تا
 * کنسول برای یک لحظه با «نداشتن کد» اشتباه گرفته نشود.
 */
export function useStaffPermission(codes: string[]) {
  const role = useAuthStore((s) => s.user?.role)
  const q = useStaffMe()
  const isOwner = role === 'super_admin' || role === 'venue_manager' || role === 'club_admin'
  const allowed =
    isOwner ||
    (q.data ?? []).some((row) => row.is_active && (row.permissions ?? []).some((c) => codes.includes(c)))
  return { allowed, ready: isOwner || !q.isPending }
}

/**
 * دامنه‌ی سالن‌های کنسول‌های مدیر = my-venues (مدیران) + انتصاب‌های /staff/me (کارکنان).
 * my-venues فقط برای نقش‌های مالک پرسیده می‌شود — کارمندِ role=user همیشه ۴۰۳ می‌گیرد
 * و آن ۴۰۳ در کنسول شبکه/خطای کنسول صفحه، نویزِ بی‌معنی بود (ممیزی موبایل، F-03).
 */
export function useManagedVenues(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.user?.role)
  const ownsVenues = role === 'venue_manager' || role === 'club_admin' || role === 'super_admin'
  return useQuery({
    queryKey: ['managed-venues'],
    queryFn: async (): Promise<ManagedVenue[]> => {
      const [myV, meV] = await Promise.allSettled([
        ownsVenues ? venueService.getMyVenues() : Promise.resolve([]),
        staffService.me(),
      ])
      if (myV.status === 'rejected' && meV.status === 'rejected') throw myV.reason
      const map = new Map<number, ManagedVenue>()
      for (const v of myV.status === 'fulfilled' && Array.isArray(myV.value) ? myV.value : []) {
        map.set(v.id, {
          id: v.id,
          name: v.name,
          permissions: null,
          address: v.address,
          category: v.category,
          images: v.images,
          phone: v.phone,
          is_verified: v.is_verified,
          payment_mode: v.payment_mode,
        })
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