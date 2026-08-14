// src/pages/auth/Register.tsx
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
import { authService } from '@/services/auth'

const registerSchema = z
  .object({
    fullName: z.string().min(3, 'نام حداقل ۳ کاراکتر'),
    phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر وارد کنید'),
    password: z.string().min(4, 'رمز عبور حداقل ۴ کاراکتر'),
    confirmPassword: z.string(),
    role: z.enum(['user', 'venue_manager']),
    terms: z.boolean().refine((val) => val === true, {
      message: 'پذیرش قوانین الزامی است',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'user' | 'venue_manager'>('user')
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user',
    },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    try {
      await authService.register({
        phone: data.phone,
        full_name: data.fullName,
        password: data.password,
        role: data.role,
      })
      setSuccess(true)
      toastSuccess('ثبت‌نام موفقیت‌آمیز! 🎉')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30"
            >
              <Icon icon="mdi:check" className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mt-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ثبت‌نام موفق! 🎉
            </h2>
            <p className="text-gray-600 mt-2">
              حساب کاربری شما با موفقیت ایجاد شد.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
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
              <h1 className="text-3xl font-bold text-gray-900">ثبت‌نام</h1>
              <p className="text-sm text-gray-500 mt-1">حساب کاربری خود را بسازید</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8 px-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      s <= step
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s < step ? <Icon icon="mdi:check" className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-0.5 transition-all duration-300 ${
                        s < step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع حساب</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('venue_manager')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedRole === 'venue_manager'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon icon="mdi:store" className="h-6 w-6" />
                        <span className="text-sm font-medium">مدیر سالن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('user')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedRole === 'user'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon icon="mdi:account" className="h-6 w-6" />
                        <span className="text-sm font-medium">کاربر عادی</span>
                      </button>
                    </div>
                  </div>

                  <Input
                    {...register('fullName')}
                    placeholder="نام و نام خانوادگی"
                    icon="mdi:account-outline"
                    error={errors.fullName?.message}
                    className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                  />
                  <Input
                    {...register('phone')}
                    placeholder="شماره موبایل"
                    icon="mdi:phone-outline"
                    error={errors.phone?.message}
                    className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                  />
                </motion.div>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
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

                  {/* Password Strength */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            password.length < 6
                              ? 'bg-red-500'
                              : password.length < 10
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {password.length < 6
                            ? 'ضعیف'
                            : password.length < 10
                            ? 'متوسط'
                            : 'قوی'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">حداقل ۴ کاراکتر</p>
                    </div>
                  )}

                  <div className="relative">
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="تکرار رمز عبور"
                      icon="mdi:lock-check-outline"
                      error={errors.confirmPassword?.message}
                      className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Icon
                        icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'}
                        className="h-5 w-5"
                      />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Terms */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('terms')}
                        className="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-gray-700 font-medium">
                          قوانین و مقررات را می‌پذیرم
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          با ثبت‌نام، اطلاعات شما نزد ما محفوظ است
                        </p>
                      </div>
                    </label>
                    {errors.terms && (
                      <p className="text-sm text-red-500 mt-2">{errors.terms.message}</p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon icon="mdi:information" className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span>
                        {selectedRole === 'venue_manager'
                          ? 'به عنوان مدیر سالن می‌توانید سالن خود را مدیریت و قیمت‌گذاری کنید'
                          : 'اطلاعات شما برای ارسال پیام‌های مربوط به رزرو استفاده می‌شود'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setStep(step - 1)}
                  >
                    <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                    قبلی
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    variant="gradient"
                    className="flex-1 text-white shadow-2xl shadow-blue-500/25"
                    onClick={() => setStep(step + 1)}
                  >
                    بعدی
                    <Icon icon="mdi:arrow-left" className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="gradient"
                    className="flex-1 text-white shadow-2xl shadow-blue-500/25"
                    loading={loading}
                  >
                    <Icon icon="mdi:check" className="h-5 w-5 ml-2" />
                    ثبت‌نام ({selectedRole === 'venue_manager' ? 'مدیر سالن' : 'کاربر'})
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600">
                قبلاً ثبت‌نام کردید؟{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  وارد شوید
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Register