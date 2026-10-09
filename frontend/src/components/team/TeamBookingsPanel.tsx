// frontend/src/components/team/TeamBookingsPanel.tsx
// رزروهای منتسب به تیم (GET /teams/{id}/bookings) + «اتصال رزرو» — انتخاب از رزروهای
// پیشِ‌روی خودِ کاربر که هنوز به تیمی وصل نشده‌اند (فیلتر سمت کلاینت روی bookings من)

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Button as MuiButton, Typography } from '@mui/material'

import type { Team, TeamBookingItem } from '@/types/team'
import { useLinkTeamBooking, useTeamBookings } from '@/hooks/useTeams'
import { bookingService } from '@/services/booking'
import { useToast } from '@/hooks/useToast'
import { useQuery } from '@tanstack/react-query'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { EmptyBox, ErrorBox, LoadingBox, StatusChip, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, getTodayISO, toPersianDigits } from '@/lib/jalali'
import { getStatusLabel, formatTimeFa } from '@/lib/utils'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          فقط رزروهای پیش‌روی خودتان قابل اتصال است؛ رزرو تغییر نمی‌کند و صرفاً به تاریخچه تیم منتسب می‌شود.
        </Typography>
        {bookingsQ.isPending ? (
          <LoadingBox text="در حال دریافت رزروهای شما..." />
        ) : options.length === 0 ? (
          <EmptyBox icon="mdi:calendar-plus-outline" title="رزرو قابل اتصالی نیست" text="رزرو تأییدشده/در انتظارِ پیش‌روی متصل‌نشده‌ای ندارید." />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 320, overflowY: 'auto' }}>
            {options.map((b) => (
              <Box
                key={b.id}
                onClick={() => setSelected(b.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selected === b.id ? '#2563eb' : 'rgba(15,23,42,0.08)',
                  bgcolor: selected === b.id ? 'rgba(37,99,235,0.06)' : 'transparent',
                }}
              >
                <Icon
                  icon={selected === b.id ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
                  style={{ width: 18, height: 18, color: selected === b.id ? '#2563eb' : '#64748b', flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }} noWrap>
                    {b.venue_name ?? `رزرو #${b.id}`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {`${formatJalaliDate(b.slot_date, { format: 'numeric' })}${b.start_time ? ` - ${formatTimeFa(b.start_time)}` : ''}${b.payment_amount ? ` — ${formatRial(b.payment_amount)}` : ''}`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={link.isPending}>انصراف</Button>
          <Button variant="gradient" loading={link.isPending} disabled={!selected} onClick={handleLink} icon="mdi:link-variant">
            اتصال
          </Button>
        </Box>
      </Box>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
          {`${toPersianDigits(total)} رزرو منتسب به تیم`}
        </Typography>
        {showLink && (
          <Button size="sm" variant="gradient" icon="mdi:link-variant" onClick={() => setLinkOpen(true)}>
            اتصال رزرو
          </Button>
        )}
      </Box>

      {bookingsQ.isPending ? (
        <LoadingBox text="در حال دریافت رزروها..." />
      ) : bookingsQ.isError ? (
        <ErrorBox message="دریافت رزروهای تیم ممکن نشد." onRetry={() => bookingsQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:calendar-blank-outline" title="هنوز رزروی منتسب نشده" text={showLink ? 'با «اتصال رزرو» می‌توانید رزروهای خود را به این تاریخچه اضافه کنید.' : undefined} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((b: TeamBookingItem) => (
            <Box
              key={b.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                flexWrap: 'wrap',
                px: 1.5,
                py: 1.25,
                borderRadius: '16px',
                border: '1px solid rgba(15,23,42,0.06)',
              }}
            >
              <Icon icon="mdi:calendar-outline" style={{ width: 18, height: 18, color: '#2563eb', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.83rem', fontWeight: 700 }} noWrap>
                  {b.venue_name ?? '—'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {`${formatJalaliDate(b.slot_date, { format: 'numeric' })}${b.start_time ? ` - ${formatTimeFa(b.start_time ?? '')}` : ''}`}
                  {b.booking_user_name ? ` — ثبت‌کننده: ${b.booking_user_name}` : ''}
                </Typography>
              </Box>
              {b.payment_amount != null && (
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }} dir="rtl">
                  {formatRial(b.payment_amount)}
                </Typography>
              )}
              {b.status && <StatusChip label={getStatusLabel(b.status)} color={b.status === 'confirmed' ? '#059669' : b.status === 'pending' ? '#d97706' : b.status === 'cancelled' ? '#dc2626' : '#0891b2'} />}
            </Box>
          ))}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 1 }}>
              <MuiButton size="small" disabled={page <= 1 || bookingsQ.isFetching} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>قبلی</MuiButton>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </Typography>
              <MuiButton size="small" disabled={page >= pageCount || bookingsQ.isFetching} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>بعدی</MuiButton>
            </Box>
          )}
        </Box>
      )}

      {linkOpen && <BookingsLinkDialog team={team} linkedIds={linkedIds} open onClose={() => setLinkOpen(false)} />}
    </Box>
  )
}

export default TeamBookingsPanel
