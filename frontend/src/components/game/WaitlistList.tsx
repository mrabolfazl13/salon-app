// frontend/src/components/game/WaitlistList.tsx
// لیست انتظار — به ترتیب رتبه؛ ارتقای خودکار پس از خالی‌شدن ظرفیت توسط بک‌اند انجام می‌شود

import React from 'react'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'

import type { WaitlistEntry } from '@/types/game'
import { formatPersianDateTime } from '@/utils/helpers'

interface Props {
  entries: WaitlistEntry[]
}

const WaitlistList: React.FC<Props> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 1 }}>
        لیست انتظار خالی است.
      </Typography>
    )
  }

  const sorted = [...entries].sort((a, b) => a.position - b.position)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {sorted.map((entry) => (
        <Box
          key={entry.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1,
            borderRadius: '14px',
            border: '1px solid rgba(15,23,42,0.06)',
            bgcolor: 'rgba(15,23,42,0.015)',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: entry.position === 1 ? 'rgba(245,158,11,0.14)' : 'rgba(100,116,139,0.10)',
              color: entry.position === 1 ? '#b45309' : '#64748b',
              fontSize: '0.78rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {entry.position.toLocaleString('fa-IR')}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }} noWrap>
              {`کاربر ${entry.user_id.toLocaleString('fa-IR')}`}
            </Typography>
            <Typography sx={{ fontSize: '0.66rem', color: '#94a3b8', mt: 0.1 }} noWrap>
              {`در صف از: ${formatPersianDateTime(entry.created_at)}`}
            </Typography>
          </Box>
          {entry.position === 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#b45309', fontSize: '0.68rem', fontWeight: 700 }}>
              <Icon icon="mdi:star-four-points" style={{ width: 13, height: 13 }} />
              نوبت بعدی
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

export default WaitlistList
