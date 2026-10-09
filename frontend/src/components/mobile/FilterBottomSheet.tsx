import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Slider,
  Switch,
  Typography,
  useTheme,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { formatPrice } from '@/lib/utils'
import { radii } from '@/theme'
import PrimaryButton from './PrimaryButton'
import { SPORTS, type Sport } from './SportChip'

export interface VenueFilters {
  category?: 'futsal' | 'gym'
  sportKey?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  verifiedOnly?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  /** حداکثر قیمت در داده‌ها (برای مقیاس اسلایدر) */
  priceCeiling: number
  /** لیست امکانات موجود در نتایج */
  amenityOptions: string[]
  value: VenueFilters
  onApply: (filters: VenueFilters) => void
}

const PRICE_FLOOR = 0

/** فیلترها به‌صورت Bottom Sheet در موبایل — هرگز سایدبار نیست */
const FilterBottomSheet: React.FC<Props> = ({
  open,
  onClose,
  priceCeiling,
  amenityOptions,
  value,
  onApply,
}) => {
  const ceiling = Math.max(priceCeiling, 100000)
  const [draft, setDraft] = useState<VenueFilters>(value)
  const dark = useTheme().palette.mode === 'dark'

  // همگام‌سازی با فیلترهای اعمال‌شده هر بار که شیت باز می‌شود
  useEffect(() => {
    if (open) setDraft(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const priceRange = useMemo<[number, number]>(
    () => [draft.minPrice ?? PRICE_FLOOR, draft.maxPrice ?? ceiling],
    [draft.minPrice, draft.maxPrice, ceiling],
  )

  const activeCount = useMemo(() => {
    let n = 0
    if (draft.category) n += 1
    if (draft.minPrice != null || draft.maxPrice != null) n += 1
    if (draft.verifiedOnly) n += 1
    n += draft.amenities?.length ?? 0
    return n
  }, [draft])

  const handleSport = (sport: Sport) => {
    setDraft((d) =>
      d.sportKey === sport.key
        ? { ...d, sportKey: undefined, category: undefined }
        : { ...d, sportKey: sport.key, category: sport.category },
    )
  }

  const toggleAmenity = (a: string) => {
    setDraft((d) => {
      const cur = d.amenities ?? []
      return {
        ...d,
        amenities: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a],
      }
    })
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: radii.sheet,
            borderTopRightRadius: radii.sheet,
            maxHeight: '86dvh',
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 1.5, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
        {/* هندل + هدر */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
            فیلترها
            {activeCount > 0 && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: dark ? '#fbbf24' : '#d97706', mr: 1, fontWeight: 700 }}>
                ({activeCount.toLocaleString('fa-IR')})
              </Box>
            )}
          </Typography>
          <IconButton onClick={onClose} aria-label="بستن" sx={{ width: 44, height: 44, color: 'text.primary' }}>
            <Icon icon="mdi:close" style={{ width: 22, height: 22 }} />
          </IconButton>
        </Box>

        {/* نوع ورزش */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.25, color: 'text.primary' }}>
          نوع ورزش
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {SPORTS.map((sport) => {
            const on = draft.sportKey === sport.key
            return (
              <Chip
                key={sport.key}
                icon={
                  <Icon
                    icon={sport.icon}
                    style={{ width: 16, height: 16, color: on ? (dark ? '#fcd34d' : '#b45309') : (dark ? '#fbbf24' : '#d97706') }}
                  />
                }
                label={sport.label}
                onClick={() => handleSport(sport)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  bgcolor: on
                    ? dark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)'
                    : dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
                  color: on ? (dark ? '#fcd34d' : '#b45309') : 'text.primary',
                  border: on
                    ? `1px solid ${dark ? '#fbbf24' : '#f59e0b'}`
                    : '1px solid transparent',
                }}
              />
            )
          })}
        </Box>

        {/* محدوده قیمت */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, color: 'text.primary' }}>
          محدوده قیمت
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
          {formatPrice(priceRange[0])} تا {formatPrice(priceRange[1])}
        </Typography>
        <Slider
          value={priceRange}
          min={PRICE_FLOOR}
          max={ceiling}
          step={50000}
          onChange={(_, v) => {
            const [lo, hi] = v as [number, number]
            setDraft((d) => ({
              ...d,
              minPrice: lo <= PRICE_FLOOR ? undefined : lo,
              maxPrice: hi >= ceiling ? undefined : hi,
            }))
          }}
          valueLabelDisplay="auto"
          getAriaValueText={(v) => formatPrice(v)}
          sx={{ mb: 3 }}
        />

        {/* امکانات */}
        {amenityOptions.length > 0 && (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.25, color: 'text.primary' }}>
              امکانات
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {amenityOptions.slice(0, 12).map((a) => {
                const on = draft.amenities?.includes(a) ?? false
                return (
                  <Chip
                    key={a}
                    label={a}
                    onClick={() => toggleAmenity(a)}
                    sx={{
                      borderRadius: '10px',
                      fontWeight: 600,
                      bgcolor: on
                        ? dark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)'
                        : dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
                      border: on
                        ? `1px solid ${dark ? '#fbbf24' : '#f59e0b'}`
                        : '1px solid transparent',
                      color: on ? (dark ? '#fcd34d' : '#b45309') : 'text.primary',
                    }}
                  />
                )
              })}
            </Box>
          </>
        )}

        {/* فقط تأیید شده */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:shield-check" style={{ width: 20, height: 20, color: dark ? '#34d399' : '#16a34a' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>
              فقط سالن‌های تأیید شده
            </Typography>
          </Box>
          <Switch
            checked={draft.verifiedOnly ?? false}
            onChange={(e) => setDraft((d) => ({ ...d, verifiedOnly: e.target.checked || undefined }))}
          />
        </Box>

        {/* اکشن‌ها */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <PrimaryButton
            onClick={() => {
              onApply(draft)
              onClose()
            }}
            sx={{ flex: 2 }}
          >
            اعمال فیلتر
          </PrimaryButton>
          <PrimaryButton
            onClick={() => {
              const empty: VenueFilters = {}
              setDraft(empty)
              onApply(empty)
              onClose()
            }}
            sx={{
              flex: 1,
              background: 'none',
              boxShadow: 'none',
              border: `1.5px solid ${dark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)'}`,
              color: 'text.secondary',
              '&:hover': {
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
                border: `1.5px solid ${dark ? 'rgba(255,255,255,0.24)' : 'rgba(15,23,42,0.2)'}`,
              },
            }}
          >
            پاک کردن
          </PrimaryButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default FilterBottomSheet
