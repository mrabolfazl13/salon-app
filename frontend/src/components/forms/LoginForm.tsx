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
} from '@mui/material'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور حداقل 6 کاراکتر'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onRegister?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegister }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('ورود موفقیت‌آمیز!')
      onSuccess?.()
    } catch (err) {
      setError('خطا در ورود. لطفاً دوباره تلاش کنید.')
      toast.error('خطا در ورود')
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

        <Input
          {...register('email')}
          type="email"
          placeholder="ایمیل"
          icon="mdi:email-outline"
          error={errors.email?.message}
          fullWidth
        />

        <Input
          {...register('password')}
          type="password"
          placeholder="رمز عبور"
          icon="mdi:lock-outline"
          error={errors.password?.message}
          fullWidth
        />

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
            'ورود'
          )}
        </Button>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            حساب ندارید؟{' '}
            <Button
              variant="text"
              onClick={onRegister}
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              ثبت‌نام کنید
            </Button>
          </Typography>
        </Box>
      </Box>
    </motion.div>
  )
}

export default LoginForm