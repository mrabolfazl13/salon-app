import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import SectionHeader from '@/components/mobile/SectionHeader'
import { Button } from '@/components/ui/shadcn/button'

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
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-foreground no-underline transition-all duration-300 hover:border-[color:var(--platform-color)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      style={{ '--platform-color': color } as React.CSSProperties}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]"
        style={{ background: bgColor }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color }} />
      </span>
      <div className="flex-1">
        <p className="text-[0.95rem] font-bold text-foreground">
          {name}
        </p>
        <p className="text-[0.78rem] text-muted-foreground">
          @{handle}
        </p>
      </div>
      <Icon icon="mdi:arrow-top-right" className="text-muted-foreground" style={{ width: 20, height: 20 }} />
    </a>
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
    <section className="mb-4">
      <SectionHeader
        title="ما رو دنبال کن"
        subtitle="از آخرین اخبار، تخفیف‌ها و لحظات خاص باخبر شو"
      />

      {/* پلتفرم‌های اجتماعی */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <SocialPlatform key={platform.name} {...platform} />
        ))}
      </div>

      {/* محتوای ویژه */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="rounded-[20px] border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <Icon icon="mdi:camera" style={{ width: 24, height: 24, color: '#E4405F' }} />
            <h3 className="text-sm font-bold text-foreground">
              پیج اینستاگرام ما
            </h3>
          </div>

          {/* گالری پست‌ها حذف شد: بدون Instagram API فقط کادر خالی و عدد ساختگی نمایش داده می‌شد */}
          <p className="text-[0.85rem] text-muted-foreground">
            جدیدترین عکس‌ها، فیلم‌های بازی و تخفیف‌ها در پیج ما منتشر می‌شود.
          </p>

          <Button
            asChild
            className="mt-5 h-12 w-full rounded-xl bg-none bg-pink-700 font-bold text-white shadow-none hover:bg-pink-800 hover:shadow-none"
          >
            <a
              href="https://instagram.com/futsal.ma"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon="mdi:instagram" style={{ width: 20, height: 20 }} />
              مشاهده همه پست‌ها در اینستاگرام
            </a>
          </Button>
        </div>
      </motion.div>

      {/* دعوت به اشتراک‌گذاری */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-6"
      >
        <div className="flex items-center gap-4 rounded-lg border border-purple-500/20 bg-purple-500/[0.08] p-3 dark:bg-purple-500/10">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
            <Icon icon="mdi:share-variant" style={{ width: 24, height: 24, color: '#8b5cf6' }} />
          </span>
          <div className="flex-1">
            <p className="mb-0.5 text-[0.92rem] font-bold text-foreground">
              لحظاتت رو با ما به اشتراک بذار!
            </p>
            <p className="text-[0.82rem] text-muted-foreground">
              از بازی‌هات عکس و فیلم بگیر و با هشتگ #فوتسال_ما منتشر کن. بهترین‌ها رو استوری می‌کنیم!
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
