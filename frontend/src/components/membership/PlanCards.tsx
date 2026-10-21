// frontend/src/components/membership/PlanCards.tsx
// کارت‌های پلن اشتراک باشگاه (جلسه‌ای / پک / ماهانه) با دکمه خرید
import React from 'react'
import { Icon } from '@iconify/react'
import type { MembershipPlan } from '@/types/membership'
import { PLAN_TYPE_LABEL } from '@/types/membership'
import { Button } from '@/components/ui/shadcn/button'
import { cn, formatPrice } from '@/lib/utils'

const PLAN_ICONS: Record<string, string> = {
  session: 'mdi:flash-outline',
  sessions_pack: 'mdi:stack-overflow',
  monthly: 'mdi:calendar-month-outline',
}

const PLAN_COLORS: Record<string, { bg: string; fg: string }> = {
  session: { bg: 'rgba(37,99,235,0.07)', fg: '#2563eb' },
  sessions_pack: { bg: 'rgba(245,158,11,0.10)', fg: '#b45309' },
  monthly: { bg: 'rgba(124,58,237,0.08)', fg: '#7c3aed' },
}

interface Props {
  plans: MembershipPlan[]
  onBuy: (plan: MembershipPlan) => void
  compact?: boolean
}

const PlanCards: React.FC<Props> = ({ plans, onBuy, compact = false }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3',
        compact ? 'sm:grid-cols-1' : 'sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]',
      )}
    >
      {plans.map((plan, idx) => {
        const color = PLAN_COLORS[plan.plan_type] ?? PLAN_COLORS.session
        const isBest = idx === 0 && plans.length > 1
        return (
          <div
            key={plan.id}
            className={cn(
              'relative flex flex-col gap-2 rounded-2xl border bg-card p-4',
              isBest ? 'border-[1.5px] border-violet-600/40' : 'border-slate-900/10 dark:border-white/10',
            )}
          >
            {isBest && (
              <span className="absolute -top-2.5 end-3 inline-flex h-5 items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 px-2 text-xs font-extrabold text-white">
                بهترین مقدار
              </span>
            )}
            <div className="flex items-center gap-2">
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: color.bg }}
              >
                <Icon icon={PLAN_ICONS[plan.plan_type] ?? 'mdi:card-account-details'} style={{ width: 18, height: 18, color: color.fg }} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.95rem] font-extrabold">{plan.title}</p>
                <p className="text-xs text-muted-foreground">
                  {PLAN_TYPE_LABEL[plan.plan_type]}
                </p>
              </div>
            </div>
            {plan.description && (
              <p className="text-xs leading-[1.7] text-muted-foreground">
                {plan.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between pt-1">
              <p className="text-[1.05rem] font-extrabold" style={{ color: color.fg }}>
                {formatPrice(plan.price)}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => onBuy(plan)}
                className="rounded-[10px] px-4 text-xs font-bold text-white shadow-none hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                style={{ background: `linear-gradient(135deg, ${color.fg}, #7c3aed)` }}
              >
                خرید
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PlanCards
