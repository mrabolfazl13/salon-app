// src/pages/auth/ForgotPassword.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth'

const toLatinDigits = (value: string): string =>
  value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [devCode, setDevCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { success: toastSuccess } = useToast()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanPhone = toLatinDigits(phone).trim()
    if (!/^09[0-9]{9}$/.test(cleanPhone)) {
      setError('شماره موبایل معتبر وارد کنید (مثال 09123456789)')
      return
    }
    setLoading(true)
    try {
      const res = await authService.forgotPassword({ phone: cleanPhone })
      if (res.dev_code) setDevCode(res.dev_code)
      toastSuccess('کد بازیابی ارسال شد')
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در ارسال کد بازیابی. لطفاً بعداً تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[0-9]{6}$/.test(code)) {
      setError('کد ۶ رقمی را وارد کنید')
      return
    }
    if (newPassword.length < 4) {
      setError('رمز عبور جدید باید حداقل ۴ کاراکتر باشد')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }
    setLoading(true)
    try {
      const res = await authService.resetPassword({
        phone: toLatinDigits(phone).trim(),
        code,
        newPassword,
      })
      toastSuccess(res.message || 'رمز عبور با موفقیت تغییر کرد')
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'خطا در بازیابی رمز عبور')
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
                {success
                  ? 'رمز عبور شما با موفقیت بازنشانی شد'
                  : step === 1
                    ? 'شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود'
                    : 'کد ۶ رقمی و رمز عبور جدید را وارد کنید'}
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
                    <p className="font-medium">رمز عبور تغییر کرد!</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      اکنون می‌توانید با رمز عبور جدید وارد شوید.
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
            ) : step === 1 ? (
              <form onSubmit={handleSendCode} className="space-y-5">
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

                {/* Phone Input */}
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(toLatinDigits(e.target.value).replace(/[^0-9]/g, '').slice(0, 11))}
                  placeholder="09123456789"
                  icon="mdi:cellphone"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                  dir="ltr"
                />

                {/* Info Box */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon icon="mdi:information" className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>
                      کد بازیابی ۶ رقمی به شماره موبایل شما ارسال می‌شود. این کد تا ۱۰ دقیقه معتبر است.
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
                  ارسال کد بازیابی
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
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
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

                {/* Dev Code Hint */}
                {devCode && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex items-center gap-2">
                    <Icon icon="mdi:lightbulb-on-outline" className="h-5 w-5 flex-shrink-0" />
                    <span>
                      حالت توسعه — کد بازیابی شما:
                      <b className="mx-1 tracking-widest" dir="ltr">{devCode}</b>
                    </span>
                  </div>
                )}

                {/* Code Input */}
                <Input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(toLatinDigits(e.target.value).replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  icon="mdi:numeric"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 text-center tracking-[0.5em]"
                  dir="ltr"
                />

                {/* New Password */}
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز عبور جدید (حداقل ۴ کاراکتر)"
                  icon="mdi:lock-outline"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                />

                {/* Confirm Password */}
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور جدید"
                  icon="mdi:lock-check-outline"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full text-white shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40"
                  loading={loading}
                >
                  <Icon icon="mdi:check-circle-outline" className="h-5 w-5 ml-2" />
                  بازنشانی رمز عبور
                </Button>

                {/* Back */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setCode(''); setError(null) }}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Icon icon="mdi:arrow-right" className="h-4 w-4" />
                    تغییر شماره موبایل
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
