import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
  Avatar,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  SportsSoccer as SportsIcon,
  EmojiEvents as TrophyIcon,
  Description as ContractIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
  userRole?: string
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, userRole = 'user' }) => {
  const location = useLocation()

  const menuItems = [
    { label: 'داشبورد', icon: DashboardIcon, href: '/dashboard' },
    { label: 'سالن‌ها', icon: SportsIcon, href: '/venues' },
    { label: 'رزروها', icon: CalendarIcon, href: '/bookings' },
    { label: 'رقابت‌ها', icon: TrophyIcon, href: '/competitions' },
    { label: 'قراردادها', icon: ContractIcon, href: '/contracts' },
  ]

  const adminItems = [
    { label: 'مدیریت کاربران', icon: UsersIcon, href: '/admin/users' },
    { label: 'مدیریت سالن‌ها', icon: SportsIcon, href: '/admin/venues' },
  ]

  const allItems = userRole === 'admin' || userRole === 'super_admin'
    ? [...menuItems, ...adminItems]
    : menuItems

  const isActive = (href: string) => location.pathname === href

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid',
          borderColor: 'rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              کاربر
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userRole === 'admin' ? 'مدیر' : 'کاربر عادی'}
            </Typography>
          </Box>
        </Box>
        <Divider />
      </Box>

      <List sx={{ px: 2 }}>
        {allItems.map((item) => (
          <motion.div
            key={item.href}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <ListItem
              component={Link}
              to={item.href}
              onClick={onClose}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                bgcolor: isActive(item.href) ? 'primary.main' : 'transparent',
                color: isActive(item.href) ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: isActive(item.href) ? 'primary.dark' : 'rgba(37, 99, 235, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.href) ? 'white' : 'inherit' }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          </motion.div>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItem
          button
          sx={{
            borderRadius: '12px',
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="خروج" />
        </ListItem>
      </Box>
    </Drawer>
  )
}

export default Sidebar