import React, { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import SectionHeader from '@/components/mobile/SectionHeader'

interface FAQItemProps {
  question: string
  answer: string
  delay?: number
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, delay = 0 }) => {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className={`overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:shadow-sm ${
          isOpen ? 'border-blue-600 dark:border-blue-400' : 'border-border'
        }`}
      >
        {/* سوال */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen) } }}
          className="flex cursor-pointer items-center justify-between gap-2 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="flex-1 text-[0.82rem] font-bold text-foreground">
            {question}
          </p>
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
              isOpen
                ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950'
                : 'bg-black/5 text-muted-foreground dark:bg-white/10'
            }`}
          >
            <Icon
              icon={isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
              style={{ width: 15, height: 15 }}
            />
          </span>
        </div>

        {/* پاسخ */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={panelId}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-t border-border p-3 pt-2">
                <p className="text-[0.75rem] leading-[1.7] text-muted-foreground">
                  {answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    <section className="mb-6">
      <SectionHeader
        title="سوالات متداول"
        subtitle="پاسخ سوالات رایج رو اینجا پیدا کن"
      />

      <div className="flex flex-col gap-2">
        {FAQS.map((faq, index) => (
          <FAQItem key={index} {...faq} delay={index * 0.05} />
        ))}
      </div>

      {/* تماس با پشتیبانی */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-6"
      >
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.08] p-3 dark:bg-blue-500/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
            <Icon icon="mdi:headset" style={{ width: 18, height: 18, color: '#3b82f6' }} />
          </span>
          <div className="flex-1">
            <p className="mb-0.5 text-[0.82rem] font-bold text-foreground">
              سوال دیگه‌ای داری؟
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              تیم پشتیبانی ما ۲۴ ساعته آماده کمک هست. از طریق واتساپ، تلگرام یا تماس تلفنی با ما در ارتباط باش.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
