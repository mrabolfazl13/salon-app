// frontend/src/pages/games/GameCreate.tsx
// صفحه ساخت بازی — انتخاب رزرو تأییدشده‌ی خود کاربر و ساخت بازی روی آن

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import GameFormDialog from '@/components/game/GameFormDialog'
import { formatGameDateTime } from '@/components/game/shared'
import { bookingService } from '@/services/booking'
import { formatPrice } from '@/utils/helpers'

// شکل رزرو از سمت بک‌اند (snake_case)
interface ApiBooking {
  id: number | string
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
  venue_name?: string
  slot_date?: string
  start_time?: string
  duration?: number
}

const BookingRow: React.FC<{ booking: ApiBooking; onSelect: () => void }> = ({ booking, onSelect }) => (
  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
      <Icon icon="mdi:calendar-check" aria-hidden="true" className="h-[22px] w-[22px] text-white" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[0.9rem] font-bold text-foreground">
        {booking.venue_name || `رزرو #${booking.id}`}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-[0.68rem] text-muted-foreground">
          {formatGameDateTime(booking.slot_date, booking.start_time)}
          {booking.duration ? ` · ${booking.duration} دقیقه` : ''}
        </p>
        <span className="inline-flex h-5 items-center rounded-full bg-emerald-50 px-2 text-[0.68rem] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {formatPrice(booking.payment_amount)}
        </span>
      </div>
    </div>
    <Button size="sm" variant="gradient" icon="mdi:gamepad-variant" onClick={onSelect}>
      ساخت بازی
    </Button>
  </div>
)

const GameCreate: React.FC = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<ApiBooking | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await bookingService.getAll()
      const list = Array.isArray(data) ? (data as ApiBooking[]) : []
      // فقط رزروهای تأییدشده قابل ساخت بازی هستند (قانون بک‌اند)
      setBookings(list.filter((b) => b.status === 'confirmed'))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return (
    <Layout>
      <div className="py-4">
        <div className="mb-4 flex items-center gap-3">
          <IconButtonBack onClick={() => navigate(-1)} />
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-foreground">ساخت بازی</h1>
            <p className="mt-1 text-[0.8rem] text-muted-foreground">
              ابتدا یکی از رزروهای تأییدشده‌ی خود را انتخاب کنید؛ بازی روی همان رزرو ساخته می‌شود.
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState
            title="خطا در بارگذاری رزروها"
            description="لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید."
            onRetry={fetchBookings}
          />
        ) : loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} variant="rectangular" height={86} className="rounded-lg" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank-outline"
            title="رزرو تأییدشده‌ای ندارید"
            description="برای ساخت بازی باید ابتدا یک سانس را رزرو و تأیید کنید."
            actionLabel="رفتن به رزروها"
            onAction={() => navigate('/bookings')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <BookingRow key={String(b.id)} booking={b} onSelect={() => setSelected(b)} />
            ))}
          </div>
        )}
      </div>

      <GameFormDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        bookingId={selected ? Number(selected.id) : null}
        bookingLabel={
          selected
            ? `${selected.venue_name || `رزرو #${selected.id}`} — ${formatGameDateTime(selected.slot_date, selected.start_time)}`
            : undefined
        }
        onCreated={(game) => {
          toast.success('بازی با موفقیت ساخته شد')
          navigate(`/games/${game.id}`)
        }}
      />
    </Layout>
  )
}

const IconButtonBack: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    aria-label="بازگشت"
    onClick={onClick}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <Icon icon="mdi:arrow-right" aria-hidden="true" className="h-5 w-5" />
  </button>
)

export default GameCreate
