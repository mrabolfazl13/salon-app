// frontend/src/components/contract/manager/SessionRescheduleDialog.tsx
// جابه‌جایی یک سانس — POST reschedule; تداخل 409 / سانس گذشته 400 فارسی بک‌اند
// اینلاین روی همان دیالوگ نمایش داده می‌شود.

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { useRescheduleSession } from '@/hooks/useContracts'
import { effectiveSession, extractError } from '@/components/contract/shared'
import type { ContractSessionData } from '@/services/contract'

interface Props {
  open: boolean
  onClose: () => void
  contractId: number
  session: ContractSessionData | null
}

const SessionRescheduleDialog: React.FC<Props> = ({ open, onClose, contractId, session }) => {
  const mutation = useRescheduleSession(contractId)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dateErr, setDateErr] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (open && session) {
      const eff = effectiveSession(session)
      setDate(eff.date)
      setTime((eff.time || '').slice(0, 5))
      setDateErr(null)
      setServerError(null)
    }
  }, [open, session])

  if (!session) return null
  const eff = effectiveSession(session)

  const submit = async () => {
    setServerError(null)
    setDateErr(null)
    if (!date) { setDateErr('تاریخ جدید را انتخاب کنید'); return }
    if (!/^\d{2}:\d{2}/.test(time)) { setDateErr('ساعت جدید را وارد کنید'); return }
    if (date === eff.date && time === (eff.time || '').slice(0, 5)) {
      setDateErr('تاریخ و ساعت جدید با فعلی یکسان است')
      return
    }
    try {
      await mutation.mutateAsync({ csId: session.id, new_date: date, new_time: time })
      toast.success('سانس جابه‌جا شد — طرف مقابل مطلع می‌شود')
      onClose()
    } catch (err) {
      setServerError(extractError(err, 'جابه‌جایی سانس ناموفق بود'))
    }
  }

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:calendar-sync" style={{ color: '#d97706' }} />
          جابه‌جایی سانس
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Typography variant="body2" color="text.secondary">
          {`وضعیت فعلی: ${session.status === 'rescheduled' ? `جابه‌جایی‌شده از ${eff.date} — ` : ''}${eff.time?.slice(0, 5)} به مدت ${session.duration} دقیقه`}
        </Typography>
        {serverError && <Alert severity="warning" sx={{ borderRadius: '12px' }}>{serverError}</Alert>}
        <PersianDatePicker
          label="تاریخ جدید"
          value={date}
          onChange={setDate}
          error={Boolean(dateErr)}
          helperText={dateErr}
        />
        <TextField
          label="ساعت جدید"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
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
          {mutation.isPending ? 'در حال ثبت...' : 'جابه‌جایی'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SessionRescheduleDialog