// frontend/src/components/game/InviteUserDialog.tsx
// دعوت مستقیم کاربر به بازی — با شناسه‌ی کاربری (جستجوی کاربر در دسترس عموم نیست)

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'

import { useGameInvitations, useInviteUser } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import { formatGameDateTime, getGameError } from './shared'

interface Props {
  gameId: number
  open: boolean
  onClose: () => void
}

const EXPIRY_OPTIONS = [
  { value: 1, label: '۱ روز' },
  { value: 3, label: '۳ روز' },
  { value: 7, label: '۷ روز' },
  { value: 30, label: '۳۰ روز' },
]

const InviteUserDialog: React.FC<Props> = ({ gameId, open, onClose }) => {
  const toast = useToast()
  const invite = useInviteUser(gameId)
  const invitationsQ = useGameInvitations(open ? gameId : null)
  const pending = (invitationsQ.data ?? []).filter((inv) => inv.status === 'pending')

  const [userId, setUserId] = useState<number | ''>('')
  const [expiresInDays, setExpiresInDays] = useState<number>(7)
  const userIdInputId = useId()
  const expiryLabelId = useId()

  const handleInvite = () => {
    if (!userId || userId <= 0) {
      toast.error('شناسه‌ی کاربر را وارد کنید.')
      return
    }
    invite.mutate(
      { user_id: userId, expires_in_days: expiresInDays },
      {
        onSuccess: () => {
          toast.success('دعوت ارسال شد')
          setUserId('')
        },
        onError: (err) => toast.error(getGameError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title="دعوت مستقیم بازیکن" maxWidth="xs">
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          شناسه‌ی کاربری مخاطب را وارد کنید؛ پس از ارسال، دعوت در بخش «دعوت‌نامه‌های من» برای او نمایش داده می‌شود.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={userIdInputId}>
            شناسه کاربر <span className="text-red-600">*</span>
          </Label>
          <Input
            id={userIdInputId}
            type="number"
            inputMode="numeric"
            min={1}
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label id={expiryLabelId}>اعتبار دعوت</Label>
          <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(Number(v))}>
            <SelectTrigger aria-labelledby={expiryLabelId} className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pending.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-muted-foreground">
              دعوت‌های در انتظار پاسخ ({pending.length.toLocaleString('fa-IR')})
            </p>
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2">
                <Icon icon="mdi:email-clock-outline" style={{ color: '#b45309', fontSize: 16 }} />
                <p className="text-[0.78rem] font-semibold text-foreground">
                  {inv.invited_user_name || `کاربر #${inv.invited_user_id}`}
                </p>
                {inv.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatGameDateTime(inv.expires_at.slice(0, 10), inv.expires_at.slice(11, 16))}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={invite.isPending}>
            انصراف
          </Button>
          <Button variant="gradient" onClick={handleInvite} loading={invite.isPending} icon="mdi:email-fast-outline">
            ارسال دعوت
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default InviteUserDialog
