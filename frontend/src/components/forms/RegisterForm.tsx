import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Input,
  Alert,
  CircularProgress,
  Typography,
  Grid,
} from '@mui/material'
import toast from 'react-hot-toast'

const registerSchema = z
  .object({
    fullName: z.string().min(3, 'نام حداقل 3 کاراکتر'),
    phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر وارد کنید'),
    email: z.string().email('ایمیل معتبر وارد کنید'),
    password: z.string().min(6, 'رمز عبور حداقل 6 کاراکتر'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
  onLogin?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLogin }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('ثبت‌نام موفقیت‌آمیز!')
      onSuccess?.()
    } catch (err) {
      setError('خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.')
      toast.error('خطا در ثبت‌نام')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Alert severity="error">{error}</Alert>
          </motion.div>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Input
              {...register('fullName')}
              placeholder="نام و نام خانوادگی"
              icon="mdi:account-outline"
              error={errors.fullName?.message}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              {...register('phone')}
              placeholder="شماره موبایل"
              icon="mdi:phone-outline"
              error={errors.phone?.message}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              {...register('email')}
              type="email"
              placeholder="ایمیل"
              icon="mdi:email-outline"
              error={errors.email?.message}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              {...register('password')}
              type="password"
              placeholder="رمز عبور"
              icon="mdi:lock-outline"
              error={errors.password?.message}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="تکرار رمز عبور"
              icon="mdi:lock-check-outline"
              error={errors.confirmPassword?.message}
              fullWidth
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          }}
        >
          {loading ? (
            <CircularProgress size={24} className="text-white" />
          ) : (
            'ثبت‌نام'
          )}
        </Button>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            قبلاً ثبت‌نام کردید؟{' '}
            <Button
              variant="text"
              onClick={onLogin}
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              وارد شوید
            </Button>
          </Typography>
        </Box>
      </Box>
    </motion.div>
  )
}

export default RegisterForm