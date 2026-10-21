import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { checkinService } from '@/services/checkin'
import { formatPersianDateTime } from '@/utils/helpers'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert'
import toast from 'react-hot-toast'

const ManagerCheckin: React.FC = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    booking_id?: number
    checked_in_at?: string
  } | null>(null)

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('لطفاً کد را وارد کنید')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const data = await checkinService.verifyCheckIn(code.trim().toUpperCase())
      setResult({
        success: true,
        message: data.message,
        booking_id: data.booking_id,
        checked_in_at: data.checked_in_at,
      })
      toast.success(data.message)
      setCode('')
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.detail || 'کد نامعتبر است یا قبلاً استفاده شده',
      })
      toast.error(err.response?.data?.detail || 'کد نامعتبر است')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
          <div className="flex items-center gap-4">
            <Icon icon="mdi:qrcode-scan" aria-hidden="true" className="h-10 w-10 text-foreground" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                ثبت ورود با کد QR
              </h1>
              <p className="text-sm text-muted-foreground">
                کد ارائه‌شده توسط کاربر را وارد کنید
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-code">کد Check-in</Label>
              <Input
                id="checkin-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="مثال: A3F9K2L7M1X5"
                disabled={loading}
                autoComplete="off"
                dir="ltr"
                className="text-center"
                style={{ fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.25rem' }}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || !code.trim()}
              className="gap-2 rounded-xl py-4 text-base font-semibold"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال بررسی" />
              ) : (
                <Icon icon="mdi:check-circle" aria-hidden="true" className="h-5 w-5" />
              )}
              {loading ? 'در حال بررسی...' : 'ثبت ورود'}
            </Button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <Alert variant={result.success ? 'success' : 'destructive'} className="mb-6 rounded-2xl">
            <div>
              <AlertTitle className="mb-2">{result.message}</AlertTitle>
              {result.success && result.checked_in_at && (
                <AlertDescription>
                  زمان ورود: {formatPersianDateTime(result.checked_in_at)}
                </AlertDescription>
              )}
              {result.success && result.booking_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/bookings/${result.booking_id}`)}
                  className="mt-3 gap-2 rounded-lg"
                >
                  <Icon icon="mdi:eye" aria-hidden="true" className="h-4 w-4" />
                  مشاهده رزرو
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
          <h2 className="mb-4 text-base font-bold text-foreground">راهنما</h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              • کاربران کد ۱۲ رقمی را از صفحه جزئیات رزرو خود دریافت می‌کنند
            </p>
            <p className="text-sm text-muted-foreground">
              • هر کد فقط یک بار قابل استفاده است
            </p>
            <p className="text-sm text-muted-foreground">
              • پس از ثبت موفق، زمان ورود در سیستم ذخیره می‌شود
            </p>
            <p className="text-sm text-muted-foreground">
              • کد به صورت حروف بزرگ و بدون فاصله وارد شود
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ManagerCheckin
