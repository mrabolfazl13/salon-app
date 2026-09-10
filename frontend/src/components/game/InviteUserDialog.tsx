// frontend/src/components/game/InviteUserDialog.tsx
// دعوت مستقیم کاربر به بازی — با شناسه‌ی کاربری (جستجوی کاربر در دسترس عموم نیست)

import React, { useState } from 'react'
import { Box, Typography, TextField, MenuItem } from '@mui/material'
import { Icon } from '@iconify/react'

import { useGameInvitations, useInviteUser } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          شناسه‌ی کاربری مخاطب را وارد کنید؛ پس از ارسال، دعوت در بخش «دعوت‌نامه‌های من» برای او نمایش داده می‌شود.
        </Typography>
        <TextField
          label="شناسه کاربر"
          size="small"
          type="number"
          required
          fullWidth
          value={userId}
          onChange={(e) => setUserId(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
        />
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
        {pending.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              دعوت‌های در انتظار پاسخ ({pending.length.toLocaleString('fa-IR')})
            </Typography>
            {pending.map((inv) => (
              <Box key={inv.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon="mdi:email-clock-outline" style={{ color: '#b45309', fontSize: 16 }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
                  {inv.invited_user_name || `کاربر #${inv.invited_user_id}`}
                </Typography>
                {inv.expires_at && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {formatGameDateTime(inv.expires_at.slice(0, 10), inv.expires_at.slice(11, 16))}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
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

export default InviteUserDialog
