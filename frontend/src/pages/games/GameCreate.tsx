// frontend/src/pages/games/GameCreate.tsx
// صفحه ساخت بازی — انتخاب رزرو تأییدشده‌ی خود کاربر و ساخت بازی روی آن

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Box, Typography, Paper, Chip } from '@mui/material'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import GameFormDialog from '@/components/game/GameFormDialog'
import { formatGameDateTime } from '@/components/game/shared'
import { bookingService } from '@/services/booking'
import { formatPrice } from '@/utils/helpers'
import { radii, shadows } from '@/theme'

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
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: `${radii.card}px`,
      boxShadow: shadows.card,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      flexWrap: 'wrap',
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon icon="mdi:calendar-check" style={{ width: 22, height: 22, color: '#fff' }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }} noWrap>
        {booking.venue_name || `رزرو #${booking.id}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
          {formatGameDateTime(booking.slot_date, booking.start_time)}
          {booking.duration ? ` · ${booking.duration} دقیقه` : ''}
        </Typography>
        <Chip
          label={formatPrice(booking.payment_amount)}
          size="small"
          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#ecfdf5', color: '#047857' }}
        />
      </Box>
    </Box>
    <Button size="sm" variant="gradient" icon="mdi:gamepad-variant" onClick={onSelect}>
      ساخت بازی
    </Button>
  </Paper>
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
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <IconButtonBack onClick={() => navigate(-1)} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>ساخت بازی</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25 }}>
              ابتدا یکی از رزروهای تأییدشده‌ی خود را انتخاب کنید؛ بازی روی همان رزرو ساخته می‌شود.
            </Typography>
          </Box>
        </Box>

        {error ? (
          <ErrorState
            title="خطا در بارگذاری رزروها"
            description="لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید."
            onRetry={fetchBookings}
          />
        ) : loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} variant="rectangular" height={86} sx={{ borderRadius: `${radii.card}px` }} />
            ))}
          </Box>
        ) : bookings.length === 0 ? (
          <EmptyState
            emoji="📅"
            title="رزرو تأییدشده‌ای ندارید"
            description="برای ساخت بازی باید ابتدا یک سانس را رزرو و تأیید کنید."
            actionLabel="رفتن به رزروها"
            onAction={() => navigate('/bookings')}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bookings.map((b) => (
              <BookingRow key={String(b.id)} booking={b} onSelect={() => setSelected(b)} />
            ))}
          </Box>
        )}
      </Box>

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
  <Box
    component="button"
    onClick={onClick}
    sx={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1px solid #e2e8f0',
      bgcolor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
    }}
  >
    <Icon icon="mdi:arrow-right" style={{ width: 20, height: 20, color: '#0f172a' }} />
  </Box>
)

export default GameCreate
