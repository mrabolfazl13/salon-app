import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
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
    whileHover={{ scale: 1.02 }}
  >
    <Box
      sx={{
        p: 2.5,
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          borderColor: 'primary.main',
        },
      }}
    >
      {/* هدر کارت */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* آواتار */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {avatar}
        </Box>

        {/* اطلاعات کاربر */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'text.primary',
            }}
          >
            {name}
          </Typography>
          {venue && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
              }}
            >
              {venue}
            </Typography>
          )}
        </Box>
      </Box>

      {/* امتیاز */}
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            icon="mdi:star"
            style={{
              width: 16,
              height: 16,
              color: i < rating ? '#fbbf24' : '#d1d5db',
            }}
          />
        ))}
      </Box>

      {/* متن نظر */}
      <Typography
        sx={{
          fontSize: '0.85rem',
          lineHeight: 1.8,
          color: 'text.primary',
          flex: 1,
        }}
      >
        "{text}"
      </Typography>
    </Box>
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
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="نظرات کاربران"
        subtitle="ببین بقیه چی میگن درباره تجربه‌شون"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {TESTIMONIALS.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.name}
            {...testimonial}
            delay={index * 0.1}
          />
        ))}
      </Box>
    </Box>
  )
}
