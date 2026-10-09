// frontend/src/pages/deals/Deals.tsx
// «سانس‌های لحظه آخری» — GET /deals/available با فیلترهای سرور (حداکثر قیمت،
// بازه زمانی، مرتب‌سازی/فاصله) + جستجوی نام سالن سمت کلاینت (پارامر سرور ندارد).
// مسیر /deals فقط برای کاربران لاگین‌کرده (ProtectedRoute در App.tsx).

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Button, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import SearchBar from '@/components/mobile/SearchBar'
import { EmptyBox, ErrorBox, LoadingBox } from '@/components/finance/shared'
import { useAvailableDeals } from '@/hooks/useDeals'
import type { DealAvailableItem, DealSort, DealTimeOfDay } from '@/services/deals'
import { parseAmountInput } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import DealCard from '@/components/deals/DealCard'

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
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {/* هیرو */}
          <Box
            sx={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 70%)',
              color: 'white',
              p: { xs: 3, md: 4 },
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)' }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900, mb: 0.5, fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
              🔥 شگفت‌انگیزهای لحظه آخری
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 560 }}>
              سانس‌های خالیِ نزدیک سالن‌ها با تخفیف‌های ویژه — تا مهلت تمام نشده رزرو کن؛ قیمت نهایی سمت سرور اعمال می‌شود.
            </Typography>
          </Box>

          {/* فیلترها */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
              <SearchBar value={search} onChange={setSearch} placeholder="جستجوی سالن…" />
            </Box>
            <Box sx={{ flex: '1 1 180px', minWidth: 160 }}>
              <TextFieldCompact label="حداکثر قیمت (ریال)" value={maxPrice} onChange={setMaxPrice} />
            </Box>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={timeFilter}
              onChange={(_, v) => v && setTimeFilter(v as DealTimeOfDay | 'all')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: '12px',
                flexWrap: 'wrap',
                rowGap: 1,
                '& .MuiToggleButton-root': { px: 1.75, border: 'none', borderRadius: '12px !important', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', gap: 0.5 },
                '& .Mui-selected': { bgcolor: 'linear-gradient(135deg, #f59e0b, #ef4444) !important', color: 'white !important' },
              }}
            >
              {TIME_FILTERS.map((t) => (
                <ToggleButton key={t.value} value={t.value}>{t.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            {SORT_LABELS.map((s) => {
              if (s.needsCoords && !coords) {
                return (
                  <Button
                    key={s.value}
                    size="small"
                    variant="outlined"
                    onClick={requestLocation}
                    disabled={locating}
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: 'rgba(37,99,235,0.3)', color: '#2563eb' }}
                    startIcon={<Icon icon="mdi:crosshairs-gps" style={{ width: 14, height: 14 }} />}
                  >
                    {locating ? '...' : s.label}
                  </Button>
                )
              }
              const isActive = sort === s.value
              return (
                <Chip
                  key={s.value}
                  label={s.label}
                  size="small"
                  onClick={() => setSort(s.value)}
                  color={isActive ? 'primary' : 'default'}
                  variant={isActive ? 'filled' : 'outlined'}
                  icon={s.needsCoords ? <Icon icon="mdi:crosshairs-gps" style={{ width: 14, height: 14 }} /> : undefined}
                  sx={{ borderRadius: '999px', fontWeight: isActive ? 700 : 500, fontSize: '0.75rem', cursor: 'pointer' }}
                />
              )
            })}
            {coords && query.isSuccess && (
              <Chip
                size="small"
                icon={<Icon icon="mdi:map-marker" style={{ width: 14, height: 14 }} />}
                label={`${toPersianDigits(deals.length)} دیل نزدیک (۱۰۰ کیلومتر)`}
                onClick={() => {
                  setCoords(null)
                  if (sort === 'distance') setSort('time')
                }}
                sx={{ borderRadius: '999px', bgcolor: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}
              />
            )}
          </Box>

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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                gap: 2.5,
              }}
            >
              {visible.map((deal) => (
                <motion.div key={deal.slot_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <DealCard deal={deal} onBook={handleBook} />
                </motion.div>
              ))}
            </Box>
          )}
        </motion.div>
      </Box>
    </Layout>
  )
}

const TextFieldCompact: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <Box
    component="input"
    dir="rtl"
    value={value}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    placeholder={label}
    inputMode="numeric"
    sx={{
      width: '100%',
      height: 46,
      border: '1px solid rgba(15,23,42,0.12)',
      borderRadius: '14px',
      px: 2,
      fontSize: '0.85rem',
      fontFamily: 'inherit',
      background: 'rgba(255,255,255,0.9)',
      outline: 'none',
      '&:focus': { borderColor: '#2563eb' },
    }}
  />
)

export default Deals