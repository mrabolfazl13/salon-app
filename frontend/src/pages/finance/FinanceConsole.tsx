// src/pages/finance/FinanceConsole.tsx
// Modern Finance Console with Sidebar Navigation - User-Friendly Design
import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { SidebarNav } from '@/components/finance/SidebarNav'
import { DashboardOverview } from '@/components/finance/DashboardOverview'
import { useManagedVenues, useStaffPermission, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import { ErrorBox } from '@/components/finance/shared'

const FinanceConsole: React.FC = () => {
  const venuesQuery = useManagedVenues()
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])
  const venues = venuesQuery.data ?? []

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
                  مدیریت درآمد، هزینه و حساب‌ها
                </p>
              </div>
              <Link
                to="/manager-dashboard"
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent h-8"
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
            <div className="flex flex-col md:flex-row">
              {/* Sidebar Navigation */}
              <div className="hidden md:block md:w-48 md:flex-shrink-0 md:self-start md:sticky md:top-16 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto">
                <SidebarNav activeTab="overview" />
              </div>
              
              {/* Main Dashboard Content */}
              <div className="flex-1 p-4">
                <DashboardOverview venues={venues} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default FinanceConsole
