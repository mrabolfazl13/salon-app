// frontend/src/pages/teams/Teams.tsx
// «تیم‌های من» — گرید تیم‌ها + دعوت‌نامه‌های باز (badge/list) + ساخت تیم + میان‌بر کاوش.
// درخواست‌های پیوستن بازِ تیم‌های مدیریتی به‌صورت بج روی کارت هر تیم نمایش داده می‌شود.

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { Box, Card, Chip, Grid, Typography } from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useAcceptTeamInvitation, useDeclineTeamInvitation, useMyTeamInvitations, useMyTeams, useTeamJoinRequests } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { TeamFormDialog } from '@/components/team'
import { SPORT_EMOJI, SPORT_NAME_FA, TeamQuotaProgress, TeamVisibilityChip, getTeamError } from '@/components/team/shared'
import { teamService } from '@/services/team'
import type { StandingsItem } from '@/services/team'
import type { Team, TeamInvitation } from '@/types/team'
import { TEAM_MEMBER_STATUS_LABELS, TEAM_ROLE_LABELS } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'
import { radii, shadows } from '@/theme'

const PendingInvitationRow: React.FC<{ inv: TeamInvitation }> = ({ inv }) => {
  const toast = useToast()
  const accept = useAcceptTeamInvitation()
  const decline = useDeclineTeamInvitation()
  const busy = accept.isPending || decline.isPending

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        flexWrap: 'wrap',
        px: 2,
        py: 1.5,
        borderRadius: '16px',
        border: '1px solid rgba(124,58,237,0.25)',
        bgcolor: 'rgba(124,58,237,0.05)',
      }}
    >
      <Icon icon="mdi:email-open-outline" style={{ width: 20, height: 20, color: '#7c3aed', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
          دعوت به تیم «{inv.team_name ?? `#${inv.team_id}`}»
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }} noWrap>
          {inv.team_name ? 'پس از پذیرش، عضو فعال تیم می‌شوید.' : ''}
        </Typography>
      </Box>
      {inv.member_id ? (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="sm"
            variant="gradient"
            loading={accept.isPending}
            onClick={() =>
              accept.mutate(
                { teamId: inv.team_id, memberId: inv.member_id as number },
                { onSuccess: () => toast.success('به تیم پیوستید.'), onError: (err) => toast.error(getTeamError(err)) },
              )
            }
          >
            پذیرش
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={decline.isPending}
            onClick={() =>
              decline.mutate(
                { teamId: inv.team_id, memberId: inv.member_id as number },
                { onSuccess: () => toast.success('دعوت رد شد.'), onError: (err) => toast.error(getTeamError(err)) },
              )
            }
          >
            رد
          </Button>
        </Box>
      ) : (
        <Chip label="بدون شناسه عضویت" size="small" sx={{ height: 22, fontSize: '0.75rem' }} />
      )}
      {!busy && inv.member_id && (
        <Link to={`/teams/${inv.team_id}`} style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>مشاهده تیم</Typography>
        </Link>
      )}
    </Box>
  )
}

const JoinRequestsBadge: React.FC<{ team: Team }> = ({ team }) => {
  const isManager = team.my_role === 'captain' || team.my_role === 'admin'
  const q = useTeamJoinRequests(team.id, isManager && team.is_active)
  const n = q.data?.length ?? 0
  if (!isManager || n === 0) return null
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.4,
        px: 0.9,
        py: 0.25,
        borderRadius: '999px',
        bgcolor: 'rgba(245,158,11,0.14)',
        color: '#b45309',
        fontSize: '0.75rem',
        fontWeight: 800,
      }}
    >
      <Icon icon="mdi:hand-back-right" style={{ width: 13, height: 13 }} />
      {`${toPersianDigits(n)} درخواست`}
    </Box>
  )
}

const TeamCard: React.FC<{ team: Team }> = ({ team }) => {
  const statusLabel =
    team.my_status === 'pending'
      ? 'دعوت: در انتظار پاسخ'
      : team.my_role
        ? TEAM_ROLE_LABELS[team.my_role]
        : 'بدون عضویت'
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link to={`/teams/${team.id}`} style={{ textDecoration: 'none' }}>
        <Card
          sx={{
            borderRadius: `${radii.card}px`,
            boxShadow: shadows.card,
            border: team.is_active ? '1px solid rgba(15,23,42,0.06)' : '1px dashed rgba(100,116,139,0.4)',
            opacity: team.is_active ? 1 : 0.75,
            height: '100%',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box role="img" aria-label={SPORT_NAME_FA[team.sport] ?? team.sport} sx={{ fontSize: '1.7rem', lineHeight: 1 }}>{SPORT_EMOJI[team.sport] ?? '🏅'}</Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', color: '#0f172a' }} noWrap>
                  {team.name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }} noWrap>
                  {`کاپیتان: ${team.captain_name ?? '—'}`}
                </Typography>
              </Box>
              {!team.is_active && (
                <Chip label="غیرفعال" size="small" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(100,116,139,0.10)', color: '#64748b' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <TeamVisibilityChip visibility={team.visibility} />
              <Chip
                label={statusLabel}
                size="small"
                sx={{
                  height: 24,
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  bgcolor: 'rgba(37,99,235,0.08)',
                  color: '#2563eb',
                }}
              />
              {team.my_status === 'pending' && (
                <Typography sx={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>
                  {TEAM_MEMBER_STATUS_LABELS.pending}
                </Typography>
              )}
            </Box>
            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <TeamQuotaProgress
                memberCount={team.member_count}
                quota={team.quota}
                isOfficial={team.is_official}
                showHint
                compact
              />
              <JoinRequestsBadge team={team} />
            </Box>
          </Box>
        </Card>
      </Link>
    </motion.div>
  )
}

const RANK_MEDAL: Record<number, string> = { 1: '#f59e0b', 2: '#64748b', 3: '#b45309' }

const LeagueStandingsPanel: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const q = useQuery({
    queryKey: ['teams', 'standings'],
    queryFn: () => teamService.getStandings(20),
    enabled,
    staleTime: 60_000,
    retry: 0,
  })
  const items = q.data?.items ?? []
  if (!q.isSuccess || items.length === 0) return null

  return (
    <Card sx={{ borderRadius: `${radii.card}px`, boxShadow: shadows.card, border: '1px solid rgba(15,23,42,0.06)', mb: 3 }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Icon icon="mdi:trophy-outline" style={{ width: 18, height: 18, color: '#f59e0b' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>جدول لیگ</Typography>
          {q.data?.my_rank && (
            <Chip
              label={`رتبه شما: ${toPersianDigits(q.data.my_rank)}`}
              size="small"
              sx={{ height: 22, fontSize: '0.75rem', fontWeight: 800, bgcolor: 'rgba(245,158,11,0.14)', color: '#b45309', mr: 'auto' }}
            />
          )}
        </Box>
        {/* هدر ستون‌ها */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '34px 1fr 46px 46px 46px 52px', gap: 0.5, px: 0.5, fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
          <Box>#</Box><Box>تیم</Box><Box sx={{ textAlign: 'center' }}>بازی</Box>
          <Box sx={{ textAlign: 'center' }}>برد</Box><Box sx={{ textAlign: 'center' }}>باخت</Box>
          <Box sx={{ textAlign: 'center' }}>امتیاز</Box>
        </Box>
        {items.map((row: StandingsItem, i: number) => (
          <motion.div key={row.team_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: i * 0.03 }}>
            <Box
              component={Link}
              to={`/teams/${row.team_id}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '34px 1fr 46px 46px 46px 52px',
                gap: 0.5,
                alignItems: 'center',
                px: 0.5,
                py: 0.75,
                borderRadius: '10px',
                textDecoration: 'none',
                bgcolor: q.data?.my_rank === row.rank ? 'rgba(245,158,11,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(15,23,42,0.04)' },
              }}
            >
              <Box sx={{ fontWeight: 900, fontSize: '0.8rem', color: RANK_MEDAL[row.rank] ?? '#64748b', textAlign: 'center' }}>
                {toPersianDigits(row.rank)}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }} noWrap>
                  {row.team_name}
                  {row.is_official && (
                    <Icon icon="mdi:shield-check" style={{ width: 12, height: 12, color: '#059669', marginInlineStart: 4, verticalAlign: -2 }} />
                  )}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {`${toPersianDigits(row.win_rate)}٪ برد · ${toPersianDigits(row.member_count)} عضو`}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#334155', fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(row.played)}</Box>
              <Box sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(row.won)}</Box>
              <Box sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(row.lost)}</Box>
              <Box sx={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(row.points)}</Box>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Card>
  )
}

const Teams: React.FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const teamsQ = useMyTeams(isAuthenticated)
  const invitationsQ = useMyTeamInvitations(isAuthenticated)
  const [createOpen, setCreateOpen] = useState(false)

  const invites = invitationsQ.data ?? []
  const teams = teamsQ.data ?? []

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>تیم‌ها</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            تیم‌های ماندگار شما — اعضا، حصه‌ها، تاریخچه رزروها و تراز مالی تیم.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
          <Button variant="default" icon="mdi:magnify" onClick={() => navigate('/teams/discover')}>
            کاوش تیم‌ها
          </Button>
          <Button variant="gradient" icon="mdi:shield-plus-outline" onClick={() => setCreateOpen(true)}>
            تیم جدید
          </Button>
        </Box>
      </Box>

      <LeagueStandingsPanel enabled={isAuthenticated} />

      {invites.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Icon icon="mdi:email-fast-outline" style={{ width: 16, height: 16 }} />
            {`دعوت‌نامه‌های شما (${toPersianDigits(invites.length)})`}
          </Typography>
          {invites.map((inv) => <PendingInvitationRow key={inv.id} inv={inv} />)}
        </Box>
      )}

      {teamsQ.isPending ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Shimmer variant="rounded" sx={{ height: 150, borderRadius: `${radii.card}px` }} />
            </Grid>
          ))}
        </Grid>
      ) : teamsQ.isError ? (
        <ErrorState description="بارگذاری تیم‌ها ممکن نشد." onRetry={() => teamsQ.refetch()} />
      ) : teams.length === 0 ? (
        <EmptyState
          emoji="🛡️"
          title="هنوز تیمی ندارید"
          description="اولین تیم خود را بسازید یا در «کاوش تیم‌ها» به تیم‌های عمومی بپیوندید."
          actionLabel="ساخت تیم"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {teams.map((t) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
              <TeamCard team={t} />
            </Grid>
          ))}
        </Grid>
      )}

      <TeamFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Layout>
  )
}

export default Teams
