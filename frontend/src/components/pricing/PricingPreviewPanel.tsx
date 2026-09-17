// frontend/src/components/pricing/PricingPreviewPanel.tsx
// «پیش‌نمایش» موتور قیمت — POST /pricing/preview همان مسیرِ لحظه‌ی رزرو را اجرا
// می‌کند: مبنای سالن + زنجیره‌ی قوانینِ منطبق → قیمت نهایی. محاسباتی است، ذخیره نمی‌کند.

import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { extractError, formatRial } from '@/components/finance/shared'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import { usePricingPreview } from '@/hooks/usePricing'
import { MODIFIER_LABELS, faTime, parseIntFa, timeToHHMM } from './shared'
import type { PricingPreview } from '@/services/pricing'

interface Props {
  venueId: number
}

const PricingPreviewPanel: React.FC<Props> = ({ venueId }) => {
  const [date, setDate] = useState(getTodayISO())
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState('90')
  const [baseOverride, setBaseOverride] = useState('')
  const [result, setResult] = useState<PricingPreview | null>(null)
  const preview = usePricingPreview()

  const run = () => {
    setResult(null)
    if (!date) {
      toast.error('تاریخ را انتخاب کنید')
      return
    }
    const st = timeToHHMM(time)
    if (!st) {
      toast.error('ساعت را به شکل ۱۸:۳۰ وارد کنید')
      return
    }
    const dur = parseIntFa(duration)
    if (!dur || dur < 15 || dur > 240) {
      toast.error('مدت باید بین ۱۵ تا ۲۴۰ دقیقه باشد')
      return
    }
    let base: number | null = null
    if (baseOverride.trim()) {
      const b = parseIntFa(baseOverride)
      if (b === null || b < 0) {
        toast.error('مبنای دلخواه نامعتبر است')
        return
      }
      base = b
    }
    preview.mutate(
      { venue_id: venueId, slot_date: date, start_time: st, base_price: base, duration: dur },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => toast.error(extractError(err, 'خطا در پیش‌نمایش قیمت')),
      },
    )
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(37,99,235,0.18)',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(124,58,237,0.04))',
        p: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Icon icon="mdi:eye-outline" className="h-5 w-5" style={{ color: '#2563eb' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>پیش‌نمایش قیمت — همان موتور لحظه‌ی رزرو</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 180px', minWidth: 170 }}>
          <PersianDatePicker label="تاریخ" value={date} onChange={setDate} size="small" clearable={false} />
        </Box>
        <TextField
          label="ساعت شروع"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          size="small"
          dir="ltr"
          sx={{ flex: '0 1 120px', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Box sx={{ flex: '0 1 130px' }}>
          <FormControl size="small" fullWidth>
          <InputLabel id="pp-duration-label">مدت (دقیقه)</InputLabel>
          <Select labelId="pp-duration-label" label="مدت (دقیقه)" value={duration} onChange={(e) => setDuration(e.target.value)} sx={{ borderRadius: '10px', width: '100%' }}>
            {[60, 75, 90, 120].map((d) => (
              <MenuItem key={d} value={String(d)}>{toPersianDigits(d)}</MenuItem>
            ))}
          </Select>
          </FormControl>
        </Box>
        <TextField
          label="مبنای دلخواه (ریال)"
          value={baseOverride}
          onChange={(e) => setBaseOverride(e.target.value)}
          size="small"
          placeholder="خالی = پیش‌فرض سالن"
          sx={{ flex: '1 1 150px', minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Button
          variant="contained"
          onClick={run}
          disabled={preview.isPending}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, alignSelf: 'flex-end', height: 40, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          startIcon={preview.isPending ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:calculator-variant-outline" className="h-4 w-4" />}
        >
          محاسبه
        </Button>
      </Box>

      {result && (
        <Box sx={{ mt: 2.5 }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip size="small" label={`مبنا: ${formatRial(result.base_price)}`} sx={{ borderRadius: '8px', fontWeight: 600 }} />
            <Chip size="small" label={`زمان بررسی: ${toPersianDigits(result.slot_date)} — ${faTime(result.start_time)}`} sx={{ borderRadius: '8px' }} />
            {result.is_holiday && (
              <Chip size="small" color="warning" label="این تاریخ تعطیل است 🔔" sx={{ borderRadius: '8px', fontWeight: 700 }} />
            )}
          </Box>
          {result.rules.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>هیچ قانونی روی این سانس اعمال نشد — قیمت = مبنا.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>زنجیره‌ی قوانین اعمال‌شده (به ترتیب اجرا):</Typography>
              {result.rules.map((r, idx) => (
                <Box
                  key={`${r.rule_id}-${idx}`}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1.5, py: 0.75, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.05)' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Icon icon="mdi:tag-outline" style={{ width: 15, height: 15, color: '#2563eb', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
                      {r.label || `قانون #${toPersianDigits(r.rule_id)}`}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${MODIFIER_LABELS[r.modifier_type] ?? r.modifier_type} ${toPersianDigits(Math.abs(r.modifier_type === 'percent' ? r.value / 100 : r.value))}${r.modifier_type === 'percent' ? '٪' : ' ریال'}`}
                      sx={{ height: 20, fontSize: '0.65rem', borderRadius: '6px', flexShrink: 0 }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    dir="rtl"
                    sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: r.delta > 0 ? '#dc2626' : r.delta < 0 ? '#059669' : '#6b7280' }}
                  >
                    {r.delta >= 0 ? '+' : '−'}{formatRial(Math.abs(r.delta))}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ mt: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(5,150,105,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065f46' }}>قیمت نهایی این سانس</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{formatRial(result.final_price)}</Typography>
          </Box>
          {preview.isPending && <LoadingBoxCompact />}
        </Box>
      )}
    </Box>
  )
}

const LoadingBoxCompact: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
    <CircularProgress size={20} sx={{ color: '#2563eb' }} />
  </Box>
)

export default PricingPreviewPanel