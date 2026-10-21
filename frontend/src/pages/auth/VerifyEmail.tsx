// src/pages/auth/VerifyEmail.tsx
import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import { authService } from '@/services/auth'
import Layout from '@/components/layout/Layout'
import { Button } from '@/components/ui/shadcn/button'
import { Card } from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams()
  const prefillPhone = params.get('phone') || ''

  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState(prefillPhone)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^09[0-9]{9}$/.test(phone)) {
      toast.error('شماره موبایل معتبر وارد کنید')
      return
    }
    if (!email) {
      toast.error('ایمیل خود را وارد کنید')
      return
    }
    setLoading(true)
    try {
      const res = await authService.requestEmailVerify({ phone, email })
      // dev_code فقط در حالت توسعه و فقط اگر بک‌اند آن را برگردانده باشد نمایش داده می‌شود؛
      // در پروداکشن مسیر عادی «کد ارسال شد» بدون هیچ باکس کمکی render می‌شود
      if (import.meta.env.DEV && res.dev_code) setDevCode(res.dev_code)
      toast.success('کد تایید ارسال شد')
      setStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ارسال کد')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[0-9]{6}$/.test(code)) {
      toast.error('کد ۶ رقمی را وارد کنید')
      return
    }
    setLoading(true)
    try {
      const res = await authService.confirmEmailVerify({ phone, code })
      toast.success(res.message)
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در تایید کد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[420px] py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-5 shadow-[0_4px_24px_rgba(37,99,235,0.08)] sm:p-6 dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_10px_26px_rgba(245,158,11,0.35)]">
                <Icon
                  icon="mdi:email-check-outline"
                  style={{ fontSize: 32, color: '#1c1917' }}
                  aria-hidden="true"
                />
              </div>
              <h1 className="text-xl font-bold text-foreground">تایید شماره و ایمیل</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                برای انجام رزرو، باید ایمیل یا شماره موبایل خود را تایید کنید
              </p>
            </div>

            {success ? (
              <div className="py-2 text-center">
                <Alert variant="success" className="mb-5">
                  <Icon icon="mdi:check-circle-outline" aria-hidden="true" />
                  <AlertDescription>
                    ایمیل شما با موفقیت تایید شد. حالا می‌توانید رزرو کنید.
                  </AlertDescription>
                </Alert>
                <Button asChild size="lg" className="px-8">
                  <Link to="/venues">مشاهده سالن‌ها</Link>
                </Button>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleRequestCode}>
                <div className="mb-4 space-y-1.5">
                  <Label htmlFor="verify-phone">شماره موبایل</Label>
                  <Input
                    id="verify-phone"
                    dir="ltr"
                    className="text-right"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                    placeholder="09xxxxxxxxx"
                    inputMode="tel"
                  />
                </div>
                <div className="mb-6 space-y-1.5">
                  <Label htmlFor="verify-email">ایمیل</Label>
                  <Input
                    id="verify-email"
                    dir="ltr"
                    className="text-right"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <span
                      className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                  ) : (
                    'ارسال کد تایید'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleConfirm}>
                <Alert variant="info" className="mb-4">
                  <Icon icon="mdi:information-outline" aria-hidden="true" />
                  <AlertDescription>
                    کد ۶ رقمی را که به ایمیل <b>{email}</b> ارسال شد وارد کنید
                    {import.meta.env.DEV && devCode && (
                      <span className="mt-1 block font-bold" dir="ltr">
                        (حالت توسعه — کد: {devCode})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
                <div className="mb-6 space-y-1.5">
                  <Label htmlFor="verify-code">کد تایید</Label>
                  <Input
                    id="verify-code"
                    dir="ltr"
                    className="text-center tracking-[0.5em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <span
                      className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                  ) : (
                    'تایید کد'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 w-full"
                  onClick={() => { setStep(1); setCode('') }}
                >
                  <Icon icon="mdi:arrow-right" className="h-5 w-5" aria-hidden="true" />
                  تغییر ایمیل یا شماره
                </Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default VerifyEmail
