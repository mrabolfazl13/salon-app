// frontend/src/components/game/JoinRequestList.tsx
// درخواست‌های پیوستن در انتظار تأیید (بازی‌های «عمومی با تأیید») — تأیید/رد توسط مدیر

import React from 'react'
import { Icon } from '@iconify/react'
import { Box, Avatar, Typography, IconButton, Tooltip } from '@mui/material'

import type { JoinRequest } from '@/types/game'
import { useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { formatPersianDateTime, getInitials } from '@/utils/helpers'
import { getGameError } from './shared'

interface Props {
  gameId: number
  requests: JoinRequest[]
}

const JoinRequestList: React.FC<Props> = ({ gameId, requests }) => {
  const toast = useToast()
  const approve = useApproveJoinRequest(gameId)
  const reject = useRejectJoinRequest(gameId)
  const busy = approve.isPending || reject.isPending

  const handleDecide = (req: JoinRequest, accept: boolean) => {
    const mutation = accept ? approve : reject
    mutation.mutate(req.id, {
      onSuccess: () => toast.success(accept ? 'درخواست تأیید شد' : 'درخواست رد شد'),
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  if (requests.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 1 }}>
        درخواست در انتظاری وجود ندارد.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {requests.map((req) => (
        <Box
          key={req.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1.25,
            borderRadius: '16px',
            border: '1px solid rgba(245,158,11,0.25)',
            bgcolor: 'rgba(245,158,11,0.05)',
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(245,158,11,0.15)', color: '#b45309', fontSize: '0.85rem', fontWeight: 700 }}>
            {getInitials(req.full_name || '؟')}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }} noWrap>
              {req.full_name || `کاربر ${req.user_id}`}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.25 }} noWrap>
              {`ثبت: ${formatPersianDateTime(req.created_at)}${req.message ? ` - ${req.message}` : ''}`}
            </Typography>
          </Box>
          <Tooltip title="تأیید و افزودن به بازی">
            <IconButton
              size="small"
              disabled={busy}
              onClick={() => handleDecide(req, true)}
              sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#059669', '&:hover': { bgcolor: 'rgba(16,185,129,0.2)' } }}
            >
              <Icon icon="mdi:check-bold" style={{ width: 18, height: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="رد درخواست">
            <IconButton
              size="small"
              disabled={busy}
              onClick={() => handleDecide(req, false)}
              sx={{ bgcolor: 'rgba(239,68,68,0.10)', color: '#dc2626', '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' } }}
            >
              <Icon icon="mdi:close" style={{ width: 18, height: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Box>
  )
}

export default JoinRequestList
