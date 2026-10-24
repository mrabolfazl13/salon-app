// frontend/src/components/contract/manager/SessionRescheduleDialog.tsx
// جابه‌جایی یک سانس — POST reschedule; تداخل 409 / سانس گذشته 400 فارسی بک‌اند
// اینلاین روی همان دیالوگ نمایش داده می‌شود.

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { formatDate, formatTimeFa } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
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
    <Dialog
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="جابه‌جایی سانس"
      titleIcon={<Icon icon="mdi:calendar-sync" style={{ color: '#d97706' }} />}
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl px-4"
          >
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={mutation.isPending}
            className="rounded-xl font-bold"
          >
            {mutation.isPending ? 'در حال ثبت...' : 'جابه‌جایی'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {`وضعیت فعلی: ${session.status === 'rescheduled' ? `جابه‌جایی‌شده از ${formatDate(eff.date)} — ` : ''}${formatTimeFa(eff.time)} به مدت ${toPersianDigits(session.duration)} دقیقه`}
        </p>
        {serverError && (
          <Alert variant="warning">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <PersianDatePicker
          label="تاریخ جدید"
          value={date}
          onChange={setDate}
          error={Boolean(dateErr)}
          helperText={dateErr}
        />
        <div className="space-y-1.5">
          <Label htmlFor="session-reschedule-time">ساعت جدید</Label>
          <Input
            id="session-reschedule-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    </Dialog>
  )
}

export default SessionRescheduleDialog
