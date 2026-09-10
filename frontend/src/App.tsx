// src/App.tsx
import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, Box, Container, Button, Typography, Paper, CircularProgress } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Toaster } from 'react-hot-toast'
import { theme } from '@/theme'
import Loading from '@/components/ui/Loading'
import ProtectedRoute, { PublicRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'
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
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: '24px',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2563eb15, #7c3aed15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:compass-off-outline" className="h-10 w-10" style={{ color: '#2563eb' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            ۴۰۴
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            صفحه مورد نظر یافت نشد
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
            ممکن است صفحه حذف شده باشد یا آدرس اشتباهی وارد کرده‌اید.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.2,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
              startIcon={<Icon icon="mdi:home" />}
            >
              صفحه اصلی
            </Button>
            <Button
              component={Link}
              to="/venues"
              variant="outlined"
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2 }}
              startIcon={<Icon icon="mdi:store" />}
            >
              مشاهده سالن‌ها
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
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
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/verify" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/manager-dashboard" element={<ProtectedRoute requiredRole="venue_manager"><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/venues" element={<ProtectedRoute><Venues /></ProtectedRoute>} />
            <Route path="/venues/:id" element={<ProtectedRoute><VenueDetail /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/competitions" element={<ProtectedRoute><Competitions /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            <Route path="/join/g/:token" element={<ProtectedRoute><JoinByToken /></ProtectedRoute>} />

            {/* Game routes (explore/detail public — join actions require login) */}
            <Route path="/games" element={<GamesExplore />} />
            <Route path="/games/new" element={<ProtectedRoute><GameCreate /></ProtectedRoute>} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="super_admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/venues" element={<ProtectedRoute requiredRole="super_admin"><AdminVenues /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              direction: 'rtl',
              fontFamily: 'Vazirmatn, sans-serif',
              borderRadius: '12px',
            },
          }}
        />
        <BrowserRouter>
          <AuthInitializer>
            <Suspense fallback={<Loading fullScreen />}>
              <AppRoutes />
            </Suspense>
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
