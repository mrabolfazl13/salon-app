import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button,
  Divider,
} from '@mui/material'
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Storefront as StorefrontIcon,
  AdminPanelSettings as AdminPanelIcon,
} from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { getInitials } from '@/lib/utils'
import NotificationPanel from './NotificationPanel'

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  venue_manager: 'مدیر سالن',
  club_admin: 'مدیر باشگاه',
  super_admin: 'مدیر کل',
}

interface NavbarProps {
  /** منوی کناری (Drawer) غیرفعال شده — ناوبری موبایل با نوار پایین انجام می‌شود */
  onMenuClick?: () => void
}

const Navbar: React.FC<NavbarProps> = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isManager =
    user?.role === 'venue_manager' || user?.role === 'club_admin' || user?.role === 'super_admin'

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    useNotificationStore.getState().reset()
    logout()
    navigate('/')
  }

  const navItems = [
    { label: 'خانه', icon: 'mdi:home', href: '/' },
    { label: 'سالن‌ها', icon: 'mdi:store', href: '/venues' },
    { label: 'بازی‌ها', icon: 'mdi:gamepad-variant', href: '/games' },
    { label: 'رزروها', icon: 'mdi:calendar', href: '/bookings' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
    ...(isManager ? [{ label: 'رقابت‌ها', icon: 'mdi:trophy', href: '/competitions' }] : []),
  ]

  const dashboardPath = isManager ? '/manager-dashboard' : '/dashboard'

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:soccer" className="h-6 w-6 text-white" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              فوتسال
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {/* زنگ اعلان — در همه اندازه‌ها (موبایل + دسکتاپ) دیده می‌شود */}
          {isAuthenticated && <NotificationPanel />}

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    component={Link}
                    to={item.href}
                    color="inherit"
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        background: 'rgba(37, 99, 235, 0.08)',
                      },
                    }}
                    startIcon={<Icon icon={item.icon} />}
                  >
                    {item.label}
                  </Button>
                ))}

                <IconButton onClick={handleMenuOpen} color="inherit">
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      fontSize: '0.85rem',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {user?.fullName ? getInitials(user.fullName) : <PersonIcon />}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: '16px',
                      minWidth: 220,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mt: 1,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {user?.fullName || 'کاربر'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user ? roleLabels[user.role] || user.role : ''}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                    <PersonIcon sx={{ ml: 1 }} /> پروفایل
                  </MenuItem>
                  <MenuItem component={Link} to={dashboardPath} onClick={handleMenuClose}>
                    <DashboardIcon sx={{ ml: 1 }} /> داشبورد
                  </MenuItem>
                  {isManager && (
                    <MenuItem component={Link} to="/manager-dashboard" onClick={handleMenuClose}>
                      <StorefrontIcon sx={{ ml: 1 }} /> مدیریت سالن‌ها
                    </MenuItem>
                  )}
                  {user?.role === 'super_admin' && (
                    <MenuItem component={Link} to="/admin" onClick={handleMenuClose}>
                      <AdminPanelIcon sx={{ ml: 1 }} /> پنل ادمین
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ ml: 1 }} /> خروج
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  sx={{ borderRadius: '10px', textTransform: 'none' }}
                >
                  ورود
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  }}
                >
                  ثبت‌نام
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </motion.div>
  )
}

export default Navbar