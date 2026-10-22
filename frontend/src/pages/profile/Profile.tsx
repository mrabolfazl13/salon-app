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
import { useMyMarketingConsent, useSetMarketingConsent } from '@/hooks/useCrm'
import { formatRial } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useUpdateStore } from '@/store/updateStore'
import { getAppVersion, isTauri } from '@/services/update'
import { authService } from '@/services/auth'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import { Separator } from '@/components/ui/shadcn/separator'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  venue_manager: 'مدیر سالن',
  club_admin: 'مدیر باشگاه',
  super_admin: 'مدیر کل',
  coach: 'مربی',
}

// اگر بک‌اند اندپوینت مربوطه را هنوز ندارد، پیام مناسب نمایش می‌دهد
function friendlyError(err: any, fallback: string): string {
  const status = err?.response?.status
  if (status === 404 || status === 405) {
    return 'این قابلیت هنوز در سمت سرور در دسترس نیست'
  }
  return err?.response?.data?.detail || fallback
}

/** اسپینر استاندارد (جایگزین CircularProgress) */
const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ''}`}
    role="status"
    aria-label="در حال بارگذاری"
  />
)

const ProfileTabTrigger: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <TabsTrigger
    value={value}
    className="h-auto min-h-9 whitespace-normal rounded-lg px-2 py-1.5 text-center text-[0.8rem] font-semibold leading-tight data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-400 data-[state=active]:via-amber-500 data-[state=active]:to-orange-500 data-[state=active]:font-extrabold data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
  >
    {children}
  </TabsTrigger>
)

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
  // وضعیت واقعی رضایت از GET /crm/consent؛ تاگل محلی تا رسیدن پاسخ سرور
  const consentQuery = useMyMarketingConsent(!!user)
  const [marketingConsent, setMarketingConsent] = useState(false)
  useEffect(() => {
    if (consentQuery.data && !setConsent.isPending) setMarketingConsent(consentQuery.data.marketing_consent)
  }, [consentQuery.data, setConsent.isPending])
  const consentLabel = consentQuery.isError
    ? 'نامشخص (وضعیت خوانده نشد)'
    : consentQuery.data
      ? (marketingConsent ? 'فعال' : 'غیرفعال')
      : 'در حال خواندن…'
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
        <div className="py-4">
          <Skeleton aria-hidden="true" className="mb-4 h-10 w-[220px] rounded-xl" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <Skeleton aria-hidden="true" className="h-[260px] rounded-lg" />
            </div>
            <div className="md:col-span-8">
              <Skeleton aria-hidden="true" className="h-[340px] rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const isManager =
    user.role === 'venue_manager' || user.role === 'club_admin' || user.role === 'super_admin'
  const isCoach = user.role === 'coach'
  const isStaff = (staffQuery.data?.length ?? 0) > 0
  const canConsoleNav = isManager || isStaff
  const dashboardPath = isCoach ? '/coach' : isManager ? '/manager-dashboard' : '/dashboard'

  // بخش‌های فرعی که در منوی بالا/موبایل کم‌دسترسی‌اند — «مرور سریع»
  const quickLinks = [
    { label: 'تیم‌های من', icon: 'mdi:account-group', href: '/teams' },
    { label: 'کاوش تیم‌ها', icon: 'mdi:compass', href: '/teams/discover' },
    { label: 'رزروهای من', icon: 'mdi:calendar-check', href: '/bookings' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
    { label: 'تورنمنت‌ها', icon: 'mdi:trophy-outline', href: '/tournaments' },
    ...(canConsoleNav ? [
      { label: 'رقابت‌ها', icon: 'mdi:trophy', href: '/competitions' },
      { label: 'امور مالی', icon: 'mdi:cash-register', href: '/finance' },
    ] : []),
    { label: isCoach ? 'پنل مربی' : isManager ? 'داشبورد مدیریت' : 'داشبورد', icon: isCoach ? 'mdi:school' : 'mdi:dashboard', href: dashboardPath },
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

  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

  return (
    <Layout>
      <div className="py-4">
        <div className="mb-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold text-foreground">
              پروفایل کاربری
            </h1>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">
              مدیریت اطلاعات، رمز عبور و تنظیمات حساب شما
            </p>
          </motion.div>
        </div>

        <div className="h-6" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Sidebar */}
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <Avatar className="mx-auto mb-4 h-[100px] w-[100px] shadow-[0_8px_24px_rgba(245,158,11,0.35)]">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-[2rem] font-extrabold text-stone-900">
                    {getInitials(user.fullName) || 'ک'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold text-foreground">
                  {user.fullName}
                </h2>
                <p className="text-[0.68rem] text-muted-foreground">
                  {roleLabels[user.role] || user.role}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Badge
                    variant={user.isVerified ? 'success' : 'muted'}
                    className="min-h-9 rounded-[10px] px-3 text-[0.68rem]"
                  >
                    {user.isVerified ? 'تایید شده' : 'در انتظار تایید'}
                  </Badge>
                  {/* چیپ امتیاز — نمایش فوری موجودی وفاداری؛ با کلیک می‌رود به تب «وفاداری و اعلان» */}
                  {loyaltyQuery.isSuccess && (
                    <button
                      type="button"
                      onClick={() => setTab(2)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-amber-500/15 px-3 text-[0.68rem] font-bold text-amber-700 transition-colors hover:bg-amber-500/25 dark:text-amber-300"
                    >
                      <Icon icon="mdi:star" className="h-[18px] w-[18px]" />
                      {`${toPersianDigits(loyaltyQuery.data.balance ?? 0)} امتیاز`}
                    </button>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex flex-col gap-2.5 text-start">
                  <p className="text-[0.68rem] text-foreground">
                    <Icon icon="mdi:phone" className="me-2 inline h-4 w-4" />
                    {user.phone}
                  </p>
                  {user.createdAt && (
                    <p className="text-[0.68rem] text-foreground">
                      <Icon icon="mdi:calendar" className="me-2 inline h-4 w-4" />
                      عضویت: {formatDate(user.createdAt)}
                    </p>
                  )}
                </div>
                {/* خروج — دسترسی مستقیم بدون نیاز به منوی آواتار */}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="mt-4 min-h-9 w-full rounded-[10px] border-red-500/25 bg-red-500/5 font-bold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Icon icon="mdi:logout" className="h-5 w-5" />
                  خروج از حساب
                </Button>
              </div>

              {/* بروزرسانی برنامه — چک دستی + بج نسخه جدید */}
              <div className="mt-6 rounded-lg border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="flex items-center gap-2 text-[0.68rem] font-extrabold text-foreground">
                      <Icon icon="mdi:cellphone-arrow-down" className="h-5 w-5" />
                      بروزرسانی برنامه
                      {updateAvailable && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </p>
                    <span className="mt-1 block text-[0.68rem] text-muted-foreground">
                      نسخه فعلی: {profileAppVersion || '—'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void useUpdateStore.getState().check(true)}
                    disabled={!isTauri()}
                    className="min-h-9 rounded-xl px-4 font-bold"
                  >
                    {isTauri() ? 'بررسی بروزرسانی' : 'فقط در اپ موبایل'}
                  </Button>
                </div>
              </div>

              {/* مرور سریع — دسترسی مستقیم به بخش‌های فرعی (جواب به «دسترسی بد تیم‌ها/رقابت») */}
              <div className="mt-6 rounded-lg border border-border bg-card shadow-sm">
                <div className="p-3">
                  <p className="text-[0.68rem] font-extrabold text-foreground">
                    مرور سریع
                  </p>
                  <span className="mb-3.5 mt-1 block text-[0.68rem] text-muted-foreground">
                    دسترسی مستقیم به بخش‌های کاربری
                  </span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {quickLinks.map((q) => (
                      <Link
                        key={q.href}
                        to={q.href}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-slate-50/60 px-2 py-3 no-underline transition-all hover:-translate-y-px hover:border-amber-500/45 hover:bg-amber-500/10 dark:bg-white/5 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-400/15">
                          <Icon icon={q.icon} className="h-[22px] w-[22px] text-amber-600 dark:text-amber-400" />
                        </span>
                        <span className="text-center text-[0.68rem] font-bold leading-snug text-foreground">
                          {q.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="md:col-span-8">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-3">
              <Tabs value={String(tab)} onValueChange={(value) => setTab(Number(value))}>
                <TabsList className="mb-4 grid h-auto w-full grid-cols-4 gap-1 p-1">
                  <ProfileTabTrigger value="0">اطلاعات شخصی</ProfileTabTrigger>
                  <ProfileTabTrigger value="1">تغییر رمز عبور</ProfileTabTrigger>
                  <ProfileTabTrigger value="2">وفاداری و اعلان</ProfileTabTrigger>
                  <ProfileTabTrigger value="3">دستاوردها</ProfileTabTrigger>
                </TabsList>

                {tab === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="mb-4 text-[0.68rem] font-bold text-foreground">
                      اطلاعات شخصی
                    </h2>
                    <form className="flex max-w-[480px] flex-col gap-4">
                      <div>
                        <Label htmlFor="profile-full-name" className="mb-1.5 block">نام کامل</Label>
                        <Input
                          id="profile-full-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="min-h-14 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-phone" className="mb-1.5 block">شماره موبایل</Label>
                        <Input
                          id="profile-phone"
                          value={user.phone}
                          disabled
                          aria-describedby="profile-phone-help"
                          className="min-h-14 rounded-xl"
                        />
                        <p id="profile-phone-help" className="mt-1.5 text-[0.68rem] text-muted-foreground">
                          شماره موبایل قابل تغییر نیست
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="mt-2 min-h-12 max-w-[220px] rounded-xl px-6 font-bold"
                      >
                        {savingProfile ? (
                          <Spinner className="text-white" />
                        ) : (
                          'ذخیره تغییرات'
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {tab === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="mb-4 text-[0.68rem] font-bold text-foreground">
                      تغییر رمز عبور
                    </h2>
                    <form className="flex max-w-[480px] flex-col gap-4">
                      <div>
                        <Label htmlFor="profile-old-password" className="mb-1.5 block">رمز عبور فعلی</Label>
                        <Input
                          id="profile-old-password"
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="min-h-14 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-new-password" className="mb-1.5 block">رمز عبور جدید</Label>
                        <Input
                          id="profile-new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="min-h-14 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-confirm-password" className="mb-1.5 block">تکرار رمز عبور جدید</Label>
                        <Input
                          id="profile-confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          aria-invalid={passwordsMismatch || undefined}
                          aria-describedby={passwordsMismatch ? 'profile-confirm-password-help' : undefined}
                          className={
                            passwordsMismatch
                              ? 'min-h-14 rounded-xl border-red-500 focus-visible:ring-red-500'
                              : 'min-h-14 rounded-xl'
                          }
                        />
                        {passwordsMismatch && (
                          <p id="profile-confirm-password-help" className="mt-1.5 text-[0.68rem] text-red-600 dark:text-red-400">
                            رمز عبور و تکرار آن مطابقت ندارند
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                        className="mt-2 min-h-12 max-w-[220px] rounded-xl px-6 font-bold"
                      >
                        {savingPassword ? (
                          <Spinner className="text-white" />
                        ) : (
                          'تغییر رمز عبور'
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}

                {tab === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* کارت امتیاز وفاداری */}
                    <div className="mb-4 rounded-lg bg-gradient-to-br from-amber-700 to-amber-500 p-6 text-white shadow-[0_10px_30px_rgba(245,158,11,0.25)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <span className="text-[0.68rem] font-semibold opacity-85">امتیاز وفاداری</span>
                          <p className="mt-1 text-3xl font-black tabular-nums">
                            {loyaltyQuery.isPending ? '…' : toPersianDigits(loyaltyQuery.data?.balance ?? 0)}
                          </p>
                          {loyaltyQuery.data && (
                            <p className="mt-1 text-[0.68rem] opacity-90">
                              ارزش هر امتیاز {formatRial(loyaltyQuery.data.point_value_rial)} — موجودی شما ≈ {formatRial(loyaltyQuery.data.balance * loyaltyQuery.data.point_value_rial)}
                            </p>
                          )}
                        </div>
                        <Icon icon="mdi:card-account-details-star" className="h-12 w-12 opacity-35" />
                      </div>
                      <span className="mt-3 block text-[0.68rem] opacity-85">
                        با هر رزرو تأییدشده امتیاز می‌گیرید و هنگام رزرو می‌توانید تا ۵۰٪ مبلغ را با امتیاز بپردازید.
                      </span>
                    </div>

                    {/* تاریخچه امتیاز */}
                    <h2 className="mb-3 text-[0.68rem] font-bold text-foreground">تاریخچه امتیازها</h2>
                    {loyaltyQuery.isPending ? (
                      <div className="flex justify-center py-4"><Spinner className="h-[26px] w-[26px]" /></div>
                    ) : loyaltyQuery.isError ? (
                      <Alert variant="warning" className="rounded-xl">
                        <AlertDescription>دریافت تاریخچه ممکن نشد</AlertDescription>
                      </Alert>
                    ) : (loyaltyQuery.data?.history?.length ?? 0) === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-4 text-center">
                        <Icon icon="mdi:ticket-outline" className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                        <p className="mt-2 text-[0.68rem] text-muted-foreground">
                          هنوز ردیف امتیازی ثبت نشده است. با اولین رزرو تأییدشده امتیاز می‌گیرید.
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 flex flex-col gap-2">
                        {loyaltyQuery.data!.history.map((h) => (
                          <div
                            key={h.id}
                            className={
                              h.points >= 0
                                ? 'flex items-center justify-between gap-2 rounded-xl border border-border bg-emerald-500/5 px-4 py-2.5'
                                : 'flex items-center justify-between gap-2 rounded-xl border border-border bg-red-500/5 px-4 py-2.5'
                            }
                          >
                            <div className="min-w-0">
                              <p className="text-[0.68rem] font-bold text-foreground">
                                {LOYALTY_REASON_LABELS[h.reason] ?? h.reason}
                              </p>
                              <span className="text-[0.68rem] text-muted-foreground">
                                {formatJalaliDateTime(h.created_at, { format: 'numeric' })}
                              </span>
                            </div>
                            <p
                              className={
                                h.points >= 0
                                  ? 'whitespace-nowrap text-[0.68rem] font-black tabular-nums text-emerald-700 dark:text-emerald-400'
                                  : 'whitespace-nowrap text-[0.68rem] font-black tabular-nums text-red-700 dark:text-red-400'
                              }
                              dir="rtl"
                            >
                              {h.points >= 0 ? '+' : '−'}{toPersianDigits(Math.abs(h.points))} امتیاز
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* اطلاع‌رسانی لحظه آخری — GET/PUT /deals/subscription */}
                    <Separator className="my-4" />
                    <h2 className="mb-3 text-[0.68rem] font-bold text-foreground">اعلان‌ها و رضایت‌ها</h2>
                    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-amber-500/35 bg-amber-50/70 px-4 py-3.5 dark:bg-amber-500/10">
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon icon="mdi:fire-alert-outline" className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-extrabold text-foreground">اطلاع‌رسانی تخفیف‌های لحظه‌ای</p>
                          <span className="block text-[0.68rem] text-muted-foreground">
                            فقط برای سالن‌هایی که آن‌ها را به علاقه‌مندی اضافه کرده‌اید اعلان می‌شود.
                          </span>
                        </div>
                      </div>
                      <Switch
                        aria-label="اطلاع‌رسانی تخفیف‌های لحظه‌ای"
                        checked={!!subscriptionQuery.data?.notify_deals}
                        disabled={subscriptionQuery.isPending || subscriptionQuery.isError || setSubscription.isPending}
                        onCheckedChange={(checked) =>
                          setSubscription.mutate(checked, {
                            onSuccess: () => toast.success(checked ? 'اشتراک تخفیف‌ها فعال شد' : 'اشتراک غیرفعال شد'),
                            onError: () => toast.error('خطا در ذخیره تنظیمات'),
                          })
                        }
                      />
                    </div>
                    {subscriptionQuery.isError && (
                      <span className="mt-2 block text-[0.68rem] text-muted-foreground">
                        دریافت وضعیت اشتراک ممکن نشد — با بارگذاری مجدد تلاش کنید.
                      </span>
                    )}
                    <div className="h-0.5" />

                    {/* رضایت بازاریابی — وضعیت اولیه از GET /crm/consent و ثبت با
                        PUT /crm/consent (self-service، همه سالن‌ها). */}
                    <div className="mt-4 flex items-center justify-between gap-4 rounded-[14px] border border-blue-500/30 bg-blue-50/70 px-4 py-3.5 dark:bg-blue-500/10">
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon icon="mdi:bullhorn-outline" className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-extrabold text-foreground">دریافت پیام‌های بازاریابی</p>
                          <span className="block text-[0.68rem] text-muted-foreground">
                            با فعال بودن این گزینه، سالن‌ها می‌توانند به شما کمپین/تخفیف پیامک کنند. فعلی:
                            {' '}{consentLabel}
                          </span>
                        </div>
                      </div>
                      <Switch
                        aria-label="دریافت پیام‌های بازاریابی"
                        checked={marketingConsent}
                        disabled={setConsent.isPending}
                        onCheckedChange={(checked) => {
                          const next = checked
                          setMarketingConsent(next)
                          setConsent.mutate(
                            { marketing_consent: next },
                            {
                              onSuccess: () => {
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
                    </div>
                  </motion.div>
                )}

                {tab === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* خلاصه پیشرفت */}
                    <div className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-3 text-white shadow-[0_10px_30px_rgba(79,70,229,0.25)]">
                      <div>
                        <span className="text-[0.68rem] font-semibold opacity-85">نشان‌های شما</span>
                        <p className="mt-1 text-xl font-black">
                          {achievementPending ? '…' : `${toPersianDigits(unlockedCount)} از ${toPersianDigits(badges.length)} نشان باز شده`}
                        </p>
                      </div>
                      <Icon icon="mdi:trophy" className="h-10 w-10 opacity-40" />
                    </div>

                    {achievementFailed && (
                      <Alert variant="warning" className="mb-4 rounded-xl">
                        <AlertDescription>
                          برخی داده‌ها دریافت نشد — دوباره تلاش کنید.
                        </AlertDescription>
                      </Alert>
                    )}

                    {achievementPending ? (
                      <div className="flex justify-center py-8"><Spinner className="h-7 w-7" /></div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                        {badges.map((b, i) => {
                          const unlocked = b.progress >= b.goal
                          return (
                            <motion.div
                              key={b.key}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: i * 0.04 }}
                            >
                              <div
                                className={
                                  unlocked
                                    ? 'relative h-full rounded-lg border border-amber-500/50 bg-amber-50/80 p-4 text-center shadow-[0_8px_24px_rgba(245,158,11,0.18)] dark:bg-amber-400/10'
                                    : 'relative h-full rounded-lg border border-border bg-transparent p-4 text-center'
                                }
                              >
                                <div
                                  className={
                                    unlocked
                                      ? 'mx-auto mb-1 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500'
                                      : 'mx-auto mb-1 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-slate-400/15'
                                  }
                                >
                                  <Icon
                                    icon={b.icon}
                                    className={
                                      unlocked
                                        ? 'h-[26px] w-[26px] text-stone-900'
                                        : b.progress > 0
                                          ? 'h-[26px] w-[26px] text-amber-600 dark:text-amber-400'
                                          : 'h-[26px] w-[26px] text-slate-500 dark:text-slate-400'
                                    }
                                  />
                                </div>
                                <p className={unlocked ? 'text-[0.68rem] font-extrabold text-foreground' : 'text-[0.68rem] font-extrabold text-muted-foreground'}>
                                  {b.label}
                                </p>
                                <span className="mt-1 block text-[0.68rem] text-muted-foreground">
                                  {b.desc}
                                </span>
                                {!unlocked && (
                                  <span className="mt-2 block text-[0.68rem] font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                    {toPersianDigits(Math.min(b.progress, b.goal))}/{toPersianDigits(b.goal)}
                                  </span>
                                )}
                                {unlocked && (
                                  <span className="absolute end-2 top-2">
                                    <Icon icon="mdi:check-circle" className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Profile
