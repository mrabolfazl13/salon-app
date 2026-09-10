import React, { useEffect, useState } from 'react'
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import { NotificationsNone as BellIcon } from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import type { NotificationItem } from '@/services/notification'

const typeIcons: Record<string, { icon: string; color: string }> = {
  booking_confirmed: { icon: 'mdi:check-circle', color: '#16a34a' },
  booking_cancelled: { icon: 'mdi:cancel', color: '#dc2626' },
  booking_rejected: { icon: 'mdi:close-circle', color: '#dc2626' },
  new_booking: { icon: 'mdi:bell-alert', color: '#2563eb' },
  competition: { icon: 'mdi:trophy', color: '#d97706' },
  contract: { icon: 'mdi:file-document', color: '#7c3aed' },
  payment: { icon: 'mdi:credit-card-check-outline', color: '#0891b2' },
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
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'همین حالا'
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  return `${Math.floor(diff / 86400)} روز پیش`
}

const NotificationPanel: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } =
    useNotificationStore()

  // دریافت شمارش خوانده‌نشده هنگام mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    fetchNotifications()
  }

  const handleClickItem = (n: NotificationItem) => {
    if (!n.is_read) markAsRead(n.id)
    // Deep-link به صفحه بازی برای اعلان‌های بازی
    const gameId = n.data?.game_id
    if (typeof gameId === 'number') {
      setAnchorEl(null)
      navigate(`/games/${gameId}`)
    }
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-label="اعلان‌ها"
          sx={{
            width: 44,
            height: 44,
            color: '#0f172a',
            bgcolor: 'background.paper',
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            '&:hover': { bgcolor: 'rgba(37,99,235,0.08)' },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <BellIcon />
          </Badge>
        </IconButton>
      </motion.div>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              mt: 1,
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            اعلان‌ها {unreadCount > 0 && `(${unreadCount} خوانده‌نشده)`}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              خواندن همه
            </Button>
          )}
        </Box>

        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                در حال بارگذاری...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Icon icon="mdi:bell-off-outline" className="h-10 w-10" style={{ color: '#9ca3af' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                اعلانی وجود ندارد
              </Typography>
            </Box>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const t =
                  typeIcons[n.type] ||
                  (n.type.startsWith('game_') ? typeIcons.game : typeIcons.info)
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Paper
                      elevation={0}
                      onClick={() => handleClickItem(n)}
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        bgcolor: n.is_read ? 'transparent' : 'rgba(37,99,235,0.05)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          bgcolor: `${t.color}18`,
                        }}
                      >
                        <Icon icon={t.icon} style={{ color: t.color, fontSize: 18 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700 }}>
                          {n.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {n.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
                          {timeAgo(n.created_at)}
                        </Typography>
                      </Box>
                      {!n.is_read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            mt: 1,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Paper>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </Box>
      </Popover>
    </>
  )
}

export default NotificationPanel
