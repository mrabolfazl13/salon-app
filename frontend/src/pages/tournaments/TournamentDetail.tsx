// frontend/src/pages/tournaments/TournamentDetail.tsx
// صفحهٔ تورنمنت (P005) — ثبت‌نام تیم، قرعه‌کشی، براکت/برنامهٔ هفته‌ها و رده‌بندی.
// براکت با CSS grid و `grid-flow-col` رندر می‌شود: در RTL ستون اول سمت راست
// می‌نشیند (همان مسیر زمان)، بدون transform یا ترتیب معکوسِ دست‌سازی.
// هر دو فرمت (تک‌حذفی و لیگ) از همین grid استفاده می‌کنند: لیگ هم «مراحل» مرتب دارد
// (هفته‌ها)، فقط معنای مرحله عوض شده؛ پس دو مسیر رندر برای هم‌ترازیِ ظاهر لازم نیست.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
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
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
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
import { cn } from '@/lib/utils'

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
  <div className={cn('flex items-center justify-between gap-2', muted && 'opacity-50')}>
    <p className={cn(
      'min-w-0 truncate text-[0.68rem]',
      isWinner ? 'font-extrabold text-foreground' : 'font-semibold text-muted-foreground',
    )}>
      {name ?? '—'}
    </p>
    <div className="flex items-center gap-1">
      {isWinner && <Icon icon="mdi:chevron-right" className="h-4 w-4" style={{ color: '#16a34a' }} aria-hidden="true" />}
      <span className="min-w-[14px] text-center text-[0.68rem] font-extrabold tabular-nums">
        {score === null || score === undefined ? '' : toPersianDigits(score)}
      </span>
    </div>
  </div>
)

const MatchCard: React.FC<{
  match: TournamentMatch
  canManage: boolean
  busy: boolean
  onResult: () => void
}> = ({ match, canManage, busy, onResult }) => {
  const isBye = match.status === 'bye'
  return (
    <div
      data-testid={`bracket-match-${match.id}`}
      className={cn(
        'rounded-lg border bg-card/95 p-2.5 shadow-sm',
        match.status === 'ready' ? 'border-blue-600/35' : 'border-border',
      )}
    >
      <div className="flex flex-col gap-1.5">
        <TeamLine name={match.team_a_name} score={match.score_a}
                  isWinner={!!match.winner_team_id && match.winner_team_id === match.team_a_id} />
        <Separator />
        <TeamLine name={match.team_b_name} score={match.score_b}
                  isWinner={!!match.winner_team_id && match.winner_team_id === match.team_b_id}
                  muted={isBye && !match.team_b_id} />
        <div className="flex items-center justify-between gap-2">
          <StatusChip label={MATCH_STATUS_LABELS[match.status]} color={MATCH_STATUS_COLORS[match.status]} />
          {canManage && (match.status === 'ready' || match.status === 'live') && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onResult}>
              ثبت نتیجه
            </Button>
          )}
        </div>
      </div>
    </div>
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
  <div>
    <div className="mb-1 flex items-center gap-1 text-muted-foreground md:hidden">
      <Icon icon="mdi:gesture-swipe-horizontal" className="h-[18px] w-[18px]" aria-hidden="true" />
      <p className="text-[0.68rem]">برای دیدن دورهای بعد، براکت را افقی بکشید.</p>
    </div>
    <div className="overflow-x-auto pb-2 [scrollbar-width:thin]" role="region" aria-label="براکت مسابقات، قابل پیمایش با کیبورد" tabIndex={0}>
      <div data-testid={testId}
           className="grid snap-x snap-proximity grid-flow-col auto-cols-[minmax(232px,max-content)] items-stretch gap-4">
        {rounds.map((round) => (
          <div key={round.id} className="flex snap-start flex-col gap-3">
            <p className="rounded-[10px] bg-muted py-1 text-center text-[0.68rem] font-extrabold uppercase tracking-[0.4px] text-muted-foreground">
              {round.name}
            </p>
            {round.bye_team_name && (
              <p className="text-center text-[0.68rem] text-muted-foreground" data-testid={`tournament-bye-${round.id}`}>
                <Icon icon="mdi:sofa-single" className="me-1 inline-block h-4 w-4 align-middle" aria-hidden="true" />
                {round.bye_team_name} استراحت می‌کند
              </p>
            )}
            <div className="flex grow flex-col justify-around gap-4">
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} canManage={canManage}
                           busy={busy} onResult={() => onResult(match)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
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
  // پس پیش‌فرض «winners» است و فیلتر برای تک‌حذفی همان آرایهٔ قبلی را برمی‌گرداند.
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
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="px-0" onClick={() => navigate('/tournaments')}>
          <Icon icon="mdi:arrow-right" className="h-5 w-5" aria-hidden="true" />
          بازگشت به تورنمنت‌ها
        </Button>
      </div>

      {bracketQ.isPending ? (
        <div className="flex flex-col gap-3">
          <Shimmer height={96} className="rounded-lg" />
          {[1, 2, 3].map((i) => <Shimmer key={i} height={120} className="rounded-lg" />)}
        </div>
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
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold text-foreground md:text-3xl">
              <Icon icon="mdi:trophy" className="h-7 w-7" style={{ color: '#d97706' }} aria-hidden="true" />
              {tournament.name}
              <StatusChip label={TOURNAMENT_STATUS_LABELS[tournament.status]}
                          color={TOURNAMENT_STATUS_COLORS[tournament.status]} />
              <StatusChip label={TOURNAMENT_FORMAT_LABELS[tournament.format]} color="#7c3aed" />
            </h1>
            {tournament.description && (
              <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                {tournament.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="tournament-kpis">
            <KpiCard label="تیم‌ها" value={toPersianDigits(tournament.team_count)} icon="mdi:account-group" color="#2563eb" />
            <KpiCard label="ورودی هر تیم" value={formatRial(tournament.entry_fee)} icon="mdi:ticket-percent-outline" color="#0ea5e9" />
            <KpiCard label="شروع" value={tournament.starts_at ? formatJalaliDateTime(tournament.starts_at) : '—'}
                     icon="mdi:calendar-outline" color="#7c3aed" />
            <KpiCard label={isLeague ? 'صدر جدول' : 'قهرمان'}
                     value={tournament.winner_team_name ?? (isLeague ? leagueLeader ?? '—' : '—')}
                     icon={isLeague ? 'mdi:table-check' : 'mdi:trophy-outline'} color="#16a34a" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && tournament.status === 'draft' && (
              <Button disabled={mutating} data-testid="tournament-open"
                      onClick={() => openMut.mutate(tournament.id, {
                        onSuccess: () => toast.success('ثبت‌نام باز شد'),
                        onError: (err) => toast.error(extractError(err, 'بازکردن ثبت‌نام ممکن نشد.')),
                      })}>
                بازکردن ثبت‌نام
              </Button>
            )}
            {canManage && tournament.status === 'registration' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button disabled={mutating || tournament.team_count < 2}
                            data-testid="tournament-draw"
                            onClick={() => drawMut.mutate(tournament.id, {
                              onSuccess: () => toast.success(isLeague
                                ? 'برنامهٔ هفته‌ها ساخته شد'
                                : isDouble
                                  ? 'براکتِ دو-حذفی ساخته شد'
                                  : 'براکت ساخته شد'),
                              onError: (err) => toast.error(extractError(err, 'قرعه‌کشی ممکن نشد.')),
                            })}>
                      <Icon icon="mdi:shuffle-variant" className="h-5 w-5" aria-hidden="true" />
                      {isLeague ? 'قرعه‌کشی و ساخت برنامهٔ هفته‌ها' : 'قرعه‌کشی و ساخت براکت'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {isLeague
                    ? 'برنامهٔ هفته‌ها ساخته می‌شود؛ پس از آن قابل تغییر نیست'
                    : isDouble
                      ? 'هر دو براکت (برندگان و بازندگان) ساخته می‌شود؛ پس از آن قابل تغییر نیست'
                      : 'براکت ساخته می‌شود؛ پس از آن قابل تغییر نیست'}
                </TooltipContent>
              </Tooltip>
            )}
            {user && (tournament.status === 'draft' || tournament.status === 'registration') && (
              <Button variant="outline" data-testid="tournament-register"
                      onClick={() => setRegisterOpen(true)}>
                <Icon icon="mdi:plus-circle-outline" className="h-5 w-5" aria-hidden="true" />
                ثبت تیم من
              </Button>
            )}
            {canManage && !['completed', 'cancelled'].includes(tournament.status) && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={mutating}
                      data-testid="tournament-cancel"
                      onClick={() => cancelMut.mutate(tournament.id, {
                        onSuccess: () => toast.success('تورنمنت لغو شد'),
                        onError: (err) => toast.error(extractError(err, 'لغو تورنمنت ممکن نشد.')),
                      })}>
                لغو تورنمنت
              </Button>
            )}
          </div>

          {!drawn && (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">تیم‌های ثبت‌نام‌شده</h2>
              {participants.length === 0 ? (
                <p className="text-[0.68rem] text-muted-foreground">
                  هنوز تیمی ثبت‌نام نکرده است؛ کاپیتان‌ها با «ثبت تیم من» وارد می‌شوند.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <Table aria-label="تیم‌های ثبت‌نام‌شده در تورنمنت" data-testid="tournament-participants">
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">تیم</TableHead>
                        <TableHead scope="col">سید</TableHead>
                        <TableHead scope="col">وضعیت</TableHead>
                        {canManage && <TableHead scope="col">عمل</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((p) => (
                        <TableRow key={p.team_id}>
                          <TableCell className="font-semibold">{p.team_name ?? `تیم #${p.team_id}`}</TableCell>
                          <TableCell>{p.seed ? toPersianDigits(p.seed) : '—'}</TableCell>
                          <TableCell>{p.status === 'registered' ? 'ثبت‌نام‌شده' : 'کناره‌گرفته'}</TableCell>
                          {canManage && (
                            <TableCell>
                              {p.status === 'registered' && (
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={mutating}
                                        aria-label={`حذف ${p.team_name ?? ''}`}
                                        onClick={() => withdrawMut.mutate(
                                          { id: tournament.id, teamId: p.team_id },
                                          {
                                            onSuccess: () => toast.success('تیم از تورنمنت حذف شد'),
                                            onError: (err) => toast.error(extractError(err, 'حذف تیم ممکن نشد.')),
                                          })}>
                                  حذف
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {tournament.status === 'registration' && (
                <div className="mt-2">
                  <p className="block text-[0.68rem] text-muted-foreground">
                    برای قرعه‌کشی حداقل {toPersianDigits(2)} تیم لازم است.{' '}
                    {isLeague
                      ? `در لیگ هر تیم با همه بازی می‌کند ⇒ ${toPersianDigits(totalMatches || 0)} دیدار.`
                      : `تعداد دیدارهای براکت: ${toPersianDigits(totalMatches || 0)}`}
                  </p>
                  {isDouble && (
                    <p className="block text-[0.68rem] text-muted-foreground"
                       data-testid="double-elim-plan-hint">
                      <Icon icon="mdi:information-outline" className="me-1 inline-block h-4 w-4 align-middle" aria-hidden="true" />
                      با {toPersianDigits(tournament.team_count)} تیم و حذفِ دوباختی، {toPersianDigits(Math.max(0, (tournament.team_count - 1) * 2))} دیدار
                      بازی می‌شود؛ دیدارهای بدون حریفِ مرحلهٔ اول «بدون بازی» رد می‌شوند.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {drawn && (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">
                {isLeague ? 'برنامهٔ هفته‌ها' : isDouble ? 'براکت برندگان و فینالِ بزرگ' : 'براکت'}
              </h2>
              <BracketGrid rounds={mainRounds} testId="tournament-bracket"
                           canManage={canManage} busy={mutating} onResult={openResult} />

              {isDouble && losersRounds.length > 0 && (
                <div className="mt-4">
                  <h2 className="mb-1 text-lg font-bold text-foreground">
                    <Icon icon="mdi:arrow-down-bold-circle-outline" className="me-1.5 inline-block h-5 w-5 align-middle" aria-hidden="true" />
                    براکت بازندگان
                  </h2>
                  <p className="mb-3 block text-[0.68rem] text-muted-foreground"
                     data-testid="double-elim-note">
                    تیمی که اینجا می‌بازد دومین باختش را داشته و حذف شده است. برندهٔ آخرین
                    دیدارِ این براکت به فینالِ بزرگ می‌رود؛ فینالِ بزرگ یک دیدار است و
                    بازیِ دوباره (bracket reset) ندارد.
                  </p>
                  <BracketGrid rounds={losersRounds} testId="tournament-losers-bracket"
                               canManage={canManage} busy={mutating} onResult={openResult} />
                </div>
              )}
            </div>
          )}

          {standingsEnabled && (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">
                {isLeague ? (tournament.status === 'completed' ? 'جدول نهایی' : 'جدول امتیازها') : 'رده‌بندی نهایی'}
              </h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <Table aria-label={isLeague ? 'جدول امتیازهای تورنمنت' : 'رده‌بندی نهایی تورنمنت'}
                       data-testid="tournament-standings">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">رتبه</TableHead>
                      <TableHead scope="col">تیم</TableHead>
                      {isLeague ? (
                        <>
                          <TableHead scope="col">بازی</TableHead>
                          <TableHead scope="col">برد</TableHead>
                          <TableHead scope="col">تساوی</TableHead>
                          <TableHead scope="col">باخت</TableHead>
                          <TableHead scope="col">گل</TableHead>
                          <TableHead scope="col">تفاضل</TableHead>
                          <TableHead scope="col">امتیاز</TableHead>
                        </>
                      ) : (
                        <TableHead scope="col">مرحله</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leagueRows.map((row) => (
                      <TableRow key={`${row.rank}-${row.team_id}`} data-testid={`league-row-${row.team_id}`}>
                        <TableCell className="font-extrabold">
                          {toPersianDigits(row.rank)}{row.tied ? ' *' : ''}
                        </TableCell>
                        <TableCell className={row.rank === 1 ? 'font-extrabold' : 'font-semibold'}>
                          {row.rank === 1 && !row.tied && (
                            <Icon icon="mdi:trophy" className="me-1 inline-block h-4 w-4 align-middle" style={{ color: '#d97706' }} aria-hidden="true" />
                          )}
                          {row.team_name ?? `تیم #${row.team_id}`}
                        </TableCell>
                        <TableCell>{toPersianDigits(row.played)}</TableCell>
                        <TableCell>{toPersianDigits(row.won)}</TableCell>
                        <TableCell>{toPersianDigits(row.drawn)}</TableCell>
                        <TableCell>{toPersianDigits(row.lost)}</TableCell>
                        <TableCell className="tabular-nums">
                          {toPersianDigits(row.goals_for)}−{toPersianDigits(row.goals_against)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.goal_difference > 0 ? '+' : ''}{toPersianDigits(row.goal_difference)}
                        </TableCell>
                        <TableCell className="font-extrabold tabular-nums">
                          {toPersianDigits(row.points)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {elimRows.map((row) => (
                      <TableRow key={`${row.rank}-${row.team_id}`}>
                        <TableCell className="font-extrabold">{toPersianDigits(row.rank)}</TableCell>
                        <TableCell className={row.rank === 1 ? 'font-extrabold' : 'font-semibold'}>
                          {row.rank === 1 && <Icon icon="mdi:trophy" className="me-1 inline-block h-4 w-4 align-middle" style={{ color: '#d97706' }} aria-hidden="true" />}
                          {row.team_name ?? `تیم #${row.team_id}`}
                        </TableCell>
                        <TableCell>{row.label}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {standingsQ.isPending ? (
                  <div className="p-4"><Shimmer height={48} className="rounded-xl" /></div>
                ) : standingsRows.length === 0 ? (
                  <div className="p-4">
                    <p className="text-[0.68rem] text-muted-foreground">رتبه‌ای ثبت نشده است.</p>
                  </div>
                ) : null}
                {isLeague && leagueRows.some((row) => row.tied && row.rank === 1) && (
                  <div className="p-3">
                    <p className="text-[0.68rem] text-amber-700 dark:text-amber-400" data-testid="league-tie-note">
                      <Icon icon="mdi:information-outline" className="me-1 inline-block h-4 w-4 align-middle" aria-hidden="true" />
                      رتبهٔ ۱ مشترک است؛ با امتیاز، تفاضل گل و گل زده جدا نشد. برای تعیین قهرمان به پلی‌آف نیاز است.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {drawn && totalMatches > 0 && tournament.status !== 'completed' && (
            <p className="text-[0.68rem] text-muted-foreground">
              <Icon icon="mdi:information-outline" className="me-1 inline-block h-4 w-4 align-middle" aria-hidden="true" />
              {isLeague
                ? 'فقط برگزارکننده نتیجه ثبت می‌کند؛ تساوی مجاز است و جدول امتیازها خودکار به‌روز می‌شود.'
                : isDouble
                  ? 'فقط برگزارکننده نتیجه ثبت می‌کند؛ برنده در براکت برندگان می‌ماند و بازنده به براکت بازندگان می‌افتد (با دومین باخت حذف می‌شود).'
                  : 'فقط برگزارکننده نتیجه ثبت می‌کند؛ برنده خودش به دیدار بعد می‌رود.'}
            </p>
          )}
        </div>
      )}

      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="xs" fullWidth
              data-testid="tournament-register-dialog"
              title="ثبت تیم در تورنمنت"
              actions={
                <>
                  <Button variant="ghost" onClick={() => setRegisterOpen(false)}>انصراف</Button>
                  <Button onClick={submitRegister} disabled={registerMut.isPending || eligibleTeams.length === 0}>
                    {registerMut.isPending ? 'در حال ثبت…' : 'ثبت تیم'}
                  </Button>
                </>
              }>
        <div className="flex flex-col gap-4 pt-1">
          {eligibleTeams.length === 0 ? (
            <p className="text-[0.68rem] text-muted-foreground">
              تیمی که کاپیتان آن باشی و هنوز در این تورنمنت ثبت نشده باشد پیدا نشد.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tournament-team">تیم</Label>
                <select
                  id="tournament-team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')}
                  className="h-12 w-full rounded-xl border border-input bg-card px-4 text-[0.68rem] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {eligibleTeams.map((t) => (
                    // کلیک روی گزینه هم انتخاب را ثبت می‌کند (هم‌رفتار با انتخاب بومی)
                    <option key={t.id} value={t.id} onClick={() => setTeamId(t.id)}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tournament-seed">سید (اختیاری)</Label>
                <Input
                  id="tournament-seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                />
                <p className="text-[0.68rem] text-muted-foreground">۱ = بهترین. خالی بگذار تا ترتیب ورود ملاک باشد.</p>
              </div>
            </>
          )}
        </div>
      </Dialog>

      <Dialog open={!!resultMatch} onClose={() => setResultMatch(null)} maxWidth="xs" fullWidth
              data-testid="tournament-result-dialog"
              title={resultMatch ? `${resultMatch.team_a_name ?? '—'} مقابل ${resultMatch.team_b_name ?? '—'}` : 'ثبت نتیجه'}
              actions={
                <>
                  <Button variant="ghost" onClick={() => setResultMatch(null)}>انصراف</Button>
                  <Button onClick={submitResult} disabled={resultMut.isPending}
                          data-testid="tournament-result-submit">
                    {resultMut.isPending ? 'در حال ثبت…' : 'ثبت نتیجه'}
                  </Button>
                </>
              }>
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-[0.68rem] text-foreground">
              {resultMatch?.team_a_name ?? '—'}
            </p>
            <div className="flex w-24 flex-col gap-1">
              <Label htmlFor="tournament-score-a" className="text-[0.68rem]">گل</Label>
              <Input id="tournament-score-a" value={scoreA} onChange={(e) => setScoreA(e.target.value.replace(/[^\d]/g, ''))}
                     inputMode="numeric" className="text-center" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-[0.68rem] text-foreground">
              {resultMatch?.team_b_name ?? '—'}
            </p>
            <div className="flex w-24 flex-col gap-1">
              <Label htmlFor="tournament-score-b" className="text-[0.68rem]">گل</Label>
              <Input id="tournament-score-b" value={scoreB} onChange={(e) => setScoreB(e.target.value.replace(/[^\d]/g, ''))}
                     inputMode="numeric" className="text-center" />
            </div>
          </div>
          <p className="text-[0.68rem] text-muted-foreground">
            {isLeague
              ? 'تساوی مجاز است؛ هر تیم یک امتیاز می‌گیرد.'
              : isDouble && dialogHalf === 'grand_final'
                ? 'تساوی مجاز نیست؛ برنده قهرمان می‌شود و بازنده نایب‌قهرمان.'
                : isDouble && dialogHalf === 'losers'
                  ? 'تساوی مجاز نیست؛ بازندهٔ این دیدار دومین باختش را می‌گیرد و حذف می‌شود.'
                  : isDouble
                    ? 'تساوی مجاز نیست؛ برنده جلو می‌رود و بازنده فقط یک باخت دارد، پس حذف نمی‌شود.'
                    : 'تساوی مجاز نیست؛ برنده به مرحلهٔ بعد می‌رود.'}
          </p>
        </div>
      </Dialog>
    </Layout>
  )
}

export default TournamentDetailPage
