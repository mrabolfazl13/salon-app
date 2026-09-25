// src/pages/venues/Venues.tsx — لیست سالن‌ها: موبایل‌فرست و مدرن (هم‌خانواده با Home)
// + فیلتر Bottom Sheet + نمای لیست/نقشه + پارامترهای URL
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Box, Typography, Chip, Badge, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import Layout from '@/components/layout/Layout'
import VenueCard from '@/components/venue/VenueCard'
import VenueMap from '@/components/venue/VenueMap'
import {
  FilterBottomSheet,
  SearchBar,
  EmptyState,
  ErrorState,
  VenueCardSkeletonList,
  SPORTS,
  type VenueFilters,
} from '@/components/mobile'
import { venueService } from '@/services/venue'
import { formatPrice } from '@/lib/utils'
import { radii, shadows } from '@/theme'
import type { Venue } from '@/types'

/** گرید واکنش‌گرا — دقیقاً مثل Home (minmax(0,1fr) برای جلوگیری از سرریز) */
const venueGrid = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
  },
  gap: { xs: 2, sm: 2.5 },
} as const

interface SegOption {
  value: string
  label: string
  icon?: string
}

/** کنترل قطعه‌ای (Segmented) — همان سبک تب‌های بنر Home */
const Segmented: React.FC<{
  options: SegOption[]
  value: string
  onChange: (v: string) => void
  fullWidth?: boolean
}> = ({ options, value, onChange, fullWidth = false }) => {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  return (
  <Box
    sx={{
      display: 'flex',
      gap: 0.5,
      p: 0.5,
      width: fullWidth ? '100%' : 'auto',
      borderRadius: `${radii.button}px`,
      bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
    }}
  >
    {options.map((o) => {
      const active = o.value === value
      return (
        <Box
          key={o.value}
          onClick={() => onChange(o.value)}
          sx={{
            flex: fullWidth ? 1 : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            px: 2,
            minHeight: 40,
            borderRadius: `${Math.max(radii.button - 6, 8)}px`,
            cursor: 'pointer',
            userSelect: 'none',
            fontWeight: active ? 800 : 600,
            fontSize: '0.85rem',
            color: active ? '#92400e' : dark ? '#9aa7b8' : '#64748b',
            bgcolor: active ? (dark ? '#fbbf24' : '#fff') : 'transparent',
            boxShadow: active
              ? dark
                ? '0 2px 10px rgba(251,191,36,0.25)'
                : '0 2px 8px rgba(15,23,42,0.10)'
              : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {o.icon && <Icon icon={o.icon} style={{ width: 18, height: 18 }} />}
          {o.label}
        </Box>
      )
    })}
  </Box>
  )
}

const Venues: React.FC = () => {
  const [search, setSearch] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [category, setCategory] = useState<'futsal' | 'gym'>('futsal')
  const [filters, setFilters] = useState<VenueFilters>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // پارامترهای URL از چیپ ورزش‌های Home: /venues?category=X&search=Y
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat === 'futsal' || cat === 'gym') setCategory(cat)
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  const getVenues = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const items = await venueService.getAll({ category })
      if (items) setVenues(items)
    } catch {
      setFetchError(true)
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { getVenues() }, [category])

  // مقیاس اسلایدر قیمت + گزینه‌های امکانات از داده‌های واقعی
  const priceCeiling = useMemo(
    () => venues.reduce((max, v) => Math.max(max, v.price || 0), 0),
    [venues],
  )
  const amenityOptions = useMemo(() => {
    const set = new Set<string>()
    venues.forEach((v) => (v.amenities || []).forEach((a) => set.add(a)))
    return Array.from(set)
  }, [venues])

  const filteredVenues = useMemo(() => {
    const text = search.trim().toLowerCase()
    const sq = filters.sportKey ? SPORT_QUERIES[filters.sportKey]?.toLowerCase() : undefined
    return venues.filter((v) => {
      const haystack = `${v.name || ''} ${v.address || ''}`.toLowerCase()
      if (text && !haystack.includes(text)) return false
      if (sq && !haystack.includes(sq) && !(v.amenities || []).some((a) => a.toLowerCase().includes(sq))) return false
      if (filters.minPrice != null && (v.price || 0) < filters.minPrice) return false
      if (filters.maxPrice != null && (v.price || 0) > filters.maxPrice) return false
      if (filters.verifiedOnly && !v.is_verified) return false
      if (filters.amenities?.length) {
        const am = v.amenities || []
        if (!filters.amenities.every((a) => am.includes(a))) return false
      }
      return true
    })
  }, [venues, search, filters])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.sportKey) n += 1
    if (filters.minPrice != null || filters.maxPrice != null) n += 1
    if (filters.verifiedOnly) n += 1
    n += filters.amenities?.length ?? 0
    return n
  }, [filters])

  // چیپ‌های فیلتر فعال — قابل حذف تک‌تک
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (filters.sportKey) {
      const s = SPORTS.find((x) => x.key === filters.sportKey)
      chips.push({
        key: 'sport',
        label: s ? s.label : filters.sportKey,
        onRemove: () => setFilters((f) => ({ ...f, sportKey: undefined })),
      })
    }
    if (filters.minPrice != null || filters.maxPrice != null) {
      const label =
        filters.minPrice != null && filters.maxPrice != null
          ? `${formatPrice(filters.minPrice)} تا ${formatPrice(filters.maxPrice)}`
          : filters.minPrice != null
            ? `حداقل ${formatPrice(filters.minPrice)}`
            : `حداکثر ${formatPrice(filters.maxPrice ?? 0)}`
      chips.push({
        key: 'price',
        label,
        onRemove: () =>
          setFilters((f) => {
            const { minPrice: _min, maxPrice: _max, ...rest } = f
            return rest
          }),
      })
    }
    if (filters.verifiedOnly) {
      chips.push({
        key: 'verified',
        label: 'فقط تأییدشده',
        onRemove: () => setFilters((f) => ({ ...f, verifiedOnly: false })),
      })
    }
    ;(filters.amenities ?? []).forEach((a) => {
      chips.push({
        key: `am-${a}`,
        label: a,
        onRemove: () =>
          setFilters((f) => ({ ...f, amenities: (f.amenities ?? []).filter((x) => x !== a) })),
      })
    })
    return chips
  }, [filters])

  const applyFilters = (next: VenueFilters) => {
    setFilters(next)
    if (next.category && next.category !== category) setCategory(next.category)
    setFilterOpen(false)
  }

  const hasFilters = activeFilterCount > 0

  return (
    <Layout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* هدر صفحه — هم‌سبک سلام Home */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)',
                  color: '#1c1917',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.30)',
                  flexShrink: 0,
                }}
              >
                <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} style={{ width: 22, height: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: 'text.primary', lineHeight: 1.4 }}>
                {category === 'futsal' ? 'سالن‌های فوتسال' : 'باشگاه‌های بدنسازی'}
              </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>
              {category === 'futsal'
                ? 'سالن مورد نظر خود را در قم پیدا و رزرو کنید'
                : 'باشگاه بدنسازی مورد نظر خود را در قم پیدا کنید'}
            </Typography>
          </Box>
        </motion.div>

        {/* دسته‌بندی — قطعه‌ای تمام‌عرض */}
        <Box sx={{ mb: 2.5 }}>
          <Segmented
            fullWidth
            value={category}
            onChange={(v) => setCategory(v as 'futsal' | 'gym')}
            options={[
              { value: 'futsal', label: 'فوتسال', icon: 'mdi:soccer-field' },
              { value: 'gym', label: 'بدنسازی', icon: 'mdi:dumbbell' },
            ]}
          />
        </Box>

        {/* جستجو + دکمه فیلتر */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder={`جستجوی ${category === 'futsal' ? 'سالن' : 'باشگاه'} یا آدرس...`}
            />
          </Box>
          <Box
            onClick={() => setFilterOpen(true)}
            aria-label="فیلترها"
            sx={{
              width: 52,
              height: 52,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: `${radii.button}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: hasFilters
                ? (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.55)' : 'rgba(245,158,11,0.6)')
                : 'divider',
              boxShadow: shadows.card,
              color: hasFilters ? (t) => (t.palette.mode === 'dark' ? '#fbbf24' : '#b45309') : 'text.secondary',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Badge
              badgeContent={activeFilterCount}
              color="secondary"
              sx={{ '& .MuiBadge-badge': { minWidth: 16, height: 16, fontSize: '0.6rem' } }}
            >
              <Icon icon="mdi:tune-variant" style={{ width: 22, height: 22 }} />
            </Badge>
          </Box>
        </Box>

        {/* چیپ‌های فیلتر فعال */}
        {activeChips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
            {activeChips.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                size="small"
                onDelete={c.onRemove}
                sx={{
                  bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.10)'),
                  color: (t) => (t.palette.mode === 'dark' ? '#fcd34d' : '#92400e'),
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 30,
                  borderRadius: '10px',
                  '& .MuiChip-deleteIcon': {
                    color: (t) => (t.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                    fontSize: 16,
                  },
                }}
              />
            ))}
            <Box
              onClick={() => setFilters({})}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: '0.78rem',
                fontWeight: 600,
                '&:hover': { color: '#ef4444' },
              }}
            >
              <Icon icon="mdi:filter-remove-outline" style={{ width: 16, height: 16 }} />
              پاک کردن همه
            </Box>
          </Box>
        )}

        {/* ردیف نتیجه: شمارش + سوییچ لیست/نقشه */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              borderRadius: '10px',
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.10)'),
              color: (t) => (t.palette.mode === 'dark' ? '#fcd34d' : '#92400e'),
              fontSize: '0.8rem',
              fontWeight: 700,
              minWidth: 0,
            }}
          >
            <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} style={{ width: 16, height: 16, flexShrink: 0 }} />
            <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filteredVenues.length.toLocaleString('fa-IR')} {category === 'futsal' ? 'سالن' : 'باشگاه'}
            </Box>
          </Box>
          <Segmented
            value={view}
            onChange={(v) => setView(v as 'list' | 'map')}
            options={[
              { value: 'list', label: 'لیست', icon: 'mdi:view-grid-outline' },
              { value: 'map', label: 'نقشه', icon: 'mdi:map-outline' },
            ]}
          />
        </Box>

        {view === 'list' ? (
          loading ? (
            <VenueCardSkeletonList count={6} />
          ) : fetchError ? (
            <ErrorState
              title="خطا در دریافت سالن‌ها"
              description="مشکلی در ارتباط با سرور پیش آمد."
              onRetry={getVenues}
            />
          ) : filteredVenues.length === 0 ? (
            <EmptyState
              icon={category === 'futsal' ? 'mdi:stadium-outline' : 'mdi:dumbbell'}
              title={category === 'futsal' ? 'سالنی یافت نشد' : 'باشگاهی یافت نشد'}
              description="عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید"
              actionLabel={hasFilters ? 'پاک کردن فیلترها' : undefined}
              onAction={hasFilters ? () => { setFilters({}); setSearch('') } : undefined}
            />
          ) : (
            <Box sx={venueGrid}>
              {filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} onBook={(id) => navigate(`/venues/${id}`)} />
              ))}
            </Box>
          )
        ) : (
          <Box
            sx={{
              borderRadius: `${radii.card}px`,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: shadows.card,
              height: { xs: '62dvh', md: 'calc(100vh - 300px)' },
              minHeight: 340,
            }}
          >
            <VenueMap
              venues={filteredVenues.map((v) => ({
                id: v.id, name: v.name, lat: v.latitude, lng: v.longitude,
                isVerified: v.is_verified, address: v.address, price: v.price,
              }))}
              center={{ lat: 34.6427, lng: 50.8814 }}
              zoom={12}
              height="100%"
              onVenueClick={(venue) => navigate(`/venues/${venue.id}`)}
            />
          </Box>
        )}
      </Box>

      <FilterBottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        priceCeiling={priceCeiling}
        amenityOptions={amenityOptions}
        value={{ ...filters, category }}
        onApply={applyFilters}
      />
    </Layout>
  )
}

// نگاشت کلید ورزش → عبارت جستجو (مطابق SPORTS در SportChip)
const SPORT_QUERIES: Record<string, string> = {
  football: 'فوتبال',
  basketball: 'بسکتبال',
  volleyball: 'والیبال',
  tennis: 'تنیس',
  badminton: 'بدمینتون',
  pool: 'بیلیارد',
}

export default Venues
