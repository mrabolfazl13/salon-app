import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { CircularProgress, Box } from '@mui/material'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const location = useLocation()

  const isRoleAllowed =
    !requiredRole ||
    user?.role === requiredRole ||
    user?.role === 'super_admin' ||
    (requiredRole === 'venue_manager' && user?.role === 'club_admin')

  const roleMismatch = isAuthenticated && !isRoleAllowed

  useEffect(() => {
    if (roleMismatch) {
      toast.error('دسترسی شما به این صفحه مجاز نیست')
    }
  }, [roleMismatch])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

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
