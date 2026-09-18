// frontend/src/pages/teams/TeamDetail.tsx
// جزئیات تیم — سربرگ اطلاعات + Tabهای «اعضا» / «درخواست‌ها» (مدیر) / «بازی‌ها و رزروها»
// / «حصه‌ها» / «تراز»؛ اقدامات: ویرایش (مدیر)، غیرفعال‌سازی (کاپیتان)، خروج، درخواست عضویت،
// پذیرش/رد دعوت بازِ خودِ کاربر (از /teams/invitations/me)

import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Alert, Box, Divider, Paper, Tab, Tabs, Typography } from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Dialog from '@/components/ui/Dialog'
import { TextField } from '@mui/material'
import {
  SPORT_EMOJI,
  TeamBalancePanel,
  TeamBookingsPanel,
  TeamChatPanel,
  TeamDuesPanel,
  TeamFormDialog,
  TeamInviteDialog,
  TeamJoinRequestList,
  TeamMemberList,
  TeamQuotaProgress,
  TeamVisibilityChip,
  TeamRoleBadge,
  getTeamError,
} from '@/components/team'
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
import { radii, shadows } from '@/theme'

const InfoRow: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
    <Icon icon={icon} style={{ width: 17, height: 17, color: '#64748b', flexShrink: 0 }} />
    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', minWidth: 70 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{value}</Typography>
  </Box>
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
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')

  if (teamQ.isPending || (!team && !teamQ.isError)) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Shimmer variant="rounded" sx={{ height: 190 }} />
          <Shimmer variant="rounded" sx={{ height: 60 }} />
          <Shimmer variant="rounded" sx={{ height: 260 }} />
        </Box>
      </Layout>
    )
  }

  if (teamQ.isError || !team) {
    const status = (teamQ.error as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      return (
        <Layout>
          <EmptyState
            emoji="🔒"
            title={isAuthenticated ? 'این تیم خصوصی است' : 'مشاهده این تیم نیازمند ورود است'}
            description={isAuthenticated ? 'فقط اعضا و دعوت‌شده‌ها می‌توانند این تیم را ببینند.' : 'برای مشاهده و پیوستن وارد شوید.'}
            actionLabel={isAuthenticated ? 'تیم‌های من' : 'ورود'}
            onAction={() => navigate(isAuthenticated ? '/teams' : '/login')}
          />
        </Layout>
      )
    }
    if (status === 404) {
      return <Layout><EmptyState emoji="🛡️" title="تیم یافت نشد" description="ممکن است حذف شده یا نشانی نادرست باشد." actionLabel="تیم‌های من" onAction={() => navigate('/teams')} /></Layout>
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
    { label: 'حصه‌ها', show: isMember },
    { label: 'تراز', show: isMember },
  ]
  const visibleTabs = tabs.filter((t) => t.show)
  const tabIndex = Math.min(tab, Math.max(0, visibleTabs.length - 1))
  const currentTab = visibleTabs[tabIndex]?.label ?? 'اعضا'

  return (
    <Layout>
      <Box sx={{ mb: 2 }}>
        <Link to="/teams" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Icon icon="mdi:arrow-right" style={{ width: 16, height: 16 }} />
            بازگشت به تیم‌ها
          </Typography>
        </Link>
      </Box>

      {!team.is_active && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }} icon={<Icon icon="mdi:cancel" style={{ width: 20, height: 20 }} />}>
          این تیم غیرفعال شده است؛ عملیات عضویت، حصه و اتصال رزرو روی آن مجاز نیست.
        </Alert>
      )}

      {showPendingInvitation && myInvitation && (
        <Alert
          severity="info"
          icon={<Icon icon="mdi:email-fast-outline" style={{ width: 20, height: 20 }} />}
          sx={{ mb: 2, borderRadius: '14px' }}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                onClick={() =>
                  declineInv.mutate(
                    { teamId, memberId: myInvitation.member_id as number },
                    { onSuccess: () => toast.success('دعوت رد شد.'), onError: (err) => toast.error(getTeamError(err)) },
                  )
                }
              >
                رد
              </Button>
            </Box>
          }
        >
          شما به این تیم دعوت شده‌اید و هنوز پاسخ نداده‌اید.
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: `${radii.card}px`, boxShadow: shadows.card, border: '1px solid rgba(15,23,42,0.05)', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1 }}>{SPORT_EMOJI[team.sport] ?? '🏅'}</Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', md: '1.4rem' }, color: '#0f172a' }}>
              {team.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <TeamVisibilityChip visibility={team.visibility} />
              {team.my_role && <TeamRoleBadge role={team.my_role} />}
            </Box>
          </Box>
          <TeamQuotaProgress
            memberCount={team.member_count}
            quota={team.quota}
            isOfficial={team.is_official}
            showHint={isMember || isManager}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
          <InfoRow icon="mdi:crown-outline" label="کاپیتان" value={team.captain_name ?? '—'} />
          <InfoRow icon="mdi:view-day-outline" label="تاریخ ساخت" value={formatPersianDate(team.created_at)} />
        </Box>

        {team.description && (
          <Typography sx={{ mt: 1.5, fontSize: '0.85rem', color: '#475569', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
            {team.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {canRequestJoin && (
            <Button variant="gradient" icon="mdi:hand-back-right" onClick={() => setJoinDialogOpen(true)}>
              درخواست عضویت
            </Button>
          )}
          {team.has_open_join_request && !isMember && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#b45309' }}>
              <Icon icon="mdi:clock-outline" style={{ width: 20, height: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>درخواست شما در انتظار بررسی مدیران است</Typography>
            </Box>
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
        </Box>
      </Paper>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2.5,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px', minHeight: 44 },
          '& .Mui-selected': { bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb !important' },
        }}
      >
        {visibleTabs.map((t) => (
          <Tab
            key={t.label}
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                {t.label}
                {!!t.badge && (
                  <Box component="span" sx={{ px: 0.8, py: 0.1, borderRadius: '999px', bgcolor: 'rgba(245,158,11,0.14)', color: '#b45309', fontSize: '0.68rem', fontWeight: 800 }}>
                    {toPersianDigits(t.badge)}
                  </Box>
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {currentTab === 'اعضا' && (
        <Box>
          {membersQ.isPending ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 56 }} />)}
            </Box>
          ) : membersQ.isError ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>نمایش اعضا ممکن نیست.</Typography>
          ) : (
            <TeamMemberList team={team} members={membersQ.data ?? []} isCaptain={isCaptain} canManage={isManager} />
          )}
        </Box>
      )}

      {currentTab === 'درخواست‌ها' && (
        <TeamJoinRequestList teamId={teamId} requests={joinRequestsQ.data ?? []} />
      )}

      {currentTab === 'گفتگو' && <TeamChatPanel teamId={teamId} />}

      {currentTab === 'بازی‌ها و رزروها' && <TeamBookingsPanel team={team} />}
      {currentTab === 'حصه‌ها' && <TeamDuesPanel team={team} members={membersQ.data ?? []} isManager={isManager} />}
      {currentTab === 'تراز' && <TeamBalancePanel team={team} isManager={isManager} />}

      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 3 }}>
        {`شناسه تیم ${toPersianDigits(team.id)} — ساخته‌شده در ${formatPersianDate(team.created_at)}`}
      </Typography>

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

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} title={`درخواست پیوستن به «${team.name}»`} maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          <TextField
            label="پیام همراه درخواست (اختیاری)"
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)} disabled={requestJoin.isPending}>انصراف</Button>
            <Button variant="gradient" loading={requestJoin.isPending} onClick={handleJoinRequest} icon="mdi:hand-back-right">
              ثبت درخواست
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Layout>
  )
}

export default TeamDetail
