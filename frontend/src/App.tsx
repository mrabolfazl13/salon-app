// src/App.tsx
import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/theme'
import ToastProvider from '@/components/ui/Toast'
import Loading from '@/components/ui/Loading'
import ProtectedRoute, { PublicRoute } from '@/components/auth/ProtectedRoute'

// Lazy loading pages
const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Venues = lazy(() => import('@/pages/venues/Venues'))
const VenueDetail = lazy(() => import('@/pages/venues/VenueDetail'))
const Bookings = lazy(() => import('@/pages/bookings/Bookings'))
const BookingDetail = lazy(() => import('@/pages/bookings/BookingDetail'))
const Competitions = lazy(() => import('@/pages/competitions/Competitions'))
const Contracts = lazy(() => import('@/pages/contracts/Contracts'))
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading fullScreen />}>
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
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                    
                    {/* Protected user routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/manager-dashboard" element={<ProtectedRoute requiredRole="venue_manager"><ManagerDashboard /></ProtectedRoute>} />
                    <Route path="/venues" element={<ProtectedRoute><Venues /></ProtectedRoute>} />
                    <Route path="/venues/:id" element={<ProtectedRoute><VenueDetail /></ProtectedRoute>} />
                    <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                    <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
                    <Route path="/competitions" element={<ProtectedRoute><Competitions /></ProtectedRoute>} />
                    <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute requiredRole="super_admin"><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/venues" element={<ProtectedRoute requiredRole="super_admin"><AdminVenues /></ProtectedRoute>} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/venues" replace />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App