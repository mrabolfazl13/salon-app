// frontend/src/components/crm/CrmStatsTab.tsx
// «آمار» — کارت‌های KPI + نمودار دوناتِ تفکیک segment (recharts) + پرمصرف‌ترین‌ها
// + تازه‌واردهای ۷ روز اخیر (GET /crm/stats).

import React from 'react'
import { Icon } from '@iconify/react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { EmptyBox, ErrorBox, FinTooltip, KpiCard, LoadingBox, SectionCard, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { useCrmStats } from '@/hooks/useCrm'
import { ForbiddenPanel, SEGMENT_COLORS, SEGMENT_LABELS, SEGMENT_ORDER, crmErrorMessage, isForbidden } from './shared'

interface Props {
  venueId: number
}

const CrmStatsTab: React.FC<Props> = ({ venueId }) => {
  const statsQuery = useCrmStats(venueId)

  if (statsQuery.isPending) return <LoadingBox text="در حال دریافت آمار..." />
  if (statsQuery.isError) {
    return isForbidden(statsQuery.error)
      ? <ForbiddenPanel />
      : <ErrorBox message={crmErrorMessage(statsQuery.error, 'دریافت آمار ممکن نشد')} onRetry={() => statsQuery.refetch()} />
  }

  const stats = statsQuery.data
  const pieData = SEGMENT_ORDER
    .map((s) => ({ key: s, name: SEGMENT_LABELS[s], value: stats.segments[s] ?? 0 }))
    .filter((d) => d.value > 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="کل مشتریان" value={toPersianDigits(stats.total_customers)} icon="mdi:account-group" />
        <KpiCard label="ویژه (VIP)" value={toPersianDigits(stats.segments.vip ?? 0)} icon="mdi:star" color="#d97706" />
        <KpiCard label="در معرض ریزش" value={toPersianDigits(stats.segments.at_risk ?? 0)} icon="mdi:account-alert-outline" color="#ef4444" />
        <KpiCard label="بی‌فعال (≥۴۵ روز)" value={toPersianDigits(stats.inactive_count)} icon="mdi:moon-waning-crescent" color="#64748b" />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1.1fr_1fr]">
        <SectionCard title="تفکیک گروه‌های مشتریان" icon="mdi:chart-donut" color="#7c3aed">
          {pieData.length === 0 ? (
            <EmptyBox icon="mdi:chart-donut" title="داده‌ای برای نمودار نیست" />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                      {pieData.map((d) => (
                        <Cell key={d.key} fill={SEGMENT_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <RTooltip content={<FinTooltip unit="count" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5">
                {pieData.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: SEGMENT_COLORS[d.key] }} aria-hidden="true" />
                    <span className="text-[0.68rem] font-semibold text-foreground">{d.name}</span>
                    <span className="text-[0.68rem] font-extrabold tabular-nums" style={{ color: SEGMENT_COLORS[d.key] }}>
                      {toPersianDigits(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <div className="flex flex-col gap-3">
          <SectionCard title="پرمصرف‌ترین مشتریان" icon="mdi:cash-fast" color="#059669" dense>
            {stats.top_spenders.length === 0 ? (
              <p className="text-[0.68rem] text-muted-foreground">هنوز پرداختی ثبت نشده است.</p>
            ) : (
              stats.top_spenders.map((t, i) => (
                <div key={t.user_id} className="flex items-center gap-2 py-1.5">
                  <span
                    className={
                      i === 0
                        ? 'flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-amber-500/[0.14]'
                        : 'flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-blue-600/[0.08]'
                    }
                  >
                    <span
                      className={
                        i === 0
                          ? 'text-[0.68rem] font-extrabold text-amber-700 tabular-nums dark:text-amber-400'
                          : 'text-[0.68rem] font-extrabold text-blue-700 tabular-nums dark:text-blue-300'
                      }
                    >
                      {toPersianDigits(i + 1)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.68rem] font-semibold text-foreground">{t.full_name ?? '—'}</span>
                  <span className="text-[0.68rem] font-extrabold text-foreground tabular-nums">{formatRial(t.total_spend)}</span>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard title="مشتریان تازه (۷ روز اخیر)" icon="mdi:account-plus-outline" color="#2563eb" dense>
            {stats.recent_new_customers.length === 0 ? (
              <p className="text-[0.68rem] text-muted-foreground">تازگی مشتری جدید نداشته‌اید.</p>
            ) : (
              stats.recent_new_customers.map((r) => (
                <div key={r.user_id} className="flex items-center justify-between py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon icon="mdi:account-circle-outline" className="h-4 w-4 shrink-0" style={{ color: '#2563eb' }} aria-hidden="true" />
                    <span className="truncate text-[0.68rem] font-semibold text-foreground">{r.full_name ?? '—'}</span>
                  </div>
                  <span className="text-[0.68rem] text-muted-foreground tabular-nums">
                    {r.first_seen ? formatJalaliDate(r.first_seen, { format: 'numeric' }) : '—'}
                  </span>
                </div>
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default CrmStatsTab
