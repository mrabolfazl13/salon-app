// frontend/src/pages/teams/Teams.tsx
// «تیم‌های من» — گرید تیم‌ها + دعوت‌نامه‌های باز (badge/list) + ساخت تیم + میان‌بر کاوش.
// درخواست‌های پیوستن بازِ تیم‌های مدیریتی به‌صورت بج روی کارت هر تیم نمایش داده می‌شود.

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useAcceptTeamInvitation, useDeclineTeamInvitation, useMyTeamInvitations, useMyTeams, useTeamJoinRequests } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { TeamFormDialog } from '@/components/team'
import { SPORT_EMOJI, SPORT_NAME_FA, TeamQuotaProgress, TeamVisibilityChip, getTeamError } from '@/components/team/shared'
import { ErrorBox, extractError } from '@/components/finance/shared'
import { isForbidden } from '@/components/crm/shared'
import { teamService } from '@/services/team'
import type { StandingsItem } from '@/services/team'
import type { Team, TeamInvitation } from '@/types/team'
import { TEAM_MEMBER_STATUS_LABELS, TEAM_ROLE_LABELS } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'

const PendingInvitationRow: React.FC<{ inv: TeamInvitation }> = ({ inv }) => {
  const toast = useToast()
  const accept = useAcceptTeamInvitation()
  const decline = useDeclineTeamInvitation()
  const busy = accept.isPending || decline.isPending
  // رد دعوت، دعوت را برای همیشه می‌بندد (بازگشت فقط با دعوت دوبارهٔ مدیر تیم)
  const [declineOpen, setDeclineOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-violet-600/25 bg-violet-600/5 px-4 py-3">
      <Icon icon="mdi:email-open-outline" className="h-5 w-5 shrink-0 text-violet-700 dark:text-violet-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.85rem] font-extrabold text-foreground">
          دعوت به تیم «{inv.team_name ?? `#${inv.team_id}`}»
        </p>
        <p className="truncate text-[0.68rem] text-muted-foreground">
          {inv.team_name ? 'پس از پذیرش، عضو فعال تیم می‌شوید.' : ''}
        </p>
      </div>
      {inv.member_id ? (
        <div className="flex gap-2">
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
            onClick={() => setDeclineOpen(true)}
          >
            رد
          </Button>
        </div>
      ) : (
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">
          بدون شناسه عضویت
        </span>
      )}
      {!busy && inv.member_id && (
        <Link to={`/teams/${inv.team_id}`} className="no-underline">
          <span className="text-[0.68rem] font-bold text-blue-700 dark:text-blue-400">مشاهده تیم</span>
        </Link>
      )}

      <ConfirmModal
        open={declineOpen}
        onOpenChange={(open) => { if (!open) setDeclineOpen(false) }}
        title="رد دعوت تیم"
        description={`دعوت به تیم «${inv.team_name ?? `#${inv.team_id}`}» رد می‌شود و این دعوت برای همیشه بسته می‌شود؛ برای پیوستن باید مدیر تیم دوباره شما را دعوت کند.`}
        confirmText="رد دعوت"
        cancelText="انصراف"
        variant="destructive"
        loading={decline.isPending}
        onConfirm={() =>
          decline.mutate(
            { teamId: inv.team_id, memberId: inv.member_id as number },
            {
              onSuccess: () => {
                setDeclineOpen(false)
                toast.success('دعوت رد شد.')
              },
              onError: (err) => {
                setDeclineOpen(false)
                toast.error(getTeamError(err))
              },
            },
          )
        }
      />
    </div>
  )
}

const JoinRequestsBadge: React.FC<{ team: Team }> = ({ team }) => {
  const isManager = team.my_role === 'captain' || team.my_role === 'admin'
  const q = useTeamJoinRequests(team.id, isManager && team.is_active)
  const n = q.data?.length ?? 0
  if (!isManager || n === 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[0.68rem] font-extrabold text-amber-800 dark:text-amber-400">
      <Icon icon="mdi:hand-back-right" className="h-[13px] w-[13px]" aria-hidden="true" />
      {`${toPersianDigits(n)} درخواست`}
    </span>
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
      <Link to={`/teams/${team.id}`} className="block h-full no-underline">
        <div
          className={cn(
            'h-full rounded-lg border bg-card shadow-sm transition-opacity',
            team.is_active ? 'border-border' : 'border-dashed border-slate-500/40 opacity-75',
          )}
        >
          <div className="flex h-full flex-col gap-2.5 p-4">
            <div className="flex items-start gap-2.5">
              <div role="img" aria-label={SPORT_NAME_FA[team.sport] ?? team.sport} className="text-[1.7rem] leading-none">{SPORT_EMOJI[team.sport] ?? '🏅'}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.98rem] font-black text-foreground">
                  {team.name}
                </p>
                <p className="mt-1 truncate text-[0.68rem] text-muted-foreground">
                  {`کاپیتان: ${team.captain_name ?? '—'}`}
                </p>
              </div>
              {!team.is_active && (
                <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-muted-foreground">غیرفعال</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <TeamVisibilityChip visibility={team.visibility} />
              <span className="inline-flex h-6 items-center rounded-full bg-blue-600/10 px-2.5 text-[0.68rem] font-bold text-blue-700 dark:text-blue-400">
                {statusLabel}
              </span>
              {team.my_status === 'pending' && (
                <p className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-400">
                  {TEAM_MEMBER_STATUS_LABELS.pending}
                </p>
              )}
            </div>
            <div className="mt-auto flex flex-col gap-1.5">
              <TeamQuotaProgress
                memberCount={team.member_count}
                quota={team.quota}
                isOfficial={team.is_official}
                showHint
                compact
              />
              <JoinRequestsBadge team={team} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

const RANK_MEDAL: Record<number, string> = { 1: '#f59e0b', 2: '#64748b', 3: '#b45309' }

const STANDINGS_GRID = 'grid grid-cols-[34px_1fr_46px_46px_46px_52px] items-center gap-1'

const LeagueStandingsPanel: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const q = useQuery({
    queryKey: ['teams', 'standings'],
    queryFn: () => teamService.getStandings(20),
    enabled,
    staleTime: 60_000,
    retry: 0,
  })
  // خطا نباید پنل را حذف کند؛ جدول لیگ نداشتن با «درخواست ناموفق» فرق دارد
  if (q.isError) {
    return (
      <div className="mb-4 rounded-lg border border-border bg-card shadow-sm">
        <ErrorBox
          message={
            isForbidden(q.error)
              ? 'شما اجازه مشاهده جدول لیگ را ندارید (۴۰۳).'
              : extractError(q.error, 'بارگذاری جدول لیگ ممکن نشد.')
          }
          onRetry={() => q.refetch()}
        />
      </div>
    )
  }
  const items = q.data?.items ?? []
  if (!q.isSuccess || items.length === 0) return null

  return (
    <div className="mb-4 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:trophy-outline" className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
          <h2 className="text-[0.85rem] font-black text-foreground">جدول لیگ</h2>
          {q.data?.my_rank && (
            <span className="ms-auto inline-flex h-[22px] items-center rounded-full bg-amber-500/15 px-2.5 text-[0.68rem] font-extrabold text-amber-800 dark:text-amber-400">
              {`رتبه شما: ${toPersianDigits(q.data.my_rank)}`}
            </span>
          )}
        </div>
        {/* هدر ستون‌ها */}
        <div className={cn(STANDINGS_GRID, 'px-1 text-[0.68rem] font-extrabold text-muted-foreground')}>
          <div>#</div><div>تیم</div><div className="text-center">بازی</div>
          <div className="text-center">برد</div><div className="text-center">باخت</div>
          <div className="text-center">امتیاز</div>
        </div>
        {items.map((row: StandingsItem, i: number) => (
          <motion.div key={row.team_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: i * 0.03 }}>
            <Link
              to={`/teams/${row.team_id}`}
              className={cn(
                STANDINGS_GRID,
                'rounded-[10px] px-1 py-1.5 no-underline transition-colors',
                q.data?.my_rank === row.rank ? 'bg-amber-500/10' : 'hover:bg-muted/60',
              )}
            >
              <div className="text-center text-[0.8rem] font-black" style={{ color: RANK_MEDAL[row.rank] ?? '#64748b' }}>
                {toPersianDigits(row.rank)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.78rem] font-extrabold text-foreground">
                  {row.team_name}
                  {row.is_official && (
                    <Icon icon="mdi:shield-check" className="ms-1 inline-block h-3 w-3 align-[-2px]" style={{ color: '#059669' }} aria-hidden="true" />
                  )}
                </p>
                <p className="text-[0.68rem] text-muted-foreground">
                  {`${toPersianDigits(row.win_rate)}٪ برد · ${toPersianDigits(row.member_count)} عضو`}
                </p>
              </div>
              <div className="text-center text-[0.68rem] text-slate-700 tabular-nums dark:text-slate-300">{toPersianDigits(row.played)}</div>
              <div className="text-center text-[0.68rem] font-extrabold text-emerald-700 tabular-nums dark:text-emerald-400">{toPersianDigits(row.won)}</div>
              <div className="text-center text-[0.68rem] text-red-600 tabular-nums dark:text-red-400">{toPersianDigits(row.lost)}</div>
              <div className="text-center text-[0.8rem] font-black text-foreground tabular-nums">{toPersianDigits(row.points)}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground md:text-3xl">تیم‌ها</h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            تیم‌های ماندگار شما — اعضا، حصه‌ها، تاریخچه رزروها و تراز مالی تیم.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="default" icon="mdi:magnify" onClick={() => navigate('/teams/discover')}>
            کاوش تیم‌ها
          </Button>
          <Button variant="gradient" icon="mdi:shield-plus-outline" onClick={() => setCreateOpen(true)}>
            تیم جدید
          </Button>
        </div>
      </div>

      <LeagueStandingsPanel enabled={isAuthenticated} />

      {invites.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <p className="flex items-center gap-2 text-[0.8rem] font-extrabold text-violet-700 dark:text-violet-400">
            <Icon icon="mdi:email-fast-outline" className="h-4 w-4" aria-hidden="true" />
            {`دعوت‌نامه‌های شما (${toPersianDigits(invites.length)})`}
          </p>
          {invites.map((inv) => <PendingInvitationRow key={inv.id} inv={inv} />)}
        </div>
      )}

      {teamsQ.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} height={150} className="rounded-lg" />
          ))}
        </div>
      ) : teamsQ.isError ? (
        <ErrorState description="بارگذاری تیم‌ها ممکن نشد." onRetry={() => teamsQ.refetch()} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon="mdi:shield-plus-outline"
          title="هنوز تیمی ندارید"
          description="اولین تیم خود را بسازید یا در «کاوش تیم‌ها» به تیم‌های عمومی بپیوندید."
          actionLabel="ساخت تیم"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      )}

      <TeamFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Layout>
  )
}

export default Teams
