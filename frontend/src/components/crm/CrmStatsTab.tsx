// frontend/src/components/crm/CrmStatsTab.tsx
// «آمار» — کارت‌های KPI + نمودار دوناتِ تفکیک segment (recharts) + پرمصرف‌ترین‌ها
// + تازه‌واردهای ۷ روز اخیر (GET /crm/stats).

import React from 'react'
import { Box, Typography } from '@mui/material'
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2 }}>
        <KpiCard label="کل مشتریان" value={toPersianDigits(stats.total_customers)} icon="mdi:account-group" />
        <KpiCard label="ویژه (VIP)" value={toPersianDigits(stats.segments.vip ?? 0)} icon="mdi:star" color="#d97706" />
        <KpiCard label="در معرض ریزش" value={toPersianDigits(stats.segments.at_risk ?? 0)} icon="mdi:account-alert-outline" color="#ef4444" />
        <KpiCard label="بی‌فعال (≥۴۵ روز)" value={toPersianDigits(stats.inactive_count)} icon="mdi:moon-waning-crescent" color="#64748b" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: 2.5, alignItems: 'stretch' }}>
        <SectionCard title="تفکیک گروه‌های مشتریان" icon="mdi:chart-donut" color="#7c3aed">
          {pieData.length === 0 ? (
            <EmptyBox icon="mdi:chart-donut" title="داده‌ای برای نمودار نیست" />
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 220, height: 220 }}>
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
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {pieData.map((d) => (
                  <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: SEGMENT_COLORS[d.key] }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: SEGMENT_COLORS[d.key] }}>
                      {toPersianDigits(d.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </SectionCard>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <SectionCard title="پرمصرف‌ترین مشتریان" icon="mdi:cash-fast" color="#059669" dense>
            {stats.top_spenders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">هنوز پرداختی ثبت نشده است.</Typography>
            ) : (
              stats.top_spenders.map((t, i) => (
                <Box key={t.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.6 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '7px', bgcolor: i === 0 ? 'rgba(217,119,6,0.14)' : 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: i === 0 ? '#d97706' : '#2563eb' }}>{toPersianDigits(i + 1)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, minWidth: 0 }}>{t.full_name ?? '—'}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatRial(t.total_spend)}</Typography>
                </Box>
              ))
            )}
          </SectionCard>

          <SectionCard title="مشتریان تازه (۷ روز اخیر)" icon="mdi:account-plus-outline" color="#2563eb" dense>
            {stats.recent_new_customers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">تازگی مشتری جدید نداشته‌اید.</Typography>
            ) : (
              stats.recent_new_customers.map((r) => (
                <Box key={r.user_id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Icon icon="mdi:account-circle-outline" className="h-4 w-4" style={{ color: '#2563eb' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.full_name ?? '—'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {r.first_seen ? formatJalaliDate(r.first_seen, { format: 'numeric' }) : '—'}
                  </Typography>
                </Box>
              ))
            )}
          </SectionCard>
        </Box>
      </Box>
    </Box>
  )
}

export default CrmStatsTab