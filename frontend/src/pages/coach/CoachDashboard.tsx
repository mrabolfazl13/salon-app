// frontend/src/pages/coach/CoachDashboard.tsx
// داشبورد مربی (P004) — نقش `coach`: KPI ماه، جلسات امروز با ثبت حضور/تسویه،
// پیش‌روها و فهرست شاگردها. داده‌ها واقعی‌اند (GET /coach/dashboard) و هیچ mockی ندارد.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState, Shimmer } from '@/components/mobile'
import {
  ErrorBox,
  KpiCard,
  StatusChip,
  extractError,
  formatRial,
} from '@/components/finance/shared'
import {
  useCoachClients,
  useCoachDashboard,
  useCoachSessions,
  useCreateCoachSession,
  useSetCoachAttendance,
  useSetCoachSettled,
} from '@/hooks/useCoach'
import type { CoachSession, CoachSessionStatus } from '@/types/coach'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { radii, shadows } from '@/theme'

const STATUS_LABELS: Record<CoachSessionStatus, string> = {
  scheduled: 'برنامه‌ریزی‌شده',
  attended: 'برگزارشده',
  absent: 'غایب',
  cancelled: 'لغوشده',
}

const STATUS_COLORS: Record<CoachSessionStatus, string> = {
  scheduled: '#2563eb',
  attended: '#16a34a',
  absent: '#dc2626',
  cancelled: '#6b7280',
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120]

/** مقدار پیش‌فرض datetime-local (ساعت محلی، بدون منطقه) — بک‌اند naive را وقت تهران می‌گیرد */
function defaultStartsAt(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const SessionRow: React.FC<{
  session: CoachSession
  onAttendance: (status: CoachSessionStatus) => void
  onSettle: () => void
  busy: boolean
}> = ({ session, onAttendance, onSettle, busy }) => (
  <Card
    data-testid={`coach-session-${session.id}`}
    sx={{
      borderRadius: `${radii.card}px`,
      boxShadow: shadows.card,
      border: '1px solid rgba(15,23,42,0.05)',
      bgcolor: 'rgba(255,255,255,0.92)',
      p: 1.5,
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {session.client_name ?? 'شاگرد'}
          {session.fee > 0 && (
            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
              — {formatRial(session.fee)}
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {formatJalaliDateTime(session.starts_at)} · {toPersianDigits(session.duration_min)} دقیقه
          {session.fee_settled && ' · تسویه شده'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <StatusChip label={STATUS_LABELS[session.status]} color={STATUS_COLORS[session.status]} />
        <Tooltip title="برگزارشده">
          <IconButton
            aria-label="ثبت حضور"
            disabled={busy || session.status === 'attended'}
            onClick={() => onAttendance('attended')}
            sx={{ width: 44, height: 44, color: 'success.main' }}
          >
            <Icon icon="mdi:check-circle-outline" style={{ width: 22, height: 22 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="غایب">
          <IconButton
            aria-label="ثبت غیبت"
            disabled={busy || session.status === 'absent'}
            onClick={() => onAttendance('absent')}
            sx={{ width: 44, height: 44, color: 'error.main' }}
          >
            <Icon icon="mdi:close-circle-outline" style={{ width: 22, height: 22 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="لغو">
          <IconButton
            aria-label="لغو جلسه"
            disabled={busy || session.status === 'cancelled'}
            onClick={() => onAttendance('cancelled')}
            sx={{ width: 44, height: 44, color: 'text.secondary' }}
          >
            <Icon icon="mdi:cancel" style={{ width: 22, height: 22 }} />
          </IconButton>
        </Tooltip>
        {session.status === 'attended' && !session.fee_settled && (
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={onSettle}
            sx={{ borderRadius: '10px', minHeight: 40 }}
          >
            تسویه
          </Button>
        )}
      </Stack>
    </Stack>
  </Card>
)

const CoachDashboard: React.FC = () => {
  const dashQ = useCoachDashboard()
  const clientsQ = useCoachClients()
  const createMut = useCreateCoachSession()
  const attendanceMut = useSetCoachAttendance()
  const settleMut = useSetCoachSettled()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<CoachSessionStatus | 'all'>('all')
  const [phone, setPhone] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartsAt)
  const [duration, setDuration] = useState(60)
  const [fee, setFee] = useState('0')
  const [notes, setNotes] = useState('')

  const sessionsQ = useCoachSessions(
    statusFilter === 'all' ? { limit: 50 } : { status: statusFilter, limit: 50 },
  )

  const today = dashQ.data?.today ?? []
  const upcoming = useMemo(
    () => (dashQ.data?.upcoming ?? []).filter((s) => !today.some((t) => t.id === s.id)),
    [dashQ.data, today],
  )

  const runAttendance = (session: CoachSession, status: CoachSessionStatus) => {
    attendanceMut.mutate(
      { id: session.id, status },
      {
        onSuccess: () => toast.success('وضعیت جلسه ثبت شد'),
        onError: (err) => toast.error(extractError(err, 'ثبت وضعیت جلسه ممکن نشد.')),
      },
    )
  }

  const runSettle = (session: CoachSession) => {
    settleMut.mutate(
      { id: session.id, settled: true },
      {
        onSuccess: () => toast.success('تسویه ثبت شد'),
        onError: (err) => toast.error(extractError(err, 'تسویه ممکن نشد.')),
      },
    )
  }

  const submit = () => {
    if (!/^09[0-9]{9}$/.test(phone.trim())) {
      toast.error('شماره شاگرد باید با ۰۹ شروع شود و ۱۱ رقم باشد.')
      return
    }
    createMut.mutate(
      {
        client_phone: phone.trim(),
        starts_at: startsAt,
        duration_min: duration,
        fee: Math.max(0, Number(fee) || 0),
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('جلسه ساخته شد')
          setDialogOpen(false)
          setPhone('')
          setNotes('')
          setFee('0')
        },
        onError: (err) => toast.error(extractError(err, 'ساخت جلسه ممکن نشد.')),
      },
    )
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:school-outline" style={{ width: 30, height: 30, color: '#2563eb' }} />
            پنل مربی
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            جلسات تمرینی، حضور/غیبت شاگردها و درآمد ماه — بر پایهٔ داده‌های واقعی.
          </Typography>
        </Box>
        <Button
          variant="contained"
          data-testid="coach-new-session"
          onClick={() => setDialogOpen(true)}
          startIcon={<Icon icon="mdi:plus" />}
          sx={{ borderRadius: '12px', minHeight: 44 }}
        >
          جلسه جدید
        </Button>
      </Box>

      {dashQ.isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 72, borderRadius: '16px' }} />)}
        </Box>
      ) : dashQ.isError ? (
        <ErrorBox message="دریافت پنل مربی ممکن نشد (این بخش فقط برای حساب‌های با نقش مربی فعال است)." onRetry={() => dashQ.refetch()} />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2} data-testid="coach-kpis">
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="جلسات امروز" value={toPersianDigits(dashQ.data.today_count)} icon="mdi:calendar-today" color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="جلسات برگزارشده (ماه)" value={toPersianDigits(dashQ.data.month_sessions)} icon="mdi:account-check" color="#16a34a" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="درآمد ماه" value={formatRial(dashQ.data.month_revenue)} icon="mdi:cash-multiple" color="#0ea5e9" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard
                label="منتظر تسویه"
                value={formatRial(dashQ.data.month_outstanding)}
                sub={`${toPersianDigits(dashQ.data.active_clients)} شاگرد فعال`}
                icon="mdi:clock-alert-outline"
                color="#d97706"
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>جلسات امروز</Typography>
            {today.length === 0 ? (
              <EmptyState emoji="🗓️" title="جلسه‌ای برای امروز نیست" description="از دکمهٔ «جلسه جدید» برای شاگردانت زمان بگذار." />
            ) : (
              <Stack spacing={1.25} data-testid="coach-today">
                {today.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    busy={attendanceMut.isPending || settleMut.isPending}
                    onAttendance={(status) => runAttendance(s, status)}
                    onSettle={() => runSettle(s)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>پیش‌رو</Typography>
            {upcoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">جلسهٔ زمان‌بندی‌شده‌ای در آینده نیست.</Typography>
            ) : (
              <Stack spacing={1} data-testid="coach-upcoming">
                {upcoming.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                      p: 1.25, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.06)', bgcolor: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.client_name ?? 'شاگرد'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatJalaliDateTime(s.starts_at)} · {toPersianDigits(s.duration_min)} دقیقه
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>همهٔ جلسات</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={statusFilter}
              onChange={(_e, next: CoachSessionStatus | 'all') => next && setStatusFilter(next)}
              aria-label="فیلتر وضعیت جلسات"
              data-testid="coach-status-filter"
              sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButton-root': { minHeight: 40, px: 1.5, borderRadius: '10px !important', border: '1px solid rgba(15,23,42,0.12)' } }}
            >
              <ToggleButton value="all">همه</ToggleButton>
              {(Object.keys(STATUS_LABELS) as CoachSessionStatus[]).map((s) => (
                <ToggleButton key={s} value={s}>{STATUS_LABELS[s]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            {sessionsQ.isError ? (
              <ErrorBox message="دریافت فهرست جلسات ممکن نشد." onRetry={() => sessionsQ.refetch()} />
            ) : sessionsQ.isPending ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 64, borderRadius: '12px' }} />)}
              </Box>
            ) : sessionsQ.data.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">جلسه‌ای با این وضعیت یافت نشد.</Typography>
            ) : (
              <Stack spacing={1} data-testid="coach-history">
                {sessionsQ.data.items.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    busy={attendanceMut.isPending || settleMut.isPending}
                    onAttendance={(status) => runAttendance(s, status)}
                    onSettle={() => runSettle(s)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>شاگردها</Typography>
            {clientsQ.isError ? (
              <ErrorBox message="دریافت فهرست شاگردها ممکن نشد." onRetry={() => clientsQ.refetch()} />
            ) : (
              <Box
                sx={{
                  borderRadius: `${radii.card}px`,
                  boxShadow: shadows.card,
                  border: '1px solid rgba(15,23,42,0.05)',
                  bgcolor: 'rgba(255,255,255,0.92)',
                  overflowX: 'auto',
                }}
              >
                <Table size="small" aria-label="فهرست شاگردهای مربی" data-testid="coach-clients">
                  <TableHead>
                    <TableRow>
                      <TableCell>شاگرد</TableCell>
                      <TableCell>شماره</TableCell>
                      <TableCell align="right">جلسات</TableCell>
                      <TableCell align="right">مجموع حق جلسه</TableCell>
                      <TableCell>آخرین جلسه</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(clientsQ.data?.items ?? []).map((c) => (
                      <TableRow key={c.user_id}>
                        <TableCell sx={{ fontWeight: 600 }}>{c.full_name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell align="right">{toPersianDigits(c.sessions)}</TableCell>
                        <TableCell align="right">{formatRial(c.fee_total)}</TableCell>
                        <TableCell>{c.last_session_at ? formatJalaliDateTime(c.last_session_at) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {clientsQ.isPending ? (
                  <Box sx={{ p: 2 }}><Shimmer variant="rounded" sx={{ height: 48, borderRadius: '12px' }} /></Box>
                ) : (clientsQ.data?.items.length ?? 0) === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">هنوز شاگردی ثبت نشده است.</Typography>
                  </Box>
                ) : null}
              </Box>
            )}
          </Box>
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" data-testid="coach-session-dialog">
        <DialogTitle sx={{ fontWeight: 800 }}>جلسهٔ تمرینی جدید</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="شماره شاگرد"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09121234567"
              inputMode="tel"
              fullWidth
              helperText="باید حساب فعال در سامانه داشته باشد."
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="زمان شروع"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="مدت (دقیقه)"
              select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              {DURATION_OPTIONS.map((d) => (
                <MenuItem key={d} value={d}>{toPersianDigits(d)} دقیقه</MenuItem>
              ))}
            </TextField>
            <TextField
              label="حق جلسه (ریال)"
              value={fee}
              onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              fullWidth
            />
            <TextField
              label="یادداشت"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              placeholder="مثلاً: تمرین پاس و تمام‌کننده"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ minHeight: 44 }}>انصراف</Button>
          <Button variant="contained" onClick={submit} disabled={createMut.isPending} sx={{ borderRadius: '12px', minHeight: 44 }}>
            {createMut.isPending ? 'در حال ثبت…' : 'ثبت جلسه'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default CoachDashboard
