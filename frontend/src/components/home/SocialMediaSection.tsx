import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface SocialPlatformProps {
  icon: string
  name: string
  handle: string
  followers: string
  color: string
  bgColor: string
  link: string
}

const SocialPlatform: React.FC<SocialPlatformProps> = ({
  icon,
  name,
  handle,
  followers,
  color,
  bgColor,
  link,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    whileHover={{ y: -6 }}
  >
    <Box
      component="a"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 8px 24px ${color}30`,
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
          {name}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          @{handle}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: color,
            fontWeight: 700,
            mt: 0.25,
          }}
        >
          {followers} دنبال‌کننده
        </Typography>
      </Box>
      <Icon icon="mdi:arrow-top-right" style={{ width: 20, height: 20, color: 'text.secondary' }} />
    </Box>
  </motion.div>
)

const SOCIAL_PLATFORMS = [
  {
    icon: 'mdi:instagram',
    name: 'اینستاگرام',
    handle: 'futsal.ma',
    followers: '۲۵.۴K',
    color: '#E4405F',
    bgColor: 'rgba(228,64,95,0.1)',
    link: 'https://instagram.com/futsal.ma',
  },
  {
    icon: 'mdi:telegram',
    name: 'تلگرام',
    handle: 'futsal_ma',
    followers: '۱۸.۲K',
    color: '#0088cc',
    bgColor: 'rgba(0,136,204,0.1)',
    link: 'https://t.me/futsal_ma',
  },
  {
    icon: 'mdi:youtube',
    name: 'یوتیوب',
    handle: 'FutsalMa',
    followers: '۱۲.۸K',
    color: '#FF0000',
    bgColor: 'rgba(255,0,0,0.1)',
    link: 'https://youtube.com/@FutsalMa',
  },
]

export const SocialMediaSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="ما رو دنبال کن"
        subtitle="از آخرین اخبار، تخفیف‌ها و لحظات خاص باخبر شو"
      />

      {/* پلتفرم‌های اجتماعی */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {SOCIAL_PLATFORMS.map((platform) => (
          <SocialPlatform key={platform.name} {...platform} />
        ))}
      </Box>

      {/* محتوای ویژه */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: '20px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Icon icon="mdi:camera" style={{ width: 24, height: 24, color: '#E4405F' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
              آخرین پست‌های اینستاگرام
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box
                key={i}
                sx={{
                  aspectRatio: '1/1',
                  borderRadius: '12px',
                  bgcolor: 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    '& .overlay': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Icon
                  icon="mdi:image-outline"
                  style={{ width: 32, height: 32, color: '#9ca3af' }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <Icon icon="mdi:heart" style={{ width: 18, height: 18, color: '#fff' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>
                    {Math.floor(Math.random() * 500 + 100)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth
            href="https://instagram.com/futsal.ma"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 2.5,
              py: 1.2,
              borderRadius: '12px',
              bgcolor: '#E4405F',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#d63384',
              },
            }}
            startIcon={<Icon icon="mdi:instagram" style={{ width: 20, height: 20 }} />}
          >
            مشاهده همه پست‌ها در اینستاگرام
          </Button>
        </Box>
      </motion.div>

      {/* دعوت به اشتراک‌گذاری */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{ marginTop: 24 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5,
            borderRadius: '16px',
            bgcolor: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: 'rgba(139,92,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon="mdi:share-variant" style={{ width: 24, height: 24, color: '#8b5cf6' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', mb: 0.25 }}>
              لحظاتت رو با ما به اشتراک بذار!
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
              از بازی‌هات عکس و فیلم بگیر و با هشتگ #فوتسال_ما منتشر کن. بهترین‌ها رو استوری می‌کنیم!
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  )
}
