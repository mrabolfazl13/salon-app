// frontend/src/components/team/TeamBalancePanel.tsx
// تراز تیم — کاشی‌های سهم (کل/پرداختی/باز/معوق) + حساب تیم در دفتر کل + خالص؛
// «تاریخچه» ممیزی به‌صورت تایم‌لاین تاشو (فقط کاپیتان/مدیر — بک‌اند ۴۰۳ می‌دهد)

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

import type { Team } from '@/types/team'
import { TEAM_AUDIT_ACTION_LABELS } from '@/types/team'
import { useTeamAudit, useTeamBalance } from '@/hooks/useTeams'
import { KpiCard, ErrorBox, LoadingBox, EmptyBox, formatRial } from '@/components/finance/shared'
import { Button } from '@/components/ui/Button'
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const AUDIT_PAGE = 25

const AuditTimeline: React.FC<{ teamId: number }> = ({ teamId }) => {
  const [expanded, setExpanded] = useState(false)
  const [pages, setPages] = useState(1)
  const panelId = useId()

  const params = useMemo(() => ({ limit: AUDIT_PAGE * pages, offset: 0 }), [pages])
  const auditQ = useTeamAudit(teamId, params, expanded)
  const items = auditQ.data?.items ?? []
  const total = auditQ.data?.total ?? 0

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="px-0 text-[0.8rem] font-bold text-blue-700 hover:bg-transparent dark:text-blue-400"
      >
        {`تاریخچه فعالیت‌های تیم${total ? ` (${toPersianDigits(total)} رویداد)` : ''}`}
        <Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} style={{ width: 18, height: 18 }} />
      </Button>
      {expanded && (
        <div id={panelId} className="mt-2.5">
          {auditQ.isPending ? (
            <LoadingBox text="در حال دریافت تاریخچه..." />
          ) : auditQ.isError ? (
            <ErrorBox message="نمایش تاریخچه ممکن نیست (فقط مدیران تیم)." />
          ) : items.length === 0 ? (
            <EmptyBox icon="mdi:history" title="رویدادی ثبت نشده" />
          ) : (
            <div className="relative ps-[18px]">
              <div className="absolute top-1.5 bottom-1.5 start-1.5 w-0.5 rounded bg-blue-600/15" />
              {items.map((ev) => (
                <div key={ev.id} className="relative pb-3.5">
                  <div className="absolute -start-[18px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-blue-600 shadow-[0_0_0_1px_rgba(37,99,235,0.3)]" />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-[0.8rem] font-extrabold text-slate-900 dark:text-slate-100">
                      {TEAM_AUDIT_ACTION_LABELS[ev.action] ?? ev.action}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      {formatJalaliDateTime(ev.created_at, { format: 'numeric' })}
                    </p>
                    {ev.actor_name && (
                      <p className="text-[0.68rem] text-muted-foreground">{`— ${ev.actor_name}`}</p>
                    )}
                  </div>
                  {typeof ev.data?.amount === 'number' && (
                    <p className="mt-0.5 text-[0.68rem] text-slate-600 dark:text-slate-300" dir="rtl">
                      مبلغ: {formatRial(Number(ev.data.amount))}
                    </p>
                  )}
                </div>
              ))}
              {items.length < total && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={auditQ.isFetching}
                  onClick={() => setPages((n) => n + 1)}
                  className="px-0 text-[0.68rem] font-bold text-blue-700 hover:bg-transparent dark:text-blue-400"
                >
                  نمایش بیشتر
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TeamBalancePanel: React.FC<{ team: Team; isManager: boolean }> = ({ team, isManager }) => {
  const balanceQ = useTeamBalance(team.id)
  const b = balanceQ.data

  if (balanceQ.isPending) return <LoadingBox text="در حال محاسبه تراز..." />
  if (balanceQ.isError) return <ErrorBox message="دریافت تراز ممکن نشد (فقط اعضای فعال تیم)." onRetry={() => balanceQ.refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <KpiCard label="مجموع حصه‌ها" value={formatRial(b?.dues_total)} icon="mdi:file-document-multiple-outline" color="#2563eb" />
        </div>
        <div>
          <KpiCard label="پرداخت‌شده" value={formatRial(b?.dues_paid)} icon="mdi:check-circle-outline" color="#059669" />
        </div>
        <div>
          <KpiCard label="پرداخت‌نشده" value={formatRial(b?.dues_unpaid)} icon="mdi:clock-alert-outline" color="#d97706" />
        </div>
        <div>
          <KpiCard label="معوق (گذشته از سررسید)" value={formatRial(b?.dues_overdue_amount)} icon="mdi:alarm-light-outline" color="#dc2626" />
        </div>
        <div className="col-span-2">
          <KpiCard
            label="حساب تیم (دفتر کل)"
            value={formatRial(b?.team_account_balance)}
            sub={b ? `درآمد ${formatRial(b.team_ledger_income)} — هزینه ${formatRial(b.team_ledger_expense)}` : undefined}
            icon="mdi:bank-outline"
            color="#0891b2"
          />
        </div>
        <div className="col-span-2">
          <KpiCard
            label="تراز خالص (حساب تیم − حصه‌های باز)"
            value={formatRial(b?.net_balance)}
            sub={b ? `نمایان تا ${formatJalaliDate(b.as_of, { format: 'numeric' })}` : undefined}
            icon="mdi:scale-balance"
            color={(b?.net_balance ?? 0) >= 0 ? '#059669' : '#dc2626'}
          />
        </div>
      </div>
      <p className="text-[0.68rem] text-muted-foreground">
        پرداخت حصه‌ها به‌صورت ردیف درآمدی در دفتر کلِ تیم ثبت می‌شود؛ تراز خالص، مانده حساب منهای تعهدات باز اعضا است.
      </p>
      {isManager && <AuditTimeline teamId={team.id} />}
    </div>
  )
}

export default TeamBalancePanel
