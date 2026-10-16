import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface SocialPlatformProps {
  icon: string
  name: string
  handle: string
  color: string
  bgColor: string
  link: string
}

const SocialPlatform: React.FC<SocialPlatformProps> = ({
  icon,
  name,
  handle,
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
    color: '#E4405F',
    bgColor: 'rgba(228,64,95,0.1)',
    link: 'https://instagram.com/futsal.ma',
  },
  {
    icon: 'mdi:telegram',
    name: 'تلگرام',
    handle: 'futsal_ma',
    color: '#0088cc',
    bgColor: 'rgba(0,136,204,0.1)',
    link: 'https://t.me/futsal_ma',
  },
  {
    icon: 'mdi:youtube',
    name: 'یوتیوب',
    handle: 'FutsalMa',
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
              پیج اینستاگرام ما
            </Typography>
          </Box>

          {/* گالری پست‌ها حذف شد: بدون Instagram API فقط کادر خالی و عدد ساختگی نمایش داده می‌شد */}
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            جدیدترین عکس‌ها، فیلم‌های بازی و تخفیف‌ها در پیج ما منتشر می‌شود.
          </Typography>

          <Button
            fullWidth
            href="https://instagram.com/futsal.ma"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 2.5,
              minHeight: 48,
              py: 1.2,
              borderRadius: '12px',
              bgcolor: '#be185d',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#9d174d',
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
