import React, { useEffect, useState } from 'react'
import { Bell, CloudAlert, BellOff } from 'lucide-react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import type { NotificationItem } from '@/services/notification'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover'

const typeIcons: Record<string, { icon: string; color: string }> = {
  booking_confirmed: { icon: 'mdi:check-circle', color: '#16a34a' },
  booking_cancelled: { icon: 'mdi:cancel', color: '#dc2626' },
  booking_rejected: { icon: 'mdi:close-circle', color: '#dc2626' },
  new_booking: { icon: 'mdi:bell-alert', color: '#2563eb' },
  competition: { icon: 'mdi:trophy', color: '#d97706' },
  contract: { icon: 'mdi:file-document', color: '#7c3aed' },
  payment: { icon: 'mdi:credit-card-check-outline', color: '#0891b2' },
  // ---- تأیید مدیر نرم‌افزار (حساب/سالن) ----
  account_approved: { icon: 'mdi:account-check-outline', color: '#16a34a' },
  account_rejected: { icon: 'mdi:account-off-outline', color: '#dc2626' },
  venue_verified: { icon: 'mdi:shield-check-outline', color: '#16a34a' },
  info: { icon: 'mdi:information', color: '#6b7280' },
  // ---- Game notifications ----
  game_created: { icon: 'mdi:plus-circle', color: '#7c3aed' },
  game_joined: { icon: 'mdi:account-group', color: '#16a34a' },
  game_left: { icon: 'mdi:account-arrow-left-outline', color: '#6b7280' },
  game_removed: { icon: 'mdi:account-remove-outline', color: '#dc2626' },
  game_join_request: { icon: 'mdi:account-clock-outline', color: '#d97706' },
  game_request_approved: { icon: 'mdi:check-decagram', color: '#16a34a' },
  game_request_rejected: { icon: 'mdi:close-octagon-outline', color: '#dc2626' },
  game_invitation: { icon: 'mdi:email-fast-outline', color: '#7c3aed' },
  game_invitation_accepted: { icon: 'mdi:email-check-outline', color: '#16a34a' },
  game_waitlist_promoted: { icon: 'mdi:sort-ascending', color: '#0891b2' },
  game_capacity_changed: { icon: 'mdi:account-multiple-plus-outline', color: '#2563eb' },
  game_started: { icon: 'mdi:play-circle-outline', color: '#16a34a' },
  game_completed: { icon: 'mdi:flag-checkered', color: '#6b7280' },
  game_cancelled: { icon: 'mdi:close-octagon', color: '#dc2626' },
  game_payment_paid: { icon: 'mdi:credit-card-check-outline', color: '#0891b2' },
  game: { icon: 'mdi:gamepad-variant', color: '#7c3aed' },
  // ---- Team notifications (team_* / dues_*) ----
  team: { icon: 'mdi:shield-account-outline', color: '#2563eb' },
  team_invitation: { icon: 'mdi:email-fast-outline', color: '#7c3aed' },
  team_message: { icon: 'mdi:message-text-outline', color: '#0891b2' },
  team_official: { icon: 'mdi:shield-star-outline', color: '#7c3aed' },
  team_challenge_received: { icon: 'mdi:handshake-outline', color: '#d97706' },
  team_challenge_accepted: { icon: 'mdi:handshake', color: '#16a34a' },
  team_challenge_declined: { icon: 'mdi:handshake-remove', color: '#dc2626' },
  team_challenge_cancelled: { icon: 'mdi:bell-cancel-outline', color: '#6b7280' },
  dues: { icon: 'mdi:cash-clock-outline', color: '#0891b2' },
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'همین حالا'
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  return `${Math.floor(diff / 86400)} روز پیش`
}

const NotificationPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, fetchError, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } =
    useNotificationStore()

  // دریافت شمارش خوانده‌نشده هنگام mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) fetchNotifications()
  }

  const handleClickItem = (n: NotificationItem) => {
    if (!n.is_read) markAsRead(n.id)
    // Deep-link به صفحه بازی برای اعلان‌های بازی
    const gameId = n.data?.game_id
    if (typeof gameId === 'number') {
      setOpen(false)
      navigate(`/games/${gameId}`)
      return
    }
    // Deep-link به صفحه تیم برای اعلان‌های تیم/حصه (data.team_id)
    const teamId = n.data?.team_id
    if (typeof teamId === 'number') {
      setOpen(false)
      navigate(`/teams/${teamId}`)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label={unreadCount > 0 ? `اعلان‌ها، ${unreadCount} خوانده‌نشده` : 'اعلان‌ها'}
          className="relative flex h-9 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] max-w-[calc(100vw-32px)] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-[0.68rem] font-bold">
            اعلان‌ها {unreadCount > 0 && `(${unreadCount} خوانده‌نشده)`}
          </h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="min-h-9 rounded-lg px-2 text-[0.68rem] font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              خواندن همه
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto" role="log" aria-busy={loading} aria-live="polite">
          {loading && notifications.length === 0 ? (
            <p className="py-8 text-center text-[0.68rem] text-muted-foreground" role="status">
              در حال بارگذاری...
            </p>
          ) : fetchError && notifications.length === 0 ? (
            <div className="py-10 text-center">
              <CloudAlert className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
              <p className="mt-2 text-[0.68rem] text-muted-foreground">دریافت اعلان‌ها ممکن نشد</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="mt-2 min-h-9 rounded-lg px-3 text-[0.68rem] font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                تلاش مجدد
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <BellOff className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-[0.68rem] text-muted-foreground">اعلانی وجود ندارد</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const t =
                  typeIcons[n.type] ||
                  (n.type.startsWith('game_')
                    ? typeIcons.game
                    : n.type.startsWith('contract')
                      ? typeIcons.contract
                      : n.type.startsWith('dues_')
                        ? typeIcons.dues
                        : n.type.startsWith('team_') || n.type === 'team'
                          ? n.type.startsWith('team_invitation')
                            ? typeIcons.team_invitation
                            : typeIcons.team
                          : typeIcons.info)
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleClickItem(n)}
                      aria-label={`${n.title}${n.is_read ? '' : ' — خوانده نشده'}`}
                      className={
                        n.is_read
                          ? 'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                          : 'flex w-full items-start gap-3 border-b border-border bg-primary/5 px-4 py-3 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                      }
                    >
                      <span
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
                        style={{ backgroundColor: `${t.color}18` }}
                      >
                        <Icon icon={t.icon} style={{ color: t.color, fontSize: 18 }} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            n.is_read ? 'block text-[0.68rem] font-medium' : 'block text-[0.68rem] font-bold'
                          }
                        >
                          {n.title}
                        </span>
                        <span className="block truncate text-[0.68rem] text-muted-foreground">
                          {n.message}
                        </span>
                        <span className="mt-0.5 block text-[0.68rem] text-muted-foreground/70">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                      {!n.is_read && (
                        <span
                          aria-hidden="true"
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationPanel
