import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { adminService } from '@/services/admin'
import type { AdminUser, UserStats } from '@/services/admin'
import { formatDate, getInitials } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Input } from '@/components/ui/shadcn/input'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import toast from 'react-hot-toast'

const roleConfig: Record<string, { label: string; color: 'info' | 'secondary' | 'warning' | 'success' | 'default'; icon: string }> = {
  user: { label: 'کاربر', color: 'default', icon: 'mdi:account' },
  venue_manager: { label: 'مدیر سالن', color: 'info', icon: 'mdi:stadium' },
  club_admin: { label: 'مدیر باشگاه', color: 'secondary', icon: 'mdi:soccer' },
  super_admin: { label: 'مدیر کل', color: 'warning', icon: 'mdi:crown' },
  coach: { label: 'مربی', color: 'success', icon: 'mdi:school' },
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  default: 'bg-foreground/5 text-muted-foreground',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  secondary: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  warning: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [busyRole, setBusyRole] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // تغییر نقش یک write قابل‌بازگشت نیست (سرور is_verified را صفر می‌کند و در ممیزی امنیتی ثبت می‌شود)
  const [roleTarget, setRoleTarget] = useState<{ userId: number; name: string; role: AdminUser['role'] } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allUsers, userStats] = await Promise.all([
        adminService.getUsers(),
        adminService.getUserStats(),
      ])
      setUsers(allUsers || [])
      setStats(userStats)
    } catch {
      setError('خطا در دریافت اطلاعات از سرور')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search || u.full_name?.includes(search) || u.phone?.includes(search)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  /** تغییر نقش — writes به PUT /admin/users/{id}/role؛ خطا → rollback تا جدول با سرور نخواند */
  const changeRole = async (userId: number, role: AdminUser['role']) => {
    const prev = users
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, role } : u)))
    setBusyRole(userId)
    try {
      const res = await adminService.setUserRole(userId, role)
      toast.success(res?.message || 'نقش کاربر تغییر کرد')
      // مدیر سالن/باشگاهِ تازه باید دوباره تایید شود → سرور is_verified را false کرده
      await fetchData()
    } catch (err: any) {
      setUsers(prev)
      toast.error(err?.response?.data?.detail || 'تغییر نقش ممکن نشد')
    } finally {
      setBusyRole(null)
    }
  }

  const miniStats = [
    { label: 'فعال', value: stats?.active_users, icon: 'mdi:account-check', color: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'غیرفعال', value: stats?.inactive_users, icon: 'mdi:account-off', color: 'text-red-600 dark:text-red-400' },
    { label: 'تایید شده', value: stats?.verified_users, icon: 'mdi:check-decagram', color: 'text-blue-700 dark:text-blue-400' },
  ]

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="mb-1 flex items-center gap-2 text-xl font-extrabold text-foreground">
          <Icon icon="mdi:account-group" aria-hidden="true" className="h-7 w-7 text-primary-ink" />
          مدیریت کاربران
        </h1>
        <p className="text-[0.68rem] text-muted-foreground">
          {toPersianDigits(users.length)} کاربر در سیستم ثبت‌نام کرده‌اند
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 rounded-lg">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {error}
            <Button variant="outline" size="sm" onClick={fetchData}>
              تلاش مجدد
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        {miniStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
              <Icon icon={stat.icon} aria-hidden="true" className={`h-4 w-4 ${stat.color}`} />
              <p className="text-[0.68rem] text-muted-foreground">{stat.label}</p>
              <p className={`text-[0.68rem] font-extrabold ${stat.color}`}>
                {(stat.value ?? 0).toLocaleString('fa-IR')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Icon icon="mdi:magnify" aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="جستجوی کاربران"
              placeholder="جستجوی نام یا شماره موبایل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger aria-label="نقش" className="min-w-[160px]">
              <SelectValue placeholder="نقش" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه نقش‌ها</SelectItem>
              {Object.entries(roleConfig).map(([value, conf]) => (
                <SelectItem key={value} value={value}>{conf.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton aria-hidden="true" key={i} className="h-[52px]" />
            ))}
          </div>
        ) : (
          <Table aria-label="لیست کاربران سیستم">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead scope="col">کاربر</TableHead>
                <TableHead scope="col">شماره موبایل</TableHead>
                <TableHead scope="col">نقش</TableHead>
                <TableHead scope="col">تخصیص نقش</TableHead>
                <TableHead scope="col">وضعیت</TableHead>
                <TableHead scope="col">تایید</TableHead>
                <TableHead scope="col">تاریخ ثبت‌نام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-[34px] w-[34px]">
                        <AvatarFallback className="bg-blue-600 text-[0.85rem] text-white">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-[0.68rem] font-semibold text-foreground">{user.full_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-[0.68rem] text-foreground" dir="ltr">{user.phone}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] font-semibold ${ROLE_BADGE_CLASS[roleConfig[user.role]?.color || 'default']}`}>
                      <Icon icon={roleConfig[user.role]?.icon || 'mdi:account'} aria-hidden="true" className="h-3.5 w-3.5" />
                      {roleConfig[user.role]?.label || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={busyRole === user.id}
                      onValueChange={(v) => setRoleTarget({ userId: user.id, name: user.full_name, role: v as AdminUser['role'] })}
                    >
                      <SelectTrigger
                        aria-label={`تخصیص نقش برای ${user.full_name}`}
                        data-testid={`user-role-${user.id}`}
                        className="min-h-9 min-w-[128px] text-[0.8rem]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).map(([value, conf]) => (
                          <SelectItem key={value} value={value}>{conf.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[0.68rem] font-semibold ${
                      user.is_active
                        ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-red-500/30 text-red-700 dark:text-red-400'
                    }`}>
                      {user.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Icon
                      icon={user.is_verified ? 'mdi:check-decagram' : 'mdi:minus-circle-outline'}
                      aria-label={user.is_verified ? 'تایید شده' : 'تایید نشده'}
                      className={`h-5 w-5 ${user.is_verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground/40'}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-[0.68rem] text-muted-foreground">{formatDate(user.created_at)}</p>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-12 text-center">
                      <Icon icon="mdi:account-search-outline" aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-[0.68rem] text-muted-foreground">
                        کاربری با این مشخصات یافت نشد
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmModal
        open={roleTarget !== null}
        onOpenChange={(open) => { if (!open) setRoleTarget(null) }}
        title="تغییر نقش کاربر"
        description={
          roleTarget
            ? `نقش «${roleTarget.name}» از «${roleConfig[users.find((u) => u.id === roleTarget.userId)?.role ?? '']?.label || '—'}» به «${roleConfig[roleTarget.role]?.label || roleTarget.role}» تغییر می‌کند. این اقدام در ممیزی امنیتی ثبت می‌شود؛ اگر نقش جدید مدیر سالن یا مدیر باشگاه باشد، تایید قبلی کاربر باطل می‌شود و باید دوباره تایید شود.`
            : ''
        }
        confirmText="تغییر نقش"
        cancelText="انصراف"
        variant="destructive"
        loading={busyRole !== null}
        onConfirm={() => {
          if (!roleTarget) return
          const { userId, role } = roleTarget
          setRoleTarget(null)
          void changeRole(userId, role)
        }}
      />
    </Layout>
  )
}

export default Users
