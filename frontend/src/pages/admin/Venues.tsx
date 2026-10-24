import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { venueService } from '@/services/venue'
import { adminService } from '@/services/admin'
import { formatPrice, formatDate } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Button } from '@/components/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

// سالن‌های در انتظار تایید (پاسخ خام بک‌اند)
interface PendingVenue {
  id: number
  name: string
  address: string
  phone: string | null
  manager_id: number
  created_at: string
  is_verified: boolean
}

const AdminVenues: React.FC = () => {
  const [venues, setVenues] = useState<any[]>([])
  const [pending, setPending] = useState<PendingVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  // تأیید سالن یک‌طرفه است (endpoint لغو تأیید نداریم) → گام تأیید قبل از write
  const [verifyTarget, setVerifyTarget] = useState<PendingVenue | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [all, pend] = await Promise.all([
        venueService.getAll(),
        adminService.getPendingVenues(),
      ])
      setVenues(all || [])
      setPending(pend || [])
    } catch {
      toast.error('خطا در دریافت لیست سالن‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: number) => {
    setVerifyingId(id)
    try {
      await adminService.verifyVenue(id)
      toast.success('سالن با موفقیت تایید شد')
      await fetchAll()
    } catch {
      toast.error('خطا در تایید سالن')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="mb-1 flex items-center gap-2 text-xl font-extrabold text-foreground">
          <Icon icon="mdi:stadium" aria-hidden="true" className="h-7 w-7 text-primary-ink" />
          مدیریت سالن‌ها
        </h1>
        <p className="text-[0.68rem] text-muted-foreground">
          {toPersianDigits(venues.length)} سالن در سیستم | {toPersianDigits(pending.length)} سالن در انتظار تایید
        </p>
      </div>

      {/* Pending venues */}
      <div className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Icon icon="mdi:shield-question-outline" aria-hidden="true" className="h-5 w-5 text-amber-800 dark:text-amber-400" />
          <h2 className="text-sm font-bold text-foreground">
            سالن‌های در انتظار تایید
          </h2>
        </div>
        {loading ? (
          <Skeleton aria-hidden="true" className="h-[90px] rounded-lg" />
        ) : pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Icon icon="mdi:check-all" aria-hidden="true" className="mx-auto h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            <p className="mt-2 text-[0.68rem] text-muted-foreground">
              سالنی در انتظار تایید نیست
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-4">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[0.68rem] font-bold text-foreground">{venue.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                      <Icon icon="mdi:map-marker-outline" aria-hidden="true" className="h-3.5 w-3.5" />
                      {venue.address}
                    </p>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                      ثبت‌نام: {formatDate(venue.created_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => setVerifyTarget(venue)}
                    disabled={verifyingId === venue.id}
                    className="gap-2 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-md shadow-emerald-900/15 hover:from-emerald-800 hover:to-emerald-900"
                  >
                    {verifyingId === venue.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال تایید" />
                    ) : (
                      <Icon icon="mdi:shield-check" aria-hidden="true" className="h-4 w-4" />
                    )}
                    تایید سالن
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* All venues */}
      <div className="mb-4 flex items-center gap-2">
        <Icon icon="mdi:stadium-variant" aria-hidden="true" className="h-5 w-5 text-primary-ink" />
        <h2 className="text-sm font-bold text-foreground">
          همه سالن‌ها
        </h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton aria-hidden="true" key={i} className="h-[52px] rounded-lg" />
            ))}
          </div>
        ) : (
          <Table aria-label="لیست سالن‌ها">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead scope="col">سالن</TableHead>
                <TableHead scope="col">آدرس</TableHead>
                <TableHead scope="col">تلفن</TableHead>
                <TableHead scope="col">حداقل قیمت</TableHead>
                <TableHead scope="col">وضعیت</TableHead>
                <TableHead scope="col">تاریخ ثبت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="text-[0.68rem] font-semibold text-foreground">{venue.name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[220px] truncate text-[0.68rem] text-muted-foreground">
                      {venue.address}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-[0.68rem] text-foreground" dir="ltr">{venue.phone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-[0.68rem] font-bold text-primary-ink">
                      {formatPrice(venue.price)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] font-bold ${
                        venue.is_verified
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-800 dark:text-amber-400'
                      }`}
                    >
                      <Icon icon={venue.is_verified ? 'mdi:shield-check' : 'mdi:shield-outline'} aria-hidden="true" className="h-3.5 w-3.5" />
                      {venue.is_verified ? 'تایید شده' : 'در انتظار'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-[0.68rem] text-muted-foreground">{formatDate(venue.created_at)}</p>
                  </TableCell>
                </TableRow>
              ))}
              {venues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-12 text-center">
                      <Icon icon="mdi:stadium-outline" aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-[0.68rem] text-muted-foreground">
                        سالنی ثبت نشده است
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
        open={verifyTarget !== null}
        onOpenChange={(open) => { if (!open) setVerifyTarget(null) }}
        title="تأیید این سالن؟"
        description={`با تأیید «${verifyTarget?.name ?? ''}» سالن در فهرست عمومی فعال می‌شود و کاربران می‌توانند روی آن رزرو و پرداخت انجام دهند. این اقدام بازگشت ندارد.`}
        confirmText="تأیید سالن"
        cancelText="انصراف"
        loading={verifyingId !== null}
        onConfirm={() => {
          if (!verifyTarget) return
          const venueId = verifyTarget.id
          setVerifyTarget(null)
          void handleVerify(venueId)
        }}
      />
    </Layout>
  )
}

export default AdminVenues
