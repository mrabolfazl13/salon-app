// src/pages/auth/Login.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور حداقل 6 کاراکتر'),
})

type LoginForm = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      success('ورود موفقیت‌آمیز! 🎉')
      navigate('/dashboard')
    } catch (err) {
      setError('خطا در ورود. لطفاً دوباره تلاش کنید.')
      toastError('خطا در ورود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden">
          {/* Gradient Header Line */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-shimmer" />

          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-4"
              >
                <Icon icon="mdi:soccer" className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900">خوش آمدید</h1>
              <p className="text-sm text-gray-500 mt-1">برای رزرو سالن فوتسال وارد شوید</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2"
              >
                <Icon icon="mdi:alert-circle" className="h-5 w-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('email')}
                type="email"
                placeholder="ایمیل"
                icon="mdi:email-outline"
                error={errors.email?.message}
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
              />

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمز عبور"
                  icon="mdi:lock-outline"
                  error={errors.password?.message}
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon
                    icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
                    className="h-5 w-5"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  مرا به خاطر بسپار
                </label>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  رمز عبور را فراموش کردید؟
                </Link>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full py-4 text-white shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40"
                loading={loading}
              >
                <Icon icon="mdi:login" className="h-5 w-5 ml-2" />
                ورود
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-gray-500">یا</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  icon="mdi:google"
                >
                  گوگل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  icon="mdi:github"
                >
                  گیت‌هاب
                </Button>
              </div>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-600">
                حساب ندارید؟{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  ثبت‌نام کنید
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Login