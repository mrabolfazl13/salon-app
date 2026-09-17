// frontend/src/components/team/TeamInviteDialog.tsx
// دعوت مستقیم به تیم — با شماره موبایل (کاربر ثبت‌نام‌شده) یا شناسه کاربری

import React, { useState } from 'react'
import { Box, MenuItem, TextField, Typography } from '@mui/material'

import { useInviteTeamMember } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          دعوت فقط برای کاربران ثبت‌نام‌شده ارسال می‌شود؛ پس از ارسال، دعوت در صفحه «تیم‌ها»ی مخاطب نمایش داده می‌شود.
        </Typography>
        <TextField
          select
          label="دعوت از طریق"
          size="small"
          value={byPhone ? 'phone' : 'user_id'}
          onChange={(e) => {
            setByPhone(e.target.value === 'phone')
            setFieldError('')
          }}
        >
          <MenuItem value="phone">شماره موبایل</MenuItem>
          <MenuItem value="user_id">شناسه کاربری</MenuItem>
        </TextField>
        {byPhone ? (
          <TextField
            label="موبایل مخاطب"
            size="small"
            fullWidth
            slotProps={{ htmlInput: { dir: 'ltr', maxLength: 11 } }}
            value={phone}
            error={!!fieldError && byPhone}
            helperText={fieldError && byPhone ? fieldError : undefined}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''))
              setFieldError('')
            }}
          />
        ) : (
          <TextField
            label="شناسه کاربر"
            size="small"
            type="number"
            fullWidth
            value={userId}
            error={!!fieldError && !byPhone}
            helperText={fieldError && !byPhone ? fieldError : undefined}
            onChange={(e) => {
              setUserId(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))
              setFieldError('')
            }}
          />
        )}
        <TextField
          select
          label="اعتبار دعوت"
          size="small"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(Number(e.target.value))}
        >
          {EXPIRY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={invite.isPending}>
            انصراف
          </Button>
          <Button variant="gradient" onClick={handleInvite} loading={invite.isPending} icon="mdi:email-fast-outline">
            ارسال دعوت
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default TeamInviteDialog
