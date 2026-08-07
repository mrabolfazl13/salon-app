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
  Badge,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NavbarProps {
  isAuthenticated?: boolean
  userRole?: string
  onMenuClick?: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated = false,
  userRole = 'user',
  onMenuClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const theme = useTheme()

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget)
  }

  const handleNotifClose = () => {
    setNotifAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    navigate('/login')
  }

  const navItems = [
    { label: 'خانه', icon: 'mdi:home', href: '/' },
    { label: 'رزرو', icon: 'mdi:calendar', href: '/bookings' },
    { label: 'رقابت‌ها', icon: 'mdi:trophy', href: '/competitions' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
  ]

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
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

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

                <IconButton onClick={handleNotifOpen} color="inherit">
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                <IconButton onClick={handleMenuOpen} color="inherit">
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <PersonIcon />
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
                      minWidth: 200,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mt: 1,
                    },
                  }}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                    <PersonIcon sx={{ mr: 1 }} /> پروفایل
                  </MenuItem>
                  <MenuItem component={Link} to="/dashboard" onClick={handleMenuClose}>
                    <DashboardIcon sx={{ mr: 1 }} /> داشبورد
                  </MenuItem>
                  <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
                    <SettingsIcon sx={{ mr: 1 }} /> تنظیمات
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ mr: 1 }} /> خروج
                  </MenuItem>
                </Menu>

                <Menu
                  anchorEl={notifAnchorEl}
                  open={Boolean(notifAnchorEl)}
                  onClose={handleNotifClose}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: '16px',
                      minWidth: 300,
                      maxWidth: 350,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mt: 1,
                    },
                  }}
                >
                  <MenuItem sx={{ fontWeight: 600 }}>اعلان‌ها</MenuItem>
                  <MenuItem>رزرو شما در تاریخ ۱۴۰۲/۱۰/۱۵ تایید شد</MenuItem>
                  <MenuItem>رقابت قیمت جدید برای سالن آبی</MenuItem>
                  <MenuItem>قرارداد شما تا ۱ ماه دیگر تمدید می‌شود</MenuItem>
                  <MenuItem sx={{ color: 'primary.main', justifyContent: 'center' }}>
                    مشاهده همه
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