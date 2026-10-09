import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { gradients, radii } from '@/theme'

interface StatsItem {
  icon: string
  value: string
  label: string
  color: string
}

const STATS: StatsItem[] = [
  { icon: 'mdi:users', value: '+۱۲,۰۰۰', label: 'بازیکن فعال', color: '#3b82f6' },
  { icon: 'mdi:soccer-field', value: '+۵۰', label: 'زمین حرفه‌ای', color: '#10b981' },
  { icon: 'mdi:trophy', value: '+۳۰۰', label: 'مسابقه هفتگی', color: '#f59e0b' },
  { icon: 'mdi:star', value: '۴.۸', label: 'امتیاز کاربران', color: '#ef4444' },
]

const FEATURES = [
  {
    icon: 'mdi:clock-check-outline',
    title: 'رزرو فوری',
    desc: 'در کمتر از ۳۰ ثانیه زمین رزرو کن',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    icon: 'mdi:cash-multiple',
    title: 'بهترین قیمت',
    desc: 'تضمین ارزان‌ترین نرخ با تخفیف‌های ویژه',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    icon: 'mdi:account-group',
    title: 'تیم‌سازی آسان',
    desc: 'هم‌تیمی پیدا کن و تیم بساز',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
]

export const HeroSection: React.FC = () => {
  const navigate = useNavigate()
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % FEATURES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${radii.card}px`,
        background: gradients.primary,
        color: '#fff',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 4, sm: 5, md: 6 },
        mb: 4,
        boxShadow: '0 20px 60px rgba(15,23,42,0.4)',
      }}
    >
      {/* پس‌زمینه متحرک */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 250,
          height: 250,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.08)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: '3px dashed rgba(255,255,255,0.1)',
          animation: 'spin 20s linear infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          bgcolor: 'rgba(245,158,11,0.06)',
          filter: 'blur(60px)',
        }}
      />

      {/* محتوای اصلی */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* عنوان اصلی */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
              lineHeight: 1.3,
              mb: 2,
              textAlign: 'center',
            }}
          >
            فوتسال رو{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              حرفه‌ای‌تر
            </Box>{' '}
            تجربه کن
          </Typography>
        </motion.div>

        {/* زیرعنوان */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              maxWidth: 600,
              mx: 'auto',
              mb: 3,
              lineHeight: 1.8,
            }}
          >
            بهترین زمین‌ها، راحت‌ترین رزرو، هیجان‌انگیزترین بازی‌ها
            <br />
            همین حالا شروع کن و به هزاران بازیکن بپیوند
          </Typography>
        </motion.div>

        {/* دکمه‌های CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <Button
            onClick={() => navigate('/venues')}
            sx={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#1c1917',
              fontWeight: 800,
              fontSize: '0.95rem',
              px: 3.5,
              py: 1.2,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(251,191,36,0.35)',
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(251,191,36,0.45)',
              },
              transition: 'all 0.3s ease',
            }}
            startIcon={<Icon icon="mdi:soccer" style={{ width: 20, height: 20 }} />}
          >
            مشاهده زمین‌ها
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              px: 3.5,
              py: 1.2,
              borderRadius: '12px',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
            startIcon={<Icon icon="mdi:account-plus" style={{ width: 20, height: 20 }} />}
          >
            ثبت‌نام رایگان
          </Button>
        </motion.div>

        {/* ویژگی‌های چرخشی */}
        <motion.div
          key={currentFeature}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 32,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: FEATURES[currentFeature].gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              icon={FEATURES[currentFeature].icon}
              style={{ width: 22, height: 22, color: '#fff' }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
              {FEATURES[currentFeature].title}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              {FEATURES[currentFeature].desc}
            </Typography>
          </Box>
        </motion.div>

        {/* آمار اجتماعی */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mt: 3,
          }}
        >
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    background: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    icon={stat.icon}
                    style={{ width: 22, height: 22, color: stat.color }}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* استایل انیمیشن‌ها */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  )
}
