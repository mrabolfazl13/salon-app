import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { adminService } from '@/services/admin'
import type { UserStats, VenueStats, AdminUser } from '@/services/admin'
import { formatDate, getInitials } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const roleConfig: Record<string, { label: string; className: string }> = {
  user: { label: 'کاربر', className: 'bg-muted text-muted-foreground' },
  venue_manager: { label: 'مدیر سالن', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  club_admin: { label: 'مدیر باشگاه', className: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
  super_admin: { label: 'مدیر کل', className: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' },
  coach: { label: 'مربی', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('rounded-lg border border-border bg-card shadow-sm', className)}>{children}</div>
)

const AdminDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [venueStats, setVenueStats] = useState<VenueStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingManagers, setPendingManagers] = useState<AdminUser[]>([])
  const [actingId, setActingId] = useState<number | null>(null)
  // تأیید/رد هر دو یک‌طرفه‌اند (endpoint بازگشتی وجود ندارد) → یک گام تأیید قبل از write
  const [confirmAction, setConfirmAction] = useState<{ id: number; name: string; kind: 'approve' | 'reject' } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [uStats, vStats, allUsers] = await Promise.all([
        adminService.getUserStats(),
        adminService.getVenueStats(),
        adminService.getUsers(),
      ])
      setUserStats(uStats)
      setVenueStats(vStats)
      setUsers(allUsers || [])

      // Endpoint may not exist or user lacks permission - silently ignore
      try {
        const pendingMgrs = await adminService.getPendingManagers()
        setPendingManagers(pendingMgrs || [])
      } catch (err) {
        console.warn('Failed to fetch pending managers:', err)
        setPendingManagers([])
      }
    } catch (mainErr) {
      console.error('Failed to fetch admin dashboard data:', mainErr)
      setError('خطا در دریافت اطلاعات از سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    setActingId(id)
    try {
      await adminService.approveUser(id)
      await fetchData()
    } catch {
      toast.error('خطا در تأیید کاربر')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id: number) => {
    setActingId(id)
    try {
      await adminService.rejectUser(id)
      await fetchData()
    } catch {
      toast.error('خطا در رد درخواست')
    } finally {
      setActingId(null)
    }
  }

  /** اجرای اقدامی که کاربر در ConfirmModal تأیید کرده است */
  const runConfirmedAction = () => {
    if (!confirmAction) return
    const { id, kind } = confirmAction
    setConfirmAction(null)
    if (kind === 'approve') void handleApprove(id)
    else void handleReject(id)
  }

  const stats = [
    { label: 'کل کاربران', value: userStats?.total_users, icon: 'mdi:account-group', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    { label: 'کاربران فعال', value: userStats?.active_users, icon: 'mdi:account-check', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
    { label: 'کل سالن‌ها', value: venueStats?.total_venues, icon: 'mdi:stadium', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    { label: 'در انتظار تایید', value: venueStats?.pending_venues, icon: 'mdi:clipboard-clock-outline', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ]

  const recentUsers = [...users]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5)

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="mb-1 flex items-center gap-2 text-xl font-extrabold md:text-3xl">
          <Icon icon="mdi:crown" className="h-7 w-7 text-primary" aria-hidden="true" />
          پنل مدیریت
        </h1>
        <p className="text-[0.68rem] text-muted-foreground">نمای کلی کاربران و سالن‌های سیستم</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex flex-1 items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchData}
              className="shrink-0 rounded-lg border border-red-300/60 px-3 py-1.5 text-[0.68rem] font-semibold transition-colors hover:bg-red-500/10 dark:border-red-500/40"
            >
              تلاش مجدد
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label}>
            {loading ? (
              <Skeleton aria-hidden="true" className="h-[120px] rounded-lg" />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="h-full"
              >
                <Card className="flex h-full items-center justify-between p-3">
                  <div>
                    <p className="mb-1 text-[0.68rem] text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-extrabold tabular-nums md:text-3xl">
                      {stat.value == null ? '۰' : toPersianDigits(stat.value)}
                    </p>
                  </div>
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                    style={{ background: stat.gradient }}
                  >
                    <Icon icon={stat.icon} className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </Card>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* مدیران سالن در انتظار تایید */}
      {!loading && pendingManagers.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="mdi:account-clock-outline" className="h-5 w-5 text-amber-800 dark:text-amber-400" aria-hidden="true" />
            <h2 className="text-sm font-bold">مدیران سالن در انتظار تایید</h2>
            <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800 tabular-nums dark:text-amber-300">
              {toPersianDigits(pendingManagers.length)}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pendingManagers.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200/70 bg-card/85 p-3 dark:border-amber-500/20"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-amber-700 text-[0.68rem] text-white">
                      {getInitials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[0.68rem] font-bold">{toPersianDigits(m.full_name)}</p>
                    <p className="block font-mono text-[0.68rem] text-muted-foreground" dir="ltr">
                      {m.phone} • {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actingId === m.id}
                    onClick={() => setConfirmAction({ id: m.id, name: m.full_name, kind: 'approve' })}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-[0.68rem] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <Icon icon="mdi:check" className="h-4 w-4" aria-hidden="true" />
                    تایید
                  </button>
                  <button
                    type="button"
                    disabled={actingId === m.id}
                    onClick={() => setConfirmAction({ id: m.id, name: m.full_name, kind: 'reject' })}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-destructive/50 px-3 text-[0.68rem] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Icon icon="mdi:close" className="h-4 w-4" aria-hidden="true" />
                    رد
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-3 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:account-clock-outline" className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
              <h2 className="text-sm font-bold">آخرین کاربران</h2>
            </div>
            <Link to="/admin/users" className="inline-flex min-h-11 items-center text-[0.68rem] font-semibold text-primary hover:underline">
              مشاهده همه
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton aria-hidden="true" key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <Table aria-label="کاربران اخیر">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">کاربر</TableHead>
                  <TableHead scope="col">شماره موبایل</TableHead>
                  <TableHead scope="col">نقش</TableHead>
                  <TableHead scope="col">تاریخ ثبت‌نام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-[11px] text-white">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[0.68rem] font-semibold">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[0.68rem]" dir="ltr">{user.phone}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-lg px-2 py-0.5 text-[0.68rem] font-semibold',
                          roleConfig[user.role]?.className || 'bg-muted text-muted-foreground'
                        )}
                      >
                        {roleConfig[user.role]?.label || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[0.68rem] text-muted-foreground">{formatDate(user.created_at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="py-4 text-center text-[0.68rem] text-muted-foreground">کاربری یافت نشد</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="flex flex-col p-3">
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="mdi:chart-donut" className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold">کاربران بر اساس نقش</h2>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton aria-hidden="true" key={i} className="h-9 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(userStats?.by_role || {}).map(([role, count]) => (
                <div key={role}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-[0.68rem] font-semibold">{roleConfig[role]?.label || role}</span>
                    <span className="text-[0.68rem] text-muted-foreground tabular-nums">{toPersianDigits(count)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${userStats?.total_users ? Math.max(4, (count / userStats.total_users) * 100) : 0}%`,
                        background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex gap-3 border-t border-border pt-4">
            <Link
              to="/admin/users"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-[0.68rem] font-semibold transition-colors hover:bg-muted"
            >
              <Icon icon="mdi:account-group" className="h-4 w-4" aria-hidden="true" />
              کاربران
            </Link>
            <Link
              to="/admin/venues"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-[0.68rem] font-semibold transition-colors hover:bg-muted"
            >
              <Icon icon="mdi:stadium" className="h-4 w-4" aria-hidden="true" />
              سالن‌ها
            </Link>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={confirmAction !== null}
        onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
        title={confirmAction?.kind === 'approve' ? 'تأیید حساب مدیر سالن' : 'رد درخواست مدیریت سالن'}
        description={
          confirmAction?.kind === 'approve'
            ? `با تأیید «${confirmAction?.name ?? ''}» دسترسی مدیریتی او فعال می‌شود و می‌تواند سالن ثبت کند. این تصمیم بازگشت ندارد؛ در سیستم گزینه‌ی لغو تأیید وجود ندارد.`
            : `با رد درخواست «${confirmAction?.name ?? ''}» حساب مدیریتی او بسته می‌شود و کاربر برای دسترسی دوباره باید از نو درخواست بدهد.`
        }
        confirmText={confirmAction?.kind === 'approve' ? 'تأیید و فعال‌سازی' : 'رد درخواست'}
        cancelText="انصراف"
        variant={confirmAction?.kind === 'reject' ? 'destructive' : 'default'}
        loading={actingId !== null}
        onConfirm={runConfirmedAction}
      />
    </Layout>
  )
}

export default AdminDashboard
