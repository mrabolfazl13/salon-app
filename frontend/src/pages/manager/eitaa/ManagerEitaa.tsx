// frontend/src/pages/manager/eitaa/ManagerEitaa.tsx
// تنظیم کانال ایتا توسط مدیر سالن: اتصال ربات، وضعیت پست روزانه و ارسال آزمایشی.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { extractError } from '@/components/finance/shared'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { useManagedVenues } from '@/hooks/useStaffMe'
import { eitaaService } from '@/services/eitaa'

const ManagerEitaa: React.FC = () => {
  const { venueId: venueIdParam } = useParams()
  const venueId = Number(venueIdParam)
  const venuesQuery = useManagedVenues()
  const venueName = useMemo(
    () => venuesQuery.data?.find((v) => v.id === venueId)?.name ?? `سالن #${venueId}`,
    [venuesQuery.data, venueId],
  )

  const [chatId, setChatId] = useState('')
  const [token, setToken] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [pinUpdates, setPinUpdates] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [lastPostDate, setLastPostDate] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(venueId)) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await eitaaService.get(venueId)
      setChatId(data.chat_id)
      setIsActive(data.is_active)
      setPinUpdates(data.pin_updates)
      setLastPostDate(data.last_post_date ?? null)
      setLastError(data.last_error ?? null)
      setConfigured(true)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setConfigured(false)
        setChatId('')
        setLastPostDate(null)
        setLastError(null)
      } else {
        toast.error(extractError(err, 'خطای ناشناخته'))
      }
    } finally {
      setLoading(false)
    }
  }, [venueId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!configured && !token.trim()) {
      toast.error('توکن ایتایار را وارد کنید')
      return
    }
    setSaving(true)
    try {
      const data = await eitaaService.upsert(venueId, {
        chat_id: chatId.trim(),
        bot_token: token.trim(),
        is_active: isActive,
        pin_updates: pinUpdates,
      })
      setChatId(data.chat_id)
      setIsActive(data.is_active)
      setPinUpdates(data.pin_updates)
      setLastPostDate(data.last_post_date ?? null)
      setLastError(data.last_error ?? null)
      setConfigured(true)
      setToken('')
      toast.success('کانال ایتا ذخیره شد')
    } catch (err) {
      toast.error(extractError(err, 'خطای ناشناخته'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('اتصال کانال ایتا حذف شود؟ پستهای قبلی در ایتا باقی میمانند.')) return
    try {
      await eitaaService.remove(venueId)
      setConfigured(false)
      setToken('')
      setLastPostDate(null)
      setLastError(null)
      toast.success('اتصال حذف شد')
    } catch (err) {
      toast.error(extractError(err, 'خطای ناشناخته'))
    }
  }

  const handlePostNow = async () => {
    setSaving(true)
    try {
      const result = await eitaaService.postNow(venueId)
      setLastPostDate(result.day)
      setLastError(null)
      toast.success(result.reposted ? 'جدول بهروزرسانی و دوباره ارسال شد ✅' : 'جدول امروز ارسال شد')
      void load()
    } catch (err) {
      toast.error(extractError(err, 'خطای ناشناخته'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/manager/venues/${venueId}`}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
            aria-label="بازگشت"
          >
            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">کانال ایتا — {venueName}</h1>
            <p className="text-sm text-muted-foreground">
              جدول سانسها هر روز ساعت ۰۷ ارسال میشود و بعد از تأیید رزرو با تیک ✅ بهروز میشود.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            <Icon icon="mdi:information-outline" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              ابتدا در ایتا یک کانال بسازید و ربات ایتایار خود را ادمین آن کنید. سپس شناسه کانال
              (مثلاً <span dir="ltr">salon_channel</span>) و توکن پنل ایتایار را وارد کنید.
              توکن روی سرور رمزنگاری ذخیره میشود و در هیچ پاسخی نمایش داده نمیشود.
            </p>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">در حال بارگذاری…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="eitaa-chat">شناسه کانال</Label>
                <Input
                  id="eitaa-chat"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="salon_channel"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eitaa-token">
                  توکن ایتایار {configured ? '(ذخیره شده — برای تغییر وارد کنید)' : ''}
                </Label>
                <Input
                  id="eitaa-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={configured ? '••••••••••••' : 'bot123:token'}
                  dir="ltr"
                  autoComplete="off"
                  required={!configured}
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  ارسال خودکار فعال
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={pinUpdates}
                    onChange={(e) => setPinUpdates(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  سنجاق کردن پیام بهروزرسانی
                </label>
              </div>

              {lastPostDate && (
                <p className="text-xs text-muted-foreground">
                  آخرین پست: <span dir="ltr">{lastPostDate}</span>
                </p>
              )}
              {lastError && (
                <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  آخرین خطا: {lastError}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {configured ? 'ذخیره تغییرات' : 'اتصال کانال'}
                </button>
                {configured && (
                  <>
                    <button
                      type="button"
                      onClick={handlePostNow}
                      disabled={saving}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      ارسال فوری جدول امروز
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950/30"
                    >
                      حذف اتصال
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ManagerEitaa
