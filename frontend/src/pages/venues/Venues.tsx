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
import { toPersianDigits } from '@/utils/l10n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import type { Venue } from '@/types'

/** اندازهٔ دستهٔ اولیه — ۱۲ کارت ≈ ۳ صفحهٔ ۳۹۰px؛ بعد از آن «نمایش بیشتر» +۱۲ تا */
const BATCH = 12

/** مرتب‌سازی‌های فقط-کلاینت: همه از فیلدهای موجود در VenueResponse قابل محاسبه‌اند */
type VenueSort = 'recommended' | 'cheapest' | 'newest' | 'rating'

const SORT_OPTIONS: { value: VenueSort; label: string }[] = [
  { value: 'recommended', label: 'پیشنهاد ما' },
  { value: 'cheapest', label: 'ارزان‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'rating', label: 'بامتیازترین' },
]

/** شهر از بخش اول آدرس استخراج می‌شود — فیلد city در قرارداد API وجود ندارد */
const cityOf = (v: Venue): string => {
  const first = (v.address || '').split(/[،,]/)[0]?.trim()
  return first && first.length <= 16 ? first : ''
}

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
      'flex gap-0.5 rounded-lg bg-foreground/5 p-0.5 dark:bg-white/5',
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
            'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[0.68rem] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            fullWidth && 'flex-1',
            active
              ? 'bg-card font-extrabold text-amber-800 shadow-sm dark:bg-amber-400 dark:text-amber-950'
              : 'font-semibold text-muted-foreground hover:text-foreground'
          )}
        >
          {o.icon && <Icon icon={o.icon} aria-hidden="true" className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      )
    })}
  </div>
)

/** انتخاب‌گر فشردهٔ نوار ابزار — ارتفاع ۴۴px، متن ریز هم‌سبک کارت‌ها */
const ToolbarSelect: React.FC<{
  ariaLabel: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}> = ({ ariaLabel, value, onChange, children }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger
      aria-label={ariaLabel}
      className="h-11 min-h-11 w-full min-w-0 rounded-lg border-border bg-card px-2.5 text-[0.72rem] font-bold shadow-sm"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
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
  const [sort, setSort] = useState<VenueSort>('recommended')
  const [city, setCity] = useState('all')
  /** تعداد کارت‌های فعلی — با هر تغییر فیلتر/مرتب‌سازی به دستهٔ اولیه برمی‌گردد */
  const [visible, setVisible] = useState(BATCH)
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
      if (city !== 'all' && cityOf(v) !== city) return false
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
  }, [venues, search, filters, city])

  /** فهرست شهرها از پیشوند آدرس — فقط وقتی بیش از یک شهر در داده هست فیلتر نمایش داده می‌شود */
  const cities = useMemo(() => {
    const map = new Map<string, number>()
    venues.forEach((v) => {
      const c = cityOf(v)
      if (c) map.set(c, (map.get(c) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [venues])

  const sortedVenues = useMemo(() => {
    const arr = [...filteredVenues]
    const byPrice = (v: Venue) => v.price || 0
    const byRating = (v: Venue) => v.average_rating || 0
    switch (sort) {
      case 'cheapest':
        arr.sort((a, b) => byPrice(a) - byPrice(b) || byRating(b) - byRating(a))
        break
      case 'newest':
        arr.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        )
        break
      case 'rating':
        arr.sort(
          (a, b) => byRating(b) - byRating(a) || (b.total_reviews || 0) - (a.total_reviews || 0),
        )
        break
      default:
        // پیش‌فرض: تأییدشده، بعد بامتیاز، بعد ارزان‌تر
        arr.sort(
          (a, b) =>
            Number(b.is_verified) - Number(a.is_verified) ||
            byRating(b) - byRating(a) ||
            byPrice(a) - byPrice(b),
        )
    }
    return arr
  }, [filteredVenues, sort])

  const shownVenues = useMemo(() => sortedVenues.slice(0, visible), [sortedVenues, visible])
  const remaining = Math.max(0, sortedVenues.length - shownVenues.length)

  // هر تغییر فهرست = بازگشت به دستهٔ اولیه (وگرنه کاربر در میان ۶۸ کارت گم می‌شود)
  useEffect(() => {
    setVisible(BATCH)
  }, [category, search, filters, city, sort])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.sportKey) n += 1
    if (filters.minPrice != null || filters.maxPrice != null) n += 1
    if (filters.verifiedOnly) n += 1
    if (city !== 'all') n += 1
    n += filters.amenities?.length ?? 0
    return n
  }, [filters, city])

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
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 via-amber-500 to-orange-500 text-stone-900 shadow-sm">
                <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} aria-hidden="true" className="h-4 w-4" />
              </span>
              <h1 className="text-[1.1rem] font-extrabold leading-snug text-foreground">
                {category === 'futsal' ? 'سالن‌های فوتسال' : 'باشگاه‌های بدنسازی'}
              </h1>
            </div>
            <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
              {category === 'futsal'
                ? 'سالن مورد نظر خود را در قم پیدا و رزرو کنید'
                : 'باشگاه بدنسازی مورد نظر خود را در قم پیدا کنید'}
            </p>
          </div>
        </motion.div>

        {/* دسته‌بندی — قطعه‌ای تمام‌عرض */}
        <div className="mb-4">
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
        <div className="mb-3 flex items-center gap-2">
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
            aria-label={`فیلترها${activeFilterCount > 0 ? ` (${toPersianDigits(activeFilterCount)} فعال)` : ''}`}
            className={cn(
              'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-card shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              hasFilters
                ? 'border-amber-500/60 text-amber-800 dark:border-amber-400/55 dark:text-amber-400'
                : 'border-border text-muted-foreground'
            )}
          >
            <Icon icon="mdi:tune-variant" aria-hidden="true" className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[0.6rem] font-bold text-stone-900">
                {toPersianDigits(activeFilterCount)}
              </span>
            )}
          </button>
        </div>

        {/* مرتب‌سازی + شهر — ردیف مستقل تا در ۳۹۰px له نشود */}
        <div className="mb-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ToolbarSelect ariaLabel="مرتب‌سازی" value={sort} onChange={(v) => setSort(v as VenueSort)}>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="min-h-11 text-[0.8rem]">
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      icon={
                        o.value === 'cheapest'
                          ? 'mdi:tag-outline'
                          : o.value === 'newest'
                            ? 'mdi:star-four-points-outline'
                            : o.value === 'rating'
                              ? 'mdi:star-outline'
                              : 'mdi:sort-bool-ascending-variant'
                      }
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-400"
                    />
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </ToolbarSelect>
          </div>
          {cities.length > 1 && (
            <div className="min-w-0 flex-1">
              <ToolbarSelect ariaLabel="شهر" value={city} onChange={setCity}>
                <SelectItem value="all" className="min-h-11 text-[0.8rem]">
                  همهٔ شهرها
                </SelectItem>
                {cities.map(([name, count]) => (
                  <SelectItem key={name} value={name} className="min-h-11 text-[0.8rem]">
                    {name} ({toPersianDigits(count)})
                  </SelectItem>
                ))}
              </ToolbarSelect>
            </div>
          )}
        </div>

        {/* چیپ‌های فیلتر فعال */}
        {activeChips.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {activeChips.map((c) => (
              <span
                key={c.key}
                className="inline-flex min-h-11 items-center gap-1 rounded-md bg-amber-500/10 px-2 text-[0.68rem] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              >
                {c.label}
                {/* هدف لمسی ۴۴×۴۴ با حاشیهٔ منفی: ظاهر چیپ فشرده می‌ماند */}
                <button
                  type="button"
                  onClick={c.onRemove}
                  aria-label={`حذف فیلتر ${c.label}`}
                  className="-mx-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-800 transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-400"
                >
                  <Icon icon="mdi:close" aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => { setFilters({}); setCity('all') }}
              aria-label="پاک کردن همه فیلترها"
              className="inline-flex min-h-11 items-center gap-1.5 px-1.5 text-[0.68rem] font-semibold text-muted-foreground transition-colors hover:text-red-600 dark:hover:text-red-400"
            >
              <Icon icon="mdi:filter-remove-outline" aria-hidden="true" className="h-3.5 w-3.5" />
              پاک کردن همه
            </button>
          </div>
        )}

        {/* ردیف نتیجه: شمارش + سوییچ لیست/نقشه */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[0.68rem] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
            <Icon icon={category === 'futsal' ? 'mdi:stadium' : 'mdi:dumbbell'} aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {toPersianDigits(sortedVenues.length)} {category === 'futsal' ? 'سالن' : 'باشگاه'} یافت شد
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
            <VenueCardSkeletonList count={4} />
          ) : fetchError ? (
            <ErrorState
              title="خطا در دریافت سالن‌ها"
              description="مشکلی در ارتباط با سرور پیش آمد."
              onRetry={getVenues}
            />
          ) : sortedVenues.length === 0 ? (
            <EmptyState
              icon={category === 'futsal' ? 'mdi:stadium-outline' : 'mdi:dumbbell'}
              title={category === 'futsal' ? 'سالنی یافت نشد' : 'باشگاهی یافت نشد'}
              description="عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید"
              actionLabel={hasFilters ? 'پاک کردن فیلترها' : undefined}
              onAction={
                hasFilters
                  ? () => { setFilters({}); setCity('all'); setSearch('') }
                  : undefined
              }
            />
          ) : (
            <>
              {/* شمارندهٔ تدریجی: چند کارت از چند کارت روی صفحه است */}
              <p className="mb-2 text-[0.68rem] font-semibold text-muted-foreground">
                نمایش {toPersianDigits(shownVenues.length)} از {toPersianDigits(sortedVenues.length)}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
                {shownVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} onBook={(id) => navigate(`/venues/${id}`)} />
                ))}
              </div>

              {/* دسته‌های بعدی با کلیک صریح — بدون اسکرول بی‌پایان ۲۴ صفحه‌ای */}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setVisible((n) => n + BATCH)}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-[0.78rem] font-extrabold text-foreground shadow-sm transition-colors hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  نمایش بیشتر
                  <span className="font-semibold text-muted-foreground">
                    (+{toPersianDigits(Math.min(BATCH, remaining))} از {toPersianDigits(remaining)})
                  </span>
                  <Icon icon="mdi:chevron-down" aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              {remaining === 0 && sortedVenues.length > BATCH && (
                <p className="mt-4 text-center text-[0.68rem] font-semibold text-muted-foreground">
                  همهٔ {toPersianDigits(sortedVenues.length)} مورد نمایش داده شد
                </p>
              )}
            </>
          )
        ) : (
          <div className="h-[50dvh] min-h-[280px] overflow-hidden rounded-lg border border-border shadow-sm md:h-[calc(100vh-260px)]">
            <VenueMap
              venues={sortedVenues.map((v) => ({
                id: v.id, name: v.name, lat: v.latitude, lng: v.longitude,
                isVerified: v.is_verified, address: v.address, price: v.price,
              }))}
              center={{ lat: 34.6427, lng: 50.8814 }}
              zoom={12}
              height="100%"
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
