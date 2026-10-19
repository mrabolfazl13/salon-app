import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useStaffMe } from '@/hooks/useStaffMe'
import { CircularProgress, Box } from '@mui/material'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'venue_manager' | 'club_admin' | 'super_admin' | 'coach'
  /**
   * کنسول‌های عملیاتی سالن (مالی/قیمت‌گذاری/قراردادها/شیفت): علاوه بر مدیر سالن،
   * **کارمندِ انتصابی** (role=user با انتصاب فعال در GET /staff/me) هم باز می‌کند.
   * بدون انتصاب، کاربر عادی به /venues برمی‌گردد — پیش‌تر همین پرچم صرفاً
   * «لاگین‌کرده بودن» را می‌سنجید و کاربر عادی صفحه‌ای پر از ۴۰۳ می‌دید (ممیزی F-01).
   */
  allowStaff?: boolean
}

/** بک‌اند /coach/* را با گیت سخت نقش محافظت می‌کند؛ ادمین کل هم ۴۰۳ می‌گیرد */
const NO_SUPER_ADMIN_BYPASS: string[] = ['coach']

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowStaff = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const location = useLocation()

  const role = user?.role
  const isOwner = role === 'venue_manager' || role === 'club_admin' || role === 'super_admin'
  const needsStaffCheck = allowStaff && isAuthenticated && !isOwner
  const staffQuery = useStaffMe(needsStaffCheck)
  const isAssignedStaff = needsStaffCheck && (staffQuery.data?.length ?? 0) > 0

  const isRoleAllowed =
    !requiredRole ||
    isAssignedStaff ||
    role === requiredRole ||
    (role === 'super_admin' && !NO_SUPER_ADMIN_BYPASS.includes(requiredRole)) ||
    (requiredRole === 'venue_manager' && role === 'club_admin')

  const roleMismatch = isAuthenticated && !isRoleAllowed

  useEffect(() => {
    if (roleMismatch) {
      toast.error('دسترسی شما به این صفحه مجاز نیست')
    }
  }, [roleMismatch])

  const spinner = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  )

  if (isLoading) return spinner

  // انتصاب کارمندی هنوز مشخص نشده ⇒ نه ریدایرکت کنیم (کارمند را بیرون می‌اندازد)
  // نه صفحهٔ ۴۰۳ (کاربر عادی یک لحظه کنسول می‌بیند)
  if (needsStaffCheck && staffQuery.isPending) return spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roleMismatch) {
    return <Navigate to="/venues" replace />
  }

  return <>{children}</>
}

// Public route - redirects to venues if already authenticated
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/venues'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute