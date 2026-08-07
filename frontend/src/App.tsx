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

// Lazy loading pages
const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Venues = lazy(() => import('@/pages/venues/Venues'))
const Bookings = lazy(() => import('@/pages/bookings/Bookings'))
const Competitions = lazy(() => import('@/pages/competitions/Competitions'))
const Contracts = lazy(() => import('@/pages/contracts/Contracts'))

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
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/venues" element={<Venues />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/competitions" element={<Competitions />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
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