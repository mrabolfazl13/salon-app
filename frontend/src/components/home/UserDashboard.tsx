// UserDashboard - Personalized quick-access page for authenticated users
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import MobileHeader from '@/components/mobile/MobileHeader'
import SearchBar from '@/components/mobile/SearchBar'
import VenueCard from '@/components/venue/VenueCard'
import { VenueCardSkeletonList } from '@/components/mobile/Skeletons'
import { venueService } from '@/services/venue'
import { useAuthStore } from '@/store/authStore'
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore'
import { cn } from '@/lib/utils'
import type { Venue } from '@/types'

interface QuickAction {
  label: string
  icon: string
  href: string
  color: string
  description?: string
  /** موبایل دوستونه است؛ آیتم فردِ آخر یک خانهٔ نصفه می‌گذارد، پس این یکی کل عرض را می‌گیرد */
  wide?: boolean
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const viewed = useRecentlyViewedStore((s) => s.viewed)
  
  const [recentVenues, setRecentVenues] = useState<Venue[]>([])
  const [popularVenues, setPopularVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  // Load recent and popular venues
  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        const [allVenues] = await Promise.all([
          venueService.getAll({ limit: 20 })
        ])
        
        if (!cancelled) {
          // Recent venues from recently viewed
          const byId = new Map(allVenues.map((v: Venue) => [v.id, v]))
          const recent = viewed.map((v) => byId.get(v.id)).filter(Boolean) as Venue[]
          setRecentVenues(recent.slice(0, 4))
          
          // Popular venues (sorted by rating)
          const popular = [...allVenues]
            .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
            .slice(0, 6)
          setPopularVenues(popular)
        }
      } catch (error) {
        console.error('Error loading venues:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    loadData()
    return () => { cancelled = true }
  }, [viewed])

  // Define quick actions based on user role
  const getQuickActions = (): QuickAction[] => {
    const base: QuickAction[] = [
      { label: 'رزروهای من', icon: 'mdi:calendar-check', href: '/bookings', color: 'from-blue-500 to-blue-600', description: 'مشاهده رزروهای فعال و گذشته' },
      { label: 'جستجوی سالن', icon: 'mdi:magnify', href: '/venues', color: 'from-emerald-500 to-emerald-600', description: 'یافتن سالن مناسب' },
      { label: 'علاقه‌مندی‌ها', icon: 'mdi:heart', href: '/favorites', color: 'from-rose-500 to-rose-600', description: 'سالن‌های ذخیره شده' },
      { label: 'تیم‌ها', icon: 'mdi:account-group', href: '/teams', color: 'from-violet-500 to-violet-600', description: 'مدیریت تیم‌های من' },
    ]

    // Add role-specific actions
    if (user?.role === 'venue_manager' || user?.role === 'club_admin') {
      base.splice(1, 0, {
        label: 'داشبورد مدیریت',
        icon: 'mdi:view-dashboard',
        href: '/manager-dashboard',
        color: 'from-amber-500 to-amber-600',
        description: 'مدیریت سالن و پرسنل'
      })
    }

    // /finance accepts venue_manager and club_admin (ProtectedRoute), and both
    // count as owners in useStaffPermission — hiding it from club_admin stranded them.
    if (user?.role === 'venue_manager' || user?.role === 'club_admin') {
      base.push({
        label: 'امور مالی',
        icon: 'mdi:wallet',
        href: '/finance',
        color: 'from-cyan-500 to-cyan-600',
        description: 'درآمد و هزینه‌ها'
      })
    }

    if (user?.role === 'super_admin') {
      base.push({
        label: 'پنل ادمین',
        icon: 'mdi:shield-account',
        href: '/admin',
        color: 'from-purple-500 to-purple-600',
        description: 'مدیریت سیستم'
      })
    }

    // چالش هفتگی جایزهٔ امتیازی دارد ولی تنها ورودی‌اش تایلِ صفحهٔ مهمان بود — یعنی
    // کاربرِ واردشده هیچ‌وقت به آن نمی‌رسید. کنسول‌دارها (مدیر/کلاب) داشبورد کاری خود
    // را دارند و شش تایل پر می‌شود، پس این فقط برای مشتری و مربی اضافه می‌شود.
    if (user?.role !== 'venue_manager' && user?.role !== 'club_admin') {
      base.push({
        label: 'چالش هفتگی',
        icon: 'mdi:brain',
        href: '/quiz',
        color: 'from-fuchsia-500 to-pink-600',
        description: 'سه سؤال، امتیاز وفاداری',
        wide: true
      })
    }

    return base
  }

  const quickActions = getQuickActions()

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-20">
      {/* Header */}
      <MobileHeader headingTag="h1" />

      {/* Quick Search */}
      <div className="mb-4">
        <SearchBar
          value=""
          readOnly
          onClick={() => navigate('/search')}
          placeholder="جستجوی سریع سالن..."
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-4">
        <h2 className="mb-3 text-[0.9rem] font-extrabold text-foreground">دسترسی سریع</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => navigate(action.href)}
              className={cn(
                'flex min-h-24 flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-sm transition-colors hover:border-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-amber-400/35',
                action.wide && 'col-span-2 sm:col-span-1'
              )}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white shadow-md`}>
                <Icon icon={action.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[0.78rem] font-bold text-foreground">{action.label}</p>
                {action.description && (
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{action.description}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recently Viewed Venues */}
      {recentVenues.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[0.9rem] font-extrabold text-foreground">اخیراً دیده‌شده</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/favorites')}
              className="min-h-11 px-2 text-[0.72rem]"
            >
              مشاهده همه
              <Icon icon="mdi:chevron-left" className="ms-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {recentVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Popular Venues */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[0.9rem] font-extrabold text-foreground">محبوب‌ترین سالن‌ها</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/venues')}
            className="min-h-11 px-2 text-[0.72rem]"
          >
            مشاهده همه
            <Icon icon="mdi:chevron-left" className="ms-1 h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <VenueCardSkeletonList count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {popularVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onBook={(id) => navigate(`/venues/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
