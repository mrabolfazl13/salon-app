// frontend/src/components/contract/manager/MoveContractDialog.tsx
// جابه‌جایی کل قرارداد — POST /contracts/{id}/move {day_of_week, start_time, end_time?}
// بک‌اند pre-check کامل دارد؛ در صورت تداخل ۴۰۰ با بدنه:
//   {code:"MOVE_HAS_COLLISIONS", message, collisions:[{to_date,to_time,collides_at}]}
// — همه تصادم‌ها اینلاین قبل از هیچ تغییر نمایش داده می‌شوند.

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { useMoveContract } from '@/hooks/useContracts'
import { extractError, pyDayNames, toPersianDigits } from '@/components/contract/shared'
import type { ContractData, ContractMoveCollision } from '@/services/contract'

interface Props {
  open: boolean
  onClose: () => void
  contract: ContractData | null
}

interface MoveError {
  message: string
  collisions: ContractMoveCollision[]
}

function parseMoveError(err: unknown): MoveError {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const d = detail as { message?: string; collisions?: ContractMoveCollision[] }
    if (d.message || d.collisions) {
      return { message: d.message || 'جابه‌جایی ممکن نیست', collisions: d.collisions || [] }
    }
  }
  return { message: extractError(err, 'جابه‌جایی قرارداد ناموفق بود'), collisions: [] }
}

const MoveContractDialog: React.FC<Props> = ({ open, onClose, contract }) => {
  const mutation = useMoveContract(contract?.id ?? 0)
  const [day, setDay] = useState<number>(0)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [moveError, setMoveError] = useState<MoveError | null>(null)

  useEffect(() => {
    if (open && contract) {
      setDay(contract.day_of_week)
      setStartTime((contract.start_time || '').slice(0, 5))
      setEndTime('')
      setMoveError(null)
    }
  }, [open, contract])

  if (!contract) return null

  const submit = async () => {
    setMoveError(null)
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      setMoveError({ message: 'ساعت شروع را وارد کنید', collisions: [] })
      return
    }
    if (endTime && endTime <= startTime) {
      setMoveError({ message: 'ساعت پایان باید بعد از ساعت شروع باشد', collisions: [] })
      return
    }
    try {
      const res = await mutation.mutateAsync({
        day_of_week: day,
        start_time: startTime,
        end_time: endTime || null,
      })
      toast.success(`${toPersianDigits(res.moved_sessions)} سانس آینده جابه‌جا شد`)
      onClose()
    } catch (err) {
      setMoveError(parseMoveError(err))
    }
  }

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:calendar-move" style={{ color: '#2563eb' }} />
          جابه‌جایی کل قرارداد
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Typography variant="body2" color="text.secondary">
          {`برنامه فعلی: ${pyDayNames[contract.day_of_week] ?? '—'} ساعت ${(contract.start_time || '').slice(0, 5)} — همه سانس‌های آینده به همان شیفت هفته منتقل می‌شوند.`}
        </Typography>

        {moveError && (
          <Alert severity="warning" sx={{ borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{moveError.message}</Typography>
            {moveError.collisions.length > 0 && (
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {moveError.collisions.slice(0, 8).map((c, i) => (
                  <Typography key={i} variant="caption" sx={{ display: 'block' }} dir="ltr" style={{ textAlign: 'right' }}>
                    {`→ ${c.to_date} ${c.to_time?.slice(0, 5)} — تداخل با ${c.collides_at}`}
                  </Typography>
                ))}
                {moveError.collisions.length > 8 && (
                  <Typography variant="caption">… و {toPersianDigits(moveError.collisions.length - 8)} مورد دیگر</Typography>
                )}
              </Box>
            )}
          </Alert>
        )}

        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
          <InputLabel>روز جدید هفته</InputLabel>
          <Select label="روز جدید هفته" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {pyDayNames.map((name, idx) => (
              <MenuItem key={name} value={idx}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            label="ساعت شروع"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            label="ساعت پایان (اختیاری)"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={mutation.isPending} sx={{ textTransform: 'none', borderRadius: '10px' }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={mutation.isPending}
          sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
        >
          {mutation.isPending ? 'بررسی تداخل...' : 'انتقال کل برنامه'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MoveContractDialog