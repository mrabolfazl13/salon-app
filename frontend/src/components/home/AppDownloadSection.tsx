import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import SectionHeader from '@/components/mobile/SectionHeader'
import { Button } from '@/components/ui/shadcn/button'

interface AppFeatureProps {
  icon: string
  title: string
  description: string
  color: string
}

const AppFeature: React.FC<AppFeatureProps> = ({ icon, title, description, color }) => (
  <div className="flex items-center gap-3">
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon icon={icon} style={{ width: 20, height: 20, color }} />
    </span>
    <div>
      {/* کارت این بخش تیره است؛ توکن‌های text.* پالت روشن روی آن ≈۱:۱ می‌شوند */}
      <p className="text-[0.88rem] font-bold text-white">{title}</p>
      <p className="text-xs text-white/[0.72]">{description}</p>
    </div>
  </div>
)

export const AppDownloadSection: React.FC = () => {
  return (
    <section className="mb-12">
      <SectionHeader
        title="اپلیکیشن موبایل"
        subtitle="تجربه بهتر با اپلیکیشن اختصاصی ما"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:px-6 sm:py-10 md:px-8">
          {/* پس‌زمینه متحرک */}
          <div className="pointer-events-none absolute -start-20 -top-20 h-[250px] w-[250px] animate-[pulse-glow_3s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.15),transparent)] motion-reduce:animate-none" />

          <div className="relative z-[1]">
            <div className="grid items-center gap-8 md:grid-cols-2">
              {/* سمت چپ - اطلاعات */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700">
                    <Icon icon="mdi:cellphone" style={{ width: 32, height: 32, color: '#1c1917' }} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-black">اپلیکیشن فوتسال</h3>
                    <p className="text-[0.82rem] text-white/70">نسخه ۲.۰ • رایگان</p>
                  </div>
                </div>

                <p className="mb-6 text-[0.95rem] leading-[1.8] text-white/85">
                  با اپلیکیشن موبایل، سریع‌تر رزرو کن، نوتیفیکیشن دریافت کن و از تمام امکانات استفاده کن. حتی آفلاین هم می‌تونی برنامه‌ریزی کنی!
                </p>

                {/* ویژگی‌ها */}
                <div className="mb-6 flex flex-col gap-3">
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
                </div>

                {/* دکمه‌های دانلود */}
                <div className="flex flex-wrap gap-4">
                  <Button className="h-12 gap-2 rounded-xl bg-none bg-white px-5 text-[0.88rem] font-bold text-stone-900 shadow-none hover:bg-white/90 hover:shadow-none">
                    <Icon icon="mdi:android" style={{ width: 22, height: 22 }} />
                    دانلود برای اندروید
                  </Button>
                  <Button className="h-12 gap-2 rounded-xl bg-none bg-white/15 px-5 text-[0.88rem] font-bold text-white shadow-none hover:bg-white/25 hover:shadow-none">
                    <Icon icon="mdi:apple" style={{ width: 22, height: 22 }} />
                    دانلود برای iOS
                  </Button>
                </div>
              </div>

              {/* سمت راست - تصویر گوشی */}
              <div className="hidden items-center justify-center md:flex">
                <div className="flex h-[440px] w-[220px] flex-col items-center justify-center gap-4 rounded-[32px] border-8 border-white/20 bg-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-[10px]">
                  <Icon icon="mdi:soccer" style={{ width: 64, height: 64, color: '#fbbf24' }} />
                  <p className="text-[1.1rem] font-extrabold text-white">فوتسال ما</p>
                  <p className="text-xs text-white/70">همین حالا نصب کن!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </section>
  )
}
