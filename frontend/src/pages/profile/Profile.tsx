import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { Shimmer } from '@/components/mobile'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  venue_manager: 'مدیر سالن',
  club_admin: 'مدیر باشگاه',
  super_admin: 'مدیر کل',
}

// اگر بک‌اند اندپوینت مربوطه را هنوز ندارد، پیام مناسب نمایش می‌دهد
function friendlyError(err: any, fallback: string): string {
  const status = err?.response?.status
  if (status === 404 || status === 405) {
    return 'این قابلیت هنوز در سمت سرور در دسترس نیست'
  }
  return err?.response?.data?.detail || fallback
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore()

  const [tab, setTab] = useState(0)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  if (!user) {
    return (
      <Layout>
        <Box sx={{ py: 3 }}>
          <Shimmer variant="rounded" sx={{ height: 40, width: 220, mb: 4, borderRadius: '12px' }} />
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Shimmer variant="rounded" sx={{ height: 260, borderRadius: '16px' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Shimmer variant="rounded" sx={{ height: 340, borderRadius: '16px' }} />
            </Grid>
          </Grid>
        </Box>
      </Layout>
    )
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error('نام باید حداقل ۳ کاراکتر باشد')
      return
    }
    setSavingProfile(true)
    try {
      await authService.updateProfile({ full_name: fullName.trim() })
      updateUser({ fullName: fullName.trim() })
      toast.success('پروفایل با موفقیت به‌روزرسانی شد!')
    } catch (err: any) {
      toast.error(friendlyError(err, 'خطا در به‌روزرسانی پروفایل'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      toast.error('رمز عبور جدید باید حداقل ۴ کاراکتر باشد')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند')
      return
    }
    setSavingPassword(true)
    try {
      await authService.changePassword({
        oldPassword,
        newPassword,
      })
      toast.success('رمز عبور با موفقیت تغییر کرد!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(friendlyError(err, 'خطا در تغییر رمز عبور'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
            پروفایل کاربری
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid size={{  xs: 12, md: 4  }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                  }}
                >
                  {getInitials(user.fullName) || 'ک'}
                </Avatar>
                <Typography sx={{ fontWeight: 600 }} variant="h6">
                  {user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {roleLabels[user.role] || user.role}
                </Typography>
                <Chip
                  label={user.isVerified ? 'تایید شده' : 'در انتظار تایید'}
                  color={user.isVerified ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1, borderRadius: '8px' }}
                />
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <Icon icon="mdi:phone" className="h-4 w-4 inline ml-2" />
                    {user.phone}
                  </Typography>
                  {user.createdAt && (
                    <Typography variant="body2">
                      <Icon icon="mdi:calendar" className="h-4 w-4 inline ml-2" />
                      عضویت: {formatDate(user.createdAt)}
                    </Typography>
                  )}
                </Box>
              </Card>
            </motion.div>
          </Grid>

          {/* Content */}
          <Grid size={{  xs: 12, md: 8  }}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Tabs
                  value={tab}
                  onChange={(_, newValue) => setTab(newValue)}
                  variant="fullWidth"
                  sx={{
                    mb: 3,
                    '& .MuiTab-root': {
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white !important',
                      borderRadius: '8px',
                    },
                  }}
                >
                  <Tab label="اطلاعات شخصی" />
                  <Tab label="تغییر رمز عبور" />
                </Tabs>

                {tab === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      component="form"
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}
                    >
                      <TextField
                        label="نام کامل"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <TextField
                        label="شماره موبایل"
                        value={user.phone}
                        disabled
                        fullWidth
                        helperText="شماره موبایل قابل تغییر نیست"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <Button
                        type="button"
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                          minHeight: { xs: 48, sm: 40 },
                          mt: 1,
                          maxWidth: 220,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        }}
                      >
                        {savingProfile ? (
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        ) : (
                          'ذخیره تغییرات'
                        )}
                      </Button>
                    </Box>
                  </motion.div>
                )}

                {tab === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      component="form"
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}
                    >
                      <TextField
                        label="رمز عبور فعلی"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <TextField
                        label="رمز عبور جدید"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <TextField
                        label="تکرار رمز عبور جدید"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                        error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                        helperText={
                          confirmPassword.length > 0 && confirmPassword !== newPassword
                            ? 'رمز عبور و تکرار آن مطابقت ندارند'
                            : undefined
                        }
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <Button
                        type="button"
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                          minHeight: { xs: 48, sm: 40 },
                          mt: 1,
                          maxWidth: 220,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        }}
                      >
                        {savingPassword ? (
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        ) : (
                          'تغییر رمز عبور'
                        )}
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default Profile