import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Slider,
  Switch,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { formatPrice } from '@/lib/utils'
import { radii } from '@/theme'
import PrimaryButton from './PrimaryButton'
import { SPORTS, Sport } from './SportChip'

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
            bgcolor: '#ffffff',
          },
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 1.5, pb: 'calc(24px + env(safe-area-inset-bottom))' }}>
        {/* هندل + هدر */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.12)' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
            فیلترها
            {activeCount > 0 && (
              <Box component="span" sx={{ fontSize: '0.75rem', color: '#2563eb', mr: 1 }}>
                ({activeCount.toLocaleString('fa-IR')})
              </Box>
            )}
          </Typography>
          <IconButton onClick={onClose} aria-label="بستن" sx={{ width: 44, height: 44 }}>
            <Icon icon="mdi:close" style={{ width: 22, height: 22 }} />
          </IconButton>
        </Box>

        {/* نوع ورزش */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.25, color: '#334155' }}>
          نوع ورزش
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {SPORTS.map((sport) => (
            <Chip
              key={sport.key}
              icon={<span style={{ fontSize: 16 }}>{sport.emoji}</span>}
              label={sport.label}
              onClick={() => handleSport(sport)}
              color="primary"
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                bgcolor: draft.sportKey === sport.key ? 'rgba(37,99,235,0.1)' : 'rgba(15,23,42,0.04)',
                border: draft.sportKey === sport.key ? '1px solid #2563eb' : '1px solid transparent',
              }}
            />
          ))}
        </Box>

        {/* محدوده قیمت */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, color: '#334155' }}>
          محدوده قیمت
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>
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
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.25, color: '#334155' }}>
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
                      bgcolor: on ? 'rgba(37,99,235,0.1)' : 'rgba(15,23,42,0.04)',
                      border: on ? '1px solid #2563eb' : '1px solid transparent',
                      color: on ? '#2563eb' : '#334155',
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
            <Icon icon="mdi:shield-check" style={{ width: 20, height: 20, color: '#16a34a' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
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
              border: '1.5px solid rgba(15,23,42,0.12)',
              color: '#475569',
              '&:hover': { background: 'rgba(15,23,42,0.04)', border: '1.5px solid rgba(15,23,42,0.2)' },
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
