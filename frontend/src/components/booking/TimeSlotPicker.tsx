import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Tooltip,
  Typography,
  Grid,
  Chip,
  Paper,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'

interface TimeSlot {
  id: number
  date: string
  startTime: string
  endTime: string
  price: number
  available: boolean
  // وضعیت خام سانس از بک‌اند: available | booked | blocked | in_competition | reserved | ...
  status?: string
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  onSelect?: (slot: TimeSlot) => void
  onBid?: (slot: TimeSlot) => void
}

// تعیین وضعیت با fallback امن: اگر status نبود از available حدس بزن؛
// وضعیت‌های ناشناختهٔ آینده باعث کرش نمی‌شوند (chip «نامشخص»، غیرقابل‌کلیک)
const statusOf = (slot: TimeSlot): string => slot.status ?? (slot.available ? 'available' : 'booked')
const isAvailableSlot = (slot: TimeSlot): boolean => statusOf(slot) === 'available'
const isBidableSlot = (slot: TimeSlot): boolean => statusOf(slot) === 'in_competition'

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const dayName = date.toLocaleDateString('fa-IR', { weekday: 'long' })
  const dayNumber = date.toLocaleDateString('fa-IR', { day: 'numeric' })
  const monthName = date.toLocaleDateString('fa-IR', { month: 'long' })

  if (isToday) return `امروز - ${dayNumber} ${monthName}`
  if (isTomorrow) return `فردا - ${dayNumber} ${monthName}`
  return `${dayName} ${dayNumber} ${monthName}`
}

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'available':
      return (
        <Chip
          label="آزاد"
          size="small"
          sx={{
            mt: 0.75,
            borderRadius: '6px',
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: 'rgba(76,175,80,0.1)',
            color: 'success.main',
          }}
        />
      )
    case 'booked':
      return (
        <Chip
          label="پر"
          size="small"
          color="error"
          sx={{ mt: 0.75, borderRadius: '6px', height: 20, fontSize: '0.75rem', fontWeight: 600 }}
        />
      )
    case 'blocked':
      return (
        <Chip
          label="مسدود"
          size="small"
          sx={{
            mt: 0.75,
            borderRadius: '6px',
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: 'rgba(15,23,42,0.06)',
            color: 'text.disabled',
          }}
        />
      )
    case 'reserved':
      return (
        <Chip
          label="رزرو قرارداد"
          size="small"
          sx={{
            mt: 0.75,
            borderRadius: '6px',
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: 'rgba(139,92,246,0.12)',
            color: '#7c3aed',
          }}
        />
      )
    case 'in_competition':
      return (
        <Chip
          icon={<Icon icon="mdi:gavel" className="h-3 w-3" />}
          label="رقابت با بقیه"
          size="small"
          sx={{
            mt: 0.75,
            borderRadius: '6px',
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
            color: 'white',
            '& .MuiChip-icon': { color: 'white', ml: '4px' },
          }}
        />
      )
    default:
      return (
        <Chip
          label="نامشخص"
          size="small"
          sx={{
            mt: 0.75,
            borderRadius: '6px',
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: 'rgba(15,23,42,0.06)',
            color: 'text.disabled',
          }}
        />
      )
  }
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, onSelect, onBid }) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (slot: TimeSlot) => {
    setSelected(slot.id)
    onSelect?.(slot)
  }

  // Group slots by date
  const groupedSlots = useMemo(() => {
    const groups: { [date: string]: TimeSlot[] } = {}
    slots.forEach(slot => {
      if (!groups[slot.date]) {
        groups[slot.date] = []
      }
      groups[slot.date].push(slot)
    })
    // Sort dates
    const sortedDates = Object.keys(groups).sort()
    return sortedDates.map(date => ({
      date,
      slots: groups[date],
    }))
  }, [slots])

  if (!slots || slots.length === 0) {
    return (
      <Box sx={{
        textAlign: 'center',
        py: 6,
        px: 2,
        bgcolor: 'rgba(0,0,0,0.02)',
        borderRadius: '16px',
      }}>
        <Box sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(37,99,235,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}>
          <Icon icon="mdi:calendar-remove" className="h-10 w-10" style={{ color: '#2563eb' }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          سانسی موجود نیست
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          برای تاریخ انتخاب شده سانسی یافت نشد
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:clock-outline" className="h-5 w-5" style={{ color: '#2563eb' }} />
          سانس‌های موجود
        </Typography>
        <Chip
          label={`${slots.filter(isAvailableSlot).length} سانس آزاد`}
          size="small"
          sx={{
            borderRadius: '8px',
            bgcolor: 'rgba(76,175,80,0.1)',
            color: 'success.main',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      {groupedSlots.map((group, groupIndex) => (
        <Box key={group.date} sx={{ mb: groupIndex < groupedSlots.length - 1 ? 3 : 0 }}>
          {/* Date Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            mt: groupIndex > 0 ? 1 : 0,
          }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon icon="mdi:calendar" className="h-4.5 w-4.5" style={{ color: '#2563eb' }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {formatDate(group.date)}
            </Typography>
            <Chip
              label={`${group.slots.filter(isAvailableSlot).length} سانس`}
              size="small"
              sx={{
                borderRadius: '6px',
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: 'rgba(37,99,235,0.08)',
                color: 'primary.main',
              }}
            />
          </Box>

          {/* Slots Grid */}
          <Grid container spacing={1.5}>
            {group.slots.map((slot, index) => {
              const st = statusOf(slot)
              const bidable = isBidableSlot(slot)
              const reserved = st === 'reserved'
              const clickable = isAvailableSlot(slot) || bidable

              const card = (
                <Paper
                  elevation={selected === slot.id ? 4 : 1}
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    borderRadius: '12px',
                    cursor: clickable ? 'pointer' : 'not-allowed',
                    opacity: clickable ? 1 : 0.55,
                    border: selected === slot.id ? '2px solid' : bidable ? '1.5px solid rgba(124,58,237,0.5)' : '1px solid',
                    borderColor: selected === slot.id
                      ? 'primary.main'
                      : bidable
                        ? 'rgba(124,58,237,0.5)'
                        : reserved
                          ? 'rgba(139,92,246,0.35)'
                          : 'rgba(0,0,0,0.06)',
                    bgcolor: bidable ? 'rgba(124,58,237,0.04)' : reserved ? 'rgba(139,92,246,0.05)' : undefined,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': selected === slot.id ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                    } : {},
                    '&:hover': clickable ? {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                      borderColor: bidable ? '#7c3aed' : 'primary.light',
                    } : {},
                  }}
                  onClick={() => {
                    if (isAvailableSlot(slot)) handleSelect(slot)
                    else if (bidable) onBid?.(slot)
                  }}
                >
                  {/* Time */}
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25, fontSize: '0.85rem' }}>
                    {slot.startTime}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1, fontSize: '0.75rem' }}>
                    {slot.endTime}
                  </Typography>

                  {/* Divider */}
                  <Box sx={{
                    height: '1px',
                    bgcolor: 'rgba(0,0,0,0.06)',
                    mb: 1,
                  }} />

                  {/* Price */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: bidable ? '#7c3aed' : 'primary.main',
                      fontSize: '0.8rem',
                      textDecoration: reserved ? 'line-through' : 'none',
                    }}
                  >
                    {formatPrice(slot.price)}
                  </Typography>

                  {/* Status */}
                  <StatusChip status={st} />

                  {/* Selected Check */}
                  {selected === slot.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      style={{ position: 'absolute', top: 6, right: 6 }}
                    >
                      <Box sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon icon="mdi:check" className="h-3 w-3" style={{ color: 'white' }} />
                      </Box>
                    </motion.div>
                  )}
                </Paper>
              )

              return (
                <Grid key={slot.id} size={{ xs: 4, sm: 3, md: 2 }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    {reserved ? (
                      <Tooltip title="این سانس مربوط به قرارداد است" arrow>
                        <Box component="span" sx={{ display: 'block' }}>{card}</Box>
                      </Tooltip>
                    ) : (
                      card
                    )}
                  </motion.div>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  )
}

export default TimeSlotPicker