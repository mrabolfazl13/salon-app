// علاقه‌مندی‌ها — صفحه موبایل‌فرست برای سالن‌های ذخیره‌شده (کلاینت‌ساید)
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/layout/Layout'
import VenueCard from '@/components/venue/VenueCard'
import { EmptyState, ErrorState, SectionHeader, VenueCardSkeletonList } from '@/components/mobile'
import { venueService } from '@/services/venue'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { Venue } from '@/types/venue'

const Favorites: React.FC = () => {
  const navigate = useNavigate()
  const favorites = useFavoritesStore((s) => s.favorites)
  const clear = useFavoritesStore((s) => s.clear)

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState<boolean>(favorites.length > 0)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (favorites.length === 0) {
      setVenues([])
      setLoading(false)
      setFetchError(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(false)
    venueService
      .getAll({ limit: Math.max(100, favorites.length * 2) })
      .then((response: any) => {
        if (!cancelled) {
          // Handle both array response and paginated response { data: [], total: number }
          const venues = Array.isArray(response) 
            ? response 
            : Array.isArray(response?.data) 
              ? response.data 
              : []
          setVenues(venues)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch venues for favorites:', error)
          setFetchError(true)
          setVenues([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length])

  // مرتب‌سازی بر اساس تاریخ ذخیره (جدیدترین اول)
  const favoriteVenues = useMemo(() => {
    const byId = new Map(venues.map((v) => [v.id, v]))
    return favorites
      .map((f) => byId.get(f.id))
      .filter((v): v is Venue => Boolean(v))
  }, [favorites, venues])

  // سالن‌هایی که دیگر وجود ندارند (حذف‌شده از سمت سرور)
  const missingCount = favorites.length - favoriteVenues.length

  return (
    <Layout>
      <div className="mx-auto max-w-[1000px]">
        <SectionHeader
          heading="h1"
          title="علاقه‌مندی‌ها"
          subtitle={
            favorites.length > 0
              ? `${favorites.length} سالن ذخیره‌شده`
              : undefined
          }
          actionLabel={favorites.length > 0 ? 'پاک کردن همه' : undefined}
          onAction={favorites.length > 0 ? clear : undefined}
        />

        {loading ? (
          <VenueCardSkeletonList count={Math.min(favorites.length, 3)} />
        ) : fetchError ? (
          <ErrorState
            title="خطا در دریافت سالن‌ها"
            description="مشکلی در ارتباط با سرور پیش آمد."
          />
        ) : favoriteVenues.length === 0 ? (
          favorites.length > 0 ? (
            <EmptyState
              icon="mdi:trash-can-outline"
              title="سالن‌های ذخیره‌شده در دسترس نیستند"
              description="به نظر می‌رسد سالن‌هایی که ذخیره کرده بودید حذف شده‌اند. می‌توانید لیست را پاک کنید یا سالن جدیدی پیدا کنید."
              actionLabel="پاک کردن لیست"
              onAction={clear}
            />
          ) : (
            <EmptyState
              icon="mdi:heart-outline"
              title="هنوز سالنی ذخیره نکرده‌اید"
              description="روی آیکون قلب در هر سالن بزنید تا اینجا ذخیره شود و سریع‌تر به آن دسترسی داشته باشید."
              actionLabel="مشاهده سالن‌ها"
              onAction={() => navigate('/venues')}
            />
          )
        ) : (
          <>
            {missingCount > 0 && (
              <p className="mb-3 block text-[0.68rem] text-muted-foreground">
                {`${missingCount} مورد از لیست حذف شده‌اند (سالن دیگر موجود نیست)`}
              </p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3 md:grid-cols-3">
                {favoriteVenues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    onBook={(id) => navigate(`/venues/${id}`)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Favorites
