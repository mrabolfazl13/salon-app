// frontend/src/components/pricing/CouponDialog.tsx
// ساخت/ویرایش کد تخفیف — percent در دیتا ×۱۰۰ ذخیره می‌شود؛ venue_id=null سراسری
// (ساختش فقط سرپرست؛ ویرایش سراسری هم فقط سرپرست).

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { toPersianDigits } from '@/lib/jalali'
import type { Coupon, CouponCreatePayload, CouponType, CouponUpdatePayload } from '@/services/coupons'
import type { FinanceVenue } from '@/hooks/useFinance'
import { parseIntFa } from './shared'

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

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } } as const

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'hidden' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #db2777, #f472b6)', px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:ticket-percent-outline" className="h-5 w-5" />
          {isEdit ? `ویرایش ${coupon?.code}` : 'کد تخفیف جدید'}
        </Typography>
      </Box>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
        {!isEdit && (
          <TextField
            label="کد تخفیف"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            fullWidth
            placeholder="مثلاً: نوروز۱۴۰۵"
            dir="auto"
            sx={inputSx}
          />
        )}

        {!isEdit ? (
          isSuper ? (
            <FormControl size="small" fullWidth>
              <InputLabel>دامنه اعمال</InputLabel>
              <Select
                label="دامنه اعمال"
                value={scope}
                onChange={(e) => {
                  const v = e.target.value as 'venue' | 'global'
                  setScope(v)
                  if (v === 'venue' && targetVenue === '') setTargetVenue(venueId ?? venues[0]?.id ?? '')
                }}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="venue">فقط یک سالن مشخص</MenuItem>
                <MenuItem value="global">سراسری (همه سالن‌ها)</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Chip size="small" label={venueId ? `اعمال: ${venues.find((v) => v.id === venueId)?.name ?? 'سالن انتخابی'}` : 'سالن انتخابی'} sx={{ alignSelf: 'flex-start', borderRadius: '10px', fontWeight: 600 }} />
          )
        ) : (
          <Chip size="small" label={coupon?.venue_id == null ? 'دامنه: سراسری' : `دامنه: ${venues.find((v) => v.id === coupon?.venue_id)?.name ?? 'سالن'}`} sx={{ alignSelf: 'flex-start', borderRadius: '10px', fontWeight: 600 }} />
        )}

        {scope === 'venue' && !isEdit && venues.length > 1 && (
          <FormControl size="small" fullWidth>
            <InputLabel>سالن اعمال</InputLabel>
            <Select label="سالن اعمال" value={targetVenue} onChange={(e) => setTargetVenue(e.target.value as number)} sx={{ borderRadius: '10px' }}>
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>نوع تخفیف</InputLabel>
            <Select label="نوع تخفیف" value={discountType} onChange={(e) => setDiscountType(e.target.value as CouponType)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="percent">درصدی</MenuItem>
              <MenuItem value="fixed">مبلغ ثابت (ریال)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={discountType === 'percent' ? 'درصد' : 'مبلغ تخفیف (ریال)'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            inputMode="numeric"
            sx={{ flex: 1, minWidth: 140, ...inputSx }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField label="سقف مجموع استفاده (خالی = نامحدود)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} size="small" inputMode="numeric" sx={{ flex: 1, minWidth: 150, ...inputSx }} />
          <TextField label={`سقف هر کاربر (خالی = نامحدود، پیش‌فرض ${toPersianDigits(1)})`} value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} size="small" inputMode="numeric" sx={{ flex: 1, minWidth: 150, ...inputSx }} />
        </Box>
        <TextField label="حداقل مبلغ رزرو برای اعمال (ریال)" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} size="small" inputMode="numeric" sx={inputSx} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <PersianDatePicker label="اعتبار از" value={validFrom} onChange={setValidFrom} size="small" sx={inputSx} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <PersianDatePicker label="اعتبار تا" value={validUntil} onChange={setValidUntil} size="small" min={validFrom || undefined} sx={inputSx} />
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: '-12px' }}>خالی‌گذاری = بدون محدودیت زمانی. سرور این تاریخ‌ها را به میلادی تبدیل و ذخیره می‌کند.</Typography>

        {isEdit && (
          <FormControlLabel control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>کد فعال باشد</Typography>} />
        )}

        {localError && <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>{localError}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}>انصراف</Button>
        <Button onClick={submit} variant="contained" disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #db2777, #f472b6)' }}>
          {isEdit ? 'ذخیره تغییرات' : 'ایجاد کد'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CouponDialog