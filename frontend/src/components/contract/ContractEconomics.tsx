// frontend/src/components/contract/ContractEconomics.tsx
// خلاصه‌ی اقتصادی قرارداد — سانس مؤثر (کل منهای مستثنا)، پرداختی/مانده، بنر معوق.

import React from 'react'
import { KpiCard } from '@/components/finance/shared'
import { formatRial, toPersianDigits } from '@/components/contract/shared'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Progress } from '@/components/ui/shadcn/progress'
import type { ContractEconomicsData } from '@/services/contract'

const ContractEconomics: React.FC<{
  economics: ContractEconomicsData | null
  totalAmount: number
}> = ({ economics, totalAmount }) => {
  if (!economics) return null
  const paidPct = totalAmount > 0 ? Math.min(100, Math.round((economics.paid_amount / totalAmount) * 100)) : 0

  return (
    <div className="flex flex-col gap-3">
      {economics.overdue && (
        <Alert variant="warning" className="rounded-xl font-semibold">
          <AlertDescription>
            هشدار: حداقل یک قسط از سررسید گذشته است — هرچه زودتر برای پرداخت اقدام کنید.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="سانس‌های قرارداد"
          sub={economics.excluded_sessions > 0
            ? `${toPersianDigits(economics.excluded_sessions)} سانس مستثنا شده`
            : undefined}
          value={`${toPersianDigits(economics.total_sessions)} سانس`}
          icon="mdi:calendar-multiple"
          color="#2563eb"
        />
        <KpiCard
          label="برگزار شده"
          sub={`نسبت بازی ${toPersianDigits(Math.round(economics.played_ratio))}٪`}
          value={`${toPersianDigits(economics.completed_sessions)} / ${toPersianDigits(economics.total_sessions)}`}
          icon="mdi:check-decagram"
          color="#059669"
        />
        <KpiCard
          label="پرداخت شده"
          value={formatRial(economics.paid_amount)}
          icon="mdi:cash-check"
          color="#0891b2"
        />
        <KpiCard
          label="مانده قرارداد"
          value={formatRial(economics.remaining_amount)}
          icon="mdi:book-alert-outline"
          color={economics.remaining_amount > 0 ? '#d97706' : '#059669'}
        />
      </div>
      <div className="px-1">
        <div className="mb-1 flex justify-between">
          <span className="text-xs text-muted-foreground">پیشرفت مالی</span>
          <span className="text-xs font-bold text-foreground">{toPersianDigits(paidPct)}٪</span>
        </div>
        <Progress
          value={paidPct}
          aria-label="پیشرفت مالی قرارداد"
          aria-valuetext={`${toPersianDigits(paidPct)}٪ پرداخت‌شده`}
          className={
            paidPct >= 100
              ? 'h-2 rounded-lg bg-black/5 [&>div]:rounded-lg [&>div]:bg-gradient-to-l [&>div]:from-emerald-600 [&>div]:to-emerald-400 dark:bg-white/10'
              : 'h-2 rounded-lg bg-black/5 [&>div]:rounded-lg [&>div]:bg-gradient-to-l [&>div]:from-blue-600 [&>div]:to-violet-600 dark:bg-white/10'
          }
        />
      </div>
    </div>
  )
}

export default ContractEconomics
