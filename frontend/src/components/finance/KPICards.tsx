// Modern KPI Cards for Finance Dashboard
import React from 'react'
import { Icon } from '@iconify/react'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { toPersianDigits, formatToman } from '@/utils/l10n'

interface KPIData {
  label: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: string
  color: string
}

interface KPICardProps {
  data: KPIData
  className?: string
}

export function KPICard({ data, className }: KPICardProps) {
  const { label, value, change, trend = 'neutral', icon, color } = data
  
  const trendColor = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  }[trend]

  const trendIcon = {
    up: 'mdi:trending-up',
    down: 'mdi:trending-down',
    neutral: 'mdi:minus',
  }[trend]

  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="mb-0.5 text-xs font-medium text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold tracking-tight">{formatToman(value)}</p>
            {change !== undefined && (
              <div className="mt-1 flex items-center gap-1">
                <Icon icon={trendIcon} className={cn('h-3 w-3', trendColor)} />
                <span className={cn('text-[10px] font-medium', trendColor)}>
                  {toPersianDigits(Math.abs(change))}%
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
          >
            <Icon icon={icon} className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface KPICardsContainerProps {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  pendingPayments: number
  revenueChange?: number
  expensesChange?: number
}

export function KPICardsContainer({
  totalRevenue,
  totalExpenses,
  netProfit,
  pendingPayments,
  revenueChange,
  expensesChange,
}: KPICardsContainerProps) {
  const kpis: KPIData[] = [
    {
      label: 'کل درآمد',
      value: totalRevenue,
      change: revenueChange,
      trend: revenueChange && revenueChange > 0 ? 'up' : revenueChange && revenueChange < 0 ? 'down' : 'neutral',
      icon: 'mdi:arrow-up-bold-circle',
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      label: 'کل هزینه‌ها',
      value: totalExpenses,
      change: expensesChange,
      trend: expensesChange && expensesChange > 0 ? 'down' : expensesChange && expensesChange < 0 ? 'up' : 'neutral',
      icon: 'mdi:arrow-down-bold-circle',
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
    },
    {
      label: 'سود خالص',
      value: netProfit,
      icon: 'mdi:wallet-outline',
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      label: 'پرداخت‌های معوق',
      value: pendingPayments,
      icon: 'mdi:clock-alert-outline',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, idx) => (
        <KPICard key={idx} data={kpi} />
      ))}
    </div>
  )
}
