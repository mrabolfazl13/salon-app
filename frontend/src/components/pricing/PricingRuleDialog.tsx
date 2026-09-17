// frontend/src/components/pricing/PricingRuleDialog.tsx
// ساخت/ویرایش قانون قیمت — ترجمه UI به قرارداد بک‌اند:
// day_of_week = weekday پایتون | percent ذخیره ⇒ درصد×۱۰۰ | fixed ریالِ علامत
// holiday_applies ⇒ شرط روز هفته نادیده گرفته می‌شود (الگوی تعطیل).

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

import { MODIFIER_LABELS, WEEKDAYS_PY_ORDER, parseIntFa, timeToHHMM } from './shared'
import type { ModifierType, PricingRule, PricingRulePayload } from '@/services/pricing'

interface Props {
  open: boolean
  venueId: number
  rule: PricingRule | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: PricingRulePayload) => void
}

const PricingRuleDialog: React.FC<Props> = ({ open, venueId, rule, saving, onClose, onSubmit }) => {
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
      setDay(null)
      setHolidayApplies(false)
      setStartTime('')
      setEndTime('')
      setModifierType('percent')
      setIncrease(true)
      setAmount('')
      setPriority('0')
      setLabel('')
      setActive(true)
    }
  }, [open, rule])

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
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:tag-percent" className="h-5 w-5" />
          {rule ? 'ویرایش قانون قیمت' : 'قانون قیمت جدید'}
        </Typography>
      </Box>
      <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <FormControlLabel
            control={<Switch checked={holidayApplies} onChange={(e) => setHolidayApplies(e.target.checked)} />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                فقط در روزهای تعطیل اعمال شود (قانونِ تعطیل شرط روز هفته را نادیده می‌گیرد)
              </Typography>
            }
            sx={{ mb: holidayApplies ? 0 : 1 }}
          />
          {!holidayApplies && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              <Chip
                label="همه روزها"
                size="small"
                color={day === null ? 'primary' : 'default'}
                variant={day === null ? 'filled' : 'outlined'}
                onClick={() => setDay(null)}
                sx={{ borderRadius: '8px', fontWeight: 600 }}
              />
              {WEEKDAYS_PY_ORDER.map((d) => (
                <Chip
                  key={d.value}
                  label={d.label}
                  size="small"
                  color={day === d.value ? 'primary' : 'default'}
                  variant={day === d.value ? 'filled' : 'outlined'}
                  onClick={() => setDay(day === d.value ? null : d.value)}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="ساعت شروع بازه (اختیاری)"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="16:00"
            size="small"
            dir="ltr"
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            label="ساعت پایان بازه (اختیاری)"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="23:00"
            size="small"
            dir="ltr"
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
          بازه با پنجره‌ی سانس همپوشانی داشته باشد؛ خالی = کل روز (اثر پیک/آف‌پیک)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>نوع اثر</InputLabel>
            <Select label="نوع اثر" value={modifierType} onChange={(e) => setModifierType(e.target.value as ModifierType)} sx={{ borderRadius: '10px' }}>
              {(Object.keys(MODIFIER_LABELS) as ModifierType[]).map((t) => (
                <MenuItem key={t} value={t}>{MODIFIER_LABELS[t]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={modifierType === 'percent' ? 'درصد' : 'مبلغ (ریال)'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            type="text"
            inputMode="numeric"
            sx={{ flex: 1, minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          {modifierType !== 'absolute' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
              <Chip label="افزایش" size="small" color={increase ? 'primary' : 'default'} variant={increase ? 'filled' : 'outlined'} onClick={() => setIncrease(true)} sx={{ borderRadius: '8px', fontWeight: 600 }} />
              <Chip label="کاهش" size="small" color={!increase ? 'success' : 'default'} variant={!increase ? 'filled' : 'outlined'} onClick={() => setIncrease(false)} sx={{ borderRadius: '8px', fontWeight: 600 }} />
            </Box>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
          {modifierType === 'percent' && 'درصدی = گرانی/تخفیف نسبی روی قیمت لحظه‌ای؛ مبلغ در دیتابیس ×۱۰۰ ذخیره می‌شود.'}
          {modifierType === 'fixed' && 'مبلغ ثابت = اضافه/کم کردن ریالی به قیمت (مثلاً −۵۰٬۰۰۰ ریال).'}
          {modifierType === 'absolute' && 'قیمت قطعی = کل قیمت را با این مبلغ جایگزین می‌کند.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="اولویت"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            size="small"
            type="text"
            inputMode="numeric"
            helperText="اعمال به ترتیب اولویت صعودی؛ اولویت بالاتر دیرتر اعمال می‌شود و برنده است"
            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            label="برچسب قانون"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            size="small"
            fullWidth
            placeholder="مثلاً: اوج پنجشنبه شب"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>

        <FormControlLabel control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>فعال</Typography>} />

        {localError && (
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>{localError}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}>انصراف</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          {rule ? 'ذخیره تغییرات' : 'افزودن قانون'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PricingRuleDialog