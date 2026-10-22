import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import SectionHeader from '@/components/mobile/SectionHeader'

interface TestimonialProps {
  name: string
  avatar: string
  rating: number
  text: string
  venue?: string
  delay?: number
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, avatar, rating, text, venue, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.01 }}
    className="h-full"
  >
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-all duration-300 hover:border-blue-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:border-blue-400">
      {/* هدر کارت */}
      <div className="flex items-center gap-2">
        {/* آواتار */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-extrabold text-white">
          {avatar}
        </span>

        {/* اطلاعات کاربر */}
        <div className="min-w-0 flex-1">
          <p className="text-[0.78rem] font-bold text-foreground">
            {name}
          </p>
          {venue && (
            <p className="text-[0.65rem] text-muted-foreground">
              {venue}
            </p>
          )}
        </div>
      </div>

      {/* امتیاز */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            icon="mdi:star"
            style={{
              width: 13,
              height: 13,
              color: i < rating ? '#fbbf24' : '#d1d5db',
            }}
          />
        ))}
      </div>

      {/* متن نظر */}
      <p className="flex-1 text-[0.75rem] leading-[1.7] text-foreground">
        "{text}"
      </p>
    </div>
  </motion.div>
)

const TESTIMONIALS = [
  {
    name: 'علی محمدی',
    avatar: 'ع',
    rating: 5,
    text: 'بهترین اپلیکیشن رزرو زمین که تا حالا استفاده کردم. خیلی راحت و سریع می‌تونم زمین پیدا کنم و رزرو بدم.',
    venue: 'زمین فوتسال آزادی',
  },
  {
    name: 'رضا کریمی',
    avatar: 'ر',
    rating: 5,
    text: 'تخفیف‌های لحظه آخری عالیه! با قیمت خیلی مناسب تونستم برای تیمم زمین بگیرم.',
    venue: 'سالن ورزشی انقلاب',
  },
  {
    name: 'محمد حسینی',
    avatar: 'م',
    rating: 4,
    text: 'امکان ساخت تیم و دعوت هم‌تیمی‌ها خیلی کاربردی شده. دیگه نیازی به گروه واتساپ نیست!',
    venue: 'زمین چمن مصنوعی',
  },
  {
    name: 'امیر رضایی',
    avatar: 'ا',
    rating: 5,
    text: 'پشتیبانی فوق‌العاده سریع و حرفه‌ای. یه بار مشکلی داشتم، تو چند دقیقه حل شد.',
    venue: 'سالن فوتسال المپیک',
  },
  {
    name: 'حسن احمدی',
    avatar: 'ح',
    rating: 5,
    text: 'جدول امتیازات و مسابقات هفتگی انگیزه بیشتری برای بازی کردن میده. واقعاً ممنونم!',
    venue: 'زمین ورزشی شهر',
  },
  {
    name: 'سعید نوری',
    avatar: 'س',
    rating: 4,
    text: 'کیفیت زمین‌ها دقیقاً مثل عکس‌ها بود. دیگه سورپرایز بد نداریم!',
    venue: 'سالن ورزشی فجر',
  },
]

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="mb-4">
      <SectionHeader
        title="نظرات کاربران"
        subtitle="ببین بقیه چی میگن درباره تجربه‌شون"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.name}
            {...testimonial}
            delay={index * 0.1}
          />
        ))}
      </div>
    </section>
  )
}
