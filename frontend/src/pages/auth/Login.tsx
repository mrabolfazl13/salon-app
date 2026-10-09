// src/pages/auth/Login.tsx — صفحه ورود موبایل‌اپ‌استایل (منطق حفظ شده: useForm + zod + authStore)
import React, { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Paper,
  Alert,
  Link,
} from '@mui/material'
import { PrimaryButton } from '@/components/mobile'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { gradients, radii, shadows } from '@/theme'

const loginSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر وارد کنید'),
  password: z.string().min(4, 'رمز عبور حداقل ۴ کاراکتر'),
})

type LoginForm = z.infer<typeof loginSchema>

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: `${radii.button}px`,
    minHeight: 52,
    fontSize: '0.95rem',
    bgcolor: 'background.paper',
    '& fieldset': {
      borderColor: (t: any) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.1)'),
    },
    '&:hover fieldset': {
      borderColor: (t: any) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.5)' : 'rgba(245,158,11,0.55)'),
    },
    '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: 1.5 },
  },
} as const

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { success } = useToast()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.phone, data.password)
      success('ورود موفقیت‌آمیز!')

      // Redirect based on role
      const user = useAuthStore.getState().user
      if (
        user?.role === 'venue_manager' ||
        user?.role === 'club_admin' ||
        user?.role === 'super_admin'
      ) {
        navigate('/manager-dashboard')
      } else {
        navigate('/venues')
      }
    } catch (err: any) {
      // فقط بازخورد درون‌صفحه (جلوگیری از نمایش دوجانبه خطا)
      const message = err.response?.data?.detail || 'شماره موبایل یا رمز عبور اشتباه است.'
      setError(message)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2.5,
        py: 'calc(24px + env(safe-area-inset-top))',
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'radial-gradient(1200px 600px at 50% -10%, #16233f 0%, #0b1220 60%)'
            : 'linear-gradient(180deg, #f0f5ff 0%, #f8fafc 45%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* تزئینات پس‌زمینه */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          insetInlineEnd: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: gradients.primarySoft,
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -140,
          insetInlineStart: -100,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.10)',
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        {/* برند */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.1 }}
            style={{
              width: 76,
              height: 76,
              margin: '0 auto 16px',
              borderRadius: 22,
              background: gradients.brandEnergy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(245,158,11,0.40)',
            }}
          >
            <Icon icon="mdi:soccer" style={{ width: 40, height: 40, color: '#1c1917' }} />
          </motion.div>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.5rem', color: 'text.primary' }}>
            خوش آمدید
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.5 }}>
            برای رزرو سالن فوتسال وارد شوید
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${radii.card}px`,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(18,26,43,0.92)' : 'rgba(255,255,255,0.9)'),
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: shadows.card,
          }}
        >
          {error && (
            <Alert
              severity="error"
              icon={<Icon icon="mdi:alert-circle-outline" style={{ width: 20, height: 20 }} />}
              sx={{ mb: 2.5, borderRadius: `${radii.button}px`, fontSize: '0.85rem' }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                {...register('phone')}
                placeholder="09xxxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="mdi:cellphone" style={{ width: 22, height: 22, color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="رمز عبور"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="mdi:lock-outline" style={{ width: 22, height: 22, color: '#64748b' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          sx={{ color: '#64748b' }}
                          aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                        >
                          <Icon
                            icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                            style={{ width: 22, height: 22 }}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: (t) => (t.palette.mode === 'dark' ? '#fbbf24' : '#b45309'),
                    textDecoration: 'none',
                    padding: '6px 4px',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  رمز عبور را فراموش کردید؟
                </Link>
              </Box>

              <PrimaryButton
                type="submit"
                loading={isLoading}
                icon="mdi:login-variant"
                sx={{ mt: 0.5, minHeight: 52 }}
              >
                ورود
              </PrimaryButton>
            </Box>
          </form>
        </Paper>

        <Typography
          sx={{ textAlign: 'center', mt: 3, fontSize: '0.9rem', color: 'text.secondary' }}
        >
          حساب ندارید؟{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{
              color: (t) => (t.palette.mode === 'dark' ? '#fbbf24' : '#b45309'),
              fontWeight: 800,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            ثبت‌نام کنید
          </Link>
        </Typography>
      </motion.div>
    </Box>
  )
}

export default Login
