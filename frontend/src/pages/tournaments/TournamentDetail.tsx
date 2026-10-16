// frontend/src/pages/tournaments/TournamentDetail.tsx
// صفحهٔ تورنمنت (P005) — ثبت‌نام تیم، قرعه‌کشی، براکت و رده‌بندی.
// براکت با CSS grid و `gridAutoFlow: column` رندر می‌شود: در RTL ستون اول سمت راست
// می‌نشیند (همان مسیر زمان)، بدون transform یا ترتیب معکوسِ دست‌سازی.

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
import type { MatchStatus, TournamentMatch } from '@/types/tournament'
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
                    sx={{ borderRadius: '10px', minHeight: 40 }}>
              ثبت نتیجه
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const bracketQ = useTournamentBracket(tournamentId || null)
  const standingsQ = useTournamentStandings(tournamentId || null,
    bracketQ.data?.tournament.status === 'completed')
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
    if (a === b) {
      toast.error('در تورنمنت حذفی نتیجهٔ مساوی ثبت نمی‌شود.')
      return
    }
    resultMut.mutate(
      { matchId: resultMatch.id, scoreA: a, scoreB: b },
      {
        onSuccess: () => {
          toast.success('نتیجه ثبت و برنده به مرحلهٔ بعد رفت.')
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

  return (
    <Layout>
      <Box sx={{ mb: 2 }}>
        <Button size="small" onClick={() => navigate('/tournaments')} startIcon={<Icon icon="mdi:arrow-right" />}
                sx={{ minHeight: 40, px: 0 }}>
          بازگشت به تورنمنت‌ها
        </Button>
      </Box>

      {bracketQ.isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Shimmer variant="rounded" sx={{ height: 96, borderRadius: '16px' }} />
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 120, borderRadius: '16px' }} />)}
        </Box>
      ) : bracketQ.isError ? (
        <ErrorBox message="دریافت تورنمنت ممکن نشد." onRetry={() => bracketQ.refetch()} />
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
              <KpiCard label="قهرمان" value={tournament.winner_team_name ?? '—'}
                       icon="mdi:trophy-outline" color="#16a34a" />
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
              <Tooltip title="براکت ساخته می‌شود؛ پس از آن قابل تغییر نیست">
                <span>
                  <Button variant="contained" disabled={mutating || tournament.team_count < 2}
                          data-testid="tournament-draw"
                          startIcon={<Icon icon="mdi:shuffle-variant" />}
                          onClick={() => drawMut.mutate(tournament.id, {
                            onSuccess: () => toast.success('براکت ساخته شد'),
                            onError: (err) => toast.error(extractError(err, 'قرعه‌کشی ممکن نشد.')),
                          })} sx={{ borderRadius: '12px', minHeight: 44 }}>
                    قرعه‌کشی و ساخت براکت
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
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>تیم‌های ثبت‌نام‌شده</Typography>
              {participants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  هنوز تیمی ثبت‌نام نکرده است؛ کاپیتان‌ها با «ثبت تیم من» وارد می‌شوند.
                </Typography>
              ) : (
                <Box sx={{
                  borderRadius: `${radii.card}px`, boxShadow: shadows.card,
                  border: '1px solid rgba(15,23,42,0.05)', bgcolor: 'rgba(255,255,255,0.92)', overflowX: 'auto',
                }}>
                  <Table size="small" data-testid="tournament-participants">
                    <TableHead>
                      <TableRow>
                        <TableCell>تیم</TableCell>
                        <TableCell align="right">سید</TableCell>
                        <TableCell>وضعیت</TableCell>
                        {canManage && <TableCell align="right">عمل</TableCell>}
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
                                          })} sx={{ minHeight: 40 }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  برای قرعه‌کشی حداقل {toPersianDigits(2)} تیم لازم است. تعداد دیدارهای براکت:{' '}
                  {toPersianDigits(totalMatches || 0)}
                </Typography>
              )}
            </Box>
          )}

          {drawn && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>براکت</Typography>
              <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <Box data-testid="tournament-bracket"
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 2, flexGrow: 1 }}>
                        {round.matches.map((match) => (
                          <MatchCard key={match.id} match={match} canManage={canManage}
                                     busy={mutating} onResult={() => openResult(match)} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {tournament.status === 'completed' && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>رده‌بندی نهایی</Typography>
              <Box sx={{
                borderRadius: `${radii.card}px`, boxShadow: shadows.card,
                border: '1px solid rgba(15,23,42,0.05)', bgcolor: 'rgba(255,255,255,0.92)', overflowX: 'auto',
              }}>
                <Table size="small" data-testid="tournament-standings">
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">رتبه</TableCell>
                      <TableCell>تیم</TableCell>
                      <TableCell>مرحله</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(standingsQ.data?.items ?? []).map((row) => (
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
                ) : (standingsQ.data?.items.length ?? 0) === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">رتبه‌ای ثبت نشده است.</Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>
          )}

          {drawn && totalMatches > 0 && tournament.status !== 'completed' && (
            <Typography variant="body2" color="text.secondary">
              <Icon icon="mdi:information-outline" style={{ verticalAlign: 'middle', marginLeft: 4 }} />
              فقط برگزارکننده نتیجه ثبت می‌کند؛ برنده خودش به دیدار بعد می‌رود.
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
              تساوی مجاز نیست؛ برنده به مرحلهٔ بعد می‌رود.
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
