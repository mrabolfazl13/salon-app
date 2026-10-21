// frontend/src/pages/deals/Deals.tsx
// «سانس‌های لحظه آخری» — GET /deals/available با فیلترهای سرور (حداکثر قیمت،
// بازه زمانی، مرتب‌سازی/فاصله) + جستجوی نام سالن سمت کلاینت (پارامر سرور ندارد).
// مسیر /deals فقط برای کاربران لاگین‌کرده (ProtectedRoute در App.tsx).

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import SearchBar from '@/components/mobile/SearchBar'
import { EmptyBox, ErrorBox, LoadingBox } from '@/components/finance/shared'
import { useAvailableDeals } from '@/hooks/useDeals'
import type { DealAvailableItem, DealSort, DealTimeOfDay } from '@/services/deals'
import { parseAmountInput } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import DealCard from '@/components/deals/DealCard'
import { Input } from '@/components/ui/shadcn/input'

const TIME_FILTERS: { value: DealTimeOfDay | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'morning', label: 'صبح' },
  { value: 'afternoon', label: 'عصر' },
  { value: 'evening', label: 'شب' },
]

const SORT_LABELS: { value: DealSort; label: string; needsCoords?: boolean }[] = [
  { value: 'time', label: 'نزدیک\u200cترین زمان' },
  { value: 'price_asc', label: 'ارزان\u200cترین' },
  { value: 'price_desc', label: 'گران\u200cترین' },
  { value: 'distance', label: 'نزدیک\u200cترین', needsCoords: true },
]

const Deals: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [timeFilter, setTimeFilter] = useState<DealTimeOfDay | 'all'>('all')
  const [sort, setSort] = useState<DealSort>('time')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  const params = useMemo(() => {
    const p: Record<string, unknown> = { sort, limit: 100 }
    const mp = parseAmountInput(maxPrice.trim())
    if (maxPrice.trim() && Number.isFinite(mp) && mp > 0) p.max_price = Math.round(mp)
    if (timeFilter !== 'all') p.time_of_day = timeFilter
    if (coords) {
      p.near_lat = coords.lat
      p.near_lng = coords.lng
      p.radius_km = 100
    }
    return p
  }, [sort, maxPrice, timeFilter, coords])

  const query = useAvailableDeals(params)
  const deals = query.data ?? []

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return deals
    // جستجوی نام سالن — فیلتر سمت کلاینت (سرور پارامتر نام ندارد)
    return deals.filter((d) => d.venue_name.toLowerCase().includes(q))
  }, [deals, search])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('مرورگر شما موقعیت مکانی را پشتیبانی نمی\u200cکند')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSort('distance')
        setLocating(false)
        toast.success('مرتب\u200cسازی بر اساس نزدیک\u200cترین سالن')
      },
      () => {
        setLocating(false)
        toast.error('دسترسی به موقعیت مکانی ممکن نشد')
      },
      { timeout: 8000 },
    )
  }

  const handleBook = (deal: DealAvailableItem) => {
    // مقصد: صفحه سالن با سانس پیش\u200cانتخاب\u200cشده — قیمت دیل هنگام ثبت توسط سرور اعمال می\u200cشود
    navigate(`/venues/${deal.venue_id}?slot=${deal.slot_id}&date=${deal.slot_date}`)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1100px]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {/* هیرو */}
          <div className="relative mb-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-500 to-red-500 p-6 text-white md:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-[60px] end-[-60px] h-[220px] w-[220px] rounded-full bg-white/10"
            />
            <h1 className="mb-1 text-[1.4rem] font-black md:text-[1.8rem]">
              🔥 شگفت‌انگیزهای لحظه آخری
            </h1>
            <p className="max-w-[560px] text-sm text-white/90">
              سانس‌های خالیِ نزدیک سالن‌ها با تخفیف‌های ویژه — تا مهلت تمام نشده رزرو کن؛ قیمت نهایی سمت سرور اعمال می‌شود.
            </p>
          </div>

          {/* فیلترها */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-[1_1_220px]">
              <SearchBar value={search} onChange={setSearch} placeholder="جستجوی سالن…" />
            </div>
            <div className="min-w-[160px] flex-[1_1_180px]">
              <Input
                dir="rtl"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="حداکثر قیمت (ریال)"
                aria-label="حداکثر قیمت (ریال)"
                inputMode="numeric"
                className="h-[52px] bg-card/90"
              />
            </div>
            <div
              role="group"
              aria-label="فیلتر بازه زمانی"
              className="flex flex-wrap gap-1 rounded-xl bg-card/90 p-1"
            >
              {TIME_FILTERS.map((t) => {
                const active = timeFilter === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTimeFilter(t.value)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'min-h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 px-4 py-2 text-[0.85rem] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        : 'min-h-11 rounded-xl px-4 py-2 text-[0.85rem] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    }
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {SORT_LABELS.map((s) => {
              if (s.needsCoords && !coords) {
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={requestLocation}
                    disabled={locating}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-600/30 px-4 py-2 text-[0.8rem] font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                  >
                    <Icon icon="mdi:crosshairs-gps" style={{ width: 16, height: 16 }} aria-hidden="true" />
                    {locating ? '...' : s.label}
                  </button>
                )
              }
              const isActive = sort === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSort(s.value)}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? 'inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-[0.8rem] font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      : 'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-[0.8rem] font-medium text-foreground transition-colors hover:border-amber-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  }
                >
                  {s.needsCoords && (
                    <Icon icon="mdi:crosshairs-gps" style={{ width: 16, height: 16 }} aria-hidden="true" />
                  )}
                  {s.label}
                </button>
              )
            })}
            {coords && query.isSuccess && (
              <button
                type="button"
                onClick={() => {
                  setCoords(null)
                  if (sort === 'distance') setSort('time')
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[0.8rem] font-bold text-emerald-700 dark:text-emerald-300"
                aria-label="حذف فیلتر موقعیت مکانی"
              >
                <Icon icon="mdi:map-marker" style={{ width: 16, height: 16 }} aria-hidden="true" />
                {`${toPersianDigits(deals.length)} دیل نزدیک (۱۰۰ کیلومتر)`}
              </button>
            )}
          </div>

          {/* نتایج */}
          {query.isPending ? (
            <LoadingBox text="در حال بارگذاری شگفت‌انگیزها..." />
          ) : query.isError ? (
            <ErrorBox message="خطا در دریافت سانس‌های تخفیفی" onRetry={() => query.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyBox
              icon="mdi:lightning-bolt"
              title="فعلاً سانسی در بازار نیست"
              text={search || maxPrice ? "با این فیلترها موردی پیدا نشد؛ فیلترها را بردارید." : 'مدیران سالن\u200cها هنوز تخفیف لحظه آخری منتشر نکرده\u200cاند. سالن موردعلاقه\u200cات را نشان کن و از پروفایل «اطلاع\u200cرسانی تخفیف‌های لحظه\u200cای» را روشن کن تا اولین نفر باخبر شوی.'}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((deal) => (
                <motion.div key={deal.slot_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <DealCard deal={deal} onBook={handleBook} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}

export default Deals
