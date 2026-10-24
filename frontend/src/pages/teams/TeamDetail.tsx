// frontend/src/pages/teams/TeamDetail.tsx
// جزئیات تیم — سربرگ اطلاعات + Tabهای «اعضا» / «درخواست‌ها» (مدیر) / «بازی‌ها و رزروها»
// / «حریف‌یابی» / «چالش‌ها» / «حصه‌ها» / «تراز»؛ اقدامات: ویرایش (مدیر)، غیرفعال‌سازی (کاپیتان)، خروج، درخواست عضویت،
// پذیرش/رد دعوت بازِ خودِ کاربر (از /teams/invitations/me)

import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { ErrorBox, extractError } from '@/components/finance/shared'
import { isForbidden } from '@/components/crm/shared'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { Textarea } from '@/components/ui/shadcn/textarea'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Dialog from '@/components/ui/Dialog'
import {
  SPORT_EMOJI,
  SPORT_NAME_FA,
  TeamBalancePanel,
  TeamBookingsPanel,
  TeamChallengePanel,
  TeamChatPanel,
  TeamDuesPanel,
  TeamFormDialog,
  TeamInviteDialog,
  TeamJoinRequestList,
  TeamMatchmakingPanel,
  TeamMemberList,
  TeamQuotaProgress,
  TeamVisibilityChip,
  TeamRoleBadge,
  getTeamError,
} from '@/components/team'
import SplitPaymentsPanel from '@/components/split-payment/SplitPaymentsPanel'
import { useChallenges } from '@/hooks/useMatching'
import {
  useAcceptTeamInvitation,
  useDeclineTeamInvitation,
  useDeactivateTeam,
  useLeaveTeam,
  useMyTeamInvitations,
  useRequestJoinTeam,
  useTeam,
  useTeamJoinRequests,
  useTeamMembers,
  useTeamUnreadCount,
} from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { formatPersianDate } from '@/utils/helpers'
import { toPersianDigits } from '@/lib/jalali'

const InfoRow: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 py-1">
    <Icon icon={icon} className="h-[17px] w-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />
    <span className="min-w-[70px] text-[0.8rem] text-muted-foreground">{label}</span>
    <span className="text-[0.82rem] font-semibold text-foreground">{value}</span>
  </div>
)

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const teamQ = useTeam(teamId)
  const team = teamQ.data

  const isCaptain = !!team && !!me && team.my_role === 'captain'
  const isManager = !!team && (team.my_role === 'captain' || team.my_role === 'admin')
  const isMember = !!team && team.my_status === 'active'
  const isViewer = !!team && (isMember || team.my_status === 'pending')
  const showPendingInvitation = !!team && !isMember && team.has_pending_invitation

  const membersQ = useTeamMembers(teamId, !!team && (isViewer || team.visibility !== 'private'))
  const joinRequestsQ = useTeamJoinRequests(teamId, isManager && team?.is_active === true)
  const unreadQ = useTeamUnreadCount(teamId, isMember, 15000)
  const pendingChallengesQ = useChallenges(
    { team_id: teamId, direction: 'inbox', status: 'pending' },
    isMember,
  )
  const myInvitesQ = useMyTeamInvitations(isAuthenticated)
  const myInvitation = useMemo(
    () => (myInvitesQ.data ?? []).find((i) => i.team_id === teamId && i.status === 'pending' && i.member_id),
    [myInvitesQ.data, teamId],
  )

  const leaveTeam = useLeaveTeam(teamId)
  const deactivate = useDeactivateTeam(teamId)
  const acceptInv = useAcceptTeamInvitation()
  const declineInv = useDeclineTeamInvitation()
  const requestJoin = useRequestJoinTeam(teamId)

  const [tab, setTab] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  // رد دعوت بازگشت‌ناپذیر است: دعوت مصرف می‌شود و فقط مدیر تیم می‌تواند دوباره دعوت کند
  const [confirmDeclineInvite, setConfirmDeclineInvite] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')

  if (teamQ.isPending || (!team && !teamQ.isError)) {
    return (
      <Layout>
        <div className="flex flex-col gap-4">
          <Shimmer height={190} />
          <Shimmer height={60} />
          <Shimmer height={260} />
        </div>
      </Layout>
    )
  }

  if (teamQ.isError || !team) {
    const status = (teamQ.error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      return (
        <Layout>
          <EmptyState
            icon="mdi:lock-outline"
            title={isAuthenticated ? 'این تیم خصوصی است' : 'مشاهده این تیم نیازمند ورود است'}
            description={isAuthenticated ? 'فقط اعضا و دعوت‌شده‌ها می‌توانند این تیم را ببینند.' : 'برای مشاهده و پیوستن وارد شوید.'}
            actionLabel={isAuthenticated ? 'تیم‌های من' : 'ورود'}
            onAction={() => navigate(isAuthenticated ? '/teams' : '/login')}
          />
        </Layout>
      )
    }
    if (status === 404) {
      return <Layout><EmptyState icon="mdi:shield-off-outline" title="تیم یافت نشد" description="ممکن است حذف شده یا نشانی نادرست باشد." actionLabel="تیم‌های من" onAction={() => navigate('/teams')} /></Layout>
    }
    return <Layout><ErrorState description="بارگذاری تیم ممکن نشد." onRetry={() => teamQ.refetch()} /></Layout>
  }

  const openRequests = joinRequestsQ.data?.length ?? 0

  const handleLeave = () => {
    leaveTeam.mutate(undefined, {
      onSuccess: ({ message }) => {
        toast.success(message)
        setConfirmLeave(false)
        navigate('/teams')
      },
      onError: (err) => {
        toast.error(getTeamError(err))
        setConfirmLeave(false)
      },
    })
  }

  const handleDeactivate = () => {
    deactivate.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.open_dues ? `تیم غیرفعال شد — ${toPersianDigits(res.open_dues)} حصه تسویه‌نشده باقی است.` : 'تیم غیرفعال شد.')
        setConfirmDeactivate(false)
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  const handleDeclineInvite = () => {
    if (!myInvitation?.member_id) return
    declineInv.mutate(
      { teamId, memberId: myInvitation.member_id as number },
      {
        onSuccess: () => {
          setConfirmDeclineInvite(false)
          toast.success('دعوت رد شد.')
        },
        onError: (err) => {
          setConfirmDeclineInvite(false)
          toast.error(getTeamError(err))
        },
      },
    )
  }

  const handleJoinRequest = () => {
    requestJoin.mutate(joinMessage.trim() || undefined, {
      onSuccess: (res) => {
        toast.success(res.message)
        setJoinDialogOpen(false)
        setJoinMessage('')
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  const canRequestJoin = team.is_active && team.visibility === 'public' && !isViewer && !team.has_open_join_request && !showPendingInvitation

  const tabs: { label: string; show: boolean; badge?: number }[] = [
    { label: 'اعضا', show: true },
    { label: 'گفتگو', show: isMember, badge: unreadQ.data?.unread },
    { label: 'درخواست‌ها', show: isManager && team.is_active, badge: openRequests },
    { label: 'بازی‌ها و رزروها', show: isMember },
    { label: 'حریف‌یابی', show: isMember },
    { label: 'چالش‌ها', show: isMember, badge: pendingChallengesQ.data?.total },
    { label: 'حصه‌ها', show: isMember },
    { label: 'تراز', show: isMember },
    { label: 'پرداخت اشتراکی', show: isMember },
  ]
  const visibleTabs = tabs.filter((t) => t.show)
  const tabIndex = Math.min(tab, Math.max(0, visibleTabs.length - 1))
  const currentTab = visibleTabs[tabIndex]?.label ?? 'اعضا'

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/teams" className="inline-flex min-h-11 items-center no-underline">
          <span className="inline-flex items-center gap-2 text-[0.8rem] font-bold text-blue-600 dark:text-blue-400">
            <Icon icon="mdi:arrow-right" className="h-4 w-4" aria-hidden="true" />
            بازگشت به تیم‌ها
          </span>
        </Link>
      </div>

      {!team.is_active && (
        <Alert variant="warning" className="mb-4 rounded-[14px]">
          <Icon icon="mdi:cancel" aria-hidden="true" />
          <AlertDescription>
            این تیم غیرفعال شده است؛ عملیات عضویت، حصه و اتصال رزرو روی آن مجاز نیست.
          </AlertDescription>
        </Alert>
      )}

      {showPendingInvitation && myInvitation && (
        <Alert variant="info" className="mb-4 rounded-[14px]">
          <Icon icon="mdi:email-fast-outline" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <AlertDescription>
              شما به این تیم دعوت شده‌اید و هنوز پاسخ نداده‌اید.
            </AlertDescription>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="gradient"
                loading={acceptInv.isPending}
                onClick={() =>
                  acceptInv.mutate(
                    { teamId, memberId: myInvitation.member_id as number },
                    { onSuccess: () => toast.success('به تیم پیوستید.'), onError: (err) => toast.error(getTeamError(err)) },
                  )
                }
              >
                پذیرش
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={declineInv.isPending}
                onClick={() => setConfirmDeclineInvite(true)}
              >
                رد
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <div className="mb-5 rounded-lg border border-border bg-card p-3 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div role="img" aria-label={SPORT_NAME_FA[team.sport] ?? team.sport} className="text-[2rem] leading-none md:text-[2.4rem]">{SPORT_EMOJI[team.sport] ?? '🏅'}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-foreground md:text-xl">
              {team.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <TeamVisibilityChip visibility={team.visibility} />
              {team.my_role && <TeamRoleBadge role={team.my_role} />}
            </div>
          </div>
          <TeamQuotaProgress
            memberCount={team.member_count}
            quota={team.quota}
            isOfficial={team.is_official}
            showHint={isMember || isManager}
          />
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <InfoRow icon="mdi:crown-outline" label="کاپیتان" value={team.captain_name ?? '—'} />
          <InfoRow icon="mdi:view-day-outline" label="تاریخ ساخت" value={formatPersianDate(team.created_at)} />
        </div>

        {team.description && (
          <p className="mt-3 whitespace-pre-wrap text-[0.85rem] leading-[1.9] text-slate-600 dark:text-slate-300">
            {team.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canRequestJoin && (
            <Button variant="gradient" icon="mdi:hand-back-right" onClick={() => setJoinDialogOpen(true)}>
              درخواست عضویت
            </Button>
          )}
          {team.has_open_join_request && !isMember && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Icon icon="mdi:clock-outline" className="h-5 w-5" aria-hidden="true" />
              <span className="text-[0.88rem] font-bold">درخواست شما در انتظار بررسی مدیران است</span>
            </div>
          )}
          {isViewer && team.my_role !== 'captain' && (
            <Button variant="outline" icon="mdi:exit-run" loading={leaveTeam.isPending} onClick={() => setConfirmLeave(true)}>
              خروج از تیم
            </Button>
          )}
          {isManager && team.is_active && (
            <Button variant="default" icon="mdi:email-fast-outline" onClick={() => setInviteOpen(true)}>
              دعوت عضو
            </Button>
          )}
          {isManager && (
            <Button variant="default" icon="mdi:pencil-outline" onClick={() => setEditOpen(true)}>
              ویرایش تیم
            </Button>
          )}
          {isCaptain && team.is_active && (
            <Button variant="destructive" icon="mdi:close-octagon-outline" onClick={() => setConfirmDeactivate(true)}>
              غیرفعال‌سازی تیم
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(label) => {
          const next = visibleTabs.findIndex((t) => t.label === label)
          if (next >= 0) setTab(next)
        }}
        className="mb-5"
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          {visibleTabs.map((t) => (
            <TabsTrigger
              key={t.label}
              value={t.label}
              className="h-9 shrink-0 gap-1.5 px-3 text-[0.85rem] font-bold data-[state=active]:bg-blue-600/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
            >
              {t.label}
              {!!t.badge && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-extrabold text-amber-700 dark:text-amber-400">
                  {toPersianDigits(t.badge)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={currentTab}>
          {currentTab === 'اعضا' && (
            <div>
              {membersQ.isPending ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => <Shimmer key={i} height={56} />)}
                </div>
              ) : membersQ.isError ? (
                <ErrorBox
                  message={
                    isForbidden(membersQ.error)
                      ? 'شما اجازه مشاهده اعضای این تیم را ندارید (۴۰۳).'
                      : extractError(membersQ.error, 'بارگذاری اعضا ممکن نشد.')
                  }
                  onRetry={() => membersQ.refetch()}
                />
              ) : (
                <TeamMemberList team={team} members={membersQ.data ?? []} isCaptain={isCaptain} canManage={isManager} />
              )}
            </div>
          )}

          {currentTab === 'درخواست‌ها' && (
            joinRequestsQ.isPending ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => <Shimmer key={i} height={52} />)}
              </div>
            ) : joinRequestsQ.isError ? (
              <ErrorBox
                message={
                  isForbidden(joinRequestsQ.error)
                    ? 'شما اجازه مشاهده درخواست‌های عضویت را ندارید (۴۰۳).'
                    : extractError(joinRequestsQ.error, 'بارگذاری درخواست‌ها ممکن نشد.')
                }
                onRetry={() => joinRequestsQ.refetch()}
              />
            ) : (
              <TeamJoinRequestList teamId={teamId} requests={joinRequestsQ.data ?? []} />
            )
          )}

          {currentTab === 'گفتگو' && <TeamChatPanel teamId={teamId} />}

          {currentTab === 'بازی‌ها و رزروها' && <TeamBookingsPanel team={team} />}
          {currentTab === 'حریف‌یابی' && <TeamMatchmakingPanel team={team} canChallenge={isManager} />}
          {currentTab === 'چالش‌ها' && <TeamChallengePanel teamId={teamId} canRespond={isManager} />}
          {currentTab === 'حصه‌ها' && <TeamDuesPanel team={team} members={membersQ.data ?? []} isManager={isManager} />}
          {currentTab === 'تراز' && <TeamBalancePanel team={team} isManager={isManager} />}
          {currentTab === 'پرداخت اشتراکی' && (
            <SplitPaymentsPanel team={team} members={membersQ.data ?? []} isManager={isManager} />
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-[0.68rem] text-muted-foreground">
        {`شناسه تیم ${toPersianDigits(team.id)} — ساخته‌شده در ${formatPersianDate(team.created_at)}`}
      </p>

      <TeamFormDialog open={editOpen} onClose={() => setEditOpen(false)} team={team} />
      <TeamInviteDialog teamId={teamId} open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <ConfirmModal
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="خروج از تیم"
        description="با خروج از تیم، حصه‌های پرداخت‌نشده شما باقی می‌ماند و برای بازگشت به دعوت یا درخواست مجدد نیاز دارید. (کاپیتان ابتدا باید کاپیتانی را منتقل کند.)"
        confirmText="خروج"
        variant="destructive"
        loading={leaveTeam.isPending}
        onConfirm={handleLeave}
      />

      <ConfirmModal
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="غیرفعال‌سازی تیم"
        description="با غیرفعال‌سازی، همه دعوت‌ها و درخواست‌های باز باطل می‌شود و اعضا اعلان دریافت می‌کنند؛ حصه‌های باز حذف نمی‌شوند و در لیست مالی باقی می‌مانند. این اقدام قابل بازگشت نیست."
        confirmText="غیرفعال‌سازی"
        variant="destructive"
        loading={deactivate.isPending}
        onConfirm={handleDeactivate}
      />

      <ConfirmModal
        open={confirmDeclineInvite && !!myInvitation}
        onOpenChange={(open) => { if (!open) setConfirmDeclineInvite(false) }}
        title="رد دعوت این تیم"
        description="با رد دعوت، درخواست شما در همین تیم بسته می‌شود و خودتان نمی‌توانید دوباره بپیوندید؛ برای عضویت باید کاپیتان یا مدیر تیم بار دیگر شما را دعوت کند."
        confirmText="رد دعوت"
        cancelText="انصراف"
        variant="destructive"
        loading={declineInv.isPending}
        onConfirm={handleDeclineInvite}
      />

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} title={`درخواست پیوستن به «${team.name}»`} maxWidth="xs">
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-join-message">پیام همراه درخواست (اختیاری)</Label>
            <Textarea
              id="team-join-message"
              maxLength={300}
              rows={2}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)} disabled={requestJoin.isPending}>انصراف</Button>
            <Button variant="gradient" loading={requestJoin.isPending} onClick={handleJoinRequest} icon="mdi:hand-back-right">
              ثبت درخواست
            </Button>
          </div>
        </div>
      </Dialog>
    </Layout>
  )
}

export default TeamDetail
