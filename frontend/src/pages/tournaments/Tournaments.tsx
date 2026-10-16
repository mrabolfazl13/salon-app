// frontend/src/pages/tournaments/Tournaments.tsx
// فهرست تورنمنت‌ها (P005) — کاوش، ساخت و کارهای چرخهٔ حیاتِ برگزارکننده.
// داده فقط از GET /tournaments می‌آید (بدون mock); اکشن‌ها همان endpointهای بک‌اند.

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
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
import { radii, shadows } from '@/theme'

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
  round_robin: 'لیگ (همه با همه)',
}

/** متن هر گزینه باید فرقِ واقعیِ دو فرمت را بگوید، نه فقط نامش را */
export const TOURNAMENT_FORMAT_HINTS: Record<TournamentFormat, string> = {
  single_elimination: 'با یک باخت حذف می‌شوی؛ قرعه براکت را می‌سازد و تساوی ثبت نمی‌شود.',
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
    <Card
      data-testid={`tournament-card-${tournament.id}`}
      sx={{
        borderRadius: `${radii.card}px`,
        boxShadow: shadows.card,
        border: '1px solid rgba(15,23,42,0.05)',
        bgcolor: 'rgba(255,255,255,0.92)',
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/tournaments/${tournament.id}`)}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {tournament.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {TOURNAMENT_FORMAT_LABELS[tournament.format]}
            {` · ${toPersianDigits(tournament.team_count)} تیم`}
            {tournament.starts_at ? ` · ${formatJalaliDateTime(tournament.starts_at)}` : ''}
            {tournament.entry_fee > 0 ? ` · ورودی ${formatRial(tournament.entry_fee)}` : ''}
          </Typography>
          {tournament.winner_team_name && (
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: 'success.dark' }}>
              <Icon icon="mdi:trophy" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
              {tournament.winner_team_name}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <StatusChip label={TOURNAMENT_STATUS_LABELS[tournament.status]}
                      color={TOURNAMENT_STATUS_COLORS[tournament.status]} />
          {canManage && tournament.status === 'draft' && (
            <Button size="small" variant="outlined" disabled={busy} onClick={onOpen}
                    sx={{ borderRadius: '10px', minHeight: 40 }}>
              بازکردن ثبت‌نام
            </Button>
          )}
          {canManage && tournament.status === 'registration' && (
            <Tooltip title={tournament.format === 'round_robin'
              ? 'برنامهٔ هفته‌ها ساخته می‌شود و دیگر قابل تغییر نیست'
              : 'براکت ساخته می‌شود و دیگر قابل تغییر نیست'}>
              <span>
                <Button size="small" variant="contained" disabled={busy || tournament.team_count < 2}
                        onClick={onDraw} sx={{ borderRadius: '10px', minHeight: 40 }}>
                  قرعه‌کشی
                </Button>
              </span>
            </Tooltip>
          )}
          {canManage && !['completed', 'cancelled'].includes(tournament.status) && (
            <Tooltip title="لغو تورنمنت">
              <IconButton aria-label="لغو تورنمنت" disabled={busy} onClick={onCancel}
                          sx={{ width: 40, height: 40, color: 'error.main' }}>
                <Icon icon="mdi:cancel" style={{ width: 20, height: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Card>
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:trophy-outline" style={{ width: 30, height: 30, color: '#d97706' }} />
            تورنمنت‌ها
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            جام‌های حذفی و لیگِ همه‌با‌همه با قرعهٔ خودکار — تیمت را ثبت کن و نتیجه‌ها را وارد کن.
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button variant="contained" data-testid="tournament-new" onClick={() => setDialogOpen(true)}
                  startIcon={<Icon icon="mdi:plus" />} sx={{ borderRadius: '12px', minHeight: 44 }}>
            تورنمنت جدید
          </Button>
        )}
      </Box>

      {listQ.isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 92, borderRadius: '16px' }} />)}
        </Box>
      ) : listQ.isError ? (
        <ErrorBox message="دریافت فهرست تورنمنت‌ها ممکن نشد." onRetry={() => listQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState emoji="🏆" title="هنوز تورنمنتی نیست"
                    description={isAuthenticated ? 'با دکمهٔ «تورنمنت جدید» اولین جام را بساز.' : 'برای ساخت تورنمنت وارد حساب شو.'} />
      ) : (
        <Stack spacing={1.5} data-testid="tournament-list">
          {items.map((t) => (
            <TournamentCard key={t.id} tournament={t} canManage={canManage(t)} busy={busy}
                            onOpen={() => runOpen(t)} onDraw={() => runDraw(t)} onCancel={() => runCancel(t)} />
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm"
              data-testid="tournament-create-dialog">
        <DialogTitle sx={{ fontWeight: 800 }}>تورنمنت جدید</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="نام تورنمنت" value={name} onChange={(e) => setName(e.target.value)}
                       fullWidth placeholder="جام بهارانه" autoFocus />
            <Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', mb: 0.5 }}>
                فرمت مسابقات
              </Typography>
              <RadioGroup row value={format} data-testid="tournament-format"
                          onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                          sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {(Object.keys(TOURNAMENT_FORMAT_LABELS) as TournamentFormat[]).map((f) => (
                  <FormControlLabel key={f} value={f} control={<Radio size="small" />}
                                    sx={{ ms: 0.5 }}
                                    label={
                                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        {TOURNAMENT_FORMAT_LABELS[f]}
                                      </Typography>
                                    } />
                ))}
              </RadioGroup>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5, lineHeight: 1.8 }}>
                {TOURNAMENT_FORMAT_HINTS[format]}
              </Typography>
            </Box>
            <TextField label="زمان شروع" type="datetime-local" value={startsAt}
                       onChange={(e) => setStartsAt(e.target.value)} fullWidth
                       slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="ورودی هر تیم (ریال)" value={entryFee}
                       onChange={(e) => setEntryFee(e.target.value.replace(/[^\d]/g, ''))}
                       inputMode="numeric" fullWidth />
            <TextField label="توضیح" value={description} onChange={(e) => setDescription(e.target.value)}
                       multiline minRows={2} fullWidth placeholder="قوانین، زمان بازی‌ها، جوایز" />
            <Typography variant="caption" color="text.secondary">
              پس از ساخت، ثبت‌نام را باز کن و تیم‌ها را دعوت کن؛ قرعه‌کشی براکت را می‌سازد.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ minHeight: 44 }}>انصراف</Button>
          <Button variant="contained" onClick={submit} disabled={createMut.isPending}
                  sx={{ borderRadius: '12px', minHeight: 44 }}>
            {createMut.isPending ? 'در حال ساخت…' : 'ساخت تورنمنت'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default TournamentsPage
