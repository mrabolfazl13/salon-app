import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { radii } from '@/theme'
import { toPersianDigits } from '@/lib/jalali'

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(3600 * 24) // 24 ساعت به ثانیه

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const formatTime = (num: number) => toPersianDigits(num.toString().padStart(2, '0'))

  return (
    <Box sx={{ mb: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: `${radii.card}px`,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#fff',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 4, sm: 5 },
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* پس‌زمینه متحرک */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)',
              animation: 'pulse-glow 4s ease-in-out infinite reverse',
            }}
          />

          {/* محتوای اصلی */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* آیکون و عنوان */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'bounce 2s ease-in-out infinite',
                }}
              >
                <Icon icon="mdi:gift-outline" style={{ width: 32, height: 32, color: '#1c1917' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                  textAlign: 'center',
                }}
              >
                پیشنهاد ویژه برای تازه‌واردها!
              </Typography>
            </Box>

            {/* توضیحات */}
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                maxWidth: 600,
                mx: 'auto',
                mb: 3,
                lineHeight: 1.8,
              }}
            >
              همین حالا ثبت‌نام کن و{' '}
              <Box component="span" sx={{ color: '#fbbf24', fontWeight: 800 }}>
                ۵۰٪ تخفیف
              </Box>{' '}
              برای اولین رزروت بگیر!
            </Typography>

            {/* شمارش معکوس */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              {[
                { value: formatTime(hours), label: 'ساعت' },
                { value: formatTime(minutes), label: 'دقیقه' },
                { value: formatTime(seconds), label: 'ثانیه' },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    minWidth: 80,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      color: '#fbbf24',
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* مزایا */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              {[
                'ثبت‌نام رایگان',
                'بدون نیاز به کارت اعتباری',
                'لغو تا ۲ ساعت قبل',
                'پشتیبانی ۲۴ ساعته',
              ].map((benefit) => (
                <Box
                  key={benefit}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.82rem',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <Icon icon="mdi:check-circle" style={{ width: 16, height: 16, color: '#10b981' }} />
                  {benefit}
                </Box>
              ))}
            </Box>

            {/* دکمه‌ها */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#1c1917',
                  fontWeight: 800,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(251,191,36,0.35)',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(251,191,36,0.45)',
                  },
                  transition: 'all 0.3s ease',
                }}
                startIcon={<Icon icon="mdi:account-plus" style={{ width: 22, height: 22 }} />}
              >
                ثبت‌نام و دریافت تخفیف
              </Button>
              <Button
                onClick={() => navigate('/venues')}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
                startIcon={<Icon icon="mdi:soccer" style={{ width: 22, height: 22 }} />}
              >
                مشاهده زمین‌ها
              </Button>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* استایل انیمیشن‌ها */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </Box>
  )
}
