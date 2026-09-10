// frontend/src/components/game/ParticipantList.tsx
// لیست شرکت‌کننده‌ها — نقش‌ها، وضعیت پرداخت، اقدامات مدیریتی (ارتقای ادمین/حذف)

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Avatar, Typography, IconButton, Tooltip } from '@mui/material'

import type { Participant } from '@/types/game'
import { PARTICIPANT_STATUS_LABELS } from '@/types/game'
import { useRemoveParticipant, useSetParticipantRole } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { RoleBadge, getGameError } from './shared'

interface Props {
  gameId: number
  participants: Participant[]
  /** کاربر جاری برگزارکننده است؟ (فقط organizer می‌تواند نقش تغییر دهد — هم‌راستا با بک‌اند) */
  isOrganizer: boolean
  /** کاربر جاری برگزارکننده یا ادمین است؟ (حذف بازیکن) */
  canManage: boolean
}

const STATUS_COLORS: Record<string, string> = {
  accepted: '#059669',
  pending: '#b45309',
  invited: '#2563eb',
  rejected: '#dc2626',
  left: '#94a3b8',
  removed: '#94a3b8',
}

const ParticipantList: React.FC<Props> = ({ gameId, participants, isOrganizer, canManage }) => {
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const setRole = useSetParticipantRole(gameId)
  const remove = useRemoveParticipant(gameId)
  const [confirmRemove, setConfirmRemove] = useState<Participant | null>(null)

  const active = participants.filter((p) => ['accepted', 'pending', 'invited'].includes(p.status))

  const handleToggleAdmin = (p: Participant) => {
    const next = p.role === 'admin' ? 'member' : 'admin'
    setRole.mutate(
      { userId: p.user_id, role: next },
      {
        onSuccess: () => toast.success(next === 'admin' ? 'ادمین منصوب شد' : 'نقش به عضو عادی تغییر کرد'),
        onError: (err) => toast.error(getGameError(err)),
      },
    )
  }

  const handleRemove = () => {
    if (!confirmRemove) return
    remove.mutate(confirmRemove.user_id, {
      onSuccess: ({ message }) => {
        toast.success(message)
        setConfirmRemove(null)
      },
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  if (active.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 1 }}>
        هنوز بازیکنی به بازی نپیوسته است.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {active.map((p) => {
        const isMe = me?.id === p.user_id
        return (
          <Box
            key={p.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.25,
              py: 1,
              borderRadius: '14px',
              bgcolor: isMe ? 'rgba(37,99,235,0.05)' : 'transparent',
              border: '1px solid rgba(15,23,42,0.05)',
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: '0.85rem', fontWeight: 800 }}>
              {(p.full_name ?? '؟').trim().charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }} noWrap>
                  {p.full_name ?? `کاربر ${p.user_id}`}
                  {isMe && <span style={{ color: '#2563eb' }}> (شما)</span>}
                </Typography>
                <RoleBadge role={p.role} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                <Typography sx={{ fontSize: '0.7rem', color: STATUS_COLORS[p.status] ?? '#64748b', fontWeight: 600 }}>
                  {PARTICIPANT_STATUS_LABELS[p.status as keyof typeof PARTICIPANT_STATUS_LABELS] ?? p.status}
                </Typography>
                {p.payment_status === 'paid' && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Icon icon="mdi:check-circle" style={{ width: 13, height: 13 }} />
                    پرداخت‌شده
                  </Box>
                )}
                {p.payment_status === 'pending' && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color: '#b45309', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Icon icon="mdi:clock-outline" style={{ width: 13, height: 13 }} />
                    سهم پرداخت‌نشده
                  </Box>
                )}
              </Box>
            </Box>

            {/* اقدامات مدیریتی */}
            {isOrganizer && p.role !== 'organizer' && p.status === 'accepted' && (
              <Tooltip title={p.role === 'admin' ? 'برداشتن دسترسی ادمین' : 'منصوب کردن به ادمین'}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleAdmin(p)}
                  disabled={setRole.isPending}
                  sx={{ color: p.role === 'admin' ? '#7c3aed' : '#2563eb' }}
                >
                  <Icon icon={p.role === 'admin' ? 'mdi:crown-cancel-outline' : 'mdi:crown-outline'} style={{ width: 18, height: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {canManage && p.role !== 'organizer' && !isMe && (
              <Tooltip title="حذف از بازی">
                <IconButton size="small" onClick={() => setConfirmRemove(p)} sx={{ color: '#dc2626' }}>
                  <Icon icon="mdi:account-remove-outline" style={{ width: 18, height: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })}

      <ConfirmModal
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title="حذف بازیکن"
        description={`آیا از حذف «${confirmRemove?.full_name ?? ''}» از بازی مطمئن هستید؟ در صورت پر بودن ظرفیت، نفر بعدی لیست انتظار به‌صورت خودکار جابه‌جا می‌شود.`}
        confirmText="حذف"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={handleRemove}
      />
    </Box>
  )
}

export default ParticipantList
