// frontend/src/components/team/TeamBalancePanel.tsx
// تراز تیم — کاشی‌های سهم (کل/پرداختی/باز/معوق) + حساب تیم در دفتر کل + خالص؛
// «تاریخچه» ممیزی به‌صورت تایم‌لاین تاشو (فقط کاپیتان/مدیر — بک‌اند ۴۰۳ می‌دهد)

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Button as MuiButton, Grid, Typography } from '@mui/material'

import type { Team } from '@/types/team'
import { TEAM_AUDIT_ACTION_LABELS } from '@/types/team'
import { useTeamAudit, useTeamBalance } from '@/hooks/useTeams'
import { KpiCard, ErrorBox, LoadingBox, EmptyBox, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const AUDIT_PAGE = 25

const AuditTimeline: React.FC<{ teamId: number }> = ({ teamId }) => {
  const [expanded, setExpanded] = useState(false)
  const [pages, setPages] = useState(1)

  const params = useMemo(() => ({ limit: AUDIT_PAGE * pages, offset: 0 }), [pages])
  const auditQ = useTeamAudit(teamId, params, expanded)
  const items = auditQ.data?.items ?? []
  const total = auditQ.data?.total ?? 0

  return (
    <Box>
      <MuiButton
        size="small"
        onClick={() => setExpanded((e) => !e)}
        endIcon={<Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} style={{ width: 18, height: 18 }} />}
        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: '#2563eb' }}
      >
        {`تاریخچه فعالیت‌های تیم${total ? ` (${toPersianDigits(total)} رویداد)` : ''}`}
      </MuiButton>
      {expanded && (
        <Box sx={{ mt: 1.25 }}>
          {auditQ.isPending ? (
            <LoadingBox text="در حال دریافت تاریخچه..." />
          ) : auditQ.isError ? (
            <ErrorBox message="نمایش تاریخچه ممکن نیست (فقط مدیران تیم)." />
          ) : items.length === 0 ? (
            <EmptyBox icon="mdi:history" title="رویدادی ثبت نشده" />
          ) : (
            <Box sx={{ position: 'relative', pr: '18px' }}>
              <Box sx={{ position: 'absolute', top: 6, bottom: 6, right: 6, width: '2px', bgcolor: 'rgba(37,99,235,0.15)', borderRadius: 1 }} />
              {items.map((ev) => (
                <Box key={ev.id} sx={{ position: 'relative', pb: 1.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: -18,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#2563eb',
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px rgba(37,99,235,0.3)',
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      {TEAM_AUDIT_ACTION_LABELS[ev.action] ?? ev.action}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {formatJalaliDateTime(ev.created_at, { format: 'numeric' })}
                    </Typography>
                    {ev.actor_name && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{`— ${ev.actor_name}`}</Typography>
                    )}
                  </Box>
                  {typeof ev.data?.amount === 'number' && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#475569', mt: 0.25 }} dir="rtl">
                      مبلغ: {formatRial(Number(ev.data.amount))}
                    </Typography>
                  )}
                </Box>
              ))}
              {items.length < total && (
                <MuiButton
                  size="small"
                  disabled={auditQ.isFetching}
                  onClick={() => setPages((n) => n + 1)}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#2563eb' }}
                >
                  نمایش بیشتر
                </MuiButton>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

const TeamBalancePanel: React.FC<{ team: Team; isManager: boolean }> = ({ team, isManager }) => {
  const balanceQ = useTeamBalance(team.id)
  const b = balanceQ.data

  if (balanceQ.isPending) return <LoadingBox text="در حال محاسبه تراز..." />
  if (balanceQ.isError) return <ErrorBox message="دریافت تراز ممکن نشد (فقط اعضای فعال تیم)." onRetry={() => balanceQ.refetch()} />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="مجموع حصه‌ها" value={formatRial(b?.dues_total)} icon="mdi:file-document-multiple-outline" color="#2563eb" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="پرداخت‌شده" value={formatRial(b?.dues_paid)} icon="mdi:check-circle-outline" color="#059669" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="پرداخت‌نشده" value={formatRial(b?.dues_unpaid)} icon="mdi:clock-alert-outline" color="#d97706" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="معوق (گذشته از سررسید)" value={formatRial(b?.dues_overdue_amount)} icon="mdi:alarm-light-outline" color="#dc2626" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            label="حساب تیم (دفتر کل)"
            value={formatRial(b?.team_account_balance)}
            sub={b ? `درآمد ${formatRial(b.team_ledger_income)} — هزینه ${formatRial(b.team_ledger_expense)}` : undefined}
            icon="mdi:bank-outline"
            color="#0891b2"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            label="تراز خالص (حساب تیم − حصه‌های باز)"
            value={formatRial(b?.net_balance)}
            sub={b ? `نمایان تا ${formatJalaliDate(b.as_of, { format: 'numeric' })}` : undefined}
            icon="mdi:scale-balance"
            color={(b?.net_balance ?? 0) >= 0 ? '#059669' : '#dc2626'}
          />
        </Grid>
      </Grid>
      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
        پرداخت حصه‌ها به‌صورت ردیف درآمدی در دفتر کلِ تیم ثبت می‌شود؛ تراز خالص، مانده حساب منهای تعهدات باز اعضا است.
      </Typography>
      {isManager && <AuditTimeline teamId={team.id} />}
    </Box>
  )
}

export default TeamBalancePanel
