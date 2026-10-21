// src/pages/Search.tsx — صفحه اختصاصی جستجو: چسبان + تاریخچه + محبوب‌ها + نتایج
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const POPULAR_SEARCHES = ['فوتسال', 'بدنسازی', 'چمن مصنوعی', 'سرپوشیده', 'قم']

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

const Search: React.FC = () => {
  const navigate = useNavigate()
  const { queries, add, remove, clear } = useSearchHistoryStore()
  // فوکوس خودکار روی موبایل کیبورد را بلافاصله باز می‌کند و پیشنهادها را می‌پوشاند
  const [hasPointer] = useState(hasFinePointer)

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
      <div className="mx-auto max-w-[720px]">
        {/* سرتیتر صفحه برای فناوری کمکی — ظاهر صفحه تغییری نمی‌کند */}
        <h1 className="sr-only">جستجوی سالن</h1>
        {/* نوار جستجوی چسبان */}
        <div className="sticky top-0 z-30 mb-1 bg-[#f6f7f9]/92 py-3 backdrop-blur-md dark:bg-[#0b1220]/92">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (value ? setValue('') : navigate(-1))}
              aria-label="بازگشت"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon="mdi:arrow-right" style={{ width: 22, height: 22 }} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <SearchBar
                value={value}
                onChange={setValue}
                onClear={() => setValue('')}
                onSubmit={() => add(value)}
                placeholder="نام سالن یا محله را بنویسید…"
                autoFocus={hasPointer}
              />
            </div>
          </div>
        </div>

        {showLanding ? (
          <>
            {/* جستجوهای اخیر */}
            {recent.length > 0 && (
              <div className="mb-7">
                <SectionHeader
                  title="جستجوهای اخیر"
                  actionLabel="پاک کردن"
                  onAction={clear}
                />
                <div className="flex flex-col gap-1">
                  {recent.map((q) => (
                    <div
                      key={q}
                      className="flex items-center rounded-xl transition-colors hover:bg-muted/60"
                    >
                      <button
                        type="button"
                        onClick={() => pickQuery(q)}
                        className="flex min-h-12 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-start text-[0.88rem] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon
                          icon="mdi:history"
                          aria-hidden="true"
                          style={{ width: 20, height: 20, color: '#64748b', flexShrink: 0 }}
                        />
                        <span className="min-w-0 flex-1 truncate">{q}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`حذف ${q} از جستجوهای اخیر`}
                        onClick={() => remove(q)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon icon="mdi:close" style={{ width: 20, height: 20 }} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* جستجوهای محبوب */}
            <div className="mb-7">
              <SectionHeader title="جستجوهای محبوب" />
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => pickQuery(q)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.82rem] font-semibold text-foreground transition-colors hover:border-amber-500/60 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-amber-400"
                  >
                    <Icon icon="mdi:magnify" style={{ width: 16, height: 16, color: '#64748b' }} aria-hidden="true" />
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* دسته‌بندی ورزش‌ها */}
            <div>
              <SectionHeader title="دسته‌بندی‌ها" />
              <SportChipRow onSelect={handleSport} />
            </div>
          </>
        ) : loading ? (
          <div className="pt-1">
            <SearchResultsSkeleton />
          </div>
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
          <div className="flex flex-col gap-3">
            <p className="px-1 text-xs text-muted-foreground">
              {results.length.toLocaleString('fa-IR')} نتیجه برای «{submitted}»
            </p>
            {results.map((v) => {
              const imgs = parseList(v.images)
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-amber-500/50"
                >
                  <Link
                    to={`/venues/${v.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <img
                      src={imgs[0] ? toFullUrl(imgs[0]) : ''}
                      alt={v.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = 'hidden'
                      }}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-[14px] bg-muted object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9rem] font-bold text-foreground">{v.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Rating value={v.average_rating} count={v.total_reviews} size="sm" />
                      </div>
                      <div className="mt-1">
                        <Price value={v.price} from size="sm" />
                      </div>
                    </div>
                  </Link>
                  <FavoriteButton venue={{ id: v.id, name: v.name }} size="sm" onImage={false} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Search
