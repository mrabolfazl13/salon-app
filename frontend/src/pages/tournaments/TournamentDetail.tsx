// frontend/src/pages/tournaments/TournamentDetail.tsx
// صفحهٔ تورنمنت (P005) — ثبت‌نام تیم، قرعه‌کشی، براکت/برنامهٔ هفته‌ها و رده‌بندی.
// براکت با CSS grid و `gridAutoFlow: column` رندر می‌شود: در RTL ستون اول سمت راست
// می‌نشیند (همان مسیر زمان)، بدون transform یا ترتیب معکوسِ دست‌سازی.
// هر دو فرمت (تک‌حذفی و لیگ) از همین grid استفاده می‌کنند: لیگ هم «مراحل» مرتب دارد
// (هفته‌ها)، فقط معنای مرحله عوض شده؛ پس دو مسیر رندر برای هم‌ترازیِ ظاهر لازم نیست.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
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
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_COLORS,
  TOURNAMENT_STATUS_LABELS,
} from '@/pages/tournaments/Tournaments'
import {
  useCancelTournament,
  useDrawTournament,
  useOpenRegistration,
  useRegisterTournamentTeam,
  useSetMatchResult,
  useTournamentBracket,
  useTournamentStandings,
  useWithdrawTournamentTeam,
} from '@/hooks/useTournament'
import { useMyTeams } from '@/hooks/useTeams'
import type { LeagueStanding, MatchStatus, TournamentBracketHalf, TournamentMatch, TournamentRound, TournamentStanding } from '@/types/tournament'
import { useAuthStore } from '@/store/authStore'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { radii, shadows } from '@/theme'

const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  pending: 'در انتظار تیم',
  ready: 'آمادهٔ بازی',
  live: 'در جریان',
  final: 'تمام‌شده',
  bye: 'بدون حریف',
}

const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  pending: '#6b7280',
  ready: '#2563eb',
  live: '#d97706',
  final: '#16a34a',
  bye: '#0ea5e9',
}

const TeamLine: React.FC<{
  name?: string | null
  score?: number | null
  isWinner: boolean
  muted?: boolean
}> = ({ name, score, isWinner, muted }) => (
  <Stack direction="row" spacing={1} sx={{
    alignItems: 'center', justifyContent: 'space-between', gap: 1,
    opacity: muted ? 0.45 : 1,
  }}>
    <Typography variant="body2" sx={{
      fontWeight: isWinner ? 800 : 600,
      color: isWinner ? 'text.primary' : 'text.secondary',
      minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {name ?? '—'}
    </Typography>
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', gap: 0.5 }}>
      {isWinner && <Icon icon="mdi:chevron-right" style={{ width: 16, height: 16, color: '#16a34a' }} />}
      <Typography variant="body2" component="span"
                  sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: 14, textAlign: 'center' }}>
        {score === null || score === undefined ? '' : toPersianDigits(score)}
      </Typography>
    </Stack>
  </Stack>
)

const MatchCard: React.FC<{
  match: TournamentMatch
  canManage: boolean
  busy: boolean
  onResult: () => void
}> = ({ match, canManage, busy, onResult }) => {
  const isBye = match.status === 'bye'
  return (
    <Card
      data-testid={`bracket-match-${match.id}`}
      sx={{
        borderRadius: `${radii.card}px`,
        boxShadow: shadows.card,
        border: `1px solid ${match.status === 'ready' ? 'rgba(37,99,235,0.35)' : 'rgba(15,23,42,0.07)'}`,
        bgcolor: 'rgba(255,255,255,0.94)',
        p: 1.25,
      }}
    >
      <Stack spacing={0.75}>
        <TeamLine name={match.team_a_name} score={match.score_a}
                  isWinner={!!match.winner_team_id && match.winner_team_id === match.team_a_id} />
        <Divider />
        <TeamLine name={match.team_b_name} score={match.score_b}
                  isWinner={!!match.winner_team_id && match.winner_team_id === match.team_b_id}
                  muted={isBye && !match.team_b_id} />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <StatusChip label={MATCH_STATUS_LABELS[match.status]} color={MATCH_STATUS_COLORS[match.status]} />
          {canManage && (match.status === 'ready' || match.status === 'live') && (
            <Button size="small" variant="outlined" disabled={busy} onClick={onResult}
                    sx={{ borderRadius: '10px', minHeight: 44 }}>
              ثبت نتیجه
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

/** یک ردیفِ ستونِ براکت: هر مرحله یک ستون، با ترتیب چپ→راستِ رندر RTL.
 *
 * دو-حذفی همین را دو بار می‌خواند (برندگان/فینالِ بزرگ، سپس بازندگان)، پس grid
 * باید مستقل از «کدام نیمه» باشد و برچسب نیمه بیرون آن تصمیم گرفته شود.
 */
const BracketGrid: React.FC<{
  rounds: TournamentRound[]
  testId: string
  canManage: boolean
  busy: boolean
  onResult: (match: TournamentMatch) => void
}> = ({ rounds, testId, canManage, busy, onResult }) => (
  <Box sx={{ overflowX: 'auto', pb: 1 }} role="region" aria-label="براکت مسابقات، قابل پیمایش با کیبورد" tabIndex={0}>
    <Box data-testid={testId}
         sx={{
           display: 'grid', gridAutoFlow: 'column',
           gridAutoColumns: 'minmax(232px, max-content)', gap: 2, alignItems: 'stretch',
         }}>
      {rounds.map((round) => (
        <Box key={round.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="overline" sx={{
            fontWeight: 800, color: 'text.secondary', textAlign: 'center',
            letterSpacing: '0.4px', bgcolor: 'rgba(15,23,42,0.04)', borderRadius: '10px', py: 0.5,
          }}>
            {round.name}
          </Typography>
          {round.bye_team_name && (
            <Typography variant="caption" data-testid={`tournament-bye-${round.id}`}
                        sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Icon icon="mdi:sofa-single" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
              {round.bye_team_name} استراحت می‌کند
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 2, flexGrow: 1 }}>
            {round.matches.map((match) => (
              <MatchCard key={match.id} match={match} canManage={canManage}
                         busy={busy} onResult={() => onResult(match)} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const bracketQ = useTournamentBracket(tournamentId || null)
  // ۴۰۴ با «خطای شبکه» یکی نیست: لینک مردهٔ تورنمنت حذف‌شده را با دکمهٔ
  // «تلاش مجدد» نباید نشان داد (ممیزی F-07 — مسیر /tournaments/999).
  const bracketHttpStatus = (bracketQ.error as { response?: { status?: number } } | null)?.response?.status
  const bracketStatus = bracketQ.data?.tournament.status
  const bracketFormat = bracketQ.data?.tournament.format
  // جدول لیگ وسطِ راه هم معنا دارد (امتیازها از نتیجه‌های ثبت‌شده ساخته می‌شود)،
  // برخلاف رده‌بندی حذفی که پیش از تمام‌شدن براکت چیزی برای نشان دادن ندارد.
  const standingsEnabled = bracketFormat === 'round_robin'
    ? ['drawn', 'in_progress', 'completed'].includes(String(bracketStatus))
    : bracketStatus === 'completed'
  const standingsQ = useTournamentStandings(tournamentId || null, standingsEnabled)
  const myTeamsQ = useMyTeams(!!user)

  const openMut = useOpenRegistration()
  const drawMut = useDrawTournament()
  const cancelMut = useCancelTournament()
  const registerMut = useRegisterTournamentTeam()
  const withdrawMut = useWithdrawTournamentTeam()
  const resultMut = useSetMatchResult()

  const [registerOpen, setRegisterOpen] = useState(false)
  const [teamId, setTeamId] = useState<number | ''>('')
  const [seed, setSeed] = useState('')
  const [resultMatch, setResultMatch] = useState<TournamentMatch | null>(null)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')

  const tournament = bracketQ.data?.tournament
  const rounds = bracketQ.data?.rounds ?? []
  const participants = bracketQ.data?.participants ?? []

  const canManage = !!tournament && (tournament.organizer_id === user?.id || user?.role === 'super_admin')
  const isLeague = tournament?.format === 'round_robin'
  const isDouble = tournament?.format === 'double_elimination'
  // نیمهٔ مرحله از خودِ داده خوانده می‌شود؛ بک‌اند در تک‌حذفی `bracket` را نمی‌فرستد،
  // پس پیش‌فرض «winners» است و فیلتر برای تک‌حذفی همان آرایۀ قبلی را برمی‌گرداند.
  const mainRounds = rounds.filter((r) => (r.bracket ?? 'winners') !== 'losers')
  const losersRounds = rounds.filter((r) => r.bracket === 'losers')
  const mutating = openMut.isPending || drawMut.isPending || cancelMut.isPending
    || registerMut.isPending || withdrawMut.isPending || resultMut.isPending

  const eligibleTeams = useMemo(() => {
    const mine = (myTeamsQ.data ?? []).filter((t) => t.my_role === 'captain')
    const taken = new Set(participants.filter((p) => p.status === 'registered').map((p) => p.team_id))
    return mine.filter((t) => !taken.has(t.id))
  }, [myTeamsQ.data, participants])

  const openResult = (match: TournamentMatch) => {
    setResultMatch(match)
    setScoreA(match.score_a === null || match.score_a === undefined ? '' : String(match.score_a))
    setScoreB(match.score_b === null || match.score_b === undefined ? '' : String(match.score_b))
  }

  const submitResult = () => {
    if (!resultMatch) return
    const a = Number(scoreA)
    const b = Number(scoreB)
    if (scoreA === '' || scoreB === '' || Number.isNaN(a) || Number.isNaN(b)) {
      toast.error('هر دو نتیجه را وارد کن.')
      return
    }
    if (a === b && !isLeague) {
      toast.error('در تورنمنت حذفی نتیجهٔ مساوی ثبت نمی‌شود.')
      return
    }
    const half = isDouble ? halfOf(resultMatch) : undefined
    const matchId = resultMatch.id
    resultMut.mutate(
      { matchId, scoreA: a, scoreB: b },
      {
        onSuccess: () => {
          toast.success(
            isLeague
              ? 'نتیجه در جدول لیگ ثبت شد.'
              : half === 'grand_final'
                ? 'نتیجه ثبت شد؛ قهرمان مشخص شد.'
                : half === 'losers'
                  ? 'نتیجه ثبت شد؛ بازنده دومین باخت را گرفت و حذف شد.'
                  : isDouble
                    ? 'نتیجه ثبت شد؛ برنده جلو رفت و بازنده یک باخت گرفت.'
                    : 'نتیجه ثبت و برنده به مرحلهٔ بعد رفت.',
          )
          setResultMatch(null)
        },
        onError: (err) => toast.error(extractError(err, 'ثبت نتیجه ممکن نشد.')),
      },
    )
  }

  const submitRegister = () => {
    if (!teamId) {
      toast.error('یک تیم انتخاب کن.')
      return
    }
    registerMut.mutate(
      { id: tournamentId, teamId: Number(teamId), seed: seed ? Number(seed) : null },
      {
        onSuccess: () => {
          toast.success('تیم در تورنمنت ثبت شد')
          setRegisterOpen(false)
          setTeamId('')
          setSeed('')
        },
        onError: (err) => toast.error(extractError(err, 'ثبت تیم ممکن نشد.')),
      },
    )
  }

  const drawn = rounds.length > 0 && !!tournament && tournament.status !== 'draft' && tournament.status !== 'registration'
  const totalMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0)
  // «بازنده حذف شد» فقط در نیمهٔ بازندگان راست است و «به دیدار بعد» فقط در برندگان؛
  // نیمه روی خودِ match نیست، از مرحله‌ای که آن را دارد خوانده می‌شود.
  const halfOf = (match: TournamentMatch): TournamentBracketHalf | undefined =>
    rounds.find((r) => r.matches.some((m) => m.id === match.id))?.bracket
  const dialogHalf = resultMatch ? halfOf(resultMatch) : undefined

  // دو فرمت دو شکل ردیف برمی‌گردانند؛ تفکیک با خودِ فیلدها انجام می‌شود نه حدسِ ترتیب
  const standingsRows = standingsQ.data?.items ?? []
  const leagueRows = standingsRows.filter((row): row is LeagueStanding => 'points' in row)
  const elimRows = standingsRows.filter((row): row is TournamentStanding => !('points' in row))
  // صدر جدولِ لیگ وسطِ راه هم هست، اما «قهرمان» نیست؛ اگر رتبهٔ ۱ مشترک بماند
  // همان را می‌نویسم و پلی‌آف را در جدول توضیح می‌دهم.
  const leagueFirst = leagueRows.filter((row) => row.rank === 1)
  const leagueLeader = leagueFirst.length === 0 ? null
    : leagueFirst.length === 1 ? leagueFirst[0].team_name ?? '—' : 'مشترک'

  return (
    <Layout>
      <Box sx={{ mb: 2 }}>
        <Button size="small" onClick={() => navigate('/tournaments')} startIcon={<Icon icon="mdi:arrow-right" />}
                sx={{ minHeight: 44, px: 0 }}>
          بازگشت به تورنمنت‌ها
        </Button>
      </Box>

      {bracketQ.isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Shimmer variant="rounded" sx={{ height: 96, borderRadius: '16px' }} />
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 120, borderRadius: '16px' }} />)}
        </Box>
      ) : bracketQ.isError ? (
        bracketHttpStatus === 404 ? (
          <EmptyState
            asPageHeading
            emoji="🏆"
            title="این تورنمنت پیدا نشد"
            description="یا حذف شده یا نشانی درست نیست. از فهرست تورنمنت‌ها یک جام انتخاب کن."
            actionLabel="فهرست تورنمنت‌ها"
            onAction={() => navigate('/tournaments')}
          />
        ) : (
          <ErrorBox message="دریافت تورنمنت ممکن نشد." onRetry={() => bracketQ.refetch()} />
        )
      ) : !tournament ? (
        <EmptyState emoji="🏆" title="تورنمنتی نیست" description="از فهرست تورنمنت‌ها یک جام انتخاب کن." />
      ) : (
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Icon icon="mdi:trophy" style={{ width: 28, height: 28, color: '#d97706' }} />
              {tournament.name}
              <StatusChip label={TOURNAMENT_STATUS_LABELS[tournament.status]}
                          color={TOURNAMENT_STATUS_COLORS[tournament.status]} />
              <StatusChip label={TOURNAMENT_FORMAT_LABELS[tournament.format]} color="#7c3aed" />
            </Typography>
            {tournament.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {tournament.description}
              </Typography>
            )}
          </Box>

          <Grid container spacing={2} data-testid="tournament-kpis">
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="تیم‌ها" value={toPersianDigits(tournament.team_count)} icon="mdi:account-group" color="#2563eb" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="ورودی هر تیم" value={formatRial(tournament.entry_fee)} icon="mdi:ticket-percent-outline" color="#0ea5e9" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label="شروع" value={tournament.starts_at ? formatJalaliDateTime(tournament.starts_at) : '—'}
                       icon="mdi:calendar-outline" color="#7c3aed" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <KpiCard label={isLeague ? 'صدر جدول' : 'قهرمان'}
                       value={tournament.winner_team_name ?? (isLeague ? leagueLeader ?? '—' : '—')}
                       icon={isLeague ? 'mdi:table-check' : 'mdi:trophy-outline'} color="#16a34a" />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {canManage && tournament.status === 'draft' && (
              <Button variant="contained" disabled={mutating} data-testid="tournament-open"
                      onClick={() => openMut.mutate(tournament.id, {
                        onSuccess: () => toast.success('ثبت‌نام باز شد'),
                        onError: (err) => toast.error(extractError(err, 'بازکردن ثبت‌نام ممکن نشد.')),
                      })} sx={{ borderRadius: '12px', minHeight: 44 }}>
                بازکردن ثبت‌نام
              </Button>
            )}
            {canManage && tournament.status === 'registration' && (
              <Tooltip title={isLeague
                ? 'برنامهٔ هفته‌ها ساخته می‌شود؛ پس از آن قابل تغییر نیست'
                : isDouble
                  ? 'هر دو براکت (برندگان و بازندگان) ساخته می‌شود؛ پس از آن قابل تغییر نیست'
                  : 'براکت ساخته می‌شود؛ پس از آن قابل تغییر نیست'}>
                <span>
                  <Button variant="contained" disabled={mutating || tournament.team_count < 2}
                          data-testid="tournament-draw"
                          startIcon={<Icon icon="mdi:shuffle-variant" />}
                          onClick={() => drawMut.mutate(tournament.id, {
                            onSuccess: () => toast.success(isLeague
                              ? 'برنامهٔ هفته‌ها ساخته شد'
                              : isDouble
                                ? 'براکتِ دو-حذفی ساخته شد'
                                : 'براکت ساخته شد'),
                            onError: (err) => toast.error(extractError(err, 'قرعه‌کشی ممکن نشد.')),
                          })} sx={{ borderRadius: '12px', minHeight: 44 }}>
                    {isLeague ? 'قرعه‌کشی و ساخت برنامهٔ هفته‌ها' : 'قرعه‌کشی و ساخت براکت'}
                  </Button>
                </span>
              </Tooltip>
            )}
            {user && (tournament.status === 'draft' || tournament.status === 'registration') && (
              <Button variant="outlined" data-testid="tournament-register"
                      onClick={() => setRegisterOpen(true)}
                      startIcon={<Icon icon="mdi:plus-circle-outline" />}
                      sx={{ borderRadius: '12px', minHeight: 44 }}>
                ثبت تیم من
              </Button>
            )}
            {canManage && !['completed', 'cancelled'].includes(tournament.status) && (
              <Button color="error" variant="text" disabled={mutating} data-testid="tournament-cancel"
                      onClick={() => cancelMut.mutate(tournament.id, {
                        onSuccess: () => toast.success('تورنمنت لغو شد'),
                        onError: (err) => toast.error(extractError(err, 'لغو تورنمنت ممکن نشد.')),
                      })} sx={{ minHeight: 44 }}>
                لغو تورنمنت
              </Button>
            )}
          </Stack>

          {!drawn && (
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>تیم‌های ثبت‌نام‌شده</Typography>
              {participants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  هنوز تیمی ثبت‌نام نکرده است؛ کاپیتان‌ها با «ثبت تیم من» وارد می‌شوند.
                </Typography>
              ) : (
                <Box sx={{
                  borderRadius: `${radii.card}px`, boxShadow: shadows.card,
                  border: '1px solid rgba(15,23,42,0.05)', bgcolor: 'rgba(255,255,255,0.92)', overflowX: 'auto',
                }}>
                  <Table size="small" aria-label="تیم‌های ثبت‌نام‌شده در تورنمنت" data-testid="tournament-participants">
                    <TableHead>
                      <TableRow>
                        <TableCell scope="col">تیم</TableCell>
                        <TableCell scope="col" align="right">سید</TableCell>
                        <TableCell scope="col">وضعیت</TableCell>
                        {canManage && <TableCell scope="col" align="right">عمل</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.map((p) => (
                        <TableRow key={p.team_id}>
                          <TableCell sx={{ fontWeight: 600 }}>{p.team_name ?? `تیم #${p.team_id}`}</TableCell>
                          <TableCell align="right">{p.seed ? toPersianDigits(p.seed) : '—'}</TableCell>
                          <TableCell>{p.status === 'registered' ? 'ثبت‌نام‌شده' : 'کناره‌گرفته'}</TableCell>
                          {canManage && (
                            <TableCell align="right">
                              {p.status === 'registered' && (
                                <Button size="small" color="error" variant="text" disabled={mutating}
                                        aria-label={`حذف ${p.team_name ?? ''}`}
                                        onClick={() => withdrawMut.mutate(
                                          { id: tournament.id, teamId: p.team_id },
                                          {
                                            onSuccess: () => toast.success('تیم از تورنمنت حذف شد'),
                                            onError: (err) => toast.error(extractError(err, 'حذف تیم ممکن نشد.')),
                                          })} sx={{ minHeight: 44 }}>
                                  حذف
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              {tournament.status === 'registration' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    برای قرعه‌کشی حداقل {toPersianDigits(2)} تیم لازم است.{' '}
                    {isLeague
                      ? `در لیگ هر تیم با همه بازی می‌کند ⇒ ${toPersianDigits(totalMatches || 0)} دیدار.`
                      : `تعداد دیدارهای براکت: ${toPersianDigits(totalMatches || 0)}`}
                  </Typography>
                  {isDouble && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}
                                data-testid="double-elim-plan-hint">
                      <Icon icon="mdi:information-outline" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      با {toPersianDigits(tournament.team_count)} تیم و حذفِ دوباختی، {toPersianDigits(Math.max(0, (tournament.team_count - 1) * 2))} دیدار
                      بازی می‌شود؛ دیدارهای بدون حریفِ مرحلهٔ اول «بدون بازی» رد می‌شوند.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {drawn && (
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
                {isLeague ? 'برنامهٔ هفته‌ها' : isDouble ? 'براکت برندگان و فینالِ بزرگ' : 'براکت'}
              </Typography>
              <BracketGrid rounds={mainRounds} testId="tournament-bracket"
                           canManage={canManage} busy={mutating} onResult={openResult} />

              {isDouble && losersRounds.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    <Icon icon="mdi:arrow-down-bold-circle-outline" style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                    براکت بازندگان
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}
                              data-testid="double-elim-note">
                    تیمی که اینجا می‌بازد دومین باختش را داشته و حذف شده است. برندهٔ آخرین
                    دیدارِ این براکت به فینالِ بزرگ می‌رود؛ فینالِ بزرگ یک دیدار است و
                    بازیِ دوباره (bracket reset) ندارد.
                  </Typography>
                  <BracketGrid rounds={losersRounds} testId="tournament-losers-bracket"
                               canManage={canManage} busy={mutating} onResult={openResult} />
                </Box>
              )}
            </Box>
          )}

          {standingsEnabled && (
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
                {isLeague ? (tournament.status === 'completed' ? 'جدول نهایی' : 'جدول امتیازها') : 'رده‌بندی نهایی'}
              </Typography>
              <Box sx={{
                borderRadius: `${radii.card}px`, boxShadow: shadows.card,
                border: '1px solid rgba(15,23,42,0.05)', bgcolor: 'rgba(255,255,255,0.92)', overflowX: 'auto',
              }}>
                <Table size="small"
                       aria-label={isLeague ? 'جدول امتیازهای تورنمنت' : 'رده‌بندی نهایی تورنمنت'}
                       data-testid="tournament-standings">
                  <TableHead>
                    <TableRow>
                      <TableCell scope="col" align="right">رتبه</TableCell>
                      <TableCell scope="col">تیم</TableCell>
                      {isLeague ? (
                        <>
                          <TableCell scope="col" align="right">بازی</TableCell>
                          <TableCell scope="col" align="right">برد</TableCell>
                          <TableCell scope="col" align="right">تساوی</TableCell>
                          <TableCell scope="col" align="right">باخت</TableCell>
                          <TableCell scope="col" align="right">گل</TableCell>
                          <TableCell scope="col" align="right">تفاضل</TableCell>
                          <TableCell scope="col" align="right">امتیاز</TableCell>
                        </>
                      ) : (
                        <TableCell scope="col">مرحله</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leagueRows.map((row) => (
                      <TableRow key={`${row.rank}-${row.team_id}`} data-testid={`league-row-${row.team_id}`}>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {toPersianDigits(row.rank)}{row.tied ? ' *' : ''}
                        </TableCell>
                        <TableCell sx={{ fontWeight: row.rank === 1 ? 800 : 600 }}>
                          {row.rank === 1 && !row.tied && (
                            <Icon icon="mdi:trophy" style={{ verticalAlign: 'middle', marginLeft: 4, color: '#d97706' }} />
                          )}
                          {row.team_name ?? `تیم #${row.team_id}`}
                        </TableCell>
                        <TableCell align="right">{toPersianDigits(row.played)}</TableCell>
                        <TableCell align="right">{toPersianDigits(row.won)}</TableCell>
                        <TableCell align="right">{toPersianDigits(row.drawn)}</TableCell>
                        <TableCell align="right">{toPersianDigits(row.lost)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {toPersianDigits(row.goals_for)}−{toPersianDigits(row.goals_against)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {row.goal_difference > 0 ? '+' : ''}{toPersianDigits(row.goal_difference)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {toPersianDigits(row.points)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {elimRows.map((row) => (
                      <TableRow key={`${row.rank}-${row.team_id}`}>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>{toPersianDigits(row.rank)}</TableCell>
                        <TableCell sx={{ fontWeight: row.rank === 1 ? 800 : 600 }}>
                          {row.rank === 1 && <Icon icon="mdi:trophy" style={{ verticalAlign: 'middle', marginLeft: 4, color: '#d97706' }} />}
                          {row.team_name ?? `تیم #${row.team_id}`}
                        </TableCell>
                        <TableCell>{row.label}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {standingsQ.isPending ? (
                  <Box sx={{ p: 2 }}><Shimmer variant="rounded" sx={{ height: 48, borderRadius: '12px' }} /></Box>
                ) : standingsRows.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">رتبه‌ای ثبت نشده است.</Typography>
                  </Box>
                ) : null}
                {isLeague && leagueRows.some((row) => row.tied && row.rank === 1) && (
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="warning.dark" data-testid="league-tie-note">
                      <Icon icon="mdi:information-outline" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      رتبهٔ ۱ مشترک است؛ با امتیاز، تفاضل گل و گل زده جدا نشد. برای تعیین قهرمان به پلی‌آف نیاز است.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {drawn && totalMatches > 0 && tournament.status !== 'completed' && (
            <Typography variant="body2" color="text.secondary">
              <Icon icon="mdi:information-outline" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
              {isLeague
                ? 'فقط برگزارکننده نتیجه ثبت می‌کند؛ تساوی مجاز است و جدول امتیازها خودکار به‌روز می‌شود.'
                : isDouble
                  ? 'فقط برگزارکننده نتیجه ثبت می‌کند؛ برنده در براکت برندگان می‌ماند و بازنده به براکت بازندگان می‌افتد (با دومین باخت حذف می‌شود).'
                  : 'فقط برگزارکننده نتیجه ثبت می‌کند؛ برنده خودش به دیدار بعد می‌رود.'}
            </Typography>
          )}
        </Stack>
      )}

      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} fullWidth maxWidth="xs"
              data-testid="tournament-register-dialog">
        <DialogTitle sx={{ fontWeight: 800 }}>ثبت تیم در تورنمنت</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {eligibleTeams.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                تیمی که کاپیتان آن باشی و هنوز در این تورنمنت ثبت نشده باشد پیدا نشد.
              </Typography>
            ) : (
              <>
                <TextField label="تیم" select value={teamId}
                           onChange={(e) => setTeamId(Number(e.target.value))} fullWidth
                           slotProps={{ inputLabel: { shrink: true } }}>
                  {eligibleTeams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="سید (اختیاری)" value={seed}
                           onChange={(e) => setSeed(e.target.value.replace(/[^\d]/g, ''))}
                           inputMode="numeric" fullWidth
                           helperText="۱ = بهترین. خالی بگذار تا ترتیب ورود ملاک باشد." />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegisterOpen(false)} sx={{ minHeight: 44 }}>انصراف</Button>
          <Button variant="contained" onClick={submitRegister} disabled={registerMut.isPending || eligibleTeams.length === 0}
                  sx={{ borderRadius: '12px', minHeight: 44 }}>
            {registerMut.isPending ? 'در حال ثبت…' : 'ثبت تیم'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resultMatch} onClose={() => setResultMatch(null)} fullWidth maxWidth="xs"
              data-testid="tournament-result-dialog">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {resultMatch ? `${resultMatch.team_a_name ?? '—'} مقابل ${resultMatch.team_b_name ?? '—'}` : 'ثبت نتیجه'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resultMatch?.team_a_name ?? '—'}
              </Typography>
              <TextField label="گل" value={scoreA} onChange={(e) => setScoreA(e.target.value.replace(/[^\d]/g, ''))}
                         inputMode="numeric" sx={{ width: 96 }} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resultMatch?.team_b_name ?? '—'}
              </Typography>
              <TextField label="گل" value={scoreB} onChange={(e) => setScoreB(e.target.value.replace(/[^\d]/g, ''))}
                         inputMode="numeric" sx={{ width: 96 }} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {isLeague
                ? 'تساوی مجاز است؛ هر تیم یک امتیاز می‌گیرد.'
                : isDouble && dialogHalf === 'grand_final'
                  ? 'تساوی مجاز نیست؛ برنده قهرمان می‌شود و بازنده نایب‌قهرمان.'
                  : isDouble && dialogHalf === 'losers'
                    ? 'تساوی مجاز نیست؛ بازندهٔ این دیدار دومین باختش را می‌گیرد و حذف می‌شود.'
                    : isDouble
                      ? 'تساوی مجاز نیست؛ برنده جلو می‌رود و بازنده فقط یک باخت دارد، پس حذف نمی‌شود.'
                      : 'تساوی مجاز نیست؛ برنده به مرحلهٔ بعد می‌رود.'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResultMatch(null)} sx={{ minHeight: 44 }}>انصراف</Button>
          <Button variant="contained" onClick={submitResult} disabled={resultMut.isPending}
                  data-testid="tournament-result-submit" sx={{ borderRadius: '12px', minHeight: 44 }}>
            {resultMut.isPending ? 'در حال ثبت…' : 'ثبت نتیجه'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default TournamentDetailPage
