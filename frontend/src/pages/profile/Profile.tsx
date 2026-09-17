import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  useDealSubscription,
  useMyLoyalty,
  useSetDealSubscription,
} from '@/hooks/useDeals'
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

  // امتیاز وفاداری + اشتراک اعلان تخفیف‌های لحظه‌ای (GET/PUT /deals/subscription)
  const loyaltyQuery = useMyLoyalty(8)
  const setConsent = useSetMarketingConsent()
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [consentKnown, setConsentKnown] = useState(false)
  const subscriptionQuery = useDealSubscription()
  const setSubscription = useSetDealSubscription()

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
                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
                  <Button
                    component={Link}
                    to="/teams"
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:account-group" />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#2563eb', borderColor: 'rgba(37,99,235,0.4)' }}
                  >
                    تیم‌های من
                  </Button>
                  <Button
                    component={Link}
                    to="/teams/discover"
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:magnify" />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    کاوش تیم‌ها
                  </Button>
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
                  <Tab label="وفاداری و اعلان" />
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
                      <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>هنوز ردیف امتیازی ثبت نشده است.</Typography>
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
                              border: '1px solid rgba(15,23,42,0.06)',
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
                    <Divider sx={{ mb: 2 }} />
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
                        bgcolor: 'rgba(255,247,237,0.7)',
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
                                onSuccess: () => toast.success(e.target.checked ? 'اشتراک تخفیف‌ها فعال شد 🔔' : 'اشتراک غیرفعال شد'),
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
                        bgcolor: 'rgba(239,246,255,0.7)',
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
                                    toast.success(next ? 'رضایت بازاریابی فعال شد 📣' : 'رضایت بازاریابی لغو شد')
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default Profile