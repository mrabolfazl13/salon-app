// frontend/src/components/team/TeamInviteDialog.tsx
// دعوت مستقیم به تیم — با شماره موبایل (کاربر ثبت‌نام‌شده) یا شناسه کاربری

import React, { useState } from 'react'

import { useInviteTeamMember } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import type { TeamInvitePayload } from '@/types/team'
import { getTeamError } from './shared'

interface Props {
  teamId: number
  open: boolean
  onClose: () => void
}

const EXPIRY_OPTIONS = [
  { value: 1, label: '۱ روز' },
  { value: 3, label: '۳ روز' },
  { value: 7, label: '۷ روز' },
  { value: 30, label: '۳۰ روز' },
]

const PHONE_RE = /^0\d{10}$/

const TeamInviteDialog: React.FC<Props> = ({ teamId, open, onClose }) => {
  const toast = useToast()
  const invite = useInviteTeamMember(teamId)

  const [byPhone, setByPhone] = useState(true)
  const [phone, setPhone] = useState('')
  const [userId, setUserId] = useState<number | ''>('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [fieldError, setFieldError] = useState('')

  const reset = () => {
    setPhone('')
    setUserId('')
    setFieldError('')
  }

  const handleInvite = () => {
    const payload: TeamInvitePayload = { expires_in_days: expiresInDays }
    if (byPhone) {
      const p = phone.trim()
      if (!PHONE_RE.test(p)) {
        setFieldError('شماره موبایل باید ۱۱ رقم و با ۰ شروع شود.')
        return
      }
      payload.phone = p
    } else {
      if (!userId || userId <= 0) {
        setFieldError('شناسه کاربر را وارد کنید.')
        return
      }
      payload.user_id = userId
    }
    invite.mutate(payload, {
      onSuccess: () => {
        toast.success('دعوت ارسال شد — پس از پذیرش، مخاطب عضو تیم می‌شود.')
        reset()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="دعوت به تیم" maxWidth="xs">
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-[0.68rem] text-muted-foreground">
          دعوت فقط برای کاربران ثبت‌نام‌شده ارسال می‌شود؛ پس از ارسال، دعوت در صفحه «تیم‌ها»ی مخاطب نمایش داده می‌شود.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-channel">دعوت از طریق</Label>
          <Select
            value={byPhone ? 'phone' : 'user_id'}
            onValueChange={(v) => {
              setByPhone(v === 'phone')
              setFieldError('')
            }}
          >
            <SelectTrigger id="invite-channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">شماره موبایل</SelectItem>
              <SelectItem value="user_id">شناسه کاربری</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {byPhone ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-phone">موبایل مخاطب</Label>
            <Input
              id="invite-phone"
              dir="ltr"
              inputMode="tel"
              maxLength={11}
              value={phone}
              error={fieldError && byPhone ? fieldError : undefined}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ''))
                setFieldError('')
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-user-id">شناسه کاربر</Label>
            <Input
              id="invite-user-id"
              type="number"
              value={userId}
              error={fieldError && !byPhone ? fieldError : undefined}
              onChange={(e) => {
                setUserId(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))
                setFieldError('')
              }}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-expiry">اعتبار دعوت</Label>
          <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(Number(v))}>
            <SelectTrigger id="invite-expiry">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

export default TeamInviteDialog
