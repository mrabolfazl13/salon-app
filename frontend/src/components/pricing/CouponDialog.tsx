// frontend/src/components/pricing/CouponDialog.tsx
// ساخت/ویرایش کد تخفیف — percent در دیتا ×۱۰۰ ذخیره می‌شود؛ venue_id=null سراسری
// (ساختش فقط سرپرست؛ ویرایش سراسری هم فقط سرپرست).

import React, { useEffect, useId, useState } from 'react'
import { Icon } from '@iconify/react'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { toPersianDigits } from '@/lib/jalali'
import type { Coupon, CouponCreatePayload, CouponType, CouponUpdatePayload } from '@/services/coupons'
import type { FinanceVenue } from '@/hooks/useFinance'
import { parseIntFa } from './shared'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'

interface Props {
  open: boolean
  venueId: number | null
  venues: FinanceVenue[]
  isSuper: boolean
  coupon: Coupon | null
  saving: boolean
  onClose: () => void
  onCreate: (payload: CouponCreatePayload) => void
  onUpdate: (couponId: number, payload: CouponUpdatePayload) => void
}

const CouponDialog: React.FC<Props> = ({ open, venueId, venues, isSuper, coupon, saving, onClose, onCreate, onUpdate }) => {
  const isEdit = coupon != null
  const [code, setCode] = useState('')
  const [scope, setScope] = useState<'venue' | 'global'>('venue')
  const [targetVenue, setTargetVenue] = useState<number | ''>('')
  const [discountType, setDiscountType] = useState<CouponType>('percent')
  const [amount, setAmount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [perUserLimit, setPerUserLimit] = useState('1')
  const [minAmount, setMinAmount] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [active, setActive] = useState(true)
  const [localError, setLocalError] = useState('')

  const formId = useId()
  const codeId = `${formId}-code`
  const scopeId = `${formId}-scope`
  const venueId_ = `${formId}-venue`
  const typeId = `${formId}-type`
  const amountId = `${formId}-amount`
  const maxUsesId = `${formId}-max-uses`
  const perUserId = `${formId}-per-user`
  const minAmountId = `${formId}-min-amount`
  const activeId = `${formId}-active`

  useEffect(() => {
    if (!open) return
    setLocalError('')
    if (coupon) {
      setCode(coupon.code)
      setScope(coupon.venue_id == null ? 'global' : 'venue')
      setTargetVenue(coupon.venue_id ?? '')
      setDiscountType(coupon.discount_type)
      setAmount(String(coupon.discount_type === 'percent' ? coupon.value / 100 : coupon.value))
      setMaxUses(coupon.max_uses == null ? '' : String(coupon.max_uses))
      setPerUserLimit(coupon.per_user_limit == null ? '' : String(coupon.per_user_limit))
      setMinAmount(coupon.min_booking_amount == null ? '' : String(coupon.min_booking_amount))
      setValidFrom(coupon.valid_from ? coupon.valid_from.slice(0, 10) : '')
      setValidUntil(coupon.valid_until ? coupon.valid_until.slice(0, 10) : '')
      setActive(coupon.is_active)
    } else {
      setCode('')
      setScope(isSuper ? 'venue' : 'venue')
      setTargetVenue(venueId ?? (venues[0]?.id ?? ''))
      setDiscountType('percent')
      setAmount('')
      setMaxUses('')
      setPerUserLimit('1')
      setMinAmount('')
      setValidFrom('')
      setValidUntil('')
      setActive(true)
    }
  }, [open, coupon, venueId, venues, isSuper])

  const submit = () => {
    setLocalError('')
    const val = parseIntFa(amount)
    if (val === null || val <= 0) {
      setLocalError('مقدار تخفیف باید مثبت باشد')
      return
    }
    if (discountType === 'percent' && val > 100) {
      setLocalError('درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد')
      return
    }
    const value = discountType === 'percent' ? Math.round(val * 100) : val

    let maxUsesN: number | null = null
    if (maxUses.trim()) {
      maxUsesN = parseIntFa(maxUses)
      if (maxUsesN === null || maxUsesN < 1) {
        setLocalError('سقف مجموع استفاده نامعتبر است')
        return
      }
    }
    let perUserN: number | null = null
    if (perUserLimit.trim()) {
      perUserN = parseIntFa(perUserLimit)
      if (perUserN === null || perUserN < 1) {
        setLocalError('سقف هر کاربر نامعتبر است')
        return
      }
    }
    let minN: number | null = null
    if (minAmount.trim()) {
      minN = parseIntFa(minAmount)
      if (minN === null || minN < 0) {
        setLocalError('حداقل مبلغ رزرو نامعتبر است')
        return
      }
    }
    if (validFrom && validUntil && validFrom > validUntil) {
      setLocalError('تاریخ شروع نمی‌تواند بعد از پایان باشد')
      return
    }
    const resolvedVenue: number | null = scope === 'global' ? null : (typeof targetVenue === 'number' ? targetVenue : venueId)
    if (scope === 'venue' && resolvedVenue == null) {
      setLocalError('سالن را مشخص کنید')
      return
    }

    if (isEdit && coupon) {
      onUpdate(coupon.id, {
        discount_type: discountType,
        value,
        max_uses: maxUsesN,
        per_user_limit: perUserN,
        min_booking_amount: minN,
        valid_from: validFrom ? `${validFrom}T00:00:00` : null,
        valid_until: validUntil ? `${validUntil}T23:59:59` : null,
        is_active: active,
      })
    } else {
      const c = code.trim()
      if (c.length < 2) {
        setLocalError('کد تخفیف حداقل ۲ نویسه')
        return
      }
      onCreate({
        code: c,
        venue_id: resolvedVenue,
        discount_type: discountType,
        value,
        max_uses: maxUsesN,
        per_user_limit: perUserN,
        min_booking_amount: minN,
        valid_from: validFrom ? `${validFrom}T00:00:00` : null,
        valid_until: validUntil ? `${validUntil}T23:59:59` : null,
      })
    }
  }

  const scopeChip = isEdit
    ? (coupon?.venue_id == null ? 'دامنه: سراسری' : `دامنه: ${venues.find((v) => v.id === coupon?.venue_id)?.name ?? 'سالن'}`)
    : (venueId ? `اعمال: ${venues.find((v) => v.id === venueId)?.name ?? 'سالن انتخابی'}` : 'سالن انتخابی')

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) onClose() }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400 text-white">
              <Icon icon="mdi:ticket-percent-outline" className="h-5 w-5" aria-hidden="true" />
            </span>
            <DialogTitle className="text-lg font-extrabold text-foreground">
              {isEdit ? `ویرایش ${coupon?.code}` : 'کد تخفیف جدید'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={codeId}>کد تخفیف</Label>
              <Input
                id={codeId}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثلاً: نوروز۱۴۰۵"
                dir="auto"
              />
            </div>
          )}

          {!isEdit ? (
            isSuper ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={scopeId}>دامنه اعمال</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    const next = v as 'venue' | 'global'
                    setScope(next)
                    if (next === 'venue' && targetVenue === '') setTargetVenue(venueId ?? venues[0]?.id ?? '')
                  }}
                >
                  <SelectTrigger id={scopeId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">فقط یک سالن مشخص</SelectItem>
                    <SelectItem value="global">سراسری (همه سالن‌ها)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 self-start rounded-xl border border-border bg-muted px-3 py-1 text-[0.68rem] font-semibold text-foreground">
                {scopeChip}
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 self-start rounded-xl border border-border bg-muted px-3 py-1 text-[0.68rem] font-semibold text-foreground">
              {scopeChip}
            </span>
          )}

          {scope === 'venue' && !isEdit && venues.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={venueId_}>سالن اعمال</Label>
              <Select
                value={targetVenue === '' ? '' : String(targetVenue)}
                onValueChange={(v) => setTargetVenue(Number(v))}
              >
                <SelectTrigger id={venueId_}>
                  <SelectValue placeholder="انتخاب سالن" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
              <Label htmlFor={typeId}>نوع تخفیف</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponType)}>
                <SelectTrigger id={typeId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">درصدی</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت (ریال)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-[140px] flex-1 flex-col gap-1.5">
              <Label htmlFor={amountId}>{discountType === 'percent' ? 'درصد' : 'مبلغ تخفیف (ریال)'}</Label>
              <Input
                id={amountId}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
              <Label htmlFor={maxUsesId}>سقف مجموع استفاده (خالی = نامحدود)</Label>
              <Input
                id={maxUsesId}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                inputMode="numeric"
                className="tabular-nums"
              />
            </div>
            <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
              <Label htmlFor={perUserId}>{`سقف هر کاربر (خالی = نامحدود، پیش‌فرض ${toPersianDigits(1)})`}</Label>
              <Input
                id={perUserId}
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                inputMode="numeric"
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={minAmountId}>حداقل مبلغ رزرو برای اعمال (ریال)</Label>
            <Input
              id={minAmountId}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              inputMode="numeric"
              className="tabular-nums"
            />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-[150px] flex-1">
              <PersianDatePicker label="اعتبار از" value={validFrom} onChange={setValidFrom} size="small" />
            </div>
            <div className="min-w-[150px] flex-1">
              <PersianDatePicker label="اعتبار تا" value={validUntil} onChange={setValidUntil} size="small" min={validFrom || undefined} />
            </div>
          </div>
          <p className="-mt-2 text-[0.68rem] text-muted-foreground">خالی‌گذاری = بدون محدودیت زمانی. سرور این تاریخ‌ها را به میلادی تبدیل و ذخیره می‌کند.</p>

          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch id={activeId} checked={active} onCheckedChange={setActive} />
              <Label htmlFor={activeId} className="cursor-pointer text-[0.68rem] font-semibold text-foreground">
                کد فعال باشد
              </Label>
            </div>
          )}

          {localError && (
            <p role="alert" className="text-[0.68rem] font-semibold text-red-600 dark:text-red-400">{localError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button onClick={onClose} disabled={saving} variant="outline">
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-to-br from-pink-600 to-pink-400 font-bold text-white hover:from-pink-700 hover:to-pink-500"
          >
            {isEdit ? 'ذخیره تغییرات' : 'ایجاد کد'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CouponDialog
