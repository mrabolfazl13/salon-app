import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  useDealSubscription,
  useMyLoyalty,
  useSetDealSubscription,
} from '@/hooks/useDeals'
import { useStaffMe } from '@/hooks/useStaffMe'
import { bookingService } from '@/services/booking'
import { teamService } from '@/services/team'
import { gameService } from '@/services/game'
import { LOYALTY_REASON_LABELS } from '@/components/pricing/shared'
import { useSetMarketingConsent } from '@/hooks/useCrm'
import { formatRial } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
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
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { Shimmer } from '@/components/mobile'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useUpdateStore } from '@/store/updateStore'
import { getAppVersion, isTauri } from '@/services/update'
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
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const [profileAppVersion, setProfileAppVersion] = useState('')
  const updateAvailable = useUpdateStore((s) => s.availableSilently)
  useEffect(() => {
    void getAppVersion().then(setProfileAppVersion)
  }, [])

  const [tab, setTab] = useState(0)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // امتیاز وفاداری + اشتراک اعلان تخفیف‌های لحظه‌ای (GET/PUT /deals/subscription)
  const loyaltyQuery = useMyLoyalty(8)
  const setConsent = useSetMarketingConsent()
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [consentKnown, setConsentKnown] = useState(false)
  const subscriptionQuery = useDealSubscription()
  const setSubscription = useSetDealSubscription()
  // کارمند انتصابی — برای رابط‌های فرعی (رقابت‌ها/امور مالی) در «مرور سریع»
  const staffQuery = useStaffMe()

  // دستاوردها — فقط وقتی تب باز است داده‌ها گرفته می‌شوند
  const achievementsOpen = tab === 3
  const achBookings = useQuery({
    queryKey: ['achievements', 'bookings'],
    queryFn: () => bookingService.getAll(),
    enabled: achievementsOpen,
    staleTime: 60_000,
  })
  const achTeams = useQuery({
    queryKey: ['achievements', 'teams'],
    queryFn: () => teamService.getMyTeams(),
    enabled: achievementsOpen,
    staleTime: 60_000,
  })
  const achGames = useQuery({
    queryKey: ['achievements', 'games'],
    queryFn: () => gameService.getMyGames(),
    enabled: achievementsOpen,
    staleTime: 60_000,
  })

  const achievementPending = achievementsOpen && (achBookings.isPending || achTeams.isPending || achGames.isPending)
  const achievementFailed = achBookings.isError || achTeams.isError || achGames.isError

  const badges = useMemo(() => {
    const bookings: any[] = achBookings.data ?? []
    const teams: any[] = achTeams.data ?? []
    const games: any[] = achGames.data ?? []
    const uid = user?.id
    const successfulBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length
    const completedBookings = bookings.filter((b) => b.status === 'completed').length
    const captainTeams = teams.filter((t) => t.my_role === 'captain').length
    const officialTeams = teams.filter((t) => t.is_official).length
    const wins = games.filter((g) => g.result_set && Array.isArray(g.winner_ids) && uid != null && g.winner_ids.includes(uid)).length
    const hostedGames = games.filter((g) => g.organizer_id === uid).length
    const playedGames = games.filter((g) => g.status === 'completed' && (g.my_participant_status === 'accepted' || g.organizer_id === uid)).length
    const balance = loyaltyQuery.data?.balance ?? 0
    return [
      { key: 'first-booking', label: 'شروع مسیر', desc: 'اولین رزرو تأییدشده', icon: 'mdi:calendar-check', goal: 1, progress: Math.min(successfulBookings, 1) },
      { key: 'regular', label: 'بازی منظم', desc: '۵ رزرو تکمیل‌شده', icon: 'mdi:run-fast', goal: 5, progress: completedBookings },
      { key: 'captain', label: 'کاپیتان', desc: 'کاپیتان یک تیم', icon: 'mdi:account-group', goal: 1, progress: Math.min(captainTeams, 1) },
      { key: 'official', label: 'تیم رسمی', desc: 'عضو یک تیم رسمی', icon: 'mdi:medal', goal: 1, progress: Math.min(officialTeams, 1) },
      { key: 'first-win', label: 'اولین برد', desc: 'برد در یک بازی ثبت‌شده', icon: 'mdi:trophy', goal: 1, progress: Math.min(wins, 1) },
      { key: 'triple-win', label: 'هتریک', desc: '۳ برد در بازی‌ها', icon: 'mdi:crown', goal: 3, progress: wins },
      { key: 'host', label: 'میزبان', desc: 'برگزار کردن یک بازی', icon: 'mdi:flag-checkered', goal: 1, progress: Math.min(hostedGames, 1) },
      { key: 'team-player', label: 'بازی تیمی', desc: 'حضور در ۳ بازی تکمیل‌شده', icon: 'mdi:handshake', goal: 3, progress: playedGames },
      { key: 'loyal-star', label: 'ستاره وفادار', desc: '۱۰۰ امتیاز وفاداری', icon: 'mdi:star-four-points', goal: 100, progress: balance },
    ]
  }, [achBookings.data, achTeams.data, achGames.data, loyaltyQuery.data, user?.id])

  const unlockedCount = badges.filter((b) => b.progress >= b.goal).length

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

  const isManager =
    user.role === 'venue_manager' || user.role === 'club_admin' || user.role === 'super_admin'
  const isStaff = (staffQuery.data?.length ?? 0) > 0
  const canConsoleNav = isManager || isStaff
  const dashboardPath = isManager ? '/manager-dashboard' : '/dashboard'

  // بخش‌های فرعی که در منوی بالا/موبایل کم‌دسترسی‌اند — «مرور سریع»
  const quickLinks = [
    { label: 'تیم‌های من', icon: 'mdi:account-group', href: '/teams' },
    { label: 'کاوش تیم‌ها', icon: 'mdi:compass', href: '/teams/discover' },
    { label: 'رزروهای من', icon: 'mdi:calendar-check', href: '/bookings' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
    ...(canConsoleNav ? [
      { label: 'رقابت‌ها', icon: 'mdi:trophy', href: '/competitions' },
      { label: 'امور مالی', icon: 'mdi:cash-register', href: '/finance' },
    ] : []),
    { label: isManager ? 'داشبورد مدیریت' : 'داشبورد', icon: 'mdi:dashboard', href: dashboardPath },
  ]

  const handleLogout = () => {
    useNotificationStore.getState().reset()
    logout()
    navigate('/')
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
        <Box sx={{ mb: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            پروفایل کاربری
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            مدیریت اطلاعات، رمز عبور و تنظیمات حساب شما
          </Typography>
          </motion.div>
        </Box>

        <Box sx={{ height: '1.5rem' }} />

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
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
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)',
                    color: '#1c1917',
                    fontSize: '2rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                  <Chip
                    label={user.isVerified ? 'تایید شده' : 'در انتظار تایید'}
                    color={user.isVerified ? 'success' : 'default'}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                  />
                  {/* چیپ امتیاز — نمایش فوری موجودی وفاداری؛ با کلیک می‌رود به تب «وفاداری و اعلان» */}
                  {loyaltyQuery.isSuccess && (
                    <Chip
                      icon={<Icon icon="mdi:star" style={{ fontSize: 16 }} />}
                      label={`${toPersianDigits(loyaltyQuery.data.balance ?? 0)} امتیاز`}
                      size="small"
                      onClick={() => setTab(2)}
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        bgcolor: 'rgba(245,158,11,0.14)',
                        color: (t) => (t.palette.mode === 'dark' ? '#fcd34d' : '#b45309'),
                        '&:hover': { bgcolor: 'rgba(245,158,11,0.22)' },
                      }}
                    />
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
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
                {/* خروج — دسترسی مستقیم بدون نیاز به منوی آواتار */}
                <Button
                  onClick={handleLogout}
                  color="error"
                  startIcon={<Icon icon="mdi:logout" />}
                  sx={{
                    mt: 2,
                    width: '100%',
                    minHeight: 44,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    border: '1px solid rgba(220,38,38,0.25)',
                    bgcolor: 'rgba(220,38,38,0.04)',
                    '&:hover': { bgcolor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.4)' },
                  }}
                >
                  خروج از حساب
                </Button>
              </Card>

              {/* بروزرسانی برنامه — چک دستی + بج نسخه جدید */}
              <Card sx={{ borderRadius: '16px', mt: 3 }}>
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Icon icon="mdi:cellphone-arrow-down" className="h-5 w-5" />
                      بروزرسانی برنامه
                      {updateAvailable && (
                        <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      نسخه فعلی: {profileAppVersion || '—'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => void useUpdateStore.getState().check(true)}
                    disabled={!isTauri()}
                    sx={{ minHeight: 40, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                  >
                    {isTauri() ? 'بررسی بروزرسانی' : 'فقط در اپ موبایل'}
                  </Button>
                </CardContent>
              </Card>

              {/* مرور سریع — دسترسی مستقیم به بخش‌های فرعی (جواب به «دسترسی بد تیم‌ها/رقابت») */}
              <Card sx={{ borderRadius: '16px', mt: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    مرور سریع
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.75 }}>
                    دسترسی مستقیم به بخش‌های کاربری
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                      gap: 1.5,
                    }}
                  >
                    {quickLinks.map((q) => (
                      <Box
                        key={q.href}
                        component={Link}
                        to={q.href}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                          py: 1.75,
                          px: 1,
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.6)'),
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.10)' : 'rgba(245,158,11,0.07)'),
                            borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.4)' : 'rgba(245,158,11,0.45)'),
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.10)'),
                          }}
                        >
                          <Icon icon={q.icon} style={{ fontSize: 22, color: '#d97706' }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'center', lineHeight: 1.4 }}
                        >
                          {q.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Content */}
          <Grid size={{ xs: 12, md: 8 }}>
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
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)',
                      color: '#1c1917 !important',
                      fontWeight: 800,
                      borderRadius: '8px',
                    },
                  }}
                >
                  <Tab label="اطلاعات شخصی" />
                  <Tab label="تغییر رمز عبور" />
                  <Tab label="وفاداری و اعلان" />
                  <Tab label="دستاوردها" />
                </Tabs>

                {tab === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      اطلاعات شخصی
                    </Typography>
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
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 58%, #1d4ed8 100%)',
                          boxShadow: '0 4px 14px rgba(29,78,216,0.30)',
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      تغییر رمز عبور
                    </Typography>
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
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 58%, #1d4ed8 100%)',
                          boxShadow: '0 4px 14px rgba(29,78,216,0.30)',
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

                {tab === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* کارت امتیاز وفاداری */}
                    <Box
                      sx={{
                        borderRadius: '16px',
                        p: 3,
                        mb: 3,
                        color: 'white',
                        background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                        boxShadow: '0 10px 30px rgba(245,158,11,0.25)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>امتیاز وفاداری</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                            {loyaltyQuery.isPending ? '…' : toPersianDigits(loyaltyQuery.data?.balance ?? 0)}
                          </Typography>
                          {loyaltyQuery.data && (
                            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                              ارزش هر امتیاز {formatRial(loyaltyQuery.data.point_value_rial)} — موجودی شما ≈ {formatRial(loyaltyQuery.data.balance * loyaltyQuery.data.point_value_rial)}
                            </Typography>
                          )}
                        </Box>
                        <Icon icon="mdi:card-account-details-star" className="h-12 w-12" style={{ opacity: 0.35 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.85 }}>
                        با هر رزرو تأییدشده امتیاز می‌گیرید و هنگام رزرو می‌توانید تا ۵۰٪ مبلغ را با امتیاز بپردازید.
                      </Typography>
                    </Box>

                    {/* تاریخچه امتیاز */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>تاریخچه امتیازها</Typography>
                    {loyaltyQuery.isPending ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={26} /></Box>
                    ) : loyaltyQuery.isError ? (
                      <Alert severity="warning" sx={{ borderRadius: '12px' }}>دریافت تاریخچه ممکن نشد</Alert>
                    ) : (loyaltyQuery.data?.history?.length ?? 0) === 0 ? (
                      <Box sx={{ borderRadius: '12px', border: '1px dashed', borderColor: 'divider', py: 3, textAlign: 'center' }}>
                        <Icon icon="mdi:ticket-outline" className="h-8 w-8" style={{ color: '#9ca3af' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          هنوز ردیف امتیازی ثبت نشده است. با اولین رزرو تأییدشده امتیاز می‌گیرید.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                        {loyaltyQuery.data!.history.map((h) => (
                          <Box
                            key={h.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              px: 2,
                              py: 1.25,
                              borderRadius: '12px',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: h.points >= 0 ? 'rgba(5,150,105,0.05)' : 'rgba(220,38,38,0.04)',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {LOYALTY_REASON_LABELS[h.reason] ?? h.reason}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {formatJalaliDateTime(h.created_at, { format: 'numeric' })}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: h.points >= 0 ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}
                              dir="rtl"
                            >
                              {h.points >= 0 ? '+' : '−'}{toPersianDigits(Math.abs(h.points))} امتیاز
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* اطلاع‌رسانی لحظه آخری — GET/PUT /deals/subscription */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>اعلان‌ها و رضایت‌ها</Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        px: 2,
                        py: 1.75,
                        borderRadius: '14px',
                        border: '1px solid rgba(245,158,11,0.35)',
                        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(245,158,11,0.10)' : 'rgba(255,247,237,0.7)'),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Icon icon="mdi:fire-alert-outline" className="h-6 w-6" style={{ color: '#d97706', flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>اطلاع‌رسانی تخفیف‌های لحظه‌ای</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            فقط برای سالن‌هایی که آن‌ها را به علاقه‌مندی اضافه کرده‌اید اعلان می‌شود.
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!subscriptionQuery.data?.notify_deals}
                            disabled={subscriptionQuery.isPending || subscriptionQuery.isError || setSubscription.isPending}
                            onChange={(e) =>
                              setSubscription.mutate(e.target.checked, {
                                onSuccess: () => toast.success(e.target.checked ? 'اشتراک تخفیف‌ها فعال شد' : 'اشتراک غیرفعال شد'),
                                onError: () => toast.error('خطا در ذخیره تنظیمات'),
                              })
                            }
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    </Box>
                    {subscriptionQuery.isError && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                        دریافت وضعیت اشتراک ممکن نشد — با بارگذاری مجدد تلاش کنید.
                      </Typography>
                    )}
                    <Box sx={{ height: 2 }} />

                    {/* رضایت بازاریابی — PUT /crm/consent (self-service، همه سالن‌ها).
                        بک‌اند GET برای خواندن وضعیت فعلی ندارد ⇒ سوئیچ با مقدار
                        محلی خوش‌بینانه شروع می‌شود و پاسخ سرور همان را تثبیت می‌کند. */}
                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        px: 2,
                        py: 1.75,
                        borderRadius: '14px',
                        border: '1px solid rgba(37,99,235,0.3)',
                        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(37,99,235,0.12)' : 'rgba(239,246,255,0.7)'),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Icon icon="mdi:bullhorn-outline" className="h-6 w-6" style={{ color: '#2563eb', flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>دریافت پیام‌های بازاریابی</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            با فعال بودن این گزینه، سالن‌ها می‌توانند به شما کمپین/تخفیف پیامک کنند. فعلی:
                            {' '}{consentKnown ? (marketingConsent ? 'فعال' : 'غیرفعال') : 'نامشخص (ثبت نشده)'}
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={marketingConsent}
                            disabled={setConsent.isPending}
                            onChange={(e) => {
                              const next = e.target.checked
                              setMarketingConsent(next)
                              setConsent.mutate(
                                { marketing_consent: next },
                                {
                                  onSuccess: () => {
                                    setConsentKnown(true)
                                    toast.success(next ? 'رضایت بازاریابی فعال شد' : 'رضایت بازاریابی لغو شد')
                                  },
                                  onError: () => {
                                    setMarketingConsent(!next)
                                    toast.error('خطا در ذخیره رضایت')
                                  },
                                },
                              )
                            }}
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    </Box>
                  </motion.div>
                )}

                {tab === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* خلاصه پیشرفت */}
                    <Box
                      sx={{
                        borderRadius: '16px',
                        p: 2.5,
                        mb: 3,
                        color: 'white',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%)',
                        boxShadow: '0 10px 30px rgba(79,70,229,0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>نشان‌های شما</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                          {achievementPending ? '…' : `${toPersianDigits(unlockedCount)} از ${toPersianDigits(badges.length)} نشان باز شده`}
                        </Typography>
                      </Box>
                      <Icon icon="mdi:trophy" style={{ width: 40, height: 40, opacity: 0.4 }} />
                    </Box>

                    {achievementFailed && (
                      <Alert severity="warning" sx={{ borderRadius: '12px', mb: 2 }}>
                        برخی داده‌ها دریافت نشد — دوباره تلاش کنید.
                      </Alert>
                    )}

                    {achievementPending ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                          gap: 1.5,
                        }}
                      >
                        {badges.map((b, i) => {
                          const unlocked = b.progress >= b.goal
                          return (
                            <motion.div
                              key={b.key}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: i * 0.04 }}
                            >
                              <Box
                                sx={{
                                  position: 'relative',
                                  textAlign: 'center',
                                  p: 2,
                                  borderRadius: '16px',
                                  height: '100%',
                                  border: '1px solid',
                                  borderColor: unlocked ? 'rgba(245,158,11,0.5)' : 'divider',
                                  bgcolor: unlocked
                                    ? (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.08)' : 'rgba(255,247,237,0.8)')
                                    : 'transparent',
                                  boxShadow: unlocked ? '0 8px 24px rgba(245,158,11,0.18)' : 'none',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 52,
                                    height: 52,
                                    mx: 'auto',
                                    mb: 1,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: unlocked
                                      ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'
                                      : (t) => (t.palette.mode === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.15)'),
                                  }}
                                >
                                  <Icon
                                    icon={b.icon}
                                    style={{ width: 26, height: 26, color: unlocked ? '#1c1917' : (b.progress > 0 ? '#d97706' : '#64748b') }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: unlocked ? 'text.primary' : 'text.secondary' }}>
                                  {b.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                                  {b.desc}
                                </Typography>
                                {!unlocked && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                                    {toPersianDigits(Math.min(b.progress, b.goal))}/{toPersianDigits(b.goal)}
                                  </Typography>
                                )}
                                {unlocked && (
                                  <Box sx={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}>
                                    <Icon icon="mdi:check-circle" style={{ width: 18, height: 18, color: '#059669' }} />
                                  </Box>
                                )}
                              </Box>
                            </motion.div>
                          )
                        })}
                      </Box>
                    )}
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
