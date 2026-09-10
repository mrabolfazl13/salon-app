// frontend/src/pages/games/GameDetail.tsx
// صفحه جزئیات بازی — اطلاعات، ظرفیت، بازیکنان، درخواست‌ها، لیست انتظار و اقدامات join/leave/مدیریت

import React, { useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Box, Typography, Paper, Divider, Alert } from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import ConfirmModal from '@/components/modals/ConfirmModal'
import {
  CapacityBar,
  GameStatusChip,
  InviteLinkDialog,
  InviteUserDialog,
  JoinRequestList,
  ParticipantList,
  PaymentSection,
  RoleBadge,
  SkillChip,
  VisibilityChip,
  WaitlistList,
  formatGameDateTime,
  getGameError,
} from '@/components/game'
import GameFormDialog from '@/components/game/GameFormDialog'
import {
  useAcceptInvitation,
  useCancelGame,
  useCompleteGame,
  useGame,
  useGameParticipants,
  useJoinGame,
  useJoinWaitlist,
  useLeaveGame,
  useLeaveWaitlist,
  useJoinRequests,
  useMyInvitations,
  useRejectInvitation,
  useStartGame,
  useWaitlist,
} from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { PAYMENT_MODE_LABELS } from '@/types/game'
import { formatPersianDate, formatPrice } from '@/utils/helpers'
import { radii, shadows } from '@/theme'

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', futsal: '⚽', basketball: '🏀', volleyball: '🏐',
  tennis: '🎾', badminton: '🏸', gym: '🏋️', pool: '🎱',
}

const InfoRow: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
    <Icon icon={icon} style={{ width: 17, height: 17, color: '#64748b', flexShrink: 0 }} />
    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', minWidth: 70 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{value}</Typography>
  </Box>
)

const SectionCard: React.FC<{ title: string; icon: string; badge?: number; children: React.ReactNode }> = ({
  title, icon, badge, children,
}) => (
  <Paper
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: `${radii.card}px`,
      boxShadow: shadows.card,
      border: '1px solid rgba(15,23,42,0.05)',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Icon icon={icon} style={{ width: 19, height: 19, color: '#2563eb' }} />
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{title}</Typography>
      {badge !== undefined && badge > 0 && (
        <Box
          component="span"
          sx={{
            px: 0.9, py: 0.1, borderRadius: '999px', bgcolor: 'rgba(245,158,11,0.14)',
            color: '#b45309', fontSize: '0.7rem', fontWeight: 800,
          }}
        >
          {badge.toLocaleString('fa-IR')}
        </Box>
      )}
    </Box>
    {children}
  </Paper>
)

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const gameId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: game, isLoading, isError, error, refetch } = useGame(gameId)

  const isOrganizer = !!game && !!me && game.organizer_id === me.id
  const canManage = isOrganizer || game?.my_role === 'admin'
  const isParticipant = game?.my_participant_status === 'accepted'

  const participantsQ = useGameParticipants(
    gameId,
    !!game && (game.visibility !== 'private' || isOrganizer || canManage || isParticipant || game.my_participant_status != null),
  )
  const joinRequestsQ = useJoinRequests(gameId, !!game && canManage)
  const waitlistQ = useWaitlist(gameId, !!game && canManage)
  const myInvitationsQ = useMyInvitations(isAuthenticated && !!game?.has_pending_invitation)
  const acceptInv = useAcceptInvitation()
  const rejectInv = useRejectInvitation()
  const myInvitation = myInvitationsQ.data?.find((inv) => inv.game_id === gameId && inv.status === 'pending')

  const joinGame = useJoinGame(gameId)
  const leaveGame = useLeaveGame(gameId)
  const joinWaitlist = useJoinWaitlist(gameId)
  const leaveWaitlist = useLeaveWaitlist(gameId)
  const startGame = useStartGame(gameId)
  const completeGame = useCompleteGame(gameId)
  const cancelGame = useCancelGame(gameId)

  const [inviteLinkOpen, setInviteLinkOpen] = useState(false)
  const [inviteUserOpen, setInviteUserOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  if (isLoading || (!game && !isError)) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Shimmer variant="rounded" sx={{ height: 220 }} />
          <Shimmer variant="rounded" sx={{ height: 140 }} />
          <Shimmer variant="rounded" sx={{ height: 100 }} />
        </Box>
      </Layout>
    )
  }

  if (isError || !game) {
    const forbidden = (error as { response?: { status?: number } })?.response?.status === 403
    return (
      <Layout>
        {forbidden && !isAuthenticated ? (
          <EmptyState
            emoji="🔒"
            title="این بازی خصوصی است"
            description="برای مشاهده و پیوستن، با لینک دعوت وارد شوید."
            actionLabel="ورود"
            onAction={() => navigate('/login')}
          />
        ) : forbidden ? (
          <EmptyState emoji="🔒" title="دسترسی ندارید" description="این بازی خصوصی است و شما عضو آن نیستید." actionLabel="بازی‌ها" onAction={() => navigate('/games')} />
        ) : (
          <ErrorState description="بارگذاری بازی ممکن نشد." onRetry={() => refetch()} />
        )}
      </Layout>
    )
  }

  const remaining = Math.max(game.max_players - game.current_players, 0)
  const joinable = game.status === 'open' || game.status === 'full'
  const myStatus = game.my_participant_status
  const isWaitlisted = game.my_waitlist_position != null && game.my_waitlist_position > 0

  const handleJoin = () => {
    joinGame.mutate(undefined, {
      onSuccess: ({ message }) => toast.success(message),
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  const handleLeave = () => {
    leaveGame.mutate(undefined, {
      onSuccess: ({ message }) => {
        toast.success(message)
        setConfirmLeave(false)
      },
      onError: (err) => {
        toast.error(getGameError(err))
        setConfirmLeave(false)
      },
    })
  }

  const handleCancel = () => {
    cancelGame.mutate(undefined, {
      onSuccess: () => {
        toast.success('بازی لغو شد')
        setConfirmCancel(false)
      },
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  // ─────────── دکمه اصلی پیوستن ───────────
  let primaryAction: React.ReactNode = null
  if (!isAuthenticated) {
    primaryAction = (
      <Button variant="gradient" icon="mdi:login" onClick={() => navigate('/login', { state: { from: location } })}>
        ورود برای پیوستن
      </Button>
    )
  } else if (isOrganizer) {
    primaryAction = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7c3aed' }}>
        <Icon icon="mdi:crown-outline" style={{ width: 20, height: 20 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>شما برگزارکننده هستید</Typography>
      </Box>
    )
  } else if (myStatus === 'invited') {
    primaryAction = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2563eb' }}>
        <Icon icon="mdi:email-open-outline" style={{ width: 20, height: 20 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>شما به این بازی دعوت شده‌اید</Typography>
      </Box>
    )
  } else if (myStatus === 'accepted') {
    primaryAction = (
      <Button variant="outline" icon="mdi:exit-run" onClick={() => setConfirmLeave(true)} disabled={leaveGame.isPending} loading={leaveGame.isPending}>
        خروج از بازی
      </Button>
    )
  } else if (myStatus === 'pending' || game.has_pending_join_request) {
    primaryAction = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#b45309' }}>
        <Icon icon="mdi:clock-outline" style={{ width: 20, height: 20 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>درخواست شما در انتظار تأیید است</Typography>
      </Box>
    )
  } else if (isWaitlisted) {
    primaryAction = (
      <Button
        variant="outline"
        icon="mdi:playlist-remove"
        loading={leaveWaitlist.isPending}
        onClick={() =>
          leaveWaitlist.mutate(undefined, {
            onSuccess: () => toast.success('از لیست انتظار خارج شدید'),
            onError: (err) => toast.error(getGameError(err)),
          })
        }
      >
        {`رتبه ${game.my_waitlist_position?.toLocaleString('fa-IR')} — خروج از لیست انتظار`}
      </Button>
    )
  } else if (game.visibility === 'private') {
    primaryAction = (
      <Typography sx={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Icon icon="mdi:lock-outline" style={{ width: 18, height: 18 }} />
        بازی خصوصی است — برای پیوستن به لینک دعوت نیاز دارید
      </Typography>
    )
  } else if (game.status === 'full') {
    primaryAction = (
      <Button
        variant="gradient"
        icon="mdi:plus-circle-outline"
        loading={joinWaitlist.isPending}
        onClick={() =>
          joinWaitlist.mutate(undefined, {
            onSuccess: () => toast.success('در لیست انتظار ثبت شدید'),
            onError: (err) => toast.error(getGameError(err)),
          })
        }
      >
        ورود به لیست انتظار
      </Button>
    )
  } else if (joinable) {
    primaryAction = (
      <Button variant="gradient" icon={game.join_policy === 'approval' ? 'mdi:hand-back-right' : 'mdi:account-plus-outline'} loading={joinGame.isPending} onClick={handleJoin}>
        {game.join_policy === 'approval' ? 'درخواست پیوستن' : 'پیوستن به بازی'}
      </Button>
    )
  } else {
    primaryAction = (
      <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
        {game.status === 'draft' ? 'این بازی هنوز منتشر نشده است.' : game.status === 'started' ? 'بازی شروع شده است.' : game.status === 'completed' ? 'بازی به پایان رسیده است.' : 'بازی لغو شده است.'}
      </Typography>
    )
  }

  return (
    <Layout>
      <Box sx={{ mb: 2 }}>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Icon icon="mdi:arrow-right" style={{ width: 16, height: 16 }} />
            بازگشت به بازی‌ها
          </Typography>
        </Link>
      </Box>

      {game.status === 'cancelled' && (
        <Alert severity="error" icon={<Icon icon="mdi:close-circle-outline" style={{ width: 20, height: 20 }} />} sx={{ mb: 2, borderRadius: '14px' }}>
          این بازی لغو شده و رزرو آن آزاد شده است.
        </Alert>
      )}

      {/* ─────────── بنر دعوت‌نامه ─────────── */}
      {myInvitation && (
        <Alert
          severity="info"
          icon={<Icon icon="mdi:email-fast-outline" style={{ width: 20, height: 20 }} />}
          sx={{ mb: 2, borderRadius: '14px' }}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="sm"
                variant="default"
                loading={acceptInv.isPending}
                onClick={() =>
                  acceptInv.mutate(myInvitation.id, {
                    onSuccess: ({ message }) => toast.success(message),
                    onError: (err) => toast.error(getGameError(err)),
                  })
                }
              >
                پذیرفتن
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={rejectInv.isPending}
                onClick={() =>
                  rejectInv.mutate(myInvitation.id, {
                    onSuccess: () => {
                      toast.success('دعوت رد شد')
                      refetch()
                    },
                    onError: (err) => toast.error(getGameError(err)),
                  })
                }
              >
                رد کردن
              </Button>
            </Box>
          }
        >
          شما توسط برگزارکننده به این بازی دعوت شده‌اید. با پذیرفتن، در بازی ثبت می‌شوید.
        </Alert>
      )}

      {/* ─────────── کارت اصلی ─────────── */}
      <Paper
        sx={{
          p: { xs: 2.25, md: 3 },
          borderRadius: `${radii.card}px`,
          boxShadow: shadows.card,
          border: '1px solid rgba(15,23,42,0.05)',
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1 }}>{SPORT_EMOJI[game.sport] ?? '🎮'}</Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.15rem', md: '1.4rem' }, color: '#0f172a' }}>
              {game.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
              <GameStatusChip status={game.status} />
              <VisibilityChip visibility={game.visibility} />
              <SkillChip level={game.skill_level} />
            </Box>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
            <CapacityBar current={game.current_players} max={game.max_players} />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
          <InfoRow icon="mdi:store-outline" label="مکان" value={game.venue_name || '—'} />
          <InfoRow icon="mdi:calendar-outline" label="زمان" value={formatGameDateTime(game.slot_date, game.start_time)} />
          <InfoRow icon="mdi:clock-fast" label="مدت" value={game.duration ? `${game.duration.toLocaleString('fa-IR')} دقیقه` : '—'} />
          <InfoRow icon="mdi:crown-outline" label="برگزارکننده" value={game.organizer_name || '—'} />
          <InfoRow icon="mdi:map-marker-outline" label="آدرس" value={game.venue_address || '—'} />
          <InfoRow
            icon="mdi:wallet-outline"
            label="پرداخت"
            value={
              game.payment_mode === 'free'
                ? 'رایگان'
                : game.payment_mode === 'split_payment' && game.price_per_player
                  ? `${PAYMENT_MODE_LABELS.split_payment} — ${formatPrice(game.price_per_player)} تومان/نفر`
                  : PAYMENT_MODE_LABELS[game.payment_mode]
            }
          />
        </Box>

        {game.description && (
          <Typography sx={{ mt: 1.5, fontSize: '0.85rem', color: '#475569', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
            {game.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {primaryAction}
          {remaining > 0 && game.status === 'open' && (
            <Typography sx={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              {`${remaining.toLocaleString('fa-IR')} جای خالی`}
            </Typography>
          )}
        </Box>

        {/* ─────────── اقدامات برگزارکننده/ادمین ─────────── */}
        {canManage && game.status !== 'cancelled' && game.status !== 'completed' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isAuthenticated && (
                <>
                  <Button size="sm" variant="default" icon="mdi:link-variant" onClick={() => setInviteLinkOpen(true)}>
                    لینک دعوت
                  </Button>
                  <Button size="sm" variant="default" icon="mdi:email-fast-outline" onClick={() => setInviteUserOpen(true)}>
                    دعوت بازیکن
                  </Button>
                </>
              )}
              {isOrganizer && (
                <>
                  <Button size="sm" variant="default" icon="mdi:pencil-outline" onClick={() => setEditOpen(true)}>
                    ویرایش
                  </Button>
                  {(game.status === 'open' || game.status === 'full') && (
                    <Button
                      size="sm"
                      variant="default"
                      icon="mdi:play-circle-outline"
                      loading={startGame.isPending}
                      onClick={() =>
                        startGame.mutate(undefined, {
                          onSuccess: () => toast.success('بازی شروع شد'),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                    >
                      شروع بازی
                    </Button>
                  )}
                  {game.status === 'started' && (
                    <Button
                      size="sm"
                      variant="default"
                      icon="mdi:check-decagram"
                      loading={completeGame.isPending}
                      onClick={() =>
                        completeGame.mutate(undefined, {
                          onSuccess: () => toast.success('بازی به پایان رسید'),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                    >
                      پایان بازی
                    </Button>
                  )}
                  {isOrganizer && (
                    <Button size="sm" variant="destructive" icon="mdi:cancel" onClick={() => setConfirmCancel(true)}>
                      لغو بازی
                    </Button>
                  )}
                </>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* ─────────── بخش‌ها ─────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {canManage && (joinRequestsQ.data?.length ?? 0) > 0 && (
          <SectionCard title="درخواست‌های پیوستن" icon="mdi:hand-back-right" badge={joinRequestsQ.data?.length}>
            <JoinRequestList gameId={gameId} requests={joinRequestsQ.data ?? []} />
          </SectionCard>
        )}

        <SectionCard title={`بازیکنان (${game.current_players.toLocaleString('fa-IR')})`} icon="mdi:account-group-outline">
          {participantsQ.isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 52 }} />)}
            </Box>
          ) : participantsQ.isError ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>نمایش بازیکنان ممکن نیست.</Typography>
          ) : (
            <ParticipantList
              gameId={gameId}
              participants={participantsQ.data ?? []}
              isOrganizer={isOrganizer}
              canManage={canManage}
            />
          )}
        </SectionCard>

        <SectionCard title="پرداخت" icon="mdi:credit-card-outline">
          <PaymentSection
            gameId={gameId}
            game={game}
            participants={participantsQ.data ?? []}
            currentUserId={me?.id}
          />
        </SectionCard>

        {canManage && (
          <SectionCard title="لیست انتظار" icon="mdi:sort-clock-ascending-outline" badge={waitlistQ.data?.length}>
            {waitlistQ.isLoading ? (
              <Shimmer variant="rounded" sx={{ height: 52 }} />
            ) : (
              <WaitlistList entries={waitlistQ.data ?? []} />
            )}
          </SectionCard>
        )}

        {game.my_role && game.my_role !== 'member' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>نقش شما در بازی:</Typography>
            <RoleBadge role={game.my_role} />
          </Box>
        )}

        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          {`شناسه بازی ${game.id.toLocaleString('fa-IR')} - ساخته‌شده در ${formatPersianDate(game.created_at)}`}
        </Typography>
      </Box>

      {/* ─────────── دیالوگ‌ها ─────────── */}
      <InviteLinkDialog gameId={gameId} open={inviteLinkOpen} onClose={() => setInviteLinkOpen(false)} />
      <InviteUserDialog gameId={gameId} open={inviteUserOpen} onClose={() => setInviteUserOpen(false)} />
      <GameFormDialog open={editOpen} onClose={() => setEditOpen(false)} game={game} />
      <ConfirmModal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="لغو بازی"
        description="با لغو بازی، همه بازیکنان حذف و رزرو لغو می‌شود. این اقدام قابل بازگشت نیست."
        onConfirm={handleCancel}
        loading={cancelGame.isPending}
        variant="destructive"
      />
      <ConfirmModal
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="خروج از بازی"
        description="با خروج، سهم پرداخت شما (در صورت پرداخت‌نشده) رها و نفر بعدی لیست انتظار جابه‌جا می‌شود."
        onConfirm={handleLeave}
        loading={leaveGame.isPending}
        variant="destructive"
      />
    </Layout>
  )
}

export default GameDetail
