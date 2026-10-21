// src/pages/Search.tsx — صفحه اختصاصی جستجو: چسبان + تاریخچه + محبوب‌ها + نتایج
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, IconButton, Typography, useMediaQuery } from '@mui/material'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import SearchBar from '@/components/mobile/SearchBar'
import SectionHeader from '@/components/mobile/SectionHeader'
import { SportChipRow, type Sport } from '@/components/mobile/SportChip'
import { SearchResultsSkeleton } from '@/components/mobile/Skeletons'
import EmptyState from '@/components/mobile/EmptyState'
import ErrorState from '@/components/mobile/ErrorState'
import Rating from '@/components/mobile/Rating'
import Price from '@/components/mobile/Price'
import FavoriteButton from '@/components/mobile/FavoriteButton'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import { venueService } from '@/services/venue'
import { parseList, toFullUrl } from '@/utils/venueMedia'
import type { Venue } from '@/types'
import { radii, shadows } from '@/theme'

const POPULAR_SEARCHES = ['فوتسال', 'بدنسازی', 'چمن مصنوعی', 'سرپوشیده', 'قم']

const Search: React.FC = () => {
  const navigate = useNavigate()
  const { queries, add, remove, clear } = useSearchHistoryStore()
  // فوکوس خودکار روی موبایل کیبورد را بلافاصله باز می‌کند و پیشنهادها را می‌پوشاند
  const hasPointer = useMediaQuery('(hover: hover) and (pointer: fine)')

  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [results, setResults] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // جستجوی دیبانس‌شده (۳۵۰ms)
  useEffect(() => {
    const q = value.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q) {
      setResults([])
      setSubmitted('')
      setLoading(false)
      setError(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const data: Venue[] = await venueService.getAll({ search: q, limit: 20 })
        setResults(data)
        setSubmitted(q)
        add(q)
      } catch {
        setResults([])
        setError(true)
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, retryKey])

  const recent = useMemo(() => queries.filter((q) => q !== value.trim()), [queries, value])

  const pickQuery = (q: string) => setValue(q)

  const handleSport = (sport: Sport) => {
    setValue(sport.query || sport.label)
  }

  const showLanding = !value.trim()

  return (
    <Layout>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* سرتیتر صفحه برای فناوری کمکی — ظاهر صفحه تغییری نمی‌کند */}
        <h1 className="sr-only">جستجوی سالن</h1>
        {/* نوار جستجوی چسبان */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            py: 1.5,
            mb: 1,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(11,18,32,0.92)' : 'rgba(246,247,249,0.92)'),
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => (value ? setValue('') : navigate(-1))}
              aria-label="بازگشت"
              sx={{ width: 48, height: 48, minWidth: 48, minHeight: 48, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', flexShrink: 0, color: 'text.primary' }}
            >
              <Icon icon="mdi:arrow-right" style={{ width: 22, height: 22 }} />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SearchBar
                value={value}
                onChange={setValue}
                onClear={() => setValue('')}
                onSubmit={() => add(value)}
                placeholder="نام سالن یا محله را بنویسید…"
                autoFocus={hasPointer}
              />
            </Box>
          </Box>
        </Box>

        {showLanding ? (
          <>
            {/* جستجوهای اخیر */}
            {recent.length > 0 && (
              <Box sx={{ mb: 3.5 }}>
                <SectionHeader
                  title="جستجوهای اخیر"
                  actionLabel="پاک کردن"
                  onAction={clear}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {recent.map((q) => (
                    <Box
                      key={q}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: `${radii.button}px`,
                        '&:hover': { bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)') },
                      }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={() => pickQuery(q)}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 1.25,
                          minHeight: 48,
                          borderRadius: 'inherit',
                          appearance: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          bgcolor: 'transparent',
                          border: 0,
                          margin: 0,
                          fontFamily: 'inherit',
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: 'text.primary',
                          textAlign: 'start',
                          cursor: 'pointer',
                          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                        }}
                      >
                        <Icon icon="mdi:history" aria-hidden="true" style={{ width: 20, height: 20, color: '#64748b', flexShrink: 0 }} />
                        <Typography sx={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'text.primary' }} noWrap>
                          {q}
                        </Typography>
                      </Box>
                      <IconButton
                        size="medium"
                        aria-label={`حذف ${q} از جستجوهای اخیر`}
                        onClick={() => remove(q)}
                        sx={{ width: 44, height: 44, minHeight: 44, minWidth: 44, color: '#cbd5e1', '&:hover': { color: 'error.main' } }}
                      >
                        <Icon icon="mdi:close" style={{ width: 20, height: 20 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* جستجوهای محبوب */}
            <Box sx={{ mb: 3.5 }}>
              <SectionHeader title="جستجوهای محبوب" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {POPULAR_SEARCHES.map((q) => (
                  <Box
                    key={q}
                    component="button"
                    onClick={() => pickQuery(q)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.75,
                      py: 1,
                      minHeight: 44,
                      borderRadius: '999px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      fontFamily: 'inherit',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.5)' : 'rgba(245,158,11,0.55)'),
                        color: (t) => (t.palette.mode === 'dark' ? '#fbbf24' : '#b45309'),
                      },
                    }}
                  >
                    <Icon icon="mdi:magnify" style={{ width: 16, height: 16, color: '#64748b' }} />
                    {q}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* دسته‌بندی ورزش‌ها */}
            <Box>
              <SectionHeader title="دسته‌بندی‌ها" />
              <SportChipRow onSelect={handleSport} />
            </Box>
          </>
        ) : loading ? (
          <Box sx={{ pt: 1 }}>
            <SearchResultsSkeleton />
          </Box>
        ) : error ? (
          <ErrorState onRetry={() => setRetryKey((k) => k + 1)} />
        ) : results.length === 0 ? (
          <EmptyState
            icon="mdi:magnify"
            title={`سالنی با «${submitted || value.trim()}» پیدا نشد`}
            description="اسم دیگری را امتحان کنید یا در دسته‌بندی‌ها بگردید."
            actionLabel="مشاهده همه سالن‌ها"
            onAction={() => navigate('/venues')}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', px: 0.5 }}>
              {results.length.toLocaleString('fa-IR')} نتیجه برای «{submitted}»
            </Typography>
            {results.map((v) => {
              const imgs = parseList(v.images)
              return (
                <Box
                  key={v.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: `${radii.card}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: shadows.card,
                    transition: 'border-color 0.2s ease',
                    '&:hover': { borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.45)' : 'rgba(245,158,11,0.55)') },
                  }}
                >
                  <Box
                    component={Link}
                    to={`/venues/${v.id}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      flex: 1,
                      minWidth: 0,
                      p: 0,
                      borderRadius: 'inherit',
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                    }}
                  >
                    <Box
                      component="img"
                      src={imgs[0] ? toFullUrl(imgs[0]) : ''}
                      alt={v.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = 'hidden'
                      }}
                      loading="lazy"
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '14px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'),
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }} noWrap>
                        {v.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                        <Rating value={v.average_rating} count={v.total_reviews} size="sm" />
                      </Box>
                      <Box sx={{ mt: 0.5 }}>
                        <Price value={v.price} from size="sm" />
                      </Box>
                    </Box>
                  </Box>
                  <FavoriteButton venue={{ id: v.id, name: v.name }} size="sm" onImage={false} />
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Layout>
  )
}

export default Search
