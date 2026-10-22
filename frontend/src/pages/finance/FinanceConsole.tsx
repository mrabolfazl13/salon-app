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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">امور مالی</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  مدیریت درآمد، هزینه و حساب‌های سالن‌ها
                </p>
              </div>
              <Link
                to="/manager-dashboard"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl">
          {!financeAccess.ready ? (
            loading
          ) : !financeAccess.allowed ? (
            <div className="p-6">
              <ForbiddenPanel detail="دسترسی مالی برای حساب شما فعال نیست. از مدیر سیستم درخواست دسترسی دهید." />
            </div>
          ) : venuesQuery.isPending ? (
            loading
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <div className="p-6">
                <ForbiddenPanel detail="شما به هیچ سالنی دسترسی ندارید." />
              </div>
            ) : (
              <div className="p-6">
                <ErrorBox message="خطا در دریافت اطلاعات" onRetry={() => venuesQuery.refetch()} />
              </div>
            )
          ) : venues.length === 0 ? (
            <div className="p-6">
              <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید." />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Sidebar Navigation */}
              <div className="hidden md:block md:w-64 md:flex-shrink-0">
                <SidebarNav activeTab="overview" />
              </div>
              
              {/* Main Dashboard Content */}
              <div className="flex-1 p-6">
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
