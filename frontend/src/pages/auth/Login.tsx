// src/pages/auth/Login.tsx — ورود (shadcn/Tailwind؛ منطق useForm + zod + authStore دست‌نخورده)
import React, { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { QUICK_ACCESS_GROUPS } from '@/config/quickAccess'
import { Button } from '@/components/ui/shadcn/button'
import { Card } from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'

const loginSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر وارد کنید'),
  password: z.string().min(4, 'رمز عبور حداقل ۴ کاراکتر'),
})

type LoginForm = z.infer<typeof loginSchema>

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickPending, setQuickPending] = useState<string | null>(null)
  const navigate = useNavigate()
  const { success } = useToast()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  // روی صفحه‌های لمسی autoFocus کیبورد را روی حساب‌های نمونه باز می‌کند
  const [hasPointer] = useState(hasFinePointer)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const redirectByRole = () => {
    const user = useAuthStore.getState().user
    if (user?.role === 'coach') {
      navigate('/coach')
    } else if (
      user?.role === 'venue_manager' ||
      user?.role === 'club_admin' ||
      user?.role === 'super_admin'
    ) {
      navigate('/manager-dashboard')
    } else {
      navigate('/venues')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.phone, data.password)
      success('ورود موفقیت‌آمیز!')
      redirectByRole()
    } catch (err: any) {
      // فقط بازخورد درون‌صفحه (جلوگیری از نمایش دوجانبه خطا)
      const message = err.response?.data?.detail || 'شماره موبایل یا رمز عبور اشتباه است.'
      setError(message)
    }
  }

  const quickLogin = async (phone: string, password: string) => {
    if (isLoading || quickPending) return
    setError(null)
    setQuickPending(phone)
    // فیلدها را هم پر می‌کنیم تا کاربر ببیند با چه حسابی وارد شد
    setValue('phone', phone)
    setValue('password', password)
    try {
      await login(phone, password)
      success('ورود موفقیت‌آمیز!')
      redirectByRole()
    } catch (err: any) {
      const message = err.response?.data?.detail || 'ورود سریع ناموفق بود؛ دوباره تلاش کنید.'
      setError(message)
    } finally {
      setQuickPending(null)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-slate-50 to-white px-5 pb-8 pt-safe dark:from-[#101a30] dark:via-background dark:to-background">
      {/* تزئینات پس‌زمینه */}
      <div className="pointer-events-none absolute -end-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-amber-400/15 to-blue-500/15 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-36 -start-24 h-80 w-80 rounded-full bg-amber-500/10 blur-[60px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* برند */}
        <div className="mb-7 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.1 }}
            className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_12px_30px_rgba(245,158,11,0.4)]"
          >
            <Icon icon="mdi:soccer" style={{ width: 40, height: 40, color: '#1c1917' }} />
          </motion.div>
          <h1 className="text-xl font-extrabold text-foreground">خوش آمدید</h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">برای رزرو سالن فوتسال وارد شوید</p>
        </div>

        <Card className="bg-card/90 p-3 shadow-xl backdrop-blur-md">
          {error && (
            <Alert variant="destructive" className="mb-4 text-[0.68rem]">
              <Icon icon="mdi:alert-circle-outline" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-phone">شماره موبایل</Label>
                <Input
                  id="login-phone"
                  {...register('phone')}
                  placeholder="09xxxxxxxxx"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-label="شماره تلفن همراه"
                  autoFocus={hasPointer}
                  startIcon={<Icon icon="mdi:cellphone" />}
                  error={errors.phone?.message}
                  dir="ltr"
                  className="text-start"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور"
                    autoComplete="current-password"
                    aria-label="رمز عبور"
                    startIcon={<Icon icon="mdi:lock-outline" />}
                    error={errors.password?.message}
                    dir="ltr"
                    className="pe-12 text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                    aria-pressed={showPassword}
                    className="absolute end-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon
                      icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                      style={{ width: 22, height: 22 }}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <RouterLink
                  to="/forgot-password"
                  className="inline-flex min-h-9 items-center px-2 text-[0.68rem] font-bold text-amber-700 hover:underline dark:text-amber-400"
                >
                  رمز عبور را فراموش کردید؟
                </RouterLink>
              </div>

              <Button type="submit" disabled={isLoading} className="mt-0.5">
                {isLoading ? (
                  <Icon icon="svg-spinners:3-dots-fade" className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Icon icon="mdi:login-variant" className="h-5 w-5" aria-hidden="true" />
                )}
                ورود
              </Button>
            </div>
          </form>
        </Card>

        <section aria-labelledby="quick-access-title" className="mt-7">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="quick-access-title" className="text-sm font-extrabold text-foreground">
              دسترسی سریع
            </h2>
            <span className="text-[0.68rem] text-muted-foreground">حساب‌های نمونه</span>
          </div>
          <p className="mb-3 mt-1 text-[0.68rem] text-muted-foreground">
            با یک کلیک با هر نقش وارد شوید — فقط برای آزمون و دمو.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_ACCESS_GROUPS.map((group) => (
              <Card key={group.key} className="bg-card/75 p-3">
                <div className="mb-1 flex items-center gap-1.5" style={{ color: group.color }}>
                  <Icon icon={group.icon} aria-hidden="true" style={{ width: 18, height: 18 }} />
                  <h3 className="text-[0.68rem] font-bold">{group.label}</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {group.users.map((u) => (
                    <Button
                      key={u.phone}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin(u.phone, u.password)}
                      disabled={Boolean(quickPending) || isLoading}
                      aria-label={`ورود سریع به‌عنوان ${u.name} — ${u.phone}`}
                      className="justify-start font-semibold"
                    >
                      <Icon
                        icon={quickPending === u.phone ? 'mdi:loading' : 'mdi:login-variant'}
                        className={
                          quickPending === u.phone
                            ? 'h-[18px] w-[18px] animate-spin'
                            : 'h-[18px] w-[18px]'
                        }
                        aria-hidden="true"
                      />
                      {quickPending === u.phone ? 'در حال ورود…' : u.name}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <p className="mt-7 text-center text-[0.68rem] text-muted-foreground">
          حساب ندارید؟{' '}
          <RouterLink
            to="/register"
            className="inline-flex min-h-9 items-center px-1 font-extrabold text-amber-700 hover:underline dark:text-amber-400"
          >
            ثبت‌نام کنید
          </RouterLink>
        </p>
      </motion.div>
    </main>
  )
}

export default Login
