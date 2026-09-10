import React from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'
import BottomNavigation from '@/components/mobile/BottomNavigation'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  /** منوی کناری (Drawer سمت راست) غیرفعال شده است — ناوبری موبایل با نوار
      پایین و دسترسی داشبورد/مدیر/ادمین از منوی آواتار پروفایل انجام می‌شود.
      این prop‌ها فقط برای سازگاری با فراخوان‌های قبلی نگه داشته شده‌اند. */
  showSidebar?: boolean
  userRole?: string
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 flex flex-col">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
          /* فاصله پایین برای ناوبری fixed موبایل — نقطه شکست ۹۰0px دقیقاً مثل
             breakpoint خود MUI که BottomNavigation در آن مخفی می‌شود (کلاس
             Tailwind md:pb-8 در 768px فعال می‌شد و 768–900 روی هم می‌افتادند) */
          'pb-28 min-[900px]:pb-8',
          className
        )}
      >
        {children}
      </motion.main>
      <Footer />
      {/* ناوبری پایین موبایل — آیتم‌ها/مخفی‌سازی بر عهده خود کامپوننت است */}
      <BottomNavigation />
    </div>
  )
}

export default Layout
