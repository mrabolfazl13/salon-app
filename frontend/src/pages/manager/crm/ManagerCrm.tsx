// src/pages/manager/crm/ManagerCrm.tsx
// کنسول «مشتریان» + «پرسنل» مدیر — مسیر /manager/crm با چهار تب.
// گیت: لاگین (ProtectedRoute ساده) — نقش کارمند (role=user با انتصاب) مجاز به
// باز کردن مسیر است؛ بک‌اند per-permission پاسخ ۴۰۳ می‌دهد و پنل دوستانه
// ForbiddenPanel نمایش داده می‌شود (مسیر پنهان نمی‌شود).

import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues } from '@/hooks/useStaffMe'
import CustomersTab from '@/components/crm/CustomersTab'
import CrmStatsTab from '@/components/crm/CrmStatsTab'
import CampaignsTab from '@/components/crm/CampaignsTab'
import StaffTab from '@/components/crm/StaffTab'
import { ForbiddenPanel } from '@/components/crm/shared'
import { isForbidden } from '@/components/crm/shared'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { cn } from '@/lib/utils'

const TAB_KEYS = ['customers', 'stats', 'campaigns', 'staff'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TAB_ITEMS: { value: TabKey; icon: string; text: string }[] = [
  { value: 'customers', icon: 'mdi:account-group', text: 'مشتریان' },
  { value: 'stats', icon: 'mdi:chart-box', text: 'آمار' },
  { value: 'campaigns', icon: 'mdi:message-flash-outline', text: 'کمپین' },
  { value: 'staff', icon: 'mdi:badge-account-outline', text: 'پرسنل' },
]

const ManagerCrm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && TAB_KEYS.includes(t) ? t : 'customers'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده: سالن‌های مدیر + انتصاب کارمند (crm.view/customer.view_basic)
  const venuesQuery = useManagedVenues()
  const venues = venuesQuery.data ?? []
  const [venueId, setVenueId] = useState<number | null>(null)

  useEffect(() => {
    if (venuesQuery.data) {
      setVenueId((prev) => prev ?? venuesQuery.data[0]?.id ?? null)
      if (venuesQuery.data.length === 0) setVenueId(null)
    }
  }, [venuesQuery.data])

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'customers' ? {} : { tab: value }, { replace: true })
  }

  const renderTab = () => {
    if (venueId === null) {
      return (
        <ErrorBox message={'برای این سالن رکورد مدیریتی‌ای در دسترس نیست'} />
      )
    }
    if (tab === 'customers') return <CustomersTab venueId={venueId} />
    if (tab === 'stats') return <CrmStatsTab venueId={venueId} />
    if (tab === 'campaigns') return <CampaignsTab venueId={venueId} />
    return <StaffTab venueId={venueId} />
  }

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-background">
        {/* هدر */}
        <div className="relative -mx-4 overflow-hidden bg-gradient-to-br from-slate-900 via-[#312e5f] to-violet-600 px-4 pb-14 pt-8 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:pb-16 md:pt-10">
          <div className="mx-auto max-w-[1200px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-1 text-xl font-extrabold text-white md:text-[1.9rem]">
                    مشتریان و پرسنل
                  </h1>
                  <p className="text-[0.68rem] text-white">
                    CRM سالن — گروه‌بندی مشتریان، کمپین پیامکی بازاریابی و مدیریت کارکنان
                  </p>
                </div>
                <Link
                  to="/manager-dashboard"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-slate-950/25 px-5 py-2 text-[0.85rem] font-bold text-white transition-colors hover:bg-slate-950/40"
                >
                  <Icon icon="mdi:store-outline" aria-hidden="true" className="h-4 w-4" />
                  پنل مدیریت
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative z-[2] mx-auto -mt-10 max-w-[1200px] px-3 pb-20 sm:px-4 md:px-8">
          {venuesQuery.isPending ? (
            <div className="flex justify-center py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-violet-600 border-t-transparent" role="status" aria-label="در حال بارگذاری" />
            </div>
          ) : venuesQuery.isError ? (
            isForbidden(venuesQuery.error) ? (
              <div className="rounded-[18px] border border-border bg-card/95 shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
                <ForbiddenPanel detail="پنل مشتریان برای حساب کاربری شما باز است، اما بک‌اند هنوز دسترسی لازم (crm.view یا customer.view_basic) را برای شما ثبت نکرده است؛ از مدیر سالن بخواهید شما را در بخش «پرسنل» با دسترسی مناسب انتصاب کند." />
              </div>
            ) : (
              <ErrorBox message="خطا در دریافت سالن‌ها" onRetry={() => venuesQuery.refetch()} />
            )
          ) : (
            <>
              {venues.length === 0 ? (
                <div className="rounded-[18px] border border-border bg-card/95 p-4">
                  <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید و در هیچ سالنی با دسترسی CRM انتصاب نشده‌اید." />
                </div>
              ) : (
                <>
                  {/* انتخاب سالن — چیپ اسکرول‌افقی موبایل */}
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {venues.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVenueId(v.id)}
                        aria-pressed={venueId === v.id}
                        className={cn(
                          'min-h-11 shrink-0 whitespace-nowrap rounded-[10px] border px-3 text-[0.78rem] font-bold transition-colors',
                          venueId === v.id
                            ? 'border-transparent bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                            : 'border-violet-600/25 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400'
                        )}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 rounded-lg border border-border bg-card/95 px-1 shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:px-2">
                    <Tabs value={tab} onValueChange={(v) => changeTab(v as TabKey)}>
                      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {TAB_ITEMS.map((item) => (
                          <TabsTrigger key={item.value} value={item.value} className="min-h-12 gap-2 whitespace-nowrap px-3 text-[0.85rem] font-bold">
                            <Icon icon={item.icon} aria-hidden="true" className="h-4 w-4" />
                            {item.text}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <motion.div key={tab + (venueId ?? 0)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {renderTab()}
                  </motion.div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ManagerCrm
