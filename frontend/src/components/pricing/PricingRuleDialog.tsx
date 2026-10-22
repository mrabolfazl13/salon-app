// frontend/src/components/pricing/PricingRuleDialog.tsx
// ساخت/ویرایش قانون قیمت — ترجمه UI به قرارداد بک‌اند:
// day_of_week = weekday پایتون | percent ذخیره ⇒ درصد×۱۰۰ | fixed ریالِ علامत
// holiday_applies ⇒ شرط روز هفته نادیده گرفته می‌شود (الگوی تعطیل).

import React, { useEffect, useId, useState } from 'react'
import { Icon } from '@iconify/react'

import { MODIFIER_LABELS, WEEKDAYS_PY_ORDER, parseIntFa, timeToHHMM } from './shared'
import type { ModifierType, PricingRule, PricingRulePayload } from '@/services/pricing'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'

/** پیش‌پرکردن قانون تازه (مثلاً از پیشنهاد قیمت) — فقط وقتی rule=null معنا دارد */
export interface RuleDraft {
  day_of_week?: number | null
  start_time?: string | null
  end_time?: string | null
  modifier_type?: ModifierType
  value?: number
  label?: string
}

interface Props {
  open: boolean
  venueId: number
  rule: PricingRule | null
  draft?: RuleDraft | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: PricingRulePayload) => void
}

const DAY_CHIP = 'inline-flex min-h-9 items-center rounded-lg px-3 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const PricingRuleDialog: React.FC<Props> = ({ open, venueId, rule, draft = null, saving, onClose, onSubmit }) => {
  const [day, setDay] = useState<number | null>(null)
  const [holidayApplies, setHolidayApplies] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [modifierType, setModifierType] = useState<ModifierType>('percent')
  const [increase, setIncrease] = useState(true)
  const [amount, setAmount] = useState('')
  const [priority, setPriority] = useState('0')
  const [label, setLabel] = useState('')
  const [active, setActive] = useState(true)
  const [localError, setLocalError] = useState('')

  const holidayId = useId()
  const startId = useId()
  const endId = useId()
  const amountId = useId()
  const priorityId = useId()
  const labelId = useId()
  const activeId = useId()

  useEffect(() => {
    if (!open) return
    setLocalError('')
    if (rule) {
      setDay(rule.day_of_week)
      setHolidayApplies(rule.holiday_applies)
      setStartTime(rule.start_time ? rule.start_time.slice(0, 5) : '')
      setEndTime(rule.end_time ? rule.end_time.slice(0, 5) : '')
      setModifierType(rule.modifier_type)
      setIncrease(rule.value >= 0)
      setAmount(String(Math.abs(rule.modifier_type === 'percent' ? rule.value / 100 : rule.value)))
      setPriority(String(rule.priority))
      setLabel(rule.label)
      setActive(rule.is_active)
    } else {
      const dType = draft?.modifier_type ?? 'percent'
      const dValue = draft?.value
      setDay(draft?.day_of_week ?? null)
      setHolidayApplies(false)
      setStartTime(draft?.start_time ?? '')
      setEndTime(draft?.end_time ?? '')
      setModifierType(dType)
      setIncrease(dValue == null || dValue >= 0)
      setAmount(dValue == null ? '' : String(Math.abs(dType === 'percent' ? dValue / 100 : dValue)))
      setPriority('0')
      setLabel(draft?.label ?? '')
      setActive(true)
    }
  }, [open, rule, draft])

  const handleSubmit = () => {
    setLocalError('')
    const num = parseIntFa(amount)
    if (num === null || num === 0) {
      setLocalError('مقدار را وارد کنید (عددِ بدون صفر)')
      return
    }
    let payloadValue: number
    if (modifierType === 'percent') {
      if (Math.abs(num) > 100) {
        setLocalError('درصد باید بین ۰ تا ۱۰۰ باشد')
        return
      }
      payloadValue = Math.round(num * 100)
    } else {
      payloadValue = num
    }
    if (modifierType !== 'absolute') payloadValue = increase ? Math.abs(payloadValue) : -Math.abs(payloadValue)
    if (modifierType === 'absolute' && num < 0) {
      setLocalError('قیمت قطعی باید مثبت باشد')
      return
    }

    let st: string | null = null
    let et: string | null = null
    if (startTime) {
      st = timeToHHMM(startTime)
      if (!st) {
        setLocalError('ساعت شروع معتبر نیست (HH:MM)')
        return
      }
    }
    if (endTime) {
      et = timeToHHMM(endTime)
      if (!et) {
        setLocalError('ساعت پایان معتبر نیست (HH:MM)')
        return
      }
    }
    if (st && et && st >= et) {
      setLocalError('ساعت شروع باید قبل از پایان باشد')
      return
    }
    const pr = parseIntFa(priority) ?? 0

    onSubmit({
      venue_id: venueId,
      day_of_week: holidayApplies ? null : day,
      start_time: st,
      end_time: et,
      holiday_applies: holidayApplies,
      modifier_type: modifierType,
      value: payloadValue,
      priority: pr,
      label: label.trim(),
      is_active: active,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose()
      }}
    >
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-stone-900">
              <Icon icon="mdi:tag-percent" className="h-5 w-5" aria-hidden="true" />
            </span>
            <DialogTitle className="text-lg font-extrabold text-foreground">
              {rule ? 'ویرایش قانون قیمت' : 'قانون قیمت جدید'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Switch id={holidayId} checked={holidayApplies} onCheckedChange={setHolidayApplies} />
              <Label htmlFor={holidayId} className="cursor-pointer text-[0.68rem] font-semibold text-foreground">
                فقط در روزهای تعطیل اعمال شود (قانونِ تعطیل شرط روز هفته را نادیده می‌گیرد)
              </Label>
            </div>
            {!holidayApplies && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-pressed={day === null}
                  onClick={() => setDay(null)}
                  className={
                    day === null
                      ? `${DAY_CHIP} bg-blue-600 text-white`
                      : `${DAY_CHIP} border border-border bg-card text-foreground hover:bg-muted`
                  }
                >
                  همه روزها
                </button>
                {WEEKDAYS_PY_ORDER.map((d) => {
                  const selected = day === d.value
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDay(day === d.value ? null : d.value)}
                      className={
                        selected
                          ? `${DAY_CHIP} bg-blue-600 text-white`
                          : `${DAY_CHIP} border border-border bg-card text-foreground hover:bg-muted`
                      }
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={startId}>ساعت شروع بازه (اختیاری)</Label>
                <Input
                  id={startId}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="16:00"
                  dir="ltr"
                  className="tabular-nums"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={endId}>ساعت پایان بازه (اختیاری)</Label>
                <Input
                  id={endId}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="23:00"
                  dir="ltr"
                  className="tabular-nums"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
              بازه با پنجره‌ی سانس همپوشانی داشته باشد؛ خالی = کل روز (اثر پیک/آف‌پیک)
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex min-w-[160px] flex-col gap-1.5">
                <Label htmlFor="pricing-modifier-type">نوع اثر</Label>
                <Select value={modifierType} onValueChange={(v) => setModifierType(v as ModifierType)}>
                  <SelectTrigger id="pricing-modifier-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MODIFIER_LABELS) as ModifierType[]).map((t) => (
                      <SelectItem key={t} value={t}>{MODIFIER_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-[140px] flex-1 flex-col gap-1.5">
                <Label htmlFor={amountId}>{modifierType === 'percent' ? 'درصد' : 'مبلغ (ریال)'}</Label>
                <Input
                  id={amountId}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                  className="tabular-nums"
                />
              </div>
              {modifierType !== 'absolute' && (
                <div className="flex items-center gap-1 pb-0.5">
                  <button
                    type="button"
                    aria-pressed={increase}
                    onClick={() => setIncrease(true)}
                    className={
                      increase
                        ? `${DAY_CHIP} bg-blue-600 text-white`
                        : `${DAY_CHIP} border border-border bg-card text-foreground hover:bg-muted`
                    }
                  >
                    افزایش
                  </button>
                  <button
                    type="button"
                    aria-pressed={!increase}
                    onClick={() => setIncrease(false)}
                    className={
                      !increase
                        ? `${DAY_CHIP} bg-emerald-600 text-white`
                        : `${DAY_CHIP} border border-border bg-card text-foreground hover:bg-muted`
                    }
                  >
                    کاهش
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
              {modifierType === 'percent' && 'درصدی = گرانی/تخفیف نسبی روی قیمت لحظه‌ای؛ مبلغ در دیتابیس ×۱۰۰ ذخیره می‌شود.'}
              {modifierType === 'fixed' && 'مبلغ ثابت = اضافه/کم کردن ریالی به قیمت (مثلاً −۵۰٬۰۰۰ ریال).'}
              {modifierType === 'absolute' && 'قیمت قطعی = کل قیمت را با این مبلغ جایگزین می‌کند.'}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex w-[120px] flex-col gap-1.5">
              <Label htmlFor={priorityId}>اولویت</Label>
              <Input
                id={priorityId}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                inputMode="numeric"
                className="tabular-nums"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={labelId}>برچسب قانون</Label>
              <Input
                id={labelId}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثلاً: اوج پنجشنبه شب"
              />
            </div>
          </div>
          <p className="-mt-3 text-[0.68rem] text-muted-foreground">
            اعمال به ترتیب اولویت صعودی؛ اولویت بالاتر دیرتر اعمال می‌شود و برنده است
          </p>

          <div className="flex items-center gap-2">
            <Switch id={activeId} checked={active} onCheckedChange={setActive} />
            <Label htmlFor={activeId} className="cursor-pointer text-[0.68rem] font-semibold text-foreground">فعال</Label>
          </div>

          {localError && (
            <p role="alert" className="text-[0.68rem] font-semibold text-red-600 dark:text-red-400">{localError}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving} className="px-6">
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-br from-amber-600 to-amber-500 px-6 font-bold text-stone-900 hover:from-amber-700 hover:to-amber-600"
            >
              {rule ? 'ذخیره تغییرات' : 'افزودن قانون'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PricingRuleDialog
