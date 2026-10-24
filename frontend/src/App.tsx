// src/App.tsx
import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/shadcn/button'
import Loading from '@/components/ui/Loading'
import UpdateDialog from '@/components/modals/UpdateDialog'
import { useUpdateStore } from '@/store/updateStore'
import ProtectedRoute, { PublicRoute } from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useWebSocket } from '@/hooks/useWebSocket'

// Lazy loading pages
const Home = lazy(() => import('@/pages/Home'))
const Search = lazy(() => import('@/pages/Search'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Venues = lazy(() => import('@/pages/venues/Venues'))
const VenueDetail = lazy(() => import('@/pages/venues/VenueDetail'))
const Bookings = lazy(() => import('@/pages/bookings/Bookings'))
const BookingDetail = lazy(() => import('@/pages/bookings/BookingDetail'))
const Competitions = lazy(() => import('@/pages/competitions/Competitions'))
const GamesExplore = lazy(() => import('@/pages/games/GamesExplore'))
const GameDetail = lazy(() => import('@/pages/games/GameDetail'))
const GameCreate = lazy(() => import('@/pages/games/GameCreate'))
const JoinByToken = lazy(() => import('@/pages/games/JoinByToken'))
const Contracts = lazy(() => import('@/pages/contracts/Contracts'))
const ContractDetail = lazy(() => import('@/pages/contracts/ContractDetail'))
const Profile = lazy(() => import('@/pages/profile/Profile'))
const ManagerDashboard = lazy(() => import('@/pages/dashboard/ManagerDashboard'))
const VenuePicker = lazy(() => import('@/pages/manager/venues/VenuePicker'))
const VenueWorkspace = lazy(() => import('@/pages/manager/venues/VenueWorkspace'))
const FinanceConsole = lazy(() => import('@/pages/finance/FinanceConsole'))
const FinanceOverview = lazy(() => import('@/pages/finance/FinanceOverview'))
const FinanceTransactions = lazy(() => import('@/pages/finance/FinanceTransactions'))
const FinanceAccounts = lazy(() => import('@/pages/finance/FinanceAccounts'))
const FinanceReports = lazy(() => import('@/pages/finance/FinanceReports'))
const FinanceProfitLoss = lazy(() => import('@/pages/finance/ProfitLoss'))
const FinanceCashFlow = lazy(() => import('@/pages/finance/CashFlow'))
const FinanceExpenses = lazy(() => import('@/pages/finance/Expenses'))
const ManagerPricing = lazy(() => import('@/pages/manager/pricing/ManagerPricing'))
const Deals = lazy(() => import('@/pages/deals/Deals'))
const Quiz = lazy(() => import('@/pages/quiz/Quiz'))
const ManagerContracts = lazy(() => import('@/pages/manager/contracts/ManagerContracts'))
const ManagerContractDetail = lazy(() => import('@/pages/manager/contracts/ManagerContractDetail'))
const ManagerTeams = lazy(() => import('@/pages/manager/teams/ManagerTeams'))
const ManagerCrm = lazy(() => import('@/pages/manager/crm/ManagerCrm'))
const ManagerCheckin = lazy(() => import('@/pages/manager/ManagerCheckin'))
const ManagerShifts = lazy(() => import('@/pages/manager/shifts/ManagerShifts'))
const CoachDashboard = lazy(() => import('@/pages/coach/CoachDashboard'))
const Teams = lazy(() => import('@/pages/teams/Teams'))
const Tournaments = lazy(() => import('@/pages/tournaments/Tournaments'))
const TournamentDetail = lazy(() => import('@/pages/tournaments/TournamentDetail'))
const TeamDiscover = lazy(() => import('@/pages/teams/TeamDiscover'))
const TeamDetail = lazy(() => import('@/pages/teams/TeamDetail'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminVenues = lazy(() => import('@/pages/admin/Venues'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// اسکرول به بالای صفحه با تغییر مسیر
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// صفحه ۴۰۴
const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    // پوستهٔ برنامه (هدر/ناوبری) روی ۴۰۴ هم لازم است: کاربرِ لینکِ مرده باید
    // راه بازگشت داشته باشد و صفحه landmark کامل بماند (ممیزی F-15).
    <Layout>
      <div className="mx-auto max-w-xl py-8 text-center md:py-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-amber-500/15 to-blue-500/15">
              <Icon icon="mdi:compass-off-outline" className="h-10 w-10" style={{ color: '#f59e0b' }} />
            </div>
            <p className="mb-1 text-3xl font-extrabold text-foreground">۴۰۴</p>
            <h1 className="mb-1 text-lg font-semibold text-foreground">صفحه مورد نظر یافت نشد</h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              ممکن است صفحه حذف شده باشد یا آدرس اشتباهی وارد کرده‌اید.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => navigate('/')}>
                <Icon icon="mdi:home" className="h-5 w-5" />
                صفحه اصلی
              </Button>
              <Button asChild variant="outline">
                <Link to="/venues">
                  <Icon icon="mdi:store" className="h-5 w-5" />
                  مشاهده سالن‌ها
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

// Component to handle auth initialization
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasInitialized = useAuthStore((state) => state.hasInitialized)
  const initialize = useAuthStore((state) => state.initialize)

  // اتصال بلادرنگ WebSocket برای اعلان‌ها (وقتی کاربر احراز هویت شده باشد)
  useWebSocket()

  useEffect(() => {
    if (!hasInitialized) {
      initialize()
    }
  }, [initialize, hasInitialized])

  if (!hasInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-muted border-t-brand" />
      </div>
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          {/* Suspense باید داخل wrapper باشد؛ اگر بیرون باشد، انتظار برای چانکِ
              lazy صفحه، کلِ wrapper را بعد از پایان انیمیشن از نو mount می‌کند و
              آن را روی opacity:0 قفل می‌گذارد (صفحهٔ سفید ولی قابل کلیک). */}
          <Suspense fallback={<Loading fullScreen />}>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* بازدید سالن‌ها بدون لاگین آزاد است — اقدام رزرو داخل صفحه گیت می‌شود */}
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/verify" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/manager-dashboard" element={<ProtectedRoute requiredRole="venue_manager"><ManagerDashboard /></ProtectedRoute>} />
            {/* جریان سالن‌محور: اول انتخاب سالن، بعد داشبورد همان سالن (allowStaff مثل /finance) */}
            <Route path="/manager/venues" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><VenuePicker /></ProtectedRoute>} />
            <Route path="/manager/venues/:venueId" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><VenueWorkspace /></ProtectedRoute>} />
            {/* کنسول‌های عملیاتی — گیت لاگین + allowStaff: کارمند انتصابی (role=user)
                هم باز می‌کند؛ ۴۰۳ بک‌اند با ForbiddenPanel/توست فارسی مدیریت می‌شود */}
            <Route path="/finance" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><FinanceConsole /></ProtectedRoute>}>
              <Route index element={<FinanceOverview />} />
              <Route path="transactions" element={<FinanceTransactions />} />
              <Route path="accounts" element={<FinanceAccounts />} />
              <Route path="reports" element={<FinanceReports />} />
              <Route path="profit-loss" element={<FinanceProfitLoss />} />
              <Route path="cash-flow" element={<FinanceCashFlow />} />
              <Route path="expenses" element={<FinanceExpenses />} />
            </Route>
            <Route path="/manager/pricing" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><ManagerPricing /></ProtectedRoute>} />
            {/* شگفت‌انگیزها — فقط کاربران لاگین‌کرده (همان گیت ProtectedRoute نقش کاربر) */}
            <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/competitions" element={<ProtectedRoute><Competitions /></ProtectedRoute>} />
            {/* تورنمنت‌ها (P005) — براکت تک‌حذفی؛ همهٔ مسیرهای /tournaments* در بک‌اند گیت لاگین دارند */}
            <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
            <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            <Route path="/join/g/:token" element={<ProtectedRoute><JoinByToken /></ProtectedRoute>} />

            {/* Game routes (explore/detail public — join actions require login) */}
            <Route path="/games" element={<GamesExplore />} />
            <Route path="/games/new" element={<ProtectedRoute><GameCreate /></ProtectedRoute>} />
            <Route path="/games/:id" element={<GameDetail />} />

            {/* Team routes (user area — protected) */}
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/teams/discover" element={<ProtectedRoute><TeamDiscover /></ProtectedRoute>} />
            <Route path="/teams/:id" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
            <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
            <Route path="/manager/contracts" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><ManagerContracts /></ProtectedRoute>} />
            <Route path="/manager/contracts/:id" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><ManagerContractDetail /></ProtectedRoute>} />
            <Route path="/manager/teams" element={<ProtectedRoute requiredRole="venue_manager"><ManagerTeams /></ProtectedRoute>} />
            {/* کنسول مشتریان/پرسنل — مدیر سالن یا کارمندِ انتصابی (کد customer.view_basic/CRM)؛
                کاربر عادی ۴۰۳ می‌گیرد و نباید صفحه را ببیند */}
            <Route path="/manager/crm" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><ManagerCrm /></ProtectedRoute>} />
            <Route path="/manager/checkin" element={<ProtectedRoute requiredRole="venue_manager"><ManagerCheckin /></ProtectedRoute>} />
            {/* شیفت پرسنل (P020) — گیت بک‌اند کد staff.manage است؛ کارمندِ دارای این کد هم باز می‌کند */}
            <Route path="/manager/shifts" element={<ProtectedRoute requiredRole="venue_manager" allowStaff><ManagerShifts /></ProtectedRoute>} />
            {/* پنل مربی — نقش coach (بک‌اند هم در /coach/* گیت نقش دارد) */}
            <Route path="/coach" element={<ProtectedRoute requiredRole="coach"><CoachDashboard /></ProtectedRoute>} />
            {/* /manager/finance قدیمی به کنسول مالی جدید منتقل شده — مسیر legacy ریدایرکت می‌شود */}
            <Route path="/manager/finance" element={<Navigate to="/finance" replace />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="super_admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/venues" element={<ProtectedRoute requiredRole="super_admin"><AdminVenues /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function App() {
  const mode = useThemeStore((s) => s.mode)

  // همگام‌سازی کلاس dark روی <html> برای کلاس‌های dark: در Tailwind
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  // چک خودکار بروزرسانی هنگام اجرای اپ (فقط داخل Tauri، با کوولدان ۱۸ ساعته)
  useEffect(() => {
    const t = setTimeout(() => void useUpdateStore.getState().runAutoCheck(), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              direction: 'rtl',
              fontFamily: 'Vazirmatn, sans-serif',
              borderRadius: '12px',
              background: mode === 'dark' ? '#121a2b' : '#ffffff',
              color: mode === 'dark' ? '#eef2f7' : '#0f172a',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`,
            },
          }}
        />
        <UpdateDialog />
        <BrowserRouter>
          <AuthInitializer>
            <Suspense fallback={<Loading fullScreen />}>
              <AppRoutes />
            </Suspense>
          </AuthInitializer>
        </BrowserRouter>
        </QueryClientProvider>
      </MotionConfig>
  )
}

export default App
