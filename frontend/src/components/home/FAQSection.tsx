import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface FAQItemProps {
  question: string
  answer: string
  delay?: number
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, delay = 0 }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Box
        sx={{
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: isOpen ? 'primary.main' : 'divider',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* سوال */}
        <Box
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            cursor: 'pointer',
            gap: 1.5,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.92rem',
              color: 'text.primary',
              flex: 1,
            }}
          >
            {question}
          </Typography>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: isOpen ? 'primary.main' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon
              icon={isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
              style={{
                width: 18,
                height: 18,
                color: isOpen ? '#fff' : 'text.secondary',
              }}
            />
          </Box>
        </Box>

        {/* پاسخ */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  p: 2,
                  pt: 0,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.8,
                    color: 'text.secondary',
                  }}
                >
                  {answer}
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  )
}

const FAQS = [
  {
    question: 'چطور می‌تونم زمین رزرو کنم؟',
    answer:
      'کافیه وارد بخش «زمین‌ها» بشی، زمین مورد نظرت رو انتخاب کنی، تاریخ و ساعت رو مشخص کنی و پرداخت آنلاین انجام بدی. کل فرآیند کمتر از ۱ دقیقه وقت می‌بره!',
  },
  {
    question: 'آیا امکان لغو رزرو وجود داره؟',
    answer:
      'بله! تا ۲ ساعت قبل از شروع سانس، می‌تونی بدون هیچ جریمه‌ای رزروت رو لغو کنی و مبلغ به صورت کامل به حسابت برگرده.',
  },
  {
    question: 'هزینه رزرو چقدره؟',
    answer:
      'قیمت‌ها بسته به نوع زمین (چمن طبیعی/مصنوعی)، زمان (صبح/عصر) و روز هفته متفاوت هست. معمولاً از ۲۰۰ هزار تومان شروع میشه. تخفیف‌های ویژه هم داریم!',
  },
  {
    question: 'آیا تجهیزات ورزشی هم فراهم می‌کنید؟',
    answer:
      'بله، اکثر زمین‌ها توپ، کاور و سایر تجهیزات رو دارن. ولی پیشنهاد می‌کنیم کفش مخصوص فوتسال و لباس راحت بیارید.',
  },
  {
    question: 'چطور می‌تونم تیم بسازم و هم‌تیمی پیدا کنم؟',
    answer:
      'از بخش «تیم‌ها» می‌تونی یه تیم جدید بسازی و لینک دعوت رو برای دوستات بفرستی. همچنین می‌تونی به تیم‌های موجود بپیوندی یا بازی جدید ایجاد کنی تا بقیه بهت ملحق بشن.',
  },
  {
    question: 'سیستم امتیازدهی و وفاداری چطور کار می‌کنه؟',
    answer:
      'با هر رزرو موفق، امتیاز دریافت می‌کنی. این امتیازها رو می‌تونی برای دریافت تخفیف، جوایز نقدی و مزایای ویژه استفاده کنی. هر چی بیشتر بازی کنی، سطح بالاتری می‌رسی!',
  },
  {
    question: 'آیا داور هم در دسترس هست؟',
    answer:
      'بله، هنگام رزرو می‌تونی درخواست داور حرفه‌ای هم بدی. هزینه داور جداگانه محاسبه میشه و معمولاً ۱۵۰-۲۰۰ هزار تومان برای هر سانس هست.',
  },
  {
    question: 'روش‌های پرداخت چیست؟',
    answer:
      'می‌تونی با تمام کارت‌های بانکی عضو شتاب، کیف پول دیجیتال یا درگاه‌های پرداخت آنلاین مثل زرین‌پال پرداخت کنی. همه تراکنش‌ها امن و رمزنگاری شده هستن.',
  },
]

export const FAQSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="سوالات متداول"
        subtitle="پاسخ سوالات رایج رو اینجا پیدا کن"
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {FAQS.map((faq, index) => (
          <FAQItem key={index} {...faq} delay={index * 0.05} />
        ))}
      </Box>

      {/* تماس با پشتیبانی */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{ marginTop: 32 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5,
            borderRadius: '16px',
            bgcolor: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: 'rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon="mdi:headset" style={{ width: 24, height: 24, color: '#3b82f6' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', mb: 0.25 }}>
              سوال دیگه‌ای داری؟
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
              تیم پشتیبانی ما ۲۴ ساعته آماده کمک هست. از طریق واتساپ، تلگرام یا تماس تلفنی با ما در ارتباط باش.
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  )
}
