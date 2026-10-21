// frontend/src/pages/tournaments/Tournaments.tsx
// فهرست تورنمنت‌ها (P005) — کاوش، ساخت و کارهای چرخهٔ حیاتِ برگزارکننده.
// داده فقط از GET /tournaments می‌آید (بدون mock); اکشن‌ها همان endpointهای بک‌اند.

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState, Shimmer } from '@/components/mobile'
import { ErrorBox, StatusChip, extractError, formatRial } from '@/components/finance/shared'
import {
  useCancelTournament,
  useCreateTournament,
  useDrawTournament,
  useOpenRegistration,
  useTournaments,
} from '@/hooks/useTournament'
import type { Tournament, TournamentFormat, TournamentStatus } from '@/types/tournament'
import { useAuthStore } from '@/store/authStore'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'پیش‌نویس',
  registration: 'ثبت‌نام باز',
  drawn: 'قرعه‌کشی‌شده',
  in_progress: 'در جریان',
  completed: 'تمام‌شده',
  cancelled: 'لغوشده',
}

export const TOURNAMENT_STATUS_COLORS: Record<TournamentStatus, string> = {
  draft: '#6b7280',
  registration: '#2563eb',
  drawn: '#0ea5e9',
  in_progress: '#d97706',
  completed: '#16a34a',
  cancelled: '#6b7280',
}

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'تک‌حذفی',
  double_elimination: 'دو-حذفی',
  round_robin: 'لیگ (همه با همه)',
}

/** متن هر گزینه باید فرقِ واقعیِ دو فرمت را بگوید، نه فقط نامش را */
export const TOURNAMENT_FORMAT_HINTS: Record<TournamentFormat, string> = {
  single_elimination: 'با یک باخت حذف می‌شوی؛ قرعه براکت را می‌سازد و تساوی ثبت نمی‌شود.',
  // «بدون bracket reset» عمداً در همین متن است: کاربر باید بداند فینالِ بزرگ یک بازیست،
  // نه دو بازی — وگرنه باختِ تیمِ صدرِ براکتِ برندگان را اشتباه تفسیر می‌کند.
  double_elimination: 'با دومین باخت حذف می‌شوی؛ بازنده‌ها به براکت بازندگان می‌افتند. '
    + 'فینالِ بزرگ یک دیدار است و بازیِ دوباره (bracket reset) ندارد.',
  round_robin: 'هر تیم با همهٔ تیم‌ها بازی می‌کند؛ برد ۳ امتیاز و تساوی ۱. قهرمان با جدول امتیازات تعیین می‌شود.',
}

/** مقدار پیش‌فرض datetime-local — بک‌اند ورودی naive را وقت تهران می‌گیرد */
function defaultStartsAt(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setDate(d.getDate() + 7)
  d.setHours(18, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const TournamentCard: React.FC<{
  tournament: Tournament
  canManage: boolean
  busy: boolean
  onOpen: () => void
  onDraw: () => void
  onCancel: () => void
}> = ({ tournament, canManage, busy, onOpen, onDraw, onCancel }) => {
  const navigate = useNavigate()

  return (
    <div
      data-testid={`tournament-card-${tournament.id}`}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
          <h2 className="text-base font-extrabold text-foreground">{tournament.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {TOURNAMENT_FORMAT_LABELS[tournament.format]}
            {` · ${toPersianDigits(tournament.team_count)} تیم`}
            {tournament.starts_at ? ` · ${formatJalaliDateTime(tournament.starts_at)}` : ''}
            {tournament.entry_fee > 0 ? ` · ورودی ${formatRial(tournament.entry_fee)}` : ''}
          </p>
          {tournament.winner_team_name && (
            <p className="mt-2 flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <Icon icon="mdi:trophy" aria-hidden="true" className="h-4 w-4" />
              {tournament.winner_team_name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <StatusChip label={TOURNAMENT_STATUS_LABELS[tournament.status]}
                      color={TOURNAMENT_STATUS_COLORS[tournament.status]} />
          {canManage && tournament.status === 'draft' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onOpen} className="min-h-11 rounded-[10px]">
              بازکردن ثبت‌نام
            </Button>
          )}
          {canManage && tournament.status === 'registration' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" disabled={busy || tournament.team_count < 2} onClick={onDraw} className="min-h-11 rounded-[10px]">
                    قرعه‌کشی
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {tournament.format === 'round_robin'
                  ? 'برنامهٔ هفته‌ها ساخته می‌شود و دیگر قابل تغییر نیست'
                  : 'براکت ساخته می‌شود و دیگر قابل تغییر نیست'}
              </TooltipContent>
            </Tooltip>
          )}
          {canManage && !['completed', 'cancelled'].includes(tournament.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="لغو تورنمنت"
                  disabled={busy}
                  onClick={onCancel}
                  className="h-11 w-11 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  <Icon icon="mdi:cancel" aria-hidden="true" className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>لغو تورنمنت</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

const TournamentsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const listQ = useTournaments({ limit: 100 })

  const createMut = useCreateTournament()
  const openMut = useOpenRegistration()
  const drawMut = useDrawTournament()
  const cancelMut = useCancelTournament()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartsAt)
  const [entryFee, setEntryFee] = useState('0')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState<TournamentFormat>('single_elimination')

  const canManage = (t: Tournament) =>
    t.organizer_id === user?.id || user?.role === 'super_admin'

  const busy = openMut.isPending || drawMut.isPending || cancelMut.isPending

  const runOpen = (t: Tournament) => {
    openMut.mutate(t.id, {
      onSuccess: () => toast.success('ثبت‌نام باز شد'),
      onError: (err) => toast.error(extractError(err, 'بازکردن ثبت‌نام ممکن نشد.')),
    })
  }

  const runDraw = (t: Tournament) => {
    drawMut.mutate(t.id, {
      onSuccess: () => toast.success(t.format === 'round_robin'
        ? 'برنامهٔ هفته‌ها ساخته شد'
        : 'براکت ساخته شد'),
      onError: (err) => toast.error(extractError(err, 'قرعه‌کشی ممکن نشد.')),
    })
  }

  const runCancel = (t: Tournament) => {
    cancelMut.mutate(t.id, {
      onSuccess: () => toast.success('تورنمنت لغو شد'),
      onError: (err) => toast.error(extractError(err, 'لغو تورنمنت ممکن نشد.')),
    })
  }

  const submit = () => {
    if (name.trim().length < 3) {
      toast.error('نام تورنمنت باید حداقل ۳ حرف باشد.')
      return
    }
    createMut.mutate(
      {
        name: name.trim(),
        starts_at: startsAt || null,
        entry_fee: Math.max(0, Number(entryFee) || 0),
        description: description.trim() || null,
        format,
      },
      {
        onSuccess: () => {
          toast.success('تورنمنت ساخته شد؛ حالا ثبت‌نام را باز کن.')
          setDialogOpen(false)
          setName('')
          setDescription('')
          setEntryFee('0')
          setFormat('single_elimination')
        },
        onError: (err) => toast.error(extractError(err, 'ساخت تورنمنت ممکن نشد.')),
      },
    )
  }

  const items = listQ.data?.items ?? []

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
            <Icon icon="mdi:trophy-outline" aria-hidden="true" className="h-[30px] w-[30px] text-amber-600 dark:text-amber-400" />
            تورنمنت‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            جام‌های حذفی و لیگِ همه‌با‌همه با قرعهٔ خودکار — تیمت را ثبت کن و نتیجه‌ها را وارد کن.
          </p>
        </div>
        {isAuthenticated && (
          <Button data-testid="tournament-new" onClick={() => setDialogOpen(true)} className="rounded-xl">
            <Icon icon="mdi:plus" aria-hidden="true" className="h-5 w-5" />
            تورنمنت جدید
          </Button>
        )}
      </div>

      {listQ.isPending ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" className="h-[92px] rounded-2xl" />)}
        </div>
      ) : listQ.isError ? (
        <ErrorBox message="دریافت فهرست تورنمنت‌ها ممکن نشد." onRetry={() => listQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="mdi:trophy-outline" title="هنوز تورنمنتی نیست"
                    description={isAuthenticated ? 'با دکمهٔ «تورنمنت جدید» اولین جام را بساز.' : 'برای ساخت تورنمنت وارد حساب شو.'} />
      ) : (
        <div className="flex flex-col gap-3" data-testid="tournament-list">
          {items.map((t) => (
            <TournamentCard key={t.id} tournament={t} canManage={canManage(t)} busy={busy}
                            onOpen={() => runOpen(t)} onDraw={() => runDraw(t)} onCancel={() => runCancel(t)} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent data-testid="tournament-create-dialog" className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تورنمنت جدید</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">نام تورنمنت</Label>
              <Input id="tournament-name" value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="جام بهارانه" autoFocus />
            </div>
            <div>
              <p className="mb-2 text-[0.78rem] font-bold text-muted-foreground">فرمت مسابقات</p>
              <RadioGroup
                value={format}
                onValueChange={(v) => setFormat(v as TournamentFormat)}
                data-testid="tournament-format"
                className="flex flex-wrap gap-2"
              >
                {(Object.keys(TOURNAMENT_FORMAT_LABELS) as TournamentFormat[]).map((f) => (
                  <label key={f} htmlFor={`format-${f}`}
                         className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-[0.8rem] font-semibold has-[:checked]:border-amber-500/60 has-[:checked]:bg-amber-500/10">
                    <RadioGroupItem id={`format-${f}`} value={f} />
                    {TOURNAMENT_FORMAT_LABELS[f]}
                  </label>
                ))}
              </RadioGroup>
              <p className="mt-2 text-xs leading-[1.8] text-muted-foreground">{TOURNAMENT_FORMAT_HINTS[format]}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-start">زمان شروع</Label>
              <Input id="tournament-start" type="datetime-local" value={startsAt}
                     onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-fee">ورودی هر تیم (ریال)</Label>
              <Input id="tournament-fee" value={entryFee} inputMode="numeric"
                     onChange={(e) => setEntryFee(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament-desc">توضیح</Label>
              <Textarea id="tournament-desc" value={description} onChange={(e) => setDescription(e.target.value)}
                        rows={2} placeholder="قوانین، زمان بازی‌ها، جوایز" />
            </div>
            <p className="text-xs text-muted-foreground">
              پس از ساخت، ثبت‌نام را باز کن و تیم‌ها را دعوت کن؛ قرعه‌کشی براکت را می‌سازد.
            </p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={submit} disabled={createMut.isPending} className="rounded-xl">
              {createMut.isPending ? 'در حال ساخت…' : 'ساخت تورنمنت'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default TournamentsPage
