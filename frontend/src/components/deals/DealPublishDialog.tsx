// frontend/src/components/deals/DealPublishDialog.tsx
// انتشار سانس‌های انتخابی به‌عنوان «سانس لحظه آخری» — POST /deals/publish.
// اگر سانس‌ها چند سالن را پوشش دهند، به تفکیک سالن منتشر می‌شود (هر فراخوان یک venue_id).

import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import { extractError, faNum } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import { dealService } from '@/services/deals'
import { parseIntFa } from '@/components/pricing/shared'

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
      setLocalError('قیمت دیل (ریال) نامعتبر است')
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
    <Dialog open={open} onClose={busy ? undefined : close} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'hidden' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:lightning-bolt" className="h-5 w-5" />
          عرضه به‌عنوان تخفیف‌دار
        </Typography>
      </Box>
      <DialogContent sx={{ pt: '24px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {toPersianDigits(slots.length)} سانس انتخابی — قیمت نهایی توسط سرور کنترل می‌شود و حتماً باید ارزان‌تر از قیمت مصوب قوانین باشد.
          به کاربرانِ «علاقه‌مندی + اشتراک تخفیف» همان سالن اعلان می‌رود.
        </Typography>
        {grouped.length > 1 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {grouped.map(([vid, ss]) => (
              <Chip key={vid} size="small" label={`${venueNameOf(vid)} — ${toPersianDigits(ss.length)} سانس`} sx={{ borderRadius: '8px', fontSize: '0.75rem' }} />
            ))}
          </Box>
        )}

        <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v as 'percent' | 'price')} size="small" fullWidth sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px !important' } }}>
          <ToggleButton value="percent">درصد تخفیف</ToggleButton>
          <ToggleButton value="price">قیمت نهایی (ریال)</ToggleButton>
        </ToggleButtonGroup>

        {mode === 'percent' ? (
          <TextField label="درصد تخفیف (۱ تا ۹۹)" value={percent} onChange={(e) => setPercent(e.target.value)} size="small" inputMode="numeric" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
        ) : (
          <TextField label="قیمت نهایی سانس (ریال)" value={price} onChange={(e) => setPrice(e.target.value)} size="small" inputMode="numeric" helperText="یک قیمت برای همه سانس‌های انتخابی؛ سانس‌های گران‌تر که این قیمت از آنها بیشتر باشد رد می‌شوند" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
        )}

        <FormControl size="small" fullWidth>
          <InputLabel id="dp-expiry-label">اعتبار تخفیف</InputLabel>
          <Select labelId="dp-expiry-label" label="اعتبار تخفیف" value={expiry} onChange={(e) => setExpiry(e.target.value)} sx={{ borderRadius: '10px' }}>
            {EXPIRY_OPTIONS.map((m) => (
              <MenuItem key={m} value={String(m)}>
                {m >= 1440 ? `${faNum(m / 1440)} روز` : m >= 60 ? `${faNum(m / 60)} ساعت` : `${faNum(m)} دقیقه`}
              </MenuItem>
            ))}
            <MenuItem value="">بدون مهلت (تا شروع سانس)</MenuItem>
          </Select>
        </FormControl>

        {localError && <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>{localError}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={close} disabled={busy} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none' }}>انصراف</Button>
        <Button onClick={submit} variant="contained" disabled={busy || slots.length === 0} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
          {busy ? 'در حال انتشار…' : 'انتشار 🔥'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DealPublishDialog