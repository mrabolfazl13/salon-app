// src/pages/Home.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'

const Home: React.FC = () => {
  const features = [
    {
      icon: 'mdi:calendar-check',
      title: 'رزرو آسان',
      description: 'در چند ثانیه سالن مورد نظر خود را رزرو کنید',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      icon: 'mdi:trophy',
      title: 'رقابت قیمت',
      description: 'از رقابت بین سالن‌ها بهترین قیمت را پیدا کنید',
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      icon: 'mdi:file-document',
      title: 'قرارداد بلندمدت',
      description: 'برای تیم‌های حرفه‌ای قرارداد ثبت کنید',
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      icon: 'mdi:account-group',
      title: 'مدیریت تیم',
      description: 'تیم خود را مدیریت و برنامه‌ریزی کنید',
      color: 'from-orange-500 to-amber-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
    },
    {
      icon: 'mdi:shield-check',
      title: 'امنیت بالا',
      description: 'با سیستم امنیتی پیشرفته از اطلاعات شما محافظت می‌کنیم',
      color: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
    {
      icon: 'mdi:rocket',
      title: 'سرعت بالا',
      description: 'با سرعت بالا و بدون تاخیر سالن خود را رزرو کنید',
      color: 'from-cyan-500 to-blue-600',
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
    },
  ]

  const stats = [
    { value: '۵۰+', label: 'سالن فعال', icon: 'mdi:store', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: '۱۲۰۰+', label: 'رزرو انجام شده', icon: 'mdi:calendar-check', color: 'text-green-600', bg: 'bg-green-50' },
    { value: '۹۸%', label: 'رضایت کاربران', icon: 'mdi:star', color: 'text-purple-600', bg: 'bg-purple-50' },
    { value: '۲۴/۷', label: 'پشتیبانی', icon: 'mdi:headset', color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  const testimonials = [
    {
      name: 'علی رضایی',
      role: 'مدیر تیم آبی‌ها',
      comment: 'بهترین پلتفرم رزرو سالن فوتسال. خیلی سریع و آسان!',
      rating: 5,
    },
    {
      name: 'سارا حسینی',
      role: 'بازیکن حرفه‌ای',
      comment: 'رقابت قیمت خیلی عالی بود. بهترین قیمت رو گرفتم.',
      rating: 5,
    },
    {
      name: 'محمد کریمی',
      role: 'مدیر سالن سبز',
      comment: 'سیستم عالی و پشتیبانی فوق‌العاده. حتماً پیشنهاد می‌کنم.',
      rating: 4,
    },
  ]

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40 bg-gradient-to-b from-blue-50 via-white to-white">
        {/* Background Decorations */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium shadow-lg shadow-blue-500/30 mb-6"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <Icon icon="mdi:star" className="h-4 w-4" />
            بهترین پلتفرم رزرو سالن فوتسال
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-gray-900">
              رزرو سالن فوتسال
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                به ساده‌ترین روش
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              سیستم هوشمند رزرو سالن فوتسال با قابلیت رقابت قیمت و قراردادهای بلندمدت
            </p>
          </motion.div>

          {/* Buttons - اصلاح شده با رنگ‌های مشخص */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button
                variant="gradient"
                size="lg"
                className="px-8 py-4 text-white shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <Icon icon="mdi:rocket" className="h-5 w-5 ml-2" />
                شروع کنید
              </Button>
            </Link>
            <Link to="/venues">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700"
              >
                <Icon icon="mdi:store" className="h-5 w-5 ml-2" />
                مشاهده سالن‌ها
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <span>امتیاز ۴.۸ از ۵</span>
            </div>
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2 text-gray-600">
              <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-500" />
              <span>بیش از ۱۰۰۰ رزرو موفق</span>
            </div>
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>پشتیبانی ۲۴/۷</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-14 h-14 mx-auto ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon icon={stat.icon} className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              چگونه کار می‌کند؟
            </h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              در سه مرحله ساده سالن خود را رزرو کنید
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { number: '۱', title: 'ثبت‌نام', description: 'حساب کاربری خود را بسازید', icon: 'mdi:account-plus' },
              { number: '۲', title: 'انتخاب سالن', description: 'سالن مورد نظر خود را پیدا کنید', icon: 'mdi:store-search' },
              { number: '۳', title: 'رزرو', description: 'سانس مورد نظر را رزرو کنید', icon: 'mdi:calendar-check' },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-blue-300 to-purple-300" />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              چرا <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">فوتسال</span>؟
            </h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              امکاناتی که نیاز دارید
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 h-full border border-gray-200/50">
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon icon={feature.icon} className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              نظرات <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">کاربران</span>
            </h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              آنچه کاربران درباره ما می‌گویند
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gray-50 rounded-3xl p-8 h-full border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < testimonial.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              آماده‌ای شروع کنی؟
            </h2>
            <p className="mt-3 text-blue-50 max-w-md mx-auto">
              امروز ثبت‌نام کن و از امکانات بین‌نظیر ما استفاده کن
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  variant="default"
                  size="lg"
                  className="px-10 py-4 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl shadow-black/20 hover:shadow-black/30"
                >
                  <Icon icon="mdi:account-plus" className="h-5 w-5 ml-2" />
                  شروع رایگان
                </Button>
              </Link>
              <Link to="/venues">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 py-4 border-2 border-white/50 text-white hover:bg-white/10 hover:border-white"
                >
                  <Icon icon="mdi:store" className="h-5 w-5 ml-2" />
                  مشاهده سالن‌ها
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}

export default Home