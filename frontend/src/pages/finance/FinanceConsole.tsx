// src/pages/finance/FinanceConsole.tsx
// کنسول مالی مدیر — صفحه/مسیر /finance (خارج از ManagerDashboard تا فایل ۲۲۰۰
// خطی منفجر نشود) با سه تب: داشبورد مالی، هزینه‌ها و تراکنش‌ها، حساب‌ها.
// نقش: venue_manager + club_admin + super_admin (گیت ProtectedRoute در App.tsx).

import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues, useStaffPermission, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import type { FinanceVenue } from '@/hooks/useFinance'
import FinanceDashboardTab from '@/components/finance/FinanceDashboardTab'
import TransactionsPanel from '@/components/finance/TransactionsPanel'
import AccountsPanel from '@/components/finance/AccountsPanel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'

const TAB_KEYS = ['dashboard', 'transactions', 'accounts'] as const
type TabKey = (typeof TAB_KEYS)[number]

const FinanceConsole: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && TAB_KEYS.includes(t) ? t : 'dashboard'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده: سالن‌های مدیر + انتصاب‌های کارکنان (/staff/me)
  const venuesQuery = useManagedVenues()
  const venues: FinanceVenue[] = venuesQuery.data ?? []
  // کارمندِ بدون کد مالی: کوئری‌های مالی شلیک نمی‌شوند — پیش‌تر پنج ۴۰۳ و اسکلتون ماندگار
  // («در حال بارگذاری...» روی صفحه می‌ماند) نتیجهٔ همین باز شدن بی‌دسترسی بود (ممیزی F-04)
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'dashboard' ? {} : { tab: value }, { replace: true })
  }

  const loading = (
    <div className="flex justify-center py-12">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" role="status" aria-label="در حال بارگذاری" />
    </div>
  )

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-background">
        {/* هدر */}
        <div className="relative -mx-4 overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-cyan-600 px-4 pb-14 pt-8 sm:-mx-6 sm:px-6 md:pb-16 md:pt-10 md:-mx-8 md:px-8">
          <div className="mx-auto max-w-[1200px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-2xl font-extrabold text-white md:text-[1.9rem]">
                    امور مالی
                  </h1>
                  <p className="text-sm text-white/70">
                    داشبورد درآمد و هزینه، دفتر کل و حساب‌های اشخاص
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

        <div className="relative z-[2] mx-auto -mt-10 max-w-[1200px] px-3 pb-20 sm:px-4 md:px-8">
          {!financeAccess.ready ? (
            loading
          ) : !financeAccess.allowed ? (
            <div className="rounded-[18px] border border-border bg-card/95 p-4">
              <ForbiddenPanel detail="دسترسی مالی برای حساب شما در هیچ سالنی باز نشده است؛ مدیر سالن می‌تواند در بخش «پرسنل» کد «مشاهده امور مالی» را به شما بدهد." />
            </div>
          ) : venuesQuery.isPending ? (
            loading
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <div className="rounded-[18px] border border-border bg-card/95 p-4">
                <ForbiddenPanel detail="حساب شما هیچ سالنی تحت مدیریت ندارد و در هیچ سالنی با دسترسی مالی انتصاب نشده است؛ از مدیر سالن بخواهید شما را در بخش «پرسنل» ثبت کند." />
              </div>
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

              {venues.length > 0 && (
                <>
                  <div className="mb-4 rounded-2xl border border-border bg-card/95 px-1 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:px-2 md:mb-6">
                    <Tabs value={tab} onValueChange={(v) => changeTab(v as TabKey)}>
                      <TabsList className="grid w-full grid-cols-3 gap-1 bg-transparent p-1">
                        <TabsTrigger value="dashboard" className="min-h-12 gap-1.5 px-1 text-[0.82rem] font-bold">
                          <Icon icon="mdi:chart-box" aria-hidden="true" className="h-[18px] w-[18px]" />
                          داشبورد
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="min-h-12 gap-1.5 px-1 text-[0.82rem] font-bold">
                          <Icon icon="mdi:book-ledger" aria-hidden="true" className="h-[18px] w-[18px]" />
                          تراکنش‌ها
                        </TabsTrigger>
                        <TabsTrigger value="accounts" className="min-h-12 gap-1.5 px-1 text-[0.82rem] font-bold">
                          <Icon icon="mdi:account-group" aria-hidden="true" className="h-[18px] w-[18px]" />
                          حساب‌ها
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {tab === 'dashboard' && <FinanceDashboardTab venues={venues} />}
                    {tab === 'transactions' && <TransactionsPanel venues={venues} />}
                    {tab === 'accounts' && <AccountsPanel venues={venues} />}
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

export default FinanceConsole
