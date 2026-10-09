import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'
import { gradients, radii } from '@/theme'

interface AppFeatureProps {
  icon: string
  title: string
  description: string
  color: string
}

const AppFeature: React.FC<AppFeatureProps> = ({ icon, title, description, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon icon={icon} style={{ width: 20, height: 20, color }} />
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
        {description}
      </Typography>
    </Box>
  </Box>
)

export const AppDownloadSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="اپلیکیشن موبایل"
        subtitle="تجربه بهتر با اپلیکیشن اختصاصی ما"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
              top: -80,
              right: -80,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 4,
                alignItems: 'center',
              }}
            >
              {/* سمت چپ - اطلاعات */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      background: gradients.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon icon="mdi:cellphone" style={{ width: 32, height: 32, color: '#1c1917' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.5rem' }}>
                      اپلیکیشن فوتسال
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                      نسخه ۲.۰ • رایگان
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.8,
                    mb: 3,
                  }}
                >
                  با اپلیکیشن موبایل، سریع‌تر رزرو کن، نوتیفیکیشن دریافت کن و از تمام امکانات استفاده کن. حتی آفلاین هم می‌تونی برنامه‌ریزی کنی!
                </Typography>

                {/* ویژگی‌ها */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <AppFeature
                    icon="mdi:bell-ring"
                    title="نوتیفیکیشن هوشمند"
                    description="یادآوری بازی، تخفیف‌ها و اخبار ویژه"
                    color="#fbbf24"
                  />
                  <AppFeature
                    icon="mdi:lightning-bolt"
                    title="رزرو سریع‌تر"
                    description="در کمتر از ۱۵ ثانیه زمین رزرو کن"
                    color="#10b981"
                  />
                  <AppFeature
                    icon="mdi:wifi-off"
                    title="حالت آفلاین"
                    description="مشاهده رزروها بدون اینترنت"
                    color="#3b82f6"
                  />
                  <AppFeature
                    icon="mdi:shield-check"
                    title="امنیت بالاتر"
                    description="احراز هویت بیومتریک (اثر انگشت/چهره)"
                    color="#8b5cf6"
                  />
                </Box>

                {/* دکمه‌های دانلود */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    sx={{
                      bgcolor: '#fff',
                      color: '#1c1917',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      px: 2.5,
                      py: 1.2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                    startIcon={<Icon icon="mdi:android" style={{ width: 22, height: 22 }} />}
                  >
                    دانلود برای اندروید
                  </Button>
                  <Button
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      px: 2.5,
                      py: 1.2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.25)',
                      },
                    }}
                    startIcon={<Icon icon="mdi:apple" style={{ width: 22, height: 22 }} />}
                  >
                    دانلود برای iOS
                  </Button>
                </Box>
              </Box>

              {/* سمت راست - تصویر گوشی */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 220,
                    height: 440,
                    borderRadius: '32px',
                    border: '8px solid rgba(255,255,255,0.2)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}
                >
                  <Icon icon="mdi:soccer" style={{ width: 64, height: 64, color: '#fbbf24' }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                    فوتسال ما
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                    همین حالا نصب کن!
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* استایل انیمیشن */}
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
      `}</style>
    </Box>
  )
}
