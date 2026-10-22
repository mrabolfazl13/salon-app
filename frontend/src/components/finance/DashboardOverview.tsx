// Modern Finance Dashboard Overview
import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { KPICardsContainer } from './KPICards'
import { RecentTransactions } from './RecentTransactions'
import { AccountSummaries } from './AccountSummaries'
import { useFinanceDashboard, useAccounts, type FinanceVenue } from '@/hooks/useFinance'
import { toPersianDigits } from '@/utils/l10n'

interface DashboardOverviewProps {
  venues: FinanceVenue[]
}

export function DashboardOverview({ venues }: DashboardOverviewProps) {
  const [selectedVenue, setSelectedVenue] = useState<number | 'all'>('all')
  
  // Fetch dashboard data
  const dashboardQuery = useFinanceDashboard(
    { venue_id: selectedVenue === 'all' ? undefined : selectedVenue },
    true
  )
  
  // Fetch accounts
  const accountsQuery = useAccounts({}, true)
  
  const dashboard = dashboardQuery.data
  const accounts = accountsQuery.data?.accounts || []

  // Sample transactions (replace with real data)
  const recentTransactions = [
    { id: 1, type: 'payment', amount: 5000000, description: 'رزرو سانس سالن خوراکیان', date: '1405/08/01', status: 'completed' as const },
    { id: 2, type: 'expense', amount: 3000000, description: 'هزینه اجاره سالن', date: '1405/07/30', status: 'completed' as const },
    { id: 3, type: 'refund', amount: 1500000, description: 'بازگشت وجه لغو رزرو', date: '1405/07/29', status: 'pending' as const },
    { id: 4, type: 'payment', amount: 7000000, description: 'درآمد مسابقه فوتسال', date: '1405/07/28', status: 'completed' as const },
  ]

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Venue Selector */}
      {venues.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Icon icon="mdi:store-marker" className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">انتخاب سالن:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedVenue === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedVenue('all')}
                  className="text-xs"
                >
                  همه سالن‌ها
                </Button>
                {venues.map((venue) => (
                  <Button
                    key={venue.id}
                    variant={selectedVenue === venue.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVenue(venue.id)}
                    className="text-xs"
                  >
                    {venue.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <KPICardsContainer
        totalRevenue={dashboard?.total_revenue || 0}
        totalExpenses={dashboard?.total_expenses || 0}
        netProfit={(dashboard?.total_revenue || 0) - (dashboard?.total_expenses || 0)}
        pendingPayments={dashboard?.pending_payments || 0}
        revenueChange={5.2}
        expensesChange={-2.1}
      />

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" size="sm">
              <Icon icon="mdi:cash-plus" className="h-4 w-4" />
              ثبت درآمد جدید
            </Button>
            <Button variant="outline" className="gap-2" size="sm">
              <Icon icon="mdi:cash-minus" className="h-4 w-4" />
              ثبت هزینه جدید
            </Button>
            <Button variant="outline" className="gap-2" size="sm">
              <Icon icon="mdi:file-document-outline" className="h-4 w-4" />
              گزارش مالی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTransactions} onViewAll={() => {}} />

      {/* Account Summaries */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">خلاصه حساب‌ها</h3>
        <AccountSummaries accounts={accounts.slice(0, 6)} />
      </div>
    </div>
  )
}
