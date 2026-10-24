import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { bookingService } from '@/services/booking'
import { membershipService } from '@/services/membership'
import { PLAN_TYPE_LABEL, type MembershipPurchase } from '@/types/membership'
import { formatPrice, formatDate, formatDateTime, formatTimeFa, getStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/shadcn/button'
import { Card } from '@/components/ui/shadcn/card'
import { Badge } from '@/components/ui/shadcn/badge'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

interface ApiBooking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
  // فیلدهای تکمیلی که بک‌اند در همین پاسخ می‌فرستد (همان شکل /bookings)
  venue_name?: string
  slot_date?: string
  start_time?: string
  duration?: number
}

const statusVariant = (status: string): 'success' | 'default' | 'destructive' | 'primary' => {
  if (status === 'confirmed') return 'success'
  if (status === 'completed') return 'primary'
  if (status === 'cancelled') return 'destructive'
  return 'default'
}

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [purchases, setPurchases] = useState<MembershipPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await bookingService.getAll()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    membershipService
      .getMyPurchases()
      .then((data) => setPurchases(Array.isArray(data) ? data : []))
      .catch(() => setPurchases([]))
  }, [])

  const purchaseStatusChip = (
    p: MembershipPurchase
  ): { label: string; variant: 'success' | 'default' | 'muted' } => {
    if (p.status === 'paid') return { label: 'فعال', variant: 'success' }
    if (p.status === 'pending') return { label: 'در انتظار پرداخت', variant: 'default' }
    if (p.status === 'refunded') return { label: 'بازگشت وجه شده', variant: 'muted' }
    return { label: 'لغو شده', variant: 'muted' }
  }

  const activeCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length
  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.payment_amount || 0), 0)

  const stats = [
    { title: 'کل رزروها', value: new Intl.NumberFormat('fa-IR').format(bookings.length), icon: 'mdi:calendar-check', color: '#2563eb' },
    { title: 'رزروهای فعال', value: new Intl.NumberFormat('fa-IR').format(activeCount), icon: 'mdi:calendar-clock', color: '#10b981' },
    { title: 'جمع پرداختی', value: formatPrice(totalSpent), icon: 'mdi:wallet-outline', color: '#8b5cf6' },
    { title: 'رزرو لغو شده', value: new Intl.NumberFormat('fa-IR').format(cancelledCount), icon: 'mdi:calendar-remove', color: '#f59e0b' },
  ]

  const quickActions = [
    { icon: 'mdi:store-search', label: 'رزرو جدید', href: '/venues' },
    { icon: 'mdi:trophy', label: 'رقابت‌ها', href: '/competitions' },
    { icon: 'mdi:trophy-outline', label: 'تورنمنت‌ها', href: '/tournaments' },
    { icon: 'mdi:file-document', label: 'قراردادها', href: '/contracts' },
    { icon: 'mdi:account', label: 'پروفایل', href: '/profile' },
  ]

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Layout>
        <div className="space-y-3 py-1">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            سلام{user?.fullName ? `، ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            به داشبورد سیستم رزرو سالن فوتسال خوش آمدید
          </p>
        </div>
        <Button asChild size="sm" variant="primary" className="px-4">
          <Link to="/venues">
            <Icon icon="mdi:plus" className="h-5 w-5" />
            رزرو جدید
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <Icon icon="mdi:alert-circle-outline" aria-hidden="true" />
          <AlertDescription className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <span>در دریافت اطلاعات خطایی رخ داد.</span>
            <Button variant="ghost" size="sm" onClick={fetchBookings} className="text-red-700 dark:text-red-300">
              تلاش دوباره
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="h-full"
          >
            <Card className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-[0.68rem] font-medium text-muted-foreground">{stat.title}</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${stat.color}18` }}
                >
                  <Icon icon={stat.icon} className="h-[18px] w-[18px]" style={{ color: stat.color }} />
                </span>
              </div>
              {/* مقدار KPI سرتیتر نیست؛ h6 در MUI ترتیب سرتیترها را می‌شکست — axe F-22 */}
              <div className="mt-auto text-lg font-extrabold text-foreground" dir="rtl">
                {stat.value}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Recent Bookings */}
        <Card className="p-4 md:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:calendar-history" className="h-[18px] w-[18px] text-blue-700 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-foreground">آخرین رزروها</h2>
            </div>
            <Link
              to="/bookings"
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-[0.68rem] font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              مشاهده همه
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-10 text-center">
              <Icon icon="mdi:calendar-remove-outline" className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-[0.68rem] text-muted-foreground">هنوز رزروی ندارید</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentBookings.map((b) => (
                <Link
                  key={b.id}
                  to={`/bookings/${b.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-muted/50 p-3 text-inherit no-underline transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-blue-500/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.68rem] font-semibold text-foreground">
                      {b.venue_name || `رزرو #${b.id}`}
                    </p>
                    <p className="truncate text-[0.68rem] text-muted-foreground">
                      {b.slot_date
                        ? `${formatDate(b.slot_date)} — ${b.start_time ? formatTimeFa(String(b.start_time)) : ''}`
                        : `ثبت: ${formatDateTime(b.booked_at)}`}
                    </p>
                    <p className="text-[0.68rem] font-bold text-foreground sm:hidden">
                      {formatPrice(b.payment_amount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden whitespace-nowrap text-[0.68rem] font-bold text-foreground sm:block">
                      {formatPrice(b.payment_amount)}
                    </span>
                    <Badge variant={statusVariant(b.status)}>{getStatusLabel(b.status)}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 md:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="mdi:lightning-bolt" className="h-[18px] w-[18px] text-blue-700 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-foreground">دسترسی سریع</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                asChild
                variant="outline"
                size="sm"
                className="justify-center text-[0.8rem]"
              >
                <Link to={action.href}>
                  <Icon icon={action.icon} className="h-[18px] w-[18px]" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* اشتراک‌های من — باشگاه‌های بدنسازی */}
      {purchases.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Icon
              icon="mdi:card-account-details-star"
              className="h-[18px] w-[18px] text-blue-700 dark:text-blue-400"
            />
            <h2 className="text-sm font-bold text-foreground">اشتراک‌های من</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {purchases.slice(0, 6).map((p) => {
              const chip = purchaseStatusChip(p)
              return (
                <div key={p.id} className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[0.68rem] font-bold text-foreground">{p.plan_title}</p>
                      <p className="truncate text-[0.68rem] text-muted-foreground">
                        {p.venue_name} · {p.plan_type ? PLAN_TYPE_LABEL[p.plan_type] : ''}
                      </p>
                    </div>
                    <Badge variant={chip.variant} className="shrink-0">
                      {chip.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[0.68rem] text-muted-foreground">
                      {p.status === 'paid' && p.plan_type === 'monthly' && p.expires_at
                        ? `اعتبار تا ${new Date(p.expires_at).toLocaleDateString('fa-IR')}`
                        : p.status === 'paid' && p.sessions_remaining != null
                          ? `${new Intl.NumberFormat('fa-IR').format(p.sessions_remaining)} جلسه باقی‌مانده`
                          : formatPrice(p.amount)}
                    </span>
                    {p.status === 'pending' && (
                      <Link
                        to={`/venues/${p.venue_id}`}
                        className="inline-flex min-h-11 items-center text-[0.68rem] font-bold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        پرداخت
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </Layout>
  )
}

export default Dashboard
