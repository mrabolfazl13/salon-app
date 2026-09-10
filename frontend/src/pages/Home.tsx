// src/pages/Home.tsx — موبایل‌فرست: سلام + جستجو + ورزش‌های محبوب + نزدیک شما + محبوب‌ها + اخیراً دیده‌شده
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import Layout from '@/components/layout/Layout'
import MobileHeader from '@/components/mobile/MobileHeader'
import SearchBar from '@/components/mobile/SearchBar'
import { SportChipRow, type Sport } from '@/components/mobile/SportChip'
import SectionHeader from '@/components/mobile/SectionHeader'
import VenueCard from '@/components/venue/VenueCard'
import { VenueCardSkeletonList, Shimmer } from '@/components/mobile/Skeletons'
import { useAuthStore } from '@/store/authStore'
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore'
import { venueService } from '@/services/venue'
import { sportsApi } from '@/services/sportsApi'
import type { LiveMatch, NewsItem } from '@/services/sportsApi'
import type { Venue } from '@/types'
import { parseList, toFullUrl } from '@/utils/venueMedia'
import { gradients, radii, shadows } from '@/theme'

const venueGrid = {
  display: 'grid',
  // minmax(0,1fr) — از سرریز min-content کارت‌ها در عرض‌های باریک جلوگیری می‌کند
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
  },
  gap: { xs: 2, sm: 2.5 },
} as const

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const viewed = useRecentlyViewedStore((s) => s.viewed)

  // ---- سالن‌ها ----
  const [venues, setVenues] = useState<Venue[]>([])
  const [venuesLoading, setVenuesLoading] = useState(true)
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

  useEffect(() => {
    let cancelled = false
    venueService
      .getAll({ limit: 48 })
      .then((data: Venue[]) => !cancelled && setVenues(data))
      .catch(() => !cancelled && setVenues([]))
      .finally(() => !cancelled && setVenuesLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  // موقعیت مکانی (اختیاری — در صورت رد دسترسی، بی‌صدا رد می‌شود)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { timeout: 8000 },
    )
  }, [])

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

  useEffect(() => {
    fetchSportsData()
    const interval = setInterval(fetchSportsData, 30000)
    return () => clearInterval(interval)
  }, [fetchSportsData])

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
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* سلام + جستجو */}
        <MobileHeader />
        <Box sx={{ mb: 3 }}>
          <SearchBar
            value=""
            readOnly
            onClick={() => navigate('/search')}
            placeholder="جستجوی سالن، محله یا ورزش…"
          />
        </Box>

        {/* ورزش‌های محبوب */}
        <SectionHeader title="ورزش‌های محبوب" subtitle="زودتر برو سراغ بازی" />
        <Box sx={{ mb: 4 }}>
          <SportChipRow onSelect={handleSportSelect} />
        </Box>

        {/* بنر CTA — گرادیان برند */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            onClick={() => navigate(isAuthenticated ? '/venues' : '/register')}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: `${radii.card}px`,
              background: gradients.primary,
              color: '#fff',
              px: 2.5,
              py: 3,
              mb: 4,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(37,99,235,0.35)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                insetInlineEnd: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.12)',
              }}
            />
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 0.5 }}>
              {isAuthenticated ? 'همین حالا سانس رزرو کن ⚡' : 'همین حالا رایگان شروع کن ⚡'}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
              {isAuthenticated
                ? 'بهترین سالن‌ها با بهترین قیمت، چند لحظه‌ای'
                : 'ثبت‌نام کن و در کمتر از یک دقیقه سالن رزرو کن'}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1.5,
                px: 1.75,
                py: 0.75,
                borderRadius: `${radii.button}px`,
                bgcolor: 'rgba(255,255,255,0.18)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {isAuthenticated ? 'مشاهده سالن‌ها' : 'شروع رایگان'}
              <Icon icon="mdi:arrow-left" style={{ width: 16, height: 16 }} />
            </Box>
          </Box>
        </motion.div>

        {/* نزدیک شما */}
        <SectionHeader
          title="سالن‌های نزدیک شما"
          actionLabel="مشاهده همه"
          onAction={() => navigate('/venues')}
        />
        {nearbyLoading ? (
          <Box sx={{ mb: 4 }}>
            <VenueCardSkeletonList count={2} />
          </Box>
        ) : nearby.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 4 }}>
            سالنی در نزدیکی شما پیدا نشد.
          </Typography>
        ) : (
          <Box sx={{ ...venueGrid, mb: 4 }}>
            {nearby.slice(0, 3).map((v) => (
              <VenueCard key={v.id} venue={v} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </Box>
        )}

        {/* محبوب‌ترین سالن‌ها */}
        <SectionHeader
          title="محبوب‌ترین سالن‌ها"
          subtitle="بر اساس امتیاز کاربران"
          actionLabel="همه"
          onAction={() => navigate('/venues')}
        />
        {venuesLoading ? (
          <Box sx={{ mb: 4 }}>
            <VenueCardSkeletonList count={3} />
          </Box>
        ) : (
          <Box sx={{ ...venueGrid, mb: 4 }}>
            {popular.map((v) => (
              <VenueCard key={v.id} venue={v} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </Box>
        )}

        {/* اخیراً دیده‌شده */}
        {recentVenues.length > 0 && (
          <>
            <SectionHeader title="اخیراً دیده‌شده" />
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 1,
                mb: 4,
                className: 'scrollbar-hide',
                scrollSnapType: 'x mandatory',
              }}
            >
              {recentVenues.map((v) => (
                <Box
                  key={v.id}
                  onClick={() => navigate(`/venues/${v.id}`)}
                  sx={{
                    flexShrink: 0,
                    width: 210,
                    scrollSnapAlign: 'start',
                    borderRadius: `${radii.card}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(15,23,42,0.06)',
                    boxShadow: shadows.card,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    component="img"
                    src={parseList(v.images)[0] ? toFullUrl(parseList(v.images)[0]) : ''}
                    alt={v.name}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                    sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                  />
                  <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>
                      {v.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }} noWrap>
                      {v.address}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* نتایج زنده — عملکرد حفظ شده */}
        <SectionHeader title="نتایج زنده فوتبال" subtitle="به‌روزرسانی خودکار هر ۳۰ ثانیه" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ borderRadius: radii.card, overflow: 'hidden', boxShadow: shadows.card, marginBottom: 32 }}
        >
          <Box sx={{ background: gradients.primary, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff' }}>
                <Icon icon="mdi:soccer" style={{ width: 22, height: 22 }} />
                <Typography sx={{ fontWeight: 800, color: '#fff' }}>نتایج</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f87171', animation: 'pulse 1.5s infinite' }} />
                زنده
              </Box>
            </Box>
            <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.18)', borderRadius: '12px', p: 0.5, gap: 0.5 }}>
              {[
                { id: 'live', label: 'زنده', icon: 'mdi:live-tv' },
                { id: 'upcoming', label: 'آینده', icon: 'mdi:clock-outline' },
                { id: 'finished', label: 'پایان', icon: 'mdi:check-circle' },
              ].map((tab) => (
                <Box
                  key={tab.id}
                  component="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    py: 1,
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    bgcolor: activeTab === tab.id ? '#fff' : 'transparent',
                    color: activeTab === tab.id ? '#2563eb' : 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Icon icon={tab.icon} style={{ width: 15, height: 15 }} />
                  {tab.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ bgcolor: 'background.paper', p: 1.5, maxHeight: 340, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {[1, 2, 3].map((i) => (
                  <Shimmer key={i} height={72} sx={{ borderRadius: '16px' }} />
                ))}
              </Box>
            ) : getActiveMatches().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Icon icon="mdi:soccer-field" style={{ width: 44, height: 44, color: '#cbd5e1' }} />
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 1 }}>
                  مسابقه‌ای یافت نشد
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {getActiveMatches().map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Box sx={{ bgcolor: 'rgba(15,23,42,0.03)', borderRadius: '16px', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', bgcolor: 'rgba(15,23,42,0.06)', px: 1, py: 0.25, borderRadius: '8px' }}>
                          {match.league}
                        </Typography>
                        {match.status === 'live' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                            {match.minute}'
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {formatTime(match.time, match.date)}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          {match.homeIcon ? (
                            <img src={match.homeIcon} alt={match.homeTeam} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          ) : (
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon icon="mdi:shield" style={{ width: 15, height: 15, color: '#2563eb' }} />
                            </Box>
                          )}
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }} noWrap>
                            {match.homeTeam}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, flexShrink: 0 }}>
                          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: match.status === 'live' ? '#2563eb' : '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            {match.homeScore}
                          </Typography>
                          <Typography sx={{ color: '#94a3b8' }}>-</Typography>
                          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: match.status === 'live' ? '#2563eb' : '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            {match.awayScore}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, flexDirection: 'row-reverse' }}>
                          {match.awayIcon ? (
                            <img src={match.awayIcon} alt={match.awayTeam} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          ) : (
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon icon="mdi:shield" style={{ width: 15, height: 15, color: '#7c3aed' }} />
                            </Box>
                          )}
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }} noWrap>
                            {match.awayTeam}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </Box>
        </motion.div>

        {/* اخبار ورزشی — عملکرد حفظ شده */}
        <SectionHeader title="اخبار ورزشی" />
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            mb: 2,
            scrollSnapType: 'x mandatory',
          }}
          className="scrollbar-hide"
        >
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Shimmer key={i} width={240} height={170} sx={{ borderRadius: '20px', flexShrink: 0 }} />
              ))}
            </>
          ) : news.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
              <Icon icon="mdi:newspaper-minus" style={{ width: 40, height: 40, color: '#cbd5e1' }} />
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 1 }}>اخباری یافت نشد</Typography>
            </Box>
          ) : (
            news.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 240,
                    scrollSnapAlign: 'start',
                    borderRadius: `${radii.card}px`,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(15,23,42,0.06)',
                    boxShadow: shadows.card,
                  }}
                >
                  <Box className={item.color} sx={{ height: 84, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: gradients.primarySoft }}>
                    {item.isLive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          insetInlineEnd: 8,
                          px: 1,
                          py: 0.25,
                          borderRadius: '8px',
                          bgcolor: '#dc2626',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#fff', animation: 'pulse 1.5s infinite' }} />
                        زنده
                      </Box>
                    )}
                    <Icon icon={item.icon} style={{ width: 34, height: 34, color: '#2563eb' }} />
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em' }}>
                      {item.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, fontSize: '0.68rem', color: '#64748b' }}>
                      <span>{item.date}</span>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <Icon icon="mdi:eye-outline" style={{ width: 13, height: 13 }} />
                        {(item.views / 1000).toFixed(0)}k
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))
          )}
        </Box>
      </Box>
    </Layout>
  )
}

export default Home
