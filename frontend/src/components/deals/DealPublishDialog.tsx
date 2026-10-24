// frontend/src/components/deals/DealPublishDialog.tsx
// انتشار سانس‌های انتخابی به‌عنوان «سانس لحظه آخری» — POST /deals/publish.
// اگر سانس‌ها چند سالن را پوشش دهند، به تفکیک سالن منتشر می‌شود (هر فراخوان یک venue_id).

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import { extractError, faNum } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'
import { dealService } from '@/services/deals'
import { parseIntFa } from '@/components/pricing/shared'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

export interface PublishSlot {
  id: number
  venue_id: number
  slot_date: string
  start_time: string
}

interface Props {
  open: boolean
  slots: PublishSlot[]
  venueNameOf: (venueId: number) => string
  onClose: () => void
  onPublished: () => void
}

const EXPIRY_OPTIONS = [15, 30, 60, 120, 240, 480, 720, 1440]

const DealPublishDialog: React.FC<Props> = ({ open, slots, venueNameOf, onClose, onPublished }) => {
  const [mode, setMode] = useState<'percent' | 'price'>('percent')
  const [percent, setPercent] = useState('20')
  const [price, setPrice] = useState('')
  const [expiry, setExpiry] = useState<string>('60')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  const grouped = React.useMemo(() => {
    const map = new Map<number, PublishSlot[]>()
    for (const s of slots) {
      const arr = map.get(s.venue_id) ?? []
      arr.push(s)
      map.set(s.venue_id, arr)
    }
    return Array.from(map.entries())
  }, [slots])

  const close = () => {
    if (busy) return
    setLocalError('')
    onClose()
  }

  const submit = async () => {
    setLocalError('')
    const pct = parseIntFa(percent)
    const fixed = parseIntFa(price)
    if (mode === 'percent' && (pct === null || pct < 1 || pct > 99)) {
      setLocalError('درصد تخفیف باید بین ۱ تا ۹۹ باشد')
      return
    }
    if (mode === 'price' && (fixed === null || fixed <= 0)) {
      setLocalError('قیمت دیل (تومان) نامعتبر است')
      return
    }
    const exp = parseIntFa(expiry)
    setBusy(true)
    let published = 0
    const errors: string[] = []
    try {
      for (const [venueId, ss] of grouped) {
        try {
          const res = await dealService.publish({
            venue_id: venueId,
            slot_ids: ss.map((s) => s.id),
            discount_percent: mode === 'percent' ? pct ?? undefined : undefined,
            deal_price: mode === 'price' ? fixed ?? undefined : undefined,
            expires_in_minutes: exp && exp > 0 ? exp : undefined,
          })
          published += res.published
        } catch (err) {
          errors.push(`${venueNameOf(venueId)}: ${extractError(err, 'خطا')}`)
        }
      }
      if (published > 0) {
        toast.success(`${toPersianDigits(published)} سانس به بازار لحظه آخری اضافه شد 🔥`)
        onPublished()
        onClose()
      }
      if (errors.length > 0) {
        toast.error(errors.slice(0, 2).join(' | '), { duration: 6000 })
      }
      if (published === 0 && errors.length === 0) {
        toast.error('هیچ سانی منتشر نشد')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent
        aria-label="انتشار سانس تخفیف‌دار"
        className="gap-0 overflow-hidden p-0 sm:max-w-[444px] [&>button]:text-white/90 [&>button:hover]:bg-white/15 [&>button:hover]:text-white"
      >
        <div className="bg-gradient-to-br from-amber-500 to-red-500 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pe-10 text-lg font-bold text-white">
              <Icon icon="mdi:lightning-bolt" className="h-5 w-5" />
              عرضه به‌عنوان تخفیف‌دار
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="flex flex-col gap-4 px-6 pt-6">
          <p className="text-[0.68rem] text-muted-foreground">
            {toPersianDigits(slots.length)} سانس انتخابی — قیمت نهایی توسط سرور کنترل می‌شود و حتماً باید ارزان‌تر از قیمت مصوب قوانین باشد.
            به کاربرانِ «علاقه‌مندی + اشتراک تخفیف» همان سالن اعلان می‌رود.
          </p>
          {grouped.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {grouped.map(([vid, ss]) => (
                <span key={vid} className="inline-flex items-center rounded-lg border border-border px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">
                  {`${venueNameOf(vid)} — ${toPersianDigits(ss.length)} سانس`}
                </span>
              ))}
            </div>
          )}

          <div role="group" aria-label="نحوه تعیین تخفیف" className="flex gap-2">
            <button
              type="button"
              aria-pressed={mode === 'percent'}
              onClick={() => setMode('percent')}
              className={cn(
                'min-h-11 flex-1 rounded-[10px] border px-3 text-[0.68rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                mode === 'percent'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              درصد تخفیف
            </button>
            <button
              type="button"
              aria-pressed={mode === 'price'}
              onClick={() => setMode('price')}
              className={cn(
                'min-h-11 flex-1 rounded-[10px] border px-3 text-[0.68rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                mode === 'price'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              قیمت نهایی (تومان)
            </button>
          </div>

          {mode === 'percent' ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-publish-percent">درصد تخفیف (۱ تا ۹۹)</Label>
              <Input
                id="deal-publish-percent"
                inputMode="numeric"
                className="h-11 rounded-[10px]"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-publish-price">قیمت نهایی سانس (تومان)</Label>
              <Input
                id="deal-publish-price"
                inputMode="numeric"
                className="h-11 rounded-[10px]"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-[0.68rem] text-muted-foreground">
                یک قیمت برای همه سانس‌های انتخابی؛ سانس‌های گران‌تر که این قیمت از آنها بیشتر باشد رد می‌شوند
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label id="dp-expiry-label">اعتبار تخفیف</Label>
            <Select
              value={expiry === '' ? 'none' : expiry}
              onValueChange={(v) => setExpiry(v === 'none' ? '' : v)}
            >
              <SelectTrigger aria-labelledby="dp-expiry-label" className="h-11 rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m >= 1440 ? `${faNum(m / 1440)} روز` : m >= 60 ? `${faNum(m / 60)} ساعت` : `${faNum(m)} دقیقه`}
                  </SelectItem>
                ))}
                <SelectItem value="none">بدون مهلت (تا شروع سانس)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localError && (
            <p role="alert" className="text-[0.68rem] font-bold text-red-600 dark:text-red-400">{localError}</p>
          )}
        </div>
        <DialogFooter className="gap-2 px-6 pb-6 pt-4">
          <Button variant="outline" onClick={close} disabled={busy} className="rounded-[10px]">
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={busy || slots.length === 0}
            className="rounded-[10px] font-extrabold"
          >
            {busy ? 'در حال انتشار…' : 'انتشار 🔥'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DealPublishDialog
