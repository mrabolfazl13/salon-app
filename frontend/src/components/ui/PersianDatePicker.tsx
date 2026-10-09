// frontend/src/components/ui/PersianDatePicker.tsx
// Reusable Jalali date picker: displays a Shamsi month grid, but the public
// value/onChange contract is Gregorian ISO (YYYY-MM-DD) so API payloads and
// the data layer are untouched. Empty value = clearable '' (useful for filters).

import React, { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Grid,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import {
  fromJalali,
  getTodayISO,
  jalaliMonthLength,
  jalaliMonthNames,
  jalaliWeekdayNamesShort,
  toJalali,
  toPersianDigits,
  formatJalaliDate,
} from '@/lib/jalali'

export interface PersianDatePickerProps {
  /** Gregorian ISO date (YYYY-MM-DD); '' means empty */
  value: string
  onChange: (iso: string) => void
  label?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  helperText?: React.ReactNode
  /** Gregorian ISO bounds for selectable days */
  min?: string
  max?: string
  /** show "پاک کردن" in the panel (default: true) */
  clearable?: boolean
  sx?: object
}

interface View {
  jy: number
  jm: number
}

const shiftMonth = (v: View, delta: number): View => {
  const n = v.jy * 12 + (v.jm - 1) + delta
  return { jy: Math.floor(n / 12), jm: ((n % 12) + 12) % 12 + 1 }
}

const cellBase: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  fontWeight: 600,
  background: 'transparent',
  color: '#0f172a',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  label,
  size = 'medium',
  fullWidth = true,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  min,
  max,
  clearable = true,
  sx,
}) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => toJalali(value), [value])
  const todayIso = getTodayISO()

  const [view, setView] = useState<View>(() => {
    const j = toJalali(value) ?? toJalali(todayIso)
    return { jy: j!.jy, jm: j!.jm }
  })

  const openPanel = () => {
    if (disabled || readOnly) return
    const j = toJalali(value) ?? toJalali(todayIso)
    if (j) setView({ jy: j.jy, jm: j.jm })
    setOpen(true)
  }

  const monthLen = jalaliMonthLength(view.jy, view.jm)
  const firstWeekday = useMemo(() => {
    const iso = fromJalali(view.jy, view.jm, 1)
    const dt = new Date(`${iso}T00:00:00`)
    return (dt.getDay() + 1) % 7 // Saturday-first column index
  }, [view.jy, view.jm])

  const canPick = (iso: string) =>
    (!min || iso >= min) && (!max || iso <= max)

  const pick = (iso: string) => {
    onChange(iso)
    setOpen(false)
  }

  const prevYear = shiftMonth({ jy: view.jy - 1, jm: view.jm }, 0)
  const nextYear = shiftMonth({ jy: view.jy + 1, jm: view.jm }, 0)

  return (
    <>
      <Box ref={anchorRef} sx={{ position: 'relative', ...(sx as object) }}>
        <TextField
          fullWidth={fullWidth}
          size={size}
          label={label}
          value={value ? formatJalaliDate(value, { format: 'numeric', digits: 'en' }) : ''}
          disabled={disabled}
          error={error}
          helperText={helperText}
          onClick={openPanel}
          slotProps={{
            inputLabel: { shrink: !!label },
            htmlInput: {
              style: { cursor: readOnly ? 'default' : 'pointer', textAlign: 'start' },
              placeholder: value ? undefined : '—',
              dir: 'ltr',
              readOnly: true,
            },
            input: {
              sx: { borderRadius: '10px' },
              endAdornment: !readOnly ? (
                <IconButton
                  size="small"
                  onClick={openPanel}
                  disabled={disabled}
                  aria-label="انتخاب تاریخ"
                  sx={{ color: 'primary.main' }}
                >
                  <Icon icon="mdi:calendar-month-outline" style={{ width: 20, height: 20 }} />
                </IconButton>
              ) : undefined,
            },
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1.5, borderRadius: '14px', direction: 'rtl' } } }}
      >
        <Box sx={{ width: 306 }} dir="rtl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex' }}>
              <IconButton size="small" onClick={() => setView(prevYear)} aria-label="سال قبل">
                <Icon icon="mdi:chevron-double-left" style={{ width: 18, height: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={() => setView(shiftMonth(view, -1))} aria-label="ماه قبل">
                <Icon icon="mdi:chevron-left" style={{ width: 18, height: 18 }} />
              </IconButton>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {toPersianDigits(`${jalaliMonthNames[view.jm - 1]} ${view.jy}`)}
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <IconButton size="small" onClick={() => setView(shiftMonth(view, 1))} aria-label="ماه بعد">
                <Icon icon="mdi:chevron-right" style={{ width: 18, height: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={() => setView(nextYear)} aria-label="سال بعد">
                <Icon icon="mdi:chevron-double-right" style={{ width: 18, height: 18 }} />
              </IconButton>
            </Box>
          </Box>

          <Grid container sx={{ mb: 0.5 }}>
            {jalaliWeekdayNamesShort.map((d) => (
              <Grid size={{ xs: 1 }} key={d}>
                <Typography
                  sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', lineHeight: '28px' }}
                >
                  {d}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container rowSpacing={0.25}>
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <Grid size={{ xs: 1 }} key={`b${i}`} />
            ))}
            {Array.from({ length: monthLen }).map((_, i) => {
              const jd = i + 1
              const iso = fromJalali(view.jy, view.jm, jd)
              const isSelected = !!selected && selected.jy === view.jy && selected.jm === view.jm && selected.jd === jd
              const isToday = iso === todayIso
              const enabled = !!iso && canPick(iso)
              return (
                <Grid size={{ xs: 1 }} key={jd} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => pick(iso)}
                    style={{
                      ...cellBase,
                      background: isSelected
                        ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                        : 'transparent',
                      color: isSelected ? '#fff' : enabled ? '#0f172a' : 'rgba(15,23,42,0.25)',
                      cursor: enabled ? 'pointer' : 'default',
                      boxShadow: !isSelected && isToday ? 'inset 0 0 0 1.5px #2563eb' : 'none',
                    }}
                    aria-pressed={isSelected}
                  >
                    {toPersianDigits(jd)}
                  </button>
                </Grid>
              )
            })}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              size="small"
              onClick={() => {
                const t = toJalali(todayIso)!
                setView({ jy: t.jy, jm: t.jm })
                if (canPick(todayIso)) pick(todayIso)
              }}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              امروز
            </Button>
            {clearable && value ? (
              <Button
                size="small"
                color="error"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
              >
                پاک کردن
              </Button>
            ) : null}
          </Box>
        </Box>
      </Popover>
    </>
  )
}

export interface PersianDateRangePickerProps {
  start: string
  end: string
  onStartChange: (iso: string) => void
  onEndChange: (iso: string) => void
  startLabel?: string
  endLabel?: string
  size?: 'small' | 'medium'
  spacing?: number
}

/** دو انتخابگر کنار هم با محدودیت متقابل (پایان >= شروع) */
export const PersianDateRangePicker: React.FC<PersianDateRangePickerProps> = ({
  start,
  end,
  onStartChange,
  onEndChange,
  startLabel = 'از تاریخ',
  endLabel = 'تا تاریخ',
  size = 'medium',
  spacing = 2,
}) => (
  <Grid container spacing={spacing}>
    <Grid size={{ xs: 6 }}>
      <PersianDatePicker label={startLabel} value={start} onChange={onStartChange} max={end || undefined} size={size} />
    </Grid>
    <Grid size={{ xs: 6 }}>
      <PersianDatePicker label={endLabel} value={end} onChange={onEndChange} min={start || undefined} size={size} />
    </Grid>
  </Grid>
)

export default PersianDatePicker