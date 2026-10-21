// src/pages/manager/pricing/ManagerPricing.tsx
// بخش «قیمت‌گذاری» مدیر — مسیر /manager/pricing (گیت venue_manager مثل /finance).
// سه تب: قوانین قیمت (شامل مبنای سالن و پیش‌نمایش موتور قیمت)، تعطیلات، کدهای تخفیف.

import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues, useStaffPermission, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import PricingRulesTab from '@/components/pricing/PricingRulesTab'
import HolidaysTab from '@/components/pricing/HolidaysTab'
import CouponsTab from '@/components/pricing/CouponsTab'
import PricingInsightsTab from '@/components/pricing/PricingInsightsTab'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'

const TAB_KEYS = ['rules', 'insights', 'holidays', 'coupons'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TAB_ITEMS: { value: TabKey; icon: string; text: string }[] = [
  { value: 'rules', icon: 'mdi:tag-percent-outline', text: 'قوانین قیمت' },
  { value: 'insights', icon: 'mdi:chart-bubble', text: 'تقاضا و پیشنهاد' },
  { value: 'holidays', icon: 'mdi:calendar-multiple', text: 'تعطیلات' },
  { value: 'coupons', icon: 'mdi:ticket-percent-outline', text: 'کدهای تخفیف' },
]

const ManagerPricing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && (TAB_KEYS as readonly string[]).includes(t) ? t : 'rules'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده مدیر + کارمند (/staff/me) — مثل کنسول مالی
  const venuesQuery = useManagedVenues()
  const venues = venuesQuery.data ?? []
  // کارمندِ بدون کد قیمت‌گذاری: قوانین/تعطیلات/کدها شلیک نمی‌شوند (۴۰۳ + اسکلتون ماندگار — ممیزی F-04)
  const pricingAccess = useStaffPermission(['pricing.manage', 'holiday.manage', 'coupon.manage'])
  const [venueId, setVenueId] = useState<number | null>(null)
  const selectedVenue = venueId ?? venues[0]?.id ?? null

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'rules' ? {} : { tab: value }, { replace: true })
  }

  const loading = (
    <div className="flex justify-center py-12">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" role="status" aria-label="در حال بارگذاری" />
    </div>
  )

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-background">
        <div className="relative -mx-4 overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-violet-600 to-amber-600 px-4 pb-14 pt-8 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:pb-16 md:pt-10">
          <div className="mx-auto max-w-[1200px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-2xl font-extrabold text-white md:text-[1.9rem]">
                    قیمت‌گذاری
                  </h1>
                  <p className="text-sm text-white/70">
                    قوانین داینامیک قیمت، تقویم تعطیلات و کدهای تخفیف — قیمت فقط سمت سرور محاسبه می‌شود
                  </p>
                </div>
                <Link
                  to="/manager-dashboard"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-5 py-2 text-[0.85rem] font-bold text-white transition-colors hover:bg-white/25"
                >
                  <Icon icon="mdi:store-outline" aria-hidden="true" className="h-4 w-4" />
                  پنل مدیریت
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative z-[2] mx-auto -mt-10 max-w-[1200px] px-4 pb-12 md:px-8">
          {!pricingAccess.ready ? (
            loading
          ) : !pricingAccess.allowed ? (
            <ForbiddenPanel detail="برای قیمت‌گذاری باید مدیر سالن باشید یا در یک سالن با دسترسی pricing.manage/holiday.manage/coupon.manage انتصاب شوید." />
          ) : venuesQuery.isPending ? (
            loading
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <ForbiddenPanel detail="برای قیمت‌گذاری باید مدیر سالن باشید یا در یک سالن با دسترسی pricing.manage/holiday.manage/coupon.manage انتصاب شوید." />
            ) : (
              <ErrorBox message="خطا در دریافت سالن‌های شما" onRetry={() => venuesQuery.refetch()} />
            )
          ) : (
            <>
              {venues.length === 0 && (
                <div className="mb-4 rounded-[18px] border border-border bg-card/95 p-4">
                  <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید و در هیچ سالنی انتصاب کارمندی فعال ندارید." />
                </div>
              )}

              <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:px-5">
                <Tabs value={tab} onValueChange={(v) => changeTab(v as TabKey)} className="min-w-[260px] flex-1">
                  <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {TAB_ITEMS.map((item) => (
                      <TabsTrigger key={item.value} value={item.value} className="min-h-12 gap-2 whitespace-nowrap px-3 text-[0.88rem] font-bold">
                        <Icon icon={item.icon} aria-hidden="true" className="h-4 w-4" />
                        {item.text}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {venues.length > 0 && (
                  <Select
                    value={selectedVenue != null ? String(selectedVenue) : undefined}
                    onValueChange={(v) => setVenueId(Number(v))}
                  >
                    <SelectTrigger aria-label="سالن" className="min-w-[200px] rounded-[10px]">
                      <SelectValue placeholder="سالن" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {venues.length > 0 && (
                <>
                  {tab === 'rules' && <PricingRulesTab venues={venues} venueId={selectedVenue} />}
                  {tab === 'insights' && <PricingInsightsTab venues={venues} venueId={selectedVenue} />}
                  {tab === 'holidays' && <HolidaysTab venues={venues} venueId={selectedVenue} />}
                  {tab === 'coupons' && <CouponsTab venues={venues} venueId={selectedVenue} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ManagerPricing
