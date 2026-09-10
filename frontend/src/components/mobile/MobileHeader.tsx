import React from 'react'
import { Box, Typography, Avatar, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { gradients } from '@/theme'

interface Props {
  title?: string
  subtitle?: string
  /** نمایش آواتار/ورود در انتهای خط */
  showAccount?: boolean
  onBell?: () => void
}

/** هدر موبایل: «سلام 👋 / امروز کجا می‌خوای بازی کنی؟» + آواتار */
const MobileHeader: React.FC<Props> = ({ title, subtitle, showAccount = true }) => {
  const { user, isAuthenticated } = useAuthStore()
  const heading = title || (isAuthenticated && user?.fullName
    ? `سلام ${user.fullName.split(' ')[0]} 👋`
    : 'سلام 👋')
  const sub = subtitle || 'امروز کجا می‌خوای بازی کنی؟'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        pt: { xs: 1.5, md: 0 },
        pb: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: '#0f172a', lineHeight: 1.4 }}>
          {heading}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>{sub}</Typography>
      </Box>
      {showAccount && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexShrink: 0 }}>
        {isAuthenticated ? (
          <Link to="/profile" aria-label="پروفایل">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: gradients.primary,
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}
            >
              {user?.fullName?.[0] || 'ک'}
            </Avatar>
          </Link>
        ) : (
          <Link to="/login">
            <IconButton
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'background.paper',
                border: '1px solid rgba(15,23,42,0.07)',
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                color: '#2563eb',
              }}
              aria-label="ورود"
            >
              <Icon icon="mdi:login-variant" style={{ width: 22, height: 22 }} />
            </IconButton>
          </Link>
        )}
        </Box>
      )}
    </Box>
  )
}

export default MobileHeader
