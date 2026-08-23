// src/pages/Home.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { sportsApi, LiveMatch, NewsItem } from '@/services/sportsApi'

const Home: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<LiveMatch[]>([])
  const [finishedMatches, setFinishedMatches] = useState<LiveMatch[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live')

  // Fetch sports data
  const fetchSportsData = useCallback(async () => {
    try {
      setLoading(true)
      const [matchesData, newsData] = await Promise.all([
        sportsApi.getAllMatches(),
        sportsApi.getSportsNews(),
      ])
      setLiveMatches(matchesData.live || [])
      setUpcomingMatches(matchesData.upcoming || [])
      setFinishedMatches(matchesData.finished || [])
      setNews(newsData || [])
    } catch (error) {
      console.error('Error fetching sports data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSportsData()
    // Refresh live matches every 30 seconds
    const interval = setInterval(fetchSportsData, 30000)
    return () => clearInterval(interval)
  }, [fetchSportsData])

  const getActiveMatches = () => {
    switch (activeTab) {
      case 'live': return liveMatches
      case 'upcoming': return upcomingMatches
      case 'finished': return finishedMatches
    }
  }

  const formatTime = (time?: string, date?: string) => {
    if (!time) return ''
    return time
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 animate-pulse'
      case 'upcoming': return 'bg-blue-500'
      case 'finished': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const quickActions = [
    { icon: 'mdi:store', title: 'سالن‌ها', href: '/venues', color: 'from-blue-500 to-blue-600' },
    { icon: 'mdi:calendar-check', title: 'رزرو', href: '/bookings', color: 'from-green-500 to-emerald-600' },
    { icon: 'mdi:trophy', title: 'رقابت‌ها', href: '/competitions', color: 'from-purple-500 to-indigo-600' },
    { icon: 'mdi:file-document', title: 'قراردادها', href: '/contracts', color: 'from-orange-500 to-amber-600' },
  ]

  return (
    <Layout>
      {/* Mobile-First Hero Section with Bottom Navigation Style */}
      <section className="relative min-h-screen pb-8 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 pt-8">
          {/* Header with Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Icon icon="mdi:soccer" className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">فوتسال</h1>
                <p className="text-xs text-blue-300">رزرو هوشمند سالن</p>
              </div>
            </div>
            <Link to="/profile">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <Icon icon="mdi:account" className="h-6 w-6 text-white" />
              </div>
            </Link>
          </motion.div>

          {/* Main CTA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl mb-6"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-300 text-xs font-medium mb-4 border border-green-500/30"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                همین حالا رزرو کن
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                سالن مورد نظرت رو
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  چند لحظه‌ای رزرو کن
                </span>
              </h2>
              <p className="text-blue-200 text-sm mt-3">
                بهترین سالن‌ها با بهترین قیمت‌ها
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <Link to={action.href}>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all duration-300 active:scale-95">
                      <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-2 shadow-lg`}>
                        <Icon icon={action.icon} className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-white text-xs font-medium text-center">{action.title}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <Link to="/register" className="flex-1">
                <Button
                  variant="gradient"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
                >
                  <Icon icon="mdi:rocket" className="h-5 w-5 ml-2" />
                  شروع رایگان
                </Button>
              </Link>
              <Link to="/venues" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl border-2 border-white/30 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Icon icon="mdi:store" className="h-5 w-5 ml-2" />
                  سالن‌ها
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { value: '۵۰+', label: 'سالن فعال', icon: 'mdi:store', color: 'text-blue-400' },
              { value: '۱۲۰۰+', label: 'رزرو موفق', icon: 'mdi:check-circle', color: 'text-green-400' },
              { value: '۹۸٪', label: 'رضایت', icon: 'mdi:star', color: 'text-yellow-400' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                <Icon icon={stat.icon} className={`h-5 w-5 ${stat.color} mx-auto mb-1`} />
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-blue-200">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Live Scores Section - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl mb-6"
          >
            {/* Header with Tabs */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:soccer" className="h-6 w-6 text-white" />
                  <h3 className="text-lg font-bold text-white">نتایج زنده</h3>
                </div>
                <span className="flex items-center gap-1 text-xs text-white/80">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  زنده
                </span>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                {[
                  { id: 'live', label: 'زنده', icon: 'mdi:live-tv' },
                  { id: 'upcoming', label: 'آینده', icon: 'mdi:clock-outline' },
                  { id: 'finished', label: 'پایان یافته', icon: 'mdi:check-circle' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon icon={tab.icon} className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matches List */}
            <div className="p-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="mdi:loading" className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : getActiveMatches().length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:soccer-field" className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">مسابقه‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getActiveMatches().map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-gray-50 rounded-2xl p-3 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-lg">
                          {match.league}
                        </span>
                        {match.status === 'live' && (
                          <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            {match.minute}'
                          </span>
                        )}
                        {match.status !== 'live' && (
                          <span className="text-xs text-gray-500">
                            {formatTime(match.time, match.date)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {match.homeIcon ? (
                            <img src={match.homeIcon} alt={match.homeTeam} className="w-6 h-6 object-contain" />
                          ) : (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Icon icon="mdi:shield" className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-800 truncate">{match.homeTeam}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span className={`text-lg font-bold ${match.status === 'live' ? 'text-blue-600' : 'text-gray-700'}`}>
                            {match.homeScore}
                          </span>
                          <span className="text-gray-400">-</span>
                          <span className={`text-lg font-bold ${match.status === 'live' ? 'text-blue-600' : 'text-gray-700'}`}>
                            {match.awayScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-medium text-gray-800 truncate">{match.awayTeam}</span>
                          {match.awayIcon ? (
                            <img src={match.awayIcon} alt={match.awayTeam} className="w-6 h-6 object-contain" />
                          ) : (
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <Icon icon="mdi:shield" className="h-4 w-4 text-purple-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* View All Link */}
            <div className="p-3 border-t border-gray-100">
              <button className="w-full text-center text-sm text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-xl transition-colors">
                مشاهده همه مسابقات
              </button>
            </div>
          </motion.div>

          {/* Sports News Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:newspaper" className="h-6 w-6 text-white" />
                <h3 className="text-lg font-bold text-white">اخبار ورزشی</h3>
              </div>
              <button className="text-sm text-blue-300 hover:text-white transition-colors">
                مشاهده همه
              </button>
            </div>

            {/* Horizontal Scroll News Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {loading ? (
                <div className="flex items-center justify-center w-full py-8">
                  <Icon icon="mdi:loading" className="h-8 w-8 text-white animate-spin" />
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-8 w-full">
                  <Icon icon="mdi:newspaper-minus" className="h-12 w-12 text-white/30 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">اخباری یافت نشد</p>
                </div>
              ) : (
                news.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex-shrink-0 w-64 bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20"
                  >
                    <div className={`h-32 bg-gradient-to-br ${item.color} relative p-3`}>
                      {item.isLive && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-lg flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          زنده
                        </span>
                      )}
                      <Icon icon={item.icon} className="h-8 w-8 text-white/80" />
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-white line-clamp-2 mb-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-blue-200">
                        <span>{item.date}</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:eye" className="h-3 w-3" />
                          {(item.views / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Bottom Spacing for Mobile */}
          <div className="h-20" />
        </div>
      </section>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <Link to="/bookings">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 border-4 border-white">
            <Icon icon="mdi:calendar-plus" className="h-8 w-8 text-white" />
          </div>
        </Link>
      </motion.div>

      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  )
}

export default Home