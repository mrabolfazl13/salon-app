// frontend/src/pages/coach/CoachDashboard.tsx
// داشبورد مربی (P004) — نقش `coach`: KPI ماه، جلسات امروز با ثبت حضور/تسویه،
// پیش‌روها و فهرست شاگردها. داده‌ها واقعی‌اند (GET /coach/dashboard) و هیچ mockی ندارد.

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState } from '@/components/mobile'
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
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Separator } from '@/components/ui/shadcn/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

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

const STATUS_FILTERS: (CoachSessionStatus | 'all')[] = ['all', 'scheduled', 'attended', 'absent', 'cancelled']

/** مقدار پیش‌فرض datetime-local (ساعت محلی، بدون منطقه) — بک‌اند naive را وقت تهران می‌گیرد */
function defaultStartsAt(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** دکمهٔ آیکونی ۴۴px با tooltip — همان IconButton قبلی */
const iconButtonClass =
  'inline-flex h-9 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

const SessionRow: React.FC<{
  session: CoachSession
  onAttendance: (status: CoachSessionStatus) => void
  onSettle: () => void
  busy: boolean
}> = ({ session, onAttendance, onSettle, busy }) => (
  <div
    data-testid={`coach-session-${session.id}`}
    className="rounded-lg border border-border bg-card p-3 shadow-sm"
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold text-foreground">
          {session.client_name ?? 'شاگرد'}
          {session.fee > 0 && (
            <span className="ms-2 text-[0.68rem] font-normal text-muted-foreground">
              — {formatRial(session.fee)}
            </span>
          )}
        </p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">
          {formatJalaliDateTime(session.starts_at)} · {toPersianDigits(session.duration_min)} دقیقه
          {session.fee_settled && ' · تسویه شده'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip label={STATUS_LABELS[session.status]} color={STATUS_COLORS[session.status]} />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="ثبت حضور"
              disabled={busy || session.status === 'attended'}
              onClick={() => onAttendance('attended')}
              className={`${iconButtonClass} text-emerald-600 dark:text-emerald-400`}
            >
              <Icon icon="mdi:check-circle-outline" className="h-[22px] w-[22px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>برگزارشده</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="ثبت غیبت"
              disabled={busy || session.status === 'absent'}
              onClick={() => onAttendance('absent')}
              className={`${iconButtonClass} text-red-600 dark:text-red-400`}
            >
              <Icon icon="mdi:close-circle-outline" className="h-[22px] w-[22px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>غایب</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="لغو جلسه"
              disabled={busy || session.status === 'cancelled'}
              onClick={() => onAttendance('cancelled')}
              className={`${iconButtonClass} text-muted-foreground`}
            >
              <Icon icon="mdi:cancel" className="h-[22px] w-[22px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>لغو</TooltipContent>
        </Tooltip>
        {session.status === 'attended' && !session.fee_settled && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={onSettle}
            className="min-h-9 rounded-[10px]"
          >
            تسویه
          </Button>
        )}
      </div>
    </div>
  </div>
)

const CoachDashboard: React.FC = () => {
  const dashQ = useCoachDashboard()
  const clientsQ = useCoachClients()
  const createMut = useCreateCoachSession()
  const attendanceMut = useSetCoachAttendance()
  const settleMut = useSetCoachSettled()

  const phoneId = useId()
  const startsAtId = useId()
  const durationLabelId = useId()
  const feeId = useId()
  const notesId = useId()

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <Icon icon="mdi:school-outline" className="h-[30px] w-[30px] text-blue-600 dark:text-blue-400" />
            پنل مربی
          </h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            جلسات تمرینی، حضور/غیبت شاگردها و درآمد ماه — بر پایهٔ داده‌های واقعی.
          </p>
        </div>
        <Button variant="primary" data-testid="coach-new-session" onClick={() => setDialogOpen(true)} className="min-h-9 rounded-xl">
          <Icon icon="mdi:plus" className="h-5 w-5" />
          جلسه جدید
        </Button>
      </div>

      {dashQ.isPending ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} aria-hidden="true" className="h-[72px] rounded-lg" />
          ))}
        </div>
      ) : dashQ.isError ? (
        <ErrorBox message="دریافت پنل مربی ممکن نشد (این بخش فقط برای حساب‌های با نقش مربی فعال است)." onRetry={() => dashQ.refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="coach-kpis">
            <KpiCard label="جلسات امروز" value={toPersianDigits(dashQ.data.today_count)} icon="mdi:calendar-today" color="#2563eb" />
            <KpiCard label="جلسات برگزارشده (ماه)" value={toPersianDigits(dashQ.data.month_sessions)} icon="mdi:account-check" color="#16a34a" />
            <KpiCard label="درآمد ماه" value={formatRial(dashQ.data.month_revenue)} icon="mdi:cash-multiple" color="#0ea5e9" />
            <KpiCard
              label="منتظر تسویه"
              value={formatRial(dashQ.data.month_outstanding)}
              sub={`${toPersianDigits(dashQ.data.active_clients)} شاگرد فعال`}
              icon="mdi:clock-alert-outline"
              color="#d97706"
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">جلسات امروز</h2>
            {today.length === 0 ? (
              <EmptyState icon="mdi:calendar-blank-outline" title="جلسه‌ای برای امروز نیست" description="از دکمهٔ «جلسه جدید» برای شاگردانت زمان بگذار." />
            ) : (
              <div className="flex flex-col gap-2.5" data-testid="coach-today">
                {today.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    busy={attendanceMut.isPending || settleMut.isPending}
                    onAttendance={(status) => runAttendance(s, status)}
                    onSettle={() => runSettle(s)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">پیش‌رو</h2>
            {upcoming.length === 0 ? (
              <p className="text-[0.68rem] text-muted-foreground">جلسهٔ زمان‌بندی‌شده‌ای در آینده نیست.</p>
            ) : (
              <div className="flex flex-col gap-2" data-testid="coach-upcoming">
                {upcoming.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    <p className="text-[0.68rem] font-semibold text-foreground">{s.client_name ?? 'شاگرد'}</p>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {formatJalaliDateTime(s.starts_at)} · {toPersianDigits(s.duration_min)} دقیقه
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">همهٔ جلسات</h2>
            <div
              role="group"
              aria-label="فیلتر وضعیت جلسات"
              data-testid="coach-status-filter"
              className="mb-3 flex flex-wrap gap-1"
            >
              {STATUS_FILTERS.map((value) => {
                const active = statusFilter === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(value)}
                    className={
                      active
                        ? 'inline-flex min-h-9 items-center rounded-[10px] border border-blue-600 bg-blue-600 px-4 text-[0.68rem] font-bold text-white transition-colors dark:border-blue-500 dark:bg-blue-500'
                        : 'inline-flex min-h-9 items-center rounded-[10px] border border-border bg-card px-4 text-[0.68rem] font-semibold text-foreground transition-colors hover:bg-muted'
                    }
                  >
                    {value === 'all' ? 'همه' : STATUS_LABELS[value]}
                  </button>
                )
              })}
            </div>
            {sessionsQ.isError ? (
              <ErrorBox message="دریافت فهرست جلسات ممکن نشد." onRetry={() => sessionsQ.refetch()} />
            ) : sessionsQ.isPending ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} aria-hidden="true" className="h-16 rounded-xl" />
                ))}
              </div>
            ) : sessionsQ.data.items.length === 0 ? (
              <p className="text-[0.68rem] text-muted-foreground">جلسه‌ای با این وضعیت یافت نشد.</p>
            ) : (
              <div className="flex flex-col gap-2" data-testid="coach-history">
                {sessionsQ.data.items.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    busy={attendanceMut.isPending || settleMut.isPending}
                    onAttendance={(status) => runAttendance(s, status)}
                    onSettle={() => runSettle(s)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">شاگردها</h2>
            {clientsQ.isError ? (
              <ErrorBox message="دریافت فهرست شاگردها ممکن نشد." onRetry={() => clientsQ.refetch()} />
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <Table aria-label="فهرست شاگردهای مربی" data-testid="coach-clients">
                  <TableHeader>
                    <TableRow>
                      <TableHead>شاگرد</TableHead>
                      <TableHead>شماره</TableHead>
                      <TableHead className="text-end">جلسات</TableHead>
                      <TableHead className="text-end">مجموع حق جلسه</TableHead>
                      <TableHead>آخرین جلسه</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clientsQ.data?.items ?? []).map((c) => (
                      <TableRow key={c.user_id}>
                        <TableCell className="font-semibold">{c.full_name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="text-end">{toPersianDigits(c.sessions)}</TableCell>
                        <TableCell className="text-end">{formatRial(c.fee_total)}</TableCell>
                        <TableCell>{c.last_session_at ? formatJalaliDateTime(c.last_session_at) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {clientsQ.isPending ? (
                  <div className="p-4"><Skeleton aria-hidden="true" className="h-12 rounded-xl" /></div>
                ) : (clientsQ.data?.items.length ?? 0) === 0 ? (
                  <div className="p-4">
                    <p className="text-[0.68rem] text-muted-foreground">هنوز شاگردی ثبت نشده است.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          aria-describedby={undefined}
          data-testid="coach-session-dialog"
          className="sm:max-w-[600px]"
        >
          <DialogHeader>
            <DialogTitle className="font-extrabold">جلسهٔ تمرینی جدید</DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <Label htmlFor={phoneId} className="mb-1.5 block">شماره شاگرد</Label>
              <Input
                id={phoneId}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09121234567"
                inputMode="tel"
                aria-describedby={`${phoneId}-help`}
              />
              <p id={`${phoneId}-help`} className="mt-1.5 text-[0.68rem] text-muted-foreground">
                باید حساب فعال در سامانه داشته باشد.
              </p>
            </div>
            <div>
              <Label htmlFor={startsAtId} className="mb-1.5 block">زمان شروع</Label>
              <Input
                id={startsAtId}
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label id={durationLabelId} className="mb-1.5 block">مدت (دقیقه)</Label>
              <Select value={String(duration)} onValueChange={(value) => setDuration(Number(value))}>
                <SelectTrigger aria-labelledby={durationLabelId} className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>{toPersianDigits(d)} دقیقه</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={feeId} className="mb-1.5 block">حق جلسه (ریال)</Label>
              <Input
                id={feeId}
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor={notesId} className="mb-1.5 block">یادداشت</Label>
              <Textarea
                id={notesId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="مثلاً: تمرین پاس و تمام‌کننده"
              />
            </div>
          </div>
          <DialogFooter className="px-1 pb-1">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="min-h-9">
              انصراف
            </Button>
            <Button variant="primary" onClick={submit} disabled={createMut.isPending} className="min-h-9 rounded-xl">
              {createMut.isPending ? 'در حال ثبت…' : 'ثبت جلسه'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default CoachDashboard
