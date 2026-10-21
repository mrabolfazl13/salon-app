// frontend/src/components/team/TeamBookingsPanel.tsx
// رزروهای منتسب به تیم (GET /teams/{id}/bookings) + «اتصال رزرو» — انتخاب از رزروهای
// پیشِ‌روی خودِ کاربر که هنوز به تیمی وصل نشده‌اند (فیلتر سمت کلاینت روی bookings من)

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

import type { Team, TeamBookingItem } from '@/types/team'
import { useLinkTeamBooking, useTeamBookings } from '@/hooks/useTeams'
import { bookingService } from '@/services/booking'
import { useToast } from '@/hooks/useToast'
import { useQuery } from '@tanstack/react-query'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { EmptyBox, ErrorBox, LoadingBox, StatusChip, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, getTodayISO, toPersianDigits } from '@/lib/jalali'
import { getStatusLabel, formatTimeFa, cn } from '@/lib/utils'
import { getTeamError } from './shared'

const PAGE_SIZE = 20

interface MyBooking {
  id: number
  status: string
  slot_date?: string | null
  start_time?: string | null
  venue_name?: string | null
  payment_amount?: number | null
}

const BookingsLinkDialog: React.FC<{ team: Team; linkedIds: Set<number>; open: boolean; onClose: () => void }> = ({
  team,
  linkedIds,
  open,
  onClose,
}) => {
  const toast = useToast()
  const link = useLinkTeamBooking(team.id)
  const [selected, setSelected] = useState<number | null>(null)

  const bookingsQ = useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: async () => (await bookingService.getAll()) as MyBooking[],
    enabled: open,
  })

  const options = useMemo(() => {
    const today = getTodayISO()
    const list = Array.isArray(bookingsQ.data) ? bookingsQ.data : []
    return list
      .filter((b) => (b.status === 'confirmed' || b.status === 'pending') && (b.slot_date ?? '') >= today)
      .filter((b) => !linkedIds.has(b.id))
      .sort((a, b) => (a.slot_date ?? '').localeCompare(b.slot_date ?? ''))
      .slice(0, 30)
  }, [bookingsQ.data, linkedIds])

  const handleLink = () => {
    if (!selected) return
    link.mutate(selected, {
      onSuccess: () => {
        toast.success('رزرو به تاریخچه تیم منتسب شد.')
        setSelected(null)
        onClose()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="اتصال رزرو به تیم" maxWidth="xs">
      <div className="flex flex-col gap-3 pt-1">
        <p className="text-xs text-muted-foreground">
          فقط رزروهای پیش‌روی خودتان قابل اتصال است؛ رزرو تغییر نمی‌کند و صرفاً به تاریخچه تیم منتسب می‌شود.
        </p>
        {bookingsQ.isPending ? (
          <LoadingBox text="در حال دریافت رزروهای شما..." />
        ) : options.length === 0 ? (
          <EmptyBox icon="mdi:calendar-plus-outline" title="رزرو قابل اتصالی نیست" text="رزرو تأییدشده/در انتظارِ پیش‌روی متصل‌نشده‌ای ندارید." />
        ) : (
          <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            {options.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={selected === b.id}
                onClick={() => setSelected(b.id)}
                className={cn(
                  'flex w-full cursor-pointer appearance-none items-center gap-2 rounded-[14px] border px-3 py-2.5 text-start font-[inherit] text-inherit [-webkit-tap-highlight-color:transparent]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected === b.id
                    ? 'border-blue-600 bg-blue-600/[0.06]'
                    : 'border-slate-900/10 bg-transparent hover:bg-muted/50 dark:border-white/10',
                )}
              >
                <Icon
                  icon={selected === b.id ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
                  style={{ width: 18, height: 18, color: selected === b.id ? '#2563eb' : '#64748b', flexShrink: 0 }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.82rem] font-bold">
                    {b.venue_name ?? `رزرو #${b.id}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {`${formatJalaliDate(b.slot_date, { format: 'numeric' })}${b.start_time ? ` - ${formatTimeFa(b.start_time)}` : ''}${b.payment_amount ? ` — ${formatRial(b.payment_amount)}` : ''}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={link.isPending}>انصراف</Button>
          <Button variant="gradient" loading={link.isPending} disabled={!selected} onClick={handleLink} icon="mdi:link-variant">
            اتصال
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

const TeamBookingsPanel: React.FC<{ team: Team }> = ({ team }) => {
  const [page, setPage] = useState(1)
  const [linkOpen, setLinkOpen] = useState(false)
  const bookingsQ = useTeamBookings(team.id, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
  const items = bookingsQ.data?.items ?? []
  const total = bookingsQ.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const linkedIds = useMemo(() => new Set(items.map((b) => b.booking_id)), [items])

  const showLink = team.is_active && team.my_status === 'active'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.78rem] font-semibold text-slate-500 dark:text-slate-400">
          {`${toPersianDigits(total)} رزرو منتسب به تیم`}
        </p>
        {showLink && (
          <Button size="sm" variant="gradient" icon="mdi:link-variant" onClick={() => setLinkOpen(true)}>
            اتصال رزرو
          </Button>
        )}
      </div>

      {bookingsQ.isPending ? (
        <LoadingBox text="در حال دریافت رزروها..." />
      ) : bookingsQ.isError ? (
        <ErrorBox message="دریافت رزروهای تیم ممکن نشد." onRetry={() => bookingsQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:calendar-blank-outline" title="هنوز رزروی منتسب نشده" text={showLink ? 'با «اتصال رزرو» می‌توانید رزروهای خود را به این تاریخچه اضافه کنید.' : undefined} />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((b: TeamBookingItem) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-900/[0.06] px-3 py-2.5 dark:border-white/10"
            >
              <Icon icon="mdi:calendar-outline" style={{ width: 18, height: 18, color: '#2563eb', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.83rem] font-bold">
                  {b.venue_name ?? '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {`${formatJalaliDate(b.slot_date, { format: 'numeric' })}${b.start_time ? ` - ${formatTimeFa(b.start_time ?? '')}` : ''}`}
                  {b.booking_user_name ? ` — ثبت‌کننده: ${b.booking_user_name}` : ''}
                </p>
              </div>
              {b.payment_amount != null && (
                <p className="text-xs font-extrabold" dir="rtl">
                  {formatRial(b.payment_amount)}
                </p>
              )}
              {b.status && <StatusChip label={getStatusLabel(b.status)} color={b.status === 'confirmed' ? '#059669' : b.status === 'pending' ? '#d97706' : b.status === 'cancelled' ? '#dc2626' : '#0891b2'} />}
            </div>
          ))}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="sm" variant="ghost" disabled={page <= 1 || bookingsQ.isFetching} onClick={() => setPage((p) => p - 1)} className="font-bold">قبلی</Button>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </p>
              <Button size="sm" variant="ghost" disabled={page >= pageCount || bookingsQ.isFetching} onClick={() => setPage((p) => p + 1)} className="font-bold">بعدی</Button>
            </div>
          )}
        </div>
      )}

      {linkOpen && <BookingsLinkDialog team={team} linkedIds={linkedIds} open onClose={() => setLinkOpen(false)} />}
    </div>
  )
}

export default TeamBookingsPanel
