// علاقه‌مندی‌ها — صفحه موبایل‌فرست برای سالن‌های ذخیره‌شده (کلاینت‌ساید)
import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/layout/Layout'
import VenueCard from '@/components/venue/VenueCard'
import { EmptyState, SectionHeader, VenueCardSkeletonList } from '@/components/mobile'
import { venueService } from '@/services/venue'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { Venue } from '@/types/venue'

const Favorites: React.FC = () => {
  const navigate = useNavigate()
  const favorites = useFavoritesStore((s) => s.favorites)
  const clear = useFavoritesStore((s) => s.clear)

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState<boolean>(favorites.length > 0)

  useEffect(() => {
    if (favorites.length === 0) {
      setVenues([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    venueService
      .getAll({ limit: 100 })
      .then((data: Venue[]) => {
        if (!cancelled) setVenues(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setVenues([])
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
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <SectionHeader
          title="❤️ علاقه‌مندی‌ها"
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
        ) : favoriteVenues.length === 0 ? (
          favorites.length > 0 ? (
            <EmptyState
              emoji="🗑️"
              title="سالن‌های ذخیره‌شده در دسترس نیستند"
              description="به نظر می‌رسد سالن‌هایی که ذخیره کرده بودید حذف شده‌اند. می‌توانید لیست را پاک کنید یا سالن جدیدی پیدا کنید."
              actionLabel="پاک کردن لیست"
              onAction={clear}
            />
          ) : (
            <EmptyState
              emoji="❤️"
              title="هنوز سالنی ذخیره نکرده‌اید"
              description="روی آیکون قلب در هر سالن بزنید تا اینجا ذخیره شود و سریع‌تر به آن دسترسی داشته باشید."
              actionLabel="مشاهده سالن‌ها"
              onAction={() => navigate('/venues')}
            />
          )
        ) : (
          <>
            {missingCount > 0 && (
              <Typography
                variant="caption"
                sx={{ display: 'block', color: 'text.secondary', mb: 1.5 }}
              >
                {`${missingCount} مورد از لیست حذف شده‌اند (سالن دیگر موجود نیست)`}
              </Typography>
            )}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: { xs: 2, sm: 2.5 },
                }}
              >
                {favoriteVenues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    onBook={(id) => navigate(`/venues/${id}`)}
                  />
                ))}
              </Box>
            </motion.div>
          </>
        )}
      </Box>
    </Layout>
  )
}

export default Favorites
