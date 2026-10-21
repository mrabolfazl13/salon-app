// src/pages/venues/Venues.tsx — لیست سالن‌ها: موبایل‌فرست و مدرن (هم‌خانواده با Home)
// + فیلتر Bottom Sheet + نمای لیست/نقشه + پارامترهای URL
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
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
import { cn, formatPrice } from '@/lib/utils'
import type { Venue } from '@/types'

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
}> = ({ options, value, onChange, fullWidth = false }) => (
  <div
    className={cn(
      'flex gap-1 rounded-xl bg-foreground/5 p-1 dark:bg-white/5',
      fullWidth ? 'w-full' : 'w-auto'
    )}
  >
    {options.map((o) => {
      const active = o.value === value
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-label={o.label}
          aria-pressed={active}
          className={cn(
            'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[0.85rem] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            fullWidth && 'flex-1',
            active
              ? 'bg-card font-extrabold text-amber-800 shadow-[0_2px_8px_rgba(15,23,42,0.10)] dark:bg-amber-400 dark:text-amber-950 dark:shadow-[0_2px_10px_rgba(251,191,36,0.25)]'
              : 'font-semibold text-muted-foreground hover:text-foreground'
          )}
        >
          {o.icon && <Icon icon={o.icon} aria-hidden="true" className="h-[18px] w-[18px]" />}
          {o.label}
        </button>
      )
    })}
  </div>
)

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
    (filters.amenities ?? []).forEach((a) => {
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
      <div className="mx-auto max-w-[1000px]">
        {/* هدر صفحه — هم‌سبک سلام Home */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-500 text-stone-900 shadow-[0_4px_12px_rgba(245,158,11,0.30)]">
                <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} aria-hidden="true" className="h-[22px] w-[22px]" />
              </span>
              <h1 className="text-[1.35rem] font-extrabold leading-snug text-foreground">
                {category === 'futsal' ? 'سالن‌های فوتسال' : 'باشگاه‌های بدنسازی'}
              </h1>
            </div>
            <p className="mt-1 text-[0.85rem] text-muted-foreground">
              {category === 'futsal'
                ? 'سالن مورد نظر خود را در قم پیدا و رزرو کنید'
                : 'باشگاه بدنسازی مورد نظر خود را در قم پیدا کنید'}
            </p>
          </div>
        </motion.div>

        {/* دسته‌بندی — قطعه‌ای تمام‌عرض */}
        <div className="mb-5">
          <Segmented
            fullWidth
            value={category}
            onChange={(v) => setCategory(v as 'futsal' | 'gym')}
            options={[
              { value: 'futsal', label: 'فوتسال', icon: 'mdi:soccer-field' },
              { value: 'gym', label: 'بدنسازی', icon: 'mdi:dumbbell' },
            ]}
          />
        </div>

        {/* جستجو + دکمه فیلتر */}
        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder={`جستجوی ${category === 'futsal' ? 'سالن' : 'باشگاه'} یا آدرس...`}
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label={`فیلترها${activeFilterCount > 0 ? ` (${activeFilterCount} فعال)` : ''}`}
            className={cn(
              'relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              hasFilters
                ? 'border-amber-500/60 text-amber-700 dark:border-amber-400/55 dark:text-amber-400'
                : 'border-border text-muted-foreground'
            )}
          >
            <Icon icon="mdi:tune-variant" aria-hidden="true" className="h-6 w-6" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[0.65rem] font-bold text-stone-900">
                {activeFilterCount.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        </div>

        {/* چیپ‌های فیلتر فعال */}
        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {activeChips.map((c) => (
              <span
                key={c.key}
                className="inline-flex min-h-11 items-center gap-1 rounded-[10px] bg-amber-500/10 px-3 text-[0.8rem] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              >
                {c.label}
                <button
                  type="button"
                  onClick={c.onRemove}
                  aria-label={`حذف فیلتر ${c.label}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
                >
                  <Icon icon="mdi:close" aria-hidden="true" className="h-[18px] w-[18px]" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setFilters({})}
              aria-label="پاک کردن همه فیلترها"
              className="inline-flex min-h-11 items-center gap-2 px-2 text-[0.8rem] font-semibold text-muted-foreground transition-colors hover:text-red-600 dark:hover:text-red-400"
            >
              <Icon icon="mdi:filter-remove-outline" aria-hidden="true" className="h-[18px] w-[18px]" />
              پاک کردن همه
            </button>
          </div>
        )}

        {/* ردیف نتیجه: شمارش + سوییچ لیست/نقشه */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-[10px] bg-amber-500/10 px-3 py-2 text-[0.8rem] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
            <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">
              {filteredVenues.length.toLocaleString('fa-IR')} {category === 'futsal' ? 'سالن' : 'باشگاه'}
            </span>
          </span>
          <Segmented
            value={view}
            onChange={(v) => setView(v as 'list' | 'map')}
            options={[
              { value: 'list', label: 'لیست', icon: 'mdi:view-grid-outline' },
              { value: 'map', label: 'نقشه', icon: 'mdi:map-outline' },
            ]}
          />
        </div>

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
              {filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} onBook={(id) => navigate(`/venues/${id}`)} />
              ))}
            </div>
          )
        ) : (
          <div className="h-[62dvh] min-h-[340px] overflow-hidden rounded-2xl border border-border shadow-sm md:h-[calc(100vh-300px)]">
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
          </div>
        )}
      </div>

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
