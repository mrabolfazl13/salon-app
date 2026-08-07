// src/pages/auth/ForgotPassword.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const forgotSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
})

type ForgotForm = z.infer<typeof forgotSchema>

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
      toastSuccess('لینک بازیابی رمز عبور ارسال شد! 📧')
    } catch (err) {
      setError('خطا در ارسال لینک. لطفاً دوباره تلاش کنید.')
      toastError('خطا در ارسال لینک')
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
                <Icon icon="mdi:lock-reset" className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900">بازیابی رمز عبور</h1>
              <p className="text-sm text-gray-500 mt-1">
                ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:check" className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">لینک بازیابی ارسال شد!</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      لینک بازیابی رمز عبور به ایمیل شما ارسال شد.
                    </p>
                  </div>
                </div>
                <Link to="/login">
                  <Button
                    variant="gradient"
                    className="w-full text-white shadow-2xl shadow-blue-500/25"
                  >
                    <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-2" />
                    بازگشت به صفحه ورود
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2"
                  >
                    <Icon icon="mdi:alert-circle" className="h-5 w-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Email Input */}
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="ایمیل"
                  icon="mdi:email-outline"
                  error={errors.email?.message}
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                />

                {/* Info Box */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon icon="mdi:information" className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>
                      لینک بازیابی به ایمیل شما ارسال می‌شود. لطفاً صندوق ورودی خود را بررسی کنید.
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full text-white shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40"
                  loading={loading}
                >
                  <Icon icon="mdi:email-send" className="h-5 w-5 ml-2" />
                  ارسال لینک بازیابی
                </Button>

                {/* Back to Login */}
                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Icon icon="mdi:arrow-right" className="h-4 w-4" />
                    بازگشت به صفحه ورود
                  </Link>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-sm text-gray-500">یا</span>
                  </div>
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default ForgotPassword