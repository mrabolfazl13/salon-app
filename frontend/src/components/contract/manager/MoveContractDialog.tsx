// frontend/src/components/contract/manager/MoveContractDialog.tsx
// جابه‌جایی کل قرارداد — POST /contracts/{id}/move {day_of_week, start_time, end_time?}
// بک‌اند pre-check کامل دارد؛ در صورت تداخل ۴۰۰ با بدنه:
//   {code:"MOVE_HAS_COLLISIONS", message, collisions:[{to_date,to_time,collides_at}]}
// — همه تصادم‌ها اینلاین قبل از هیچ تغییر نمایش داده می‌شوند.

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { useMoveContract } from '@/hooks/useContracts'
import { extractError, pyDayNames, toPersianDigits } from '@/components/contract/shared'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
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
    <Dialog
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="جابه‌جایی کل قرارداد"
      titleIcon={<Icon icon="mdi:calendar-move" style={{ color: '#2563eb' }} />}
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
            {mutation.isPending ? 'بررسی تداخل...' : 'انتقال کل برنامه'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {`برنامه فعلی: ${pyDayNames[contract.day_of_week] ?? '—'} ساعت ${(contract.start_time || '').slice(0, 5)} — همه سانس‌های آینده به همان شیفت هفته منتقل می‌شوند.`}
        </p>

        {moveError && (
          <Alert variant="warning">
            <AlertDescription>
              <p className="text-sm font-bold">{moveError.message}</p>
              {moveError.collisions.length > 0 && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {moveError.collisions.slice(0, 8).map((c, i) => (
                    <span key={i} dir="ltr" className="block text-end text-xs">
                      {`→ ${c.to_date} ${c.to_time?.slice(0, 5)} — تداخل با ${c.collides_at}`}
                    </span>
                  ))}
                  {moveError.collisions.length > 8 && (
                    <span className="text-xs">… و {toPersianDigits(moveError.collisions.length - 8)} مورد دیگر</span>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="move-day">روز جدید هفته</Label>
          <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
            <SelectTrigger id="move-day" className="h-11">
              <SelectValue placeholder="روز جدید هفته" />
            </SelectTrigger>
            <SelectContent>
              {pyDayNames.map((name, idx) => (
                <SelectItem key={name} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="move-start-time">ساعت شروع</Label>
            <Input
              id="move-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="move-end-time">ساعت پایان (اختیاری)</Label>
            <Input
              id="move-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default MoveContractDialog
