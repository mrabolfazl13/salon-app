// src/pages/Home.tsx — موبایل‌فرست: سلام + جستجو + ورزش‌های محبوب + نزدیک شما + محبوب‌ها + اخیراً دیده‌شده
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import MobileHeader from '@/components/mobile/MobileHeader'
import SearchBar from '@/components/mobile/SearchBar'
import { SportChipRow, type Sport } from '@/components/mobile/SportChip'
import SectionHeader from '@/components/mobile/SectionHeader'
import VenueCard from '@/components/venue/VenueCard'
import { VenueCardSkeletonList } from '@/components/mobile/Skeletons'
import { Button } from '@/components/ui/shadcn/button'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore'
import { venueService } from '@/services/venue'
import { competitionService, type ActiveCompetition } from '@/services/competition'
import { sportsApi } from '@/services/sportsApi'
import type { LiveMatch, NewsItem } from '@/services/sportsApi'
import type { Venue } from '@/types'
import { parseList, toFullUrl } from '@/utils/venueMedia'
import { formatPrice } from '@/lib/utils'
import { toPersianDigits, formatJalaliDate } from '@/lib/jalali'
import { HeroSection } from '@/components/home/HeroSection'
import UserDashboard from '@/components/home/UserDashboard'

// Lazy-load heavy sections to improve initial load performance
const WhyUsSection = lazy(() => import('@/components/home/WhyUsSection').then(m => ({ default: m.WhyUsSection })))
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })))
const FinalCTA = lazy(() => import('@/components/home/FinalCTA').then(m => ({ default: m.FinalCTA })))
const GamificationSection = lazy(() => import('@/components/home/GamificationSection').then(m => ({ default: m.GamificationSection })))
const LoyaltySection = lazy(() => import('@/components/home/LoyaltySection').then(m => ({ default: m.LoyaltySection })))
const FeaturesSection = lazy(() => import('@/components/home/FeaturesSection').then(m => ({ default: m.FeaturesSection })))
const HowItWorksSection = lazy(() => import('@/components/home/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })))
const StatsSection = lazy(() => import('@/components/home/StatsSection').then(m => ({ default: m.StatsSection })))
const FAQSection = lazy(() => import('@/components/home/FAQSection').then(m => ({ default: m.FAQSection })))
const AppDownloadSection = lazy(() => import('@/components/home/AppDownloadSection').then(m => ({ default: m.AppDownloadSection })))
const SocialMediaSection = lazy(() => import('@/components/home/SocialMediaSection').then(m => ({ default: m.SocialMediaSection })))

// Skeleton for lazy-loaded sections
const SectionSkeleton = () => (
  <div className="mb-8 animate-pulse rounded-2xl bg-card p-6">
    <div className="mb-4 h-6 w-48 rounded bg-muted" />
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  </div>
)

// برچسب زمان باقی‌مانده برای بنر رقابت‌های داغ
function remainingLabel(ms: number): string {
  if (ms <= 0) return 'رو به پایان'
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const parts: string[] = []
  if (d) parts.push(`${toPersianDigits(d)} روز`)
  if (h) parts.push(`${toPersianDigits(h)} ساعت`)
  if (!d && m) parts.push(`${toPersianDigits(m)} دقیقه`)
  return parts.length ? parts.join(' و ') : 'کمتر از ۱ دقیقه'
}

// دسترسی سریع به بخش‌هایی که پیش‌تر پشت منوی پروفایل مخفی بودند
const FEATURE_TILES = [
  { label: 'تیم‌ها', sub: 'ساخت و عضویت', icon: 'mdi:account-group', href: '/teams' },
  { label: 'بازی‌ها', sub: 'هم‌تیمی پیدا کن', icon: 'mdi:gamepad-variant', href: '/games' },
  { label: 'رقابت', sub: 'قیمت دلخواه', icon: 'mdi:trophy-outline', href: '/competitions' },
  { label: 'چالش هفتگی', sub: 'جایزه بگیر', icon: 'mdi:brain', href: '/quiz' },
  { label: 'وفاداری', sub: 'امتیاز و جوایز', icon: 'mdi:star-four-points-outline', href: '/profile' },
] as const

// minmax(0,1fr) — از سرریز min-content کارت‌ها در عرض‌های باریک جلوگیری می‌کند
const venueGrid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  // If user is authenticated, show personalized dashboard
  if (isAuthenticated) {
    return <UserDashboard />
  }
  
  // Otherwise show marketing home page for guests
  const viewed = useRecentlyViewedStore((s) => s.viewed)

  // ---- سالن‌ها ----
  const [venues, setVenues] = useState<Venue[]>([])
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [venuesError, setVenuesError] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [nearby, setNearby] = useState<Venue[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(true)

  // ---- نتایج زنده / اخبار (عملکرد قبلی حفظ شده) ----
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<LiveMatch[]>([])
  const [finishedMatches, setFinishedMatches] = useState<LiveMatch[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live')
  const [sportsDataLoaded, setSportsDataLoaded] = useState(false)

  // ---- رقابت‌های داغ (بنر) ----
  const [hotComps, setHotComps] = useState<ActiveCompetition[]>([])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let cancelled = false
    competitionService
      .getActive()
      .then((res) => !cancelled && setHotComps(Array.isArray(res?.items) ? res.items : []))
      .catch(() => !cancelled && setHotComps([]))
    return () => {
      cancelled = true
    }
  }, [])
  // تیک زنده‌ی شمارش معکوس — فقط وقتی رقابتی فعال وجود دارد
  useEffect(() => {
    if (hotComps.length === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hotComps.length])
  // حذف مواردی که مهلتشان گذشته
  const liveHotComps = useMemo(
    () => hotComps.filter((c) => new Date(c.expires_at).getTime() > now),
    [hotComps, now]
  )

  useEffect(() => {
    let cancelled = false
    setVenuesLoading(true)
    setVenuesError(false)
    venueService
      .getAll({ limit: 48 })
      .then((data: Venue[]) => !cancelled && setVenues(data))
      .catch(() => !cancelled && setVenuesError(true))
      .finally(() => !cancelled && setVenuesLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  // موقعیت مکانی (اختیاری — تلاش خودکار بی‌صدا + درخواست صریح با دکمه،
  // چون در اندروید/Tauri و مرورگرها دیالوگ دسترسی فقط با درخواست کاربر مطمئن اجرا می‌شود)
  const [locBusy, setLocBusy] = useState(false)
  const [locFailed, setLocFailed] = useState(false)
  const requestLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) return
    setLocBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocBusy(false)
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocBusy(false)
        if (!silent) {
          // اشتراک‌گذاری پیام یکنواخت در UI پایین همین بخش
          setLocFailed(true)
        }
      },
      { timeout: 12000, maximumAge: 300000, enableHighAccuracy: false },
    )
  }, [])
  useEffect(() => {
    requestLocation(true)
  }, [requestLocation])

  useEffect(() => {
    let cancelled = false
    setNearbyLoading(true)
    if (coords) {
      venueService
        .getAll({ latitude: coords.lat, longitude: coords.lng, radius: 15, limit: 6 })
        .then((data: Venue[]) => !cancelled && setNearby(data))
        .catch(() => !cancelled && setNearby([]))
        .finally(() => !cancelled && setNearbyLoading(false))
    } else {
      const timer = setTimeout(() => {
        if (!cancelled) {
          setNearby(venues.slice(0, 6))
          setNearbyLoading(false)
        }
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }
    return () => {
      cancelled = true
    }
  }, [coords, venues])

  const popular = useMemo(
    () =>
      [...venues]
        .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
        .slice(0, 6),
    [venues],
  )

  const recentVenues = useMemo(() => {
    const byId = new Map(venues.map((v) => [v.id, v]))
    return viewed.map((v) => byId.get(v.id)).filter(Boolean) as Venue[]
  }, [venues, viewed])

  const fetchSportsData = useCallback(async () => {
    try {
      const [matchesData, newsData] = await Promise.all([
        sportsApi.getAllMatches(),
        sportsApi.getSportsNews(),
      ])
      setLiveMatches(matchesData.live || [])
      setUpcomingMatches(matchesData.upcoming || [])
      setFinishedMatches(matchesData.finished || [])
      setNews(newsData || [])
    } catch (error) {
      console.error('Error fetching sports data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Only load sports data when user scrolls to that section or after a delay
  useEffect(() => {
    if (sportsDataLoaded) return
    
    const timer = setTimeout(() => {
      setSportsDataLoaded(true)
      fetchSportsData()
    }, 2000) // Delay by 2 seconds to prioritize initial render
    
    return () => clearTimeout(timer)
  }, [fetchSportsData, sportsDataLoaded])

  // Auto-refresh every 30 seconds once loaded
  useEffect(() => {
    if (!sportsDataLoaded) return
    const interval = setInterval(fetchSportsData, 30000)
    return () => clearInterval(interval)
  }, [fetchSportsData, sportsDataLoaded])

  const getActiveMatches = () => {
    switch (activeTab) {
      case 'live':
        return liveMatches
      case 'upcoming':
        return upcomingMatches
      case 'finished':
        return finishedMatches
    }
  }

  const formatTime = (time?: string, _date?: string) => {
    if (!time) return ''
    return time
  }

  const handleSportSelect = (sport: Sport) => {
    const params = new URLSearchParams()
    if (sport.category) params.set('category', sport.category)
    if (sport.query) params.set('search', sport.query)
    navigate(`/venues?${params.toString()}`)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1000px]">
        {/* Hero Section - بخش جذب کاربر */}
        <HeroSection />

        {/* سلام + جستجو */}
        <MobileHeader />
        <div className="mb-6">
          <SearchBar
            value=""
            readOnly
            onClick={() => navigate('/search')}
            placeholder="جستجوی سالن، محله یا ورزش…"
          />
        </div>

        {/* دسترسی سریع — تیم‌ها / بازی‌ها / رقابت / وفاداری
            روی موبایل ۳ ستون (دو ردیف) تا کاشی‌ها زیر ~۶۰px له نشوند */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-2.5">
          {FEATURE_TILES.map((t, i) => (
            <motion.div
              key={t.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              /* whileTap باعث می‌شود framer-motion این div را tabIndex=0 کند؛ لینک داخلش
                 خودش ایستگاه کیبورد است، پس اینجا -1 تا توقف تکراری ساخته نشود. */
              tabIndex={-1}
            >
              <Link
                to={t.href}
                className="flex min-h-24 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-4 text-center no-underline shadow-sm transition-colors hover:border-amber-500/55 dark:hover:border-amber-400/45"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  <Icon icon={t.icon} style={{ width: 22, height: 22 }} />
                </span>
                <span className="block">
                  <span className="block text-[0.82rem] font-extrabold leading-normal text-foreground">{t.label}</span>
                  <span className="mt-1 block text-[0.68rem] leading-relaxed text-muted-foreground">{t.sub}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* رقابت‌های داغ — قیمت در حال کاهش، با شمارش معکوس */}
        {liveHotComps.length > 0 && (
          <div className="mb-8">
            <SectionHeader title="رقابت‌های داغ" subtitle="تا پایان مهلت، قیمت پایین می‌آید" />
            <div className="flex gap-3 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {liveHotComps.map((c, i) => {
                const msLeft = new Date(c.expires_at).getTime() - now
                const offPct = c.current_price > 0 ? Math.max(0, Math.round(((c.current_price - c.best_price) / c.current_price) * 100)) : 0
                return (
                  <motion.div
                    key={c.slot_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    tabIndex={-1}
                    style={{ scrollSnapAlign: 'start', flex: '0 0 min(300px, 82vw)' }}
                  >
                    <Link
                      to={`/venues/${c.venue_id}`}
                      className="block rounded-2xl border border-amber-500/45 bg-gradient-to-br from-orange-50/90 to-amber-50/70 p-4 text-inherit no-underline shadow-sm dark:from-amber-400/10 dark:to-orange-500/[0.06]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Icon icon="mdi:trophy" style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0 }} />
                          <p className="truncate text-[0.78rem] font-extrabold text-foreground">
                            {c.venue_name ?? 'سالن'}
                          </p>
                        </div>
                        <span
                          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-extrabold tabular-nums ${
                            msLeft < 3 * 3600_000
                              ? 'bg-red-600/10 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          <Icon icon="mdi:timer-sand" style={{ width: 14, height: 14 }} />
                          {remainingLabel(msLeft)}
                        </span>
                      </div>

                      <p className="mb-2 text-xs text-muted-foreground">
                        {formatJalaliDate(c.date)} — {toPersianDigits(c.start_time)}
                        {' · '}
                        {toPersianDigits(c.bid_count)} پیشنهاد
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground line-through">
                          {formatPrice(c.current_price)}
                        </span>
                        <span className="text-[0.95rem] font-black tabular-nums text-amber-700 dark:text-amber-400">
                          {formatPrice(c.best_price)}
                        </span>
                        {offPct > 0 && (
                          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-extrabold text-stone-900">
                            {toPersianDigits(offPct)}٪ تخفیف
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* چرا ما؟ */}
        <Suspense fallback={<SectionSkeleton />}>
          <WhyUsSection />
        </Suspense>

        {/* امکانات ویژه */}
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>

        {/* چطور کار می‌کنه؟ */}
        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorksSection />
        </Suspense>

        {/* آمار و ارقام */}
        <Suspense fallback={<SectionSkeleton />}>
          <StatsSection />
        </Suspense>

        {/* سوالات متداول */}
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>

        {/* دانلود اپلیکیشن */}
        <Suspense fallback={<SectionSkeleton />}>
          <AppDownloadSection />
        </Suspense>

        {/* شبکه‌های اجتماعی */}
        <Suspense fallback={<SectionSkeleton />}>
          <SocialMediaSection />
        </Suspense>

        {/* ورزش‌های محبوب */}
        <SectionHeader title="ورزش‌های محبوب" subtitle="زودتر برو سراغ بازی" />
        <div className="mb-8">
          <SportChipRow onSelect={handleSportSelect} />
        </div>

        {/* بنر CTA — گرادیان برند */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/venues' : '/register')}
            className="relative mb-8 block w-full appearance-none overflow-hidden rounded-[20px] bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 px-5 py-6 text-start font-[inherit] text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <span className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-amber-500/[0.18]" />
            <span className="absolute -bottom-[60px] start-[-30px] h-[140px] w-[140px] rounded-full border-2 border-dashed border-white/[0.14]" />
            <span className="mb-1.5 flex items-center gap-1.5">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-amber-300 to-orange-500">
                <Icon icon="mdi:lightning-bolt" style={{ width: 18, height: 18, color: '#1c1917' }} />
              </span>
              <span className="text-[1.1rem] font-extrabold">
                {isAuthenticated ? 'همین حالا سانس رزرو کن' : 'همین حالا رایگان شروع کن'}
              </span>
            </span>
            <span className="block text-[0.82rem] text-white/85">
              {isAuthenticated
                ? 'بهترین سالن‌ها با بهترین قیمت، چند لحظه‌ای'
                : 'ثبت‌نام کن و در کمتر از یک دقیقه سالن رزرو کن'}
            </span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-br from-amber-300 to-orange-500 px-3.5 py-1.5 text-[0.8rem] font-extrabold text-stone-900">
              {isAuthenticated ? 'مشاهده سالن‌ها' : 'شروع رایگان'}
              <Icon icon="mdi:arrow-left" style={{ width: 16, height: 16 }} />
            </span>
          </button>
        </motion.div>

        {/* بنر شگفت‌انگیزها — سانس‌های لحظه آخری */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/deals' : '/login')}
            className="relative mb-8 block w-full appearance-none overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-500 to-red-500 px-5 py-[18px] text-start font-[inherit] text-stone-900 shadow-[0_10px_30px_rgba(239,68,68,0.28)] [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <span className="absolute -bottom-[50px] start-[-30px] h-[150px] w-[150px] rounded-full bg-white/10" />
            <span className="flex items-center justify-between gap-3">
              <span className="block min-w-0">
                <span className="flex items-center gap-2">
                  <Icon icon="mdi:fire" style={{ width: 20, height: 20, flexShrink: 0 }} />
                  <span className="text-[1.02rem] font-extrabold">شگفت‌انگیزهای لحظه آخری</span>
                </span>
                <span className="mt-1 block text-[0.78rem] text-stone-900">
                  سانس‌های تخفیف‌دار نزدیک تو — تا مهلت تمام نشده رزرو کن
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-[14px] bg-white/20 px-3 py-1.5 text-[0.78rem] font-bold">
                مشاهده
                <Icon icon="mdi:arrow-left" style={{ width: 15, height: 15 }} />
              </span>
            </span>
          </button>
        </motion.div>

        {/* نزدیک شما */}
        <SectionHeader
          title="سالن‌های نزدیک شما"
          actionLabel="مشاهده همه"
          onAction={() => navigate('/venues')}
        />
        {!coords && (
          <div className="mb-4 flex items-center gap-2 px-1">
            <p className="min-w-0 flex-1 text-[0.8rem] text-muted-foreground">
              {locFailed
                ? 'دسترسی مکان رد شد؛ از تنظیمات مرورگر/برنامه فعالش کنید.'
                : 'برای پیشنهاد بر اساس نزدیک‌ترین سالن، موقعیت مکانی را فعال کنید.'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={locBusy}
              onClick={() => {
                setLocFailed(false)
                requestLocation()
              }}
              className="min-h-11 shrink-0 gap-1 rounded-xl px-4 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Icon icon="mdi:crosshairs-gps" style={{ width: 18, height: 18 }} />
              {locBusy ? 'در حال دریافت…' : 'فعال‌سازی'}
            </Button>
          </div>
        )}
        {nearbyLoading ? (
          <div className="mb-8">
            <VenueCardSkeletonList count={2} />
          </div>
        ) : nearby.length === 0 ? (
          <p className="mb-8 text-[0.85rem] text-muted-foreground">
            سالنی در نزدیکی شما پیدا نشد.
          </p>
        ) : (
          <div className={`${venueGrid} mb-8`}>
            {nearby.slice(0, 3).map((v) => (
              <VenueCard key={v.id} venue={v} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </div>
        )}

        {/* محبوب‌ترین سالن‌ها */}
        <SectionHeader
          title="محبوب‌ترین سالن‌ها"
          subtitle="بر اساس امتیاز کاربران"
          actionLabel="همه"
          onAction={() => navigate('/venues')}
        />
        {venuesLoading ? (
          <div className="mb-8">
            <VenueCardSkeletonList count={3} />
          </div>
        ) : venuesError ? (
          <div className="mb-8 py-6 text-center">
            <Icon icon="mdi:cloud-alert-outline" style={{ width: 40, height: 40, color: '#ef4444' }} />
            <p className="mt-2 text-[0.85rem] text-muted-foreground">
              دریافت سالن‌ها ممکن نشد
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setVenuesLoading(true)
                setVenuesError(false)
                venueService
                  .getAll({ limit: 48 })
                  .then((data: Venue[]) => setVenues(data))
                  .catch(() => setVenuesError(true))
                  .finally(() => setVenuesLoading(false))
              }}
              className="mt-3 gap-1 rounded-full border-blue-600 px-5 font-bold text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              <Icon icon="mdi:refresh" style={{ width: 18, height: 18 }} />
              تلاش مجدد
            </Button>
          </div>
        ) : popular.length === 0 ? (
          <p className="mb-8 text-[0.85rem] text-muted-foreground">
            هنوز سالنی ثبت نشده است.
          </p>
        ) : (
          <div className={`${venueGrid} mb-8`}>
            {popular.map((v) => (
              <VenueCard key={v.id} venue={v} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </div>
        )}

        {/* نظرات کاربران */}
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>

        {/* چالش‌ها و جوایز */}
        <Suspense fallback={<SectionSkeleton />}>
          <GamificationSection />
        </Suspense>

        {/* برنامه وفاداری */}
        <Suspense fallback={<SectionSkeleton />}>
          <LoyaltySection />
        </Suspense>

        {/* اخیراً دیده‌شده */}
        {recentVenues.length > 0 && (
          <>
            <SectionHeader title="اخیراً دیده‌شده" />
            <div className="scrollbar-hide mb-8 flex gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory]">
              {recentVenues.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => navigate(`/venues/${v.id}`)}
                  className="block w-[210px] shrink-0 appearance-none overflow-hidden rounded-[20px] border border-border bg-card text-start font-[inherit] text-inherit shadow-sm [scroll-snap-align:start] [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <img
                    src={parseList(v.images)[0] ? toFullUrl(parseList(v.images)[0]) : ''}
                    alt={v.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                    className="block h-[100px] w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="truncate text-[0.85rem] font-bold text-foreground">
                      {v.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {v.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* نتایج زنده — عملکرد حفظ شده */}
        <SectionHeader title="نتایج زنده فوتبال" subtitle="به‌روزرسانی خودکار هر ۳۰ ثانیه" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 overflow-hidden rounded-[20px] shadow-sm"
        >
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Icon icon="mdi:soccer" style={{ width: 22, height: 22 }} />
                <p className="font-extrabold text-white">نتایج</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/85">
                <span className="h-[7px] w-[7px] rounded-full bg-red-400 motion-safe:animate-[pulse_1.5s_infinite]" />
                زنده
              </div>
            </div>
            <div className="flex gap-1 rounded-xl bg-white/[0.18] p-1">
              {[
                { id: 'live', label: 'زنده', icon: 'mdi:live-tv' },
                { id: 'upcoming', label: 'آینده', icon: 'mdi:clock-outline' },
                { id: 'finished', label: 'پایان', icon: 'mdi:check-circle' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  aria-label={`تب ${tab.label}`}
                  className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[9px] py-3 font-[inherit] text-[0.8rem] font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600'
                      : 'bg-transparent text-white/90'
                  }`}
                >
                  <Icon icon={tab.icon} style={{ width: 16, height: 16 }} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            role="region"
            aria-label="نتایج زنده، قابل پیمایش با کیبورد"
            tabIndex={0}
            className="max-h-[340px] overflow-y-auto bg-card p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600"
          >
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton aria-hidden="true" key={i} className="h-[72px] w-full rounded-2xl" />
                ))}
              </div>
            ) : getActiveMatches().length === 0 ? (
              <div className="py-8 text-center">
                <Icon icon="mdi:soccer-field" style={{ width: 44, height: 44, color: '#64748b' }} />
                <p className="mt-2 text-[0.85rem] text-muted-foreground">
                  مسابقه‌ای یافت نشد
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {getActiveMatches().map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <div className="rounded-2xl bg-slate-900/[0.03] p-3 dark:bg-white/[0.04]">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="rounded-lg bg-slate-900/[0.06] px-2 py-0.5 text-xs text-muted-foreground dark:bg-white/[0.07]">
                          {match.league}
                        </p>
                        {match.status === 'live' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 motion-safe:animate-[pulse_1.5s_infinite]" />
                            {match.minute}'
                          </span>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {formatTime(match.time, match.date)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {match.homeIcon ? (
                            <img src={match.homeIcon} alt={match.homeTeam} className="h-6 w-6 object-contain" />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/10">
                              <Icon icon="mdi:shield" style={{ width: 15, height: 15, color: '#3b82f6' }} />
                            </span>
                          )}
                          <p className="truncate text-[0.8rem] font-semibold text-foreground">
                            {match.homeTeam}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 px-2">
                          <p
                            className={`text-[1.05rem] font-extrabold tabular-nums ${
                              match.status === 'live' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                            }`}
                          >
                            {match.homeScore}
                          </p>
                          <p className="text-muted-foreground">-</p>
                          <p
                            className={`text-[1.05rem] font-extrabold tabular-nums ${
                              match.status === 'live' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                            }`}
                          >
                            {match.awayScore}
                          </p>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
                          {match.awayIcon ? (
                            <img src={match.awayIcon} alt={match.awayTeam} className="h-6 w-6 object-contain" />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/[0.14]">
                              <Icon icon="mdi:shield" style={{ width: 15, height: 15, color: '#d97706' }} />
                            </span>
                          )}
                          <p className="truncate text-[0.8rem] font-semibold text-foreground">
                            {match.awayTeam}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* اخبار ورزشی — عملکرد حفظ شده */}
        <SectionHeader title="اخبار ورزشی" />
        <div
          role="region"
          aria-label="اخبار ورزشی، فهرست افقی قابل پیمایش با کیبورد"
          tabIndex={0}
          className="scrollbar-hide mb-4 flex gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton aria-hidden="true" key={i} className="h-[170px] w-[240px] shrink-0 rounded-[20px]" />
              ))}
            </>
          ) : news.length === 0 ? (
            <div className="w-full py-8 text-center">
              <Icon icon="mdi:newspaper-minus" style={{ width: 40, height: 40, color: '#64748b' }} />
              <p className="mt-2 text-[0.85rem] text-muted-foreground">اخباری یافت نشد</p>
            </div>
          ) : (
            news.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
              >
                <div className="w-[240px] shrink-0 overflow-hidden rounded-[20px] border border-border bg-card shadow-sm [scroll-snap-align:start]">
                  <div className={`relative flex h-[84px] items-center justify-center bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(37,99,235,0.08))] ${item.color}`}>
                    {item.isLive && (
                      <span className="absolute end-2 top-2 flex items-center gap-1 rounded-lg bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        <span className="h-[5px] w-[5px] rounded-full bg-white motion-safe:animate-[pulse_1.5s_infinite]" />
                        زنده
                      </span>
                    )}
                    <Icon icon={item.icon} style={{ width: 34, height: 34, color: '#d97706' }} />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.4em] text-[0.8rem] font-bold leading-normal text-foreground">
                      {item.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* CTA نهایی */}
        <Suspense fallback={<SectionSkeleton />}>
          <FinalCTA />
        </Suspense>
      </div>
    </Layout>
  )
}

export default Home
