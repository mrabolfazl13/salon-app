// src/pages/finance/FinanceConsole.tsx
// کنسول مالی — سه تب (داشبورد، تراکنش‌ها، حساب‌ها) با حالت در آدرس (?tab=).
// نقش: venue_manager + club_admin + super_admin (گیت ProtectedRoute در App.tsx).

import React, { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import FinanceDashboardTab from '@/components/finance/FinanceDashboardTab'
import TransactionsPanel from '@/components/finance/TransactionsPanel'
import AccountsPanel from '@/components/finance/AccountsPanel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { useManagedVenues, useStaffPermission, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import { ErrorBox } from '@/components/finance/shared'

const TAB_KEYS = ['dashboard', 'transactions', 'accounts'] as const
type TabKey = (typeof TAB_KEYS)[number]

const FinanceConsole: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && TAB_KEYS.includes(t) ? t : 'dashboard'
  }, [searchParams])

  const venuesQuery = useManagedVenues()
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])
  const venues = venuesQuery.data ?? []

  const changeTab = (value: TabKey) => {
    setSearchParams(value === 'dashboard' ? {} : { tab: value }, { replace: true })
  }

  const loading = (
    <div className="flex min-h-[400px] items-center justify-center">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" role="status" />
    </div>
  )

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">امور مالی</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  داشبورد درآمد و هزینه، دفتر کل و حساب‌ها
                </p>
              </div>
              <Link
                to="/manager-dashboard"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                بازگشت
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl">
          {!financeAccess.ready ? (
            loading
          ) : !financeAccess.allowed ? (
            <div className="p-4">
              <ForbiddenPanel detail="دسترسی مالی برای حساب شما فعال نیست." />
            </div>
          ) : venuesQuery.isPending ? (
            loading
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <div className="p-4">
                <ForbiddenPanel detail="شما به هیچ سالنی دسترسی ندارید." />
              </div>
            ) : (
              <div className="p-4">
                <ErrorBox message="خطا در دریافت اطلاعات" onRetry={() => venuesQuery.refetch()} />
              </div>
            )
          ) : venues.length === 0 ? (
            <div className="p-4">
              <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید." />
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4 rounded-xl border bg-card/50">
                <Tabs value={tab} onValueChange={(v) => changeTab(v as TabKey)}>
                  <TabsList className="grid w-full grid-cols-3 gap-1 bg-transparent p-1">
                    <TabsTrigger value="dashboard" className="gap-1.5">
                      <Icon icon="mdi:chart-box" aria-hidden="true" className="h-4 w-4" />
                      داشبورد
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="gap-1.5">
                      <Icon icon="mdi:book-ledger" aria-hidden="true" className="h-4 w-4" />
                      تراکنش‌ها
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="gap-1.5">
                      <Icon icon="mdi:account-group" aria-hidden="true" className="h-4 w-4" />
                      حساب‌ها
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {tab === 'dashboard' && <FinanceDashboardTab venues={venues} />}
              {tab === 'transactions' && <TransactionsPanel venues={venues} />}
              {tab === 'accounts' && <AccountsPanel venues={venues} />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default FinanceConsole
