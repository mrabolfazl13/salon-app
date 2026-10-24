// frontend/src/pages/games/GameDetail.tsx
// صفحه جزئیات بازی — اطلاعات، ظرفیت، بازیکنان، درخواست‌ها، لیست انتظار و اقدامات join/leave/مدیریت

import React, { useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

import { SPORT_NAME_FA } from '@/components/team/shared'
import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Separator } from '@/components/ui/shadcn/separator'
import ConfirmModal from '@/components/modals/ConfirmModal'
import {
  CapacityBar,
  GameResultDialog,
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
import { formatPersianDate, formatPersianDateTime, formatPrice } from '@/utils/helpers'

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', futsal: '⚽', basketball: '🏀', volleyball: '🏐',
  tennis: '🎾', badminton: '🏸', gym: '🏋️', pool: '🎱',
}

const InfoRow: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 py-1">
    <Icon icon={icon} className="h-[17px] w-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />
    <span className="min-w-[70px] text-[0.8rem] text-muted-foreground">{label}</span>
    <span className="text-[0.82rem] font-semibold text-foreground">{value}</span>
  </div>
)

const SectionCard: React.FC<{ title: string; icon: string; badge?: number; children: React.ReactNode }> = ({
  title, icon, badge, children,
}) => (
  <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-3">
    <div className="mb-3 flex items-center gap-2">
      <Icon icon={icon} className="h-[19px] w-[19px] text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <h2 className="text-[0.95rem] font-extrabold text-foreground">{title}</h2>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-extrabold text-amber-700 dark:text-amber-400">
          {badge.toLocaleString('fa-IR')}
        </span>
      )}
    </div>
    {children}
  </section>
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
  const [resultOpen, setResultOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  if (isLoading || (!game && !isError)) {
    return (
      <Layout>
        <div className="flex flex-col gap-4">
          <Shimmer height={220} />
          <Shimmer height={140} />
          <Shimmer height={100} />
        </div>
      </Layout>
    )
  }

  if (isError || !game) {
    const forbidden = (error as { response?: { status?: number } })?.response?.status === 403
    return (
      <Layout>
        {forbidden && !isAuthenticated ? (
          <EmptyState
            icon="mdi:lock-outline"
            title="این بازی خصوصی است"
            description="برای مشاهده و پیوستن، با لینک دعوت وارد شوید."
            actionLabel="ورود"
            onAction={() => navigate('/login')}
          />
        ) : forbidden ? (
          <EmptyState icon="mdi:lock-outline" title="دسترسی ندارید" description="این بازی خصوصی است و شما عضو آن نیستید." actionLabel="بازی‌ها" onAction={() => navigate('/games')} />
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
  const canSetResult = canManage && !game.result_set && game.status !== 'cancelled' && game.status !== 'draft'
  const winnerList = (game.winner_ids ?? []).map((uid) => ({
    userId: uid,
    name: participantsQ.data?.find((p) => p.user_id === uid)?.full_name ?? `کاربر ${uid}`,
  }))

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
      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
        <Icon icon="mdi:crown-outline" className="h-5 w-5" aria-hidden="true" />
        <span className="text-[0.9rem] font-extrabold">شما برگزارکننده هستید</span>
      </div>
    )
  } else if (myStatus === 'invited') {
    primaryAction = (
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Icon icon="mdi:email-open-outline" className="h-5 w-5" aria-hidden="true" />
        <span className="text-[0.88rem] font-bold">شما به این بازی دعوت شده‌اید</span>
      </div>
    )
  } else if (myStatus === 'accepted') {
    primaryAction = (
      <Button variant="outline" icon="mdi:exit-run" onClick={() => setConfirmLeave(true)} disabled={leaveGame.isPending} loading={leaveGame.isPending}>
        خروج از بازی
      </Button>
    )
  } else if (myStatus === 'pending' || game.has_pending_join_request) {
    primaryAction = (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Icon icon="mdi:clock-outline" className="h-5 w-5" aria-hidden="true" />
        <span className="text-[0.88rem] font-bold">درخواست شما در انتظار تأیید است</span>
      </div>
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
      <p className="flex items-center gap-2 text-[0.82rem] text-muted-foreground">
        <Icon icon="mdi:lock-outline" className="h-[18px] w-[18px]" aria-hidden="true" />
        بازی خصوصی است — برای پیوستن به لینک دعوت نیاز دارید
      </p>
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
      <p className="text-[0.82rem] text-muted-foreground">
        {game.status === 'draft' ? 'این بازی هنوز منتشر نشده است.' : game.status === 'started' ? 'بازی شروع شده است.' : game.status === 'completed' ? 'بازی به پایان رسیده است.' : 'بازی لغو شده است.'}
      </p>
    )
  }

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/games" className="inline-flex min-h-11 items-center no-underline">
          <span className="inline-flex items-center gap-2 text-[0.8rem] font-bold text-blue-600 dark:text-blue-400">
            <Icon icon="mdi:arrow-right" className="h-4 w-4" aria-hidden="true" />
            بازگشت به بازی‌ها
          </span>
        </Link>
      </div>

      {game.status === 'cancelled' && (
        <Alert variant="destructive" className="mb-4 rounded-[14px]">
          <Icon icon="mdi:close-circle-outline" aria-hidden="true" />
          <AlertDescription>این بازی لغو شده و رزرو آن آزاد شده است.</AlertDescription>
        </Alert>
      )}

      {/* ─────────── بنر دعوت‌نامه ─────────── */}
      {myInvitation && (
        <Alert variant="info" className="mb-4 rounded-[14px]">
          <Icon icon="mdi:email-fast-outline" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <AlertDescription>
              شما توسط برگزارکننده به این بازی دعوت شده‌اید. با پذیرفتن، در بازی ثبت می‌شوید.
            </AlertDescription>
            <div className="flex shrink-0 items-center gap-2">
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
            </div>
          </div>
        </Alert>
      )}

      {/* ─────────── کارت اصلی ─────────── */}
      <div className="mb-5 rounded-lg border border-border bg-card p-3 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div role="img" aria-label={SPORT_NAME_FA[game.sport] ?? game.sport} className="text-[2rem] leading-none md:text-[2.4rem]">{SPORT_EMOJI[game.sport] ?? '🎮'}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-foreground md:text-xl">
              {game.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <GameStatusChip status={game.status} />
              <VisibilityChip visibility={game.visibility} />
              <SkillChip level={game.skill_level} />
            </div>
          </div>
          <div className="text-end md:text-center">
            <CapacityBar current={game.current_players} max={game.max_players} />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
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
                  ? `${PAYMENT_MODE_LABELS.split_payment} — ${formatPrice(game.price_per_player)} / نفر`
                  : PAYMENT_MODE_LABELS[game.payment_mode]
            }
          />
        </div>

        {game.description && (
          <p className="mt-3 whitespace-pre-wrap text-[0.85rem] leading-[1.9] text-slate-600 dark:text-slate-300">
            {game.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {primaryAction}
          {remaining > 0 && game.status === 'open' && (
            <p className="text-[0.78rem] font-bold text-emerald-600 dark:text-emerald-400">
              {`${remaining.toLocaleString('fa-IR')} جای خالی`}
            </p>
          )}
        </div>

        {/* ─────────── اقدامات برگزارکننده/ادمین ─────────── */}
        {canManage && game.status !== 'cancelled' && game.status !== 'completed' && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
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
            </div>
          </>
        )}
      </div>

      {/* ─────────── بخش‌ها ─────────── */}
      <div className="flex flex-col gap-3">
        {canManage && (joinRequestsQ.data?.length ?? 0) > 0 && (
          <SectionCard title="درخواست‌های پیوستن" icon="mdi:hand-back-right" badge={joinRequestsQ.data?.length}>
            <JoinRequestList gameId={gameId} requests={joinRequestsQ.data ?? []} />
          </SectionCard>
        )}

        {(canSetResult || game.result_set) && (
          <SectionCard title="نتیجه بازی" icon="mdi:trophy-outline">
            {game.result_set ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-extrabold text-emerald-600 dark:text-emerald-400">
                    <Icon icon="mdi:check-decagram" className="h-[14px] w-[14px]" aria-hidden="true" />
                    نتیجه ثبت شده
                  </span>
                  {game.result_set_at && (
                    <p className="text-[0.68rem] text-muted-foreground">
                      {formatPersianDateTime(game.result_set_at)}
                    </p>
                  )}
                </div>
                {winnerList.length === 0 ? (
                  <p className="text-[0.82rem] text-muted-foreground">برنده‌ی ثبت‌شده‌ای موجود نیست.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {winnerList.map((w) => (
                      <span key={w.userId} className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.78rem] font-bold text-amber-600 dark:text-amber-400">
                        <Icon icon="mdi:trophy" className="h-[14px] w-[14px]" aria-hidden="true" />
                        {w.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[0.8rem] text-muted-foreground">
                  بازی به پایان رسیده؟ نتیجه و برندگان را ثبت کنید تا امتیاز وفاداری به آنان اضافه شود.
                </p>
                <div>
                  <Button variant="gradient" icon="mdi:trophy-outline" onClick={() => setResultOpen(true)}>
                    ثبت نتیجه بازی
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard title={`بازیکنان (${game.current_players.toLocaleString('fa-IR')})`} icon="mdi:account-group-outline">
          {participantsQ.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <Shimmer key={i} height={52} />)}
            </div>
          ) : participantsQ.isError ? (
            <p className="text-[0.85rem] text-muted-foreground">نمایش بازیکنان ممکن نیست.</p>
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
            canManage={canManage}
          />
        </SectionCard>

        {canManage && (
          <SectionCard title="لیست انتظار" icon="mdi:sort-clock-ascending-outline" badge={waitlistQ.data?.length}>
            {waitlistQ.isLoading ? (
              <Shimmer height={52} />
            ) : (
              <WaitlistList entries={waitlistQ.data ?? []} />
            )}
          </SectionCard>
        )}

        {game.my_role && game.my_role !== 'member' && (
          <div className="flex items-center gap-2">
            <p className="text-[0.8rem] text-muted-foreground">نقش شما در بازی:</p>
            <RoleBadge role={game.my_role} />
          </div>
        )}

        <p className="text-[0.68rem] text-muted-foreground">
          {`شناسه بازی ${game.id.toLocaleString('fa-IR')} - ساخته‌شده در ${formatPersianDate(game.created_at)}`}
        </p>
      </div>

      {/* ─────────── دیالوگ‌ها ─────────── */}
      <GameResultDialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        gameId={gameId}
        participants={participantsQ.data ?? []}
        onSuccess={() => refetch()}
      />
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
