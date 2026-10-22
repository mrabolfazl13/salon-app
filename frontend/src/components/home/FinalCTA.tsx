import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { toPersianDigits } from '@/lib/jalali'
import { Button } from '@/components/ui/shadcn/button'

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
    <section className="mb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:px-6 sm:py-10 md:px-8">
          {/* پس‌زمینه متحرک */}
          <div className="pointer-events-none absolute start-[-100px] -top-[100px] h-[300px] w-[300px] animate-[pulse-glow_3s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.15),transparent)] motion-reduce:animate-none" />
          <div className="pointer-events-none absolute -bottom-20 -end-20 h-[250px] w-[250px] animate-[pulse-glow_4s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent)] motion-reduce:animate-none" />

          {/* محتوای اصلی */}
          <div className="relative z-[1]">
            {/* آیکون و عنوان */}
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="flex h-14 w-14 animate-[bounce_2s_ease-in-out_infinite] items-center justify-center rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-500 motion-reduce:animate-none">
                <Icon icon="mdi:gift-outline" style={{ width: 32, height: 32, color: '#1c1917' }} />
              </span>
              <h2 className="text-center text-xl font-black sm:text-[1.8rem] md:text-[2.2rem]">
                پیشنهاد ویژه برای تازه‌واردها!
              </h2>
            </div>

            {/* توضیحات */}
            <p className="mx-auto mb-4 max-w-[600px] text-center text-[0.95rem] leading-[1.8] text-white/85 sm:text-[1.05rem]">
              همین حالا ثبت‌نام کن و{' '}
              <span className="font-extrabold text-amber-400">
                ۵۰٪ تخفیف
              </span>{' '}
              برای اولین رزروت بگیر!
            </p>

            {/* شمارش معکوس */}
            <div className="mb-4 flex justify-center gap-4">
              {[
                { value: formatTime(hours), label: 'ساعت' },
                { value: formatTime(minutes), label: 'دقیقه' },
                { value: formatTime(seconds), label: 'ثانیه' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-20 flex-col items-center gap-1 rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 py-3 backdrop-blur-[10px]"
                >
                  <p className="text-[1.8rem] font-black tabular-nums text-amber-400">
                    {item.value}
                  </p>
                  <p className="text-[0.68rem] text-white/70">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* مزایا */}
            <div className="mb-4 flex flex-wrap justify-center gap-4">
              {[
                'ثبت‌نام رایگان',
                'بدون نیاز به کارت اعتباری',
                'لغو تا ۲ ساعت قبل',
                'پشتیبانی ۲۴ ساعته',
              ].map((benefit) => (
                <span
                  key={benefit}
                  className="flex items-center gap-2 text-[0.82rem] text-white/85"
                >
                  <Icon icon="mdi:check-circle" style={{ width: 16, height: 16, color: '#10b981' }} />
                  {benefit}
                </span>
              ))}
            </div>

            {/* دکمه‌ها */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate('/register')}
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                className="h-12 rounded-xl px-8 text-sm font-extrabold text-stone-900 shadow-[0_8px_24px_rgba(251,191,36,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(251,191,36,0.45)]"
              >
                <Icon icon="mdi:account-plus" style={{ width: 22, height: 22 }} />
                ثبت‌نام و دریافت تخفیف
              </Button>
              <Button
                onClick={() => navigate('/venues')}
                variant="outline"
                className="h-12 rounded-xl border-white/40 bg-transparent px-8 text-sm font-bold text-white hover:border-white hover:bg-white/10 hover:text-white"
              >
                <Icon icon="mdi:soccer" style={{ width: 22, height: 22 }} />
                مشاهده زمین‌ها
              </Button>
            </div>
          </div>
        </div>
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
    </section>
  )
}
