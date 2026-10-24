// src/pages/finance/FinanceConsole.tsx
// پوستهٔ مالی — گیت دسترسی و دادهٔ سالن‌ها، سپس Outlet به یکی از صفحات:
// /finance (نمای کلی)، /finance/transactions، /finance/accounts، /finance/reports.
// عمداً نوار تب ندارد؛ پیمایش با کارت‌های هاب و دکمهٔ بازگشت انجام می‌شود.
// لینک‌های قدیمی ?tab= به مسیرهای تازه ریدایرکت می‌شوند.

import React from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { useManagedVenues, useStaffPermission, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import { ErrorBox } from '@/components/finance/shared'
import type { FinanceOutletContext } from './context'

const LEGACY_TABS: Record<string, string> = {
  dashboard: '/finance',
  transactions: '/finance/transactions',
  accounts: '/finance/accounts',
}

const FinanceConsole: React.FC = () => {
  const [searchParams] = useSearchParams()
  const legacyTab = searchParams.get('tab')
  const legacyTarget = legacyTab ? LEGACY_TABS[legacyTab] : undefined

  const venuesQuery = useManagedVenues()
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])
  const venues = venuesQuery.data ?? []

  if (legacyTarget) {
    return <Navigate to={legacyTarget} replace />
  }

  const loading = (
    <div className="flex min-h-[400px] items-center justify-center">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" role="status" />
    </div>
  )

  let content: React.ReactNode
  if (!financeAccess.ready) {
    content = loading
  } else if (!financeAccess.allowed) {
    content = (
      <div className="mx-auto max-w-5xl p-4">
        <ForbiddenPanel detail="دسترسی مالی برای حساب شما فعال نیست." />
      </div>
    )
  } else if (venuesQuery.isPending) {
    content = loading
  } else if (venuesQuery.isError) {
    content = isForbiddenError(venuesQuery.error) ? (
      <div className="mx-auto max-w-5xl p-4">
        <ForbiddenPanel detail="شما به هیچ سالنی دسترسی ندارید." />
      </div>
    ) : (
      <div className="mx-auto max-w-5xl p-4">
        <ErrorBox message="خطا در دریافت اطلاعات" onRetry={() => venuesQuery.refetch()} />
      </div>
    )
  } else if (venues.length === 0) {
    content = (
      <div className="mx-auto max-w-5xl p-4">
        <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید." />
      </div>
    )
  } else {
    content = <Outlet context={{ venues } satisfies FinanceOutletContext} />
  }

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-background">{content}</div>
    </Layout>
  )
}

export default FinanceConsole
