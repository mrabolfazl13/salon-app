// frontend/src/components/team/TeamMemberList.tsx
// لیست اعضا — چیپ نقش، ردیف در-انتظارِ بیننده با پذیرش/رد، حذف (با اخطار کاپیتان)،
// تغییر نقش (فقط کاپیتان) و انتقال کاپیتانی — الگوی ParticipantList بازی

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'

import type { Team, TeamMember } from '@/types/team'
import {
  useAcceptTeamInvitation,
  useDeclineTeamInvitation,
  useRemoveTeamMember,
  useSetTeamMemberRole,
  useTransferTeamCaptain,
} from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { formatPersianDateTime } from '@/utils/helpers'
import { getTeamError, MemberStatusChip, TeamRoleBadge } from './shared'

interface Props {
  team: Team
  members: TeamMember[]
  /** کاربر جاری کاپیتان است؟ */
  isCaptain: boolean
  /** کاپیتان یا مدیر — حذف/دعوت */
  canManage: boolean
}

const TransferCaptainDialog: React.FC<{
  open: boolean
  onClose: () => void
  team: Team
  candidates: TeamMember[]
}> = ({ open, onClose, team, candidates }) => {
  const toast = useToast()
  const transfer = useTransferTeamCaptain(team.id)
  const [target, setTarget] = useState<number | ''>('')

  const handleTransfer = () => {
    if (!target || target <= 0) {
      toast.error('عضو مورد نظر را انتخاب کنید.')
      return
    }
    transfer.mutate(target, {
      onSuccess: (t) => {
        const name = candidates.find((c) => c.user_id === target)?.full_name ?? 'عضو انتخابی'
        toast.success(`کاپیتانی به «${name}» منتقل شد`)
        setTarget('')
        if (t) onClose()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="انتقال کاپیتانی" maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          با انتقال کاپیتانی، نقش شما به «مدیر» تغییر می‌کند. این اقدام قابل بازگشت نیست و فقط کاپیتان فعلی می‌تواند انجامش دهد.
        </Typography>
        <Box component="ul" sx={{ m: 0, p: '0 20px 0 0', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {candidates.map((m) => (
            <Box component="li" key={m.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.full_name ?? `کاربر ${m.user_id}`}</Typography>
              <Button
                size="sm"
                variant={target === m.user_id ? 'gradient' : 'outline'}
                onClick={() => setTarget(m.user_id)}
              >
                انتخاب
              </Button>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={transfer.isPending}>انصراف</Button>
          <Button
            variant="gradient"
            onClick={handleTransfer}
            loading={transfer.isPending}
            disabled={!target}
            icon="mdi:crown-outline"
          >
            انتقال کاپیتانی
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

const ROLE_MENU_SX = { borderRadius: '12px' } as const

const TeamMemberList: React.FC<Props> = ({ team, members, isCaptain, canManage }) => {
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const stack = useMediaQuery('(max-width:600px)')
  const acceptInv = useAcceptTeamInvitation()
  const declineInv = useDeclineTeamInvitation()
  const remove = useRemoveTeamMember(team.id)
  const setRole = useSetTeamMemberRole(team.id)
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [roleMenuFor, setRoleMenuFor] = useState<{ member: TeamMember; anchor: HTMLElement } | null>(null)

  const rows = members.filter((m) => m.status === 'active' || m.status === 'pending')
  const transferCandidates = members.filter(
    (m) => m.status === 'active' && m.role !== 'captain' && m.user_id !== me?.id,
  )

  const handleAccept = (m: TeamMember) => {
    acceptInv.mutate(
      { teamId: team.id, memberId: m.id },
      {
        onSuccess: () => toast.success('دعوت پذیرفته شد و به تیم پیوستید.'),
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  const handleDecline = (m: TeamMember) => {
    declineInv.mutate(
      { teamId: team.id, memberId: m.id },
      {
        onSuccess: () => toast.success('دعوت رد شد.'),
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  const handleRemove = () => {
    if (!confirmRemove) return
    remove.mutate(confirmRemove.id, {
      onSuccess: ({ message }) => {
        toast.success(message)
        setConfirmRemove(null)
      },
      onError: (err) => {
        toast.error(getTeamError(err))
        setConfirmRemove(null)
      },
    })
  }

  const handlePickRole = (m: TeamMember, next: 'admin' | 'member') => {
    setRole.mutate(
      { memberId: m.id, role: next },
      {
        onSuccess: () => toast.success(next === 'admin' ? 'مدیر منصوب شد' : 'نقش به عضو عادی تغییر کرد'),
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
    setRoleMenuFor(null)
  }

  const removeDescription = (m: TeamMember | null): string => {
    if (!m) return ''
    if (m.status === 'pending') return `دعوت «${m.full_name ?? ''}» پس از حذف باطل می‌شود.`
    const warn =
      isCaptain
        ? 'ظرفیت آزاد می‌شود و دسترسی‌های مدیریتی او حذف می‌گردد.'
        : 'اگر عضو انتخابی مدیر باشد، فقط کاپیتان می‌تواند حذفش کند.'
    return `آیا از حذف «${m.full_name ?? ''}» از تیم مطمئن هستید؟ ${warn} (کاپیتان قابل حذف نیست — ابتدا کاپیتانی را منتقل کنید.)`
  }

  if (rows.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', py: 1 }}>
        هنوز عضو فعال یا در انتظار پاسخی در تیم نیست.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {rows.map((m) => {
        const isMe = me?.id === m.user_id
        const isPendingInviteForMe = m.status === 'pending' && isMe
        const removable = canManage && m.role !== 'captain' && !isMe && (isCaptain || m.role === 'member')
        return (
          <Box
            key={m.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: stack ? 'wrap' : 'nowrap',
              px: 1.25,
              py: 1,
              borderRadius: '14px',
              bgcolor: isMe ? 'rgba(37,99,235,0.05)' : m.status === 'pending' ? 'rgba(245,158,11,0.05)' : 'transparent',
              border: '1px solid',
              borderColor: m.status === 'pending' ? 'rgba(245,158,11,0.25)' : 'rgba(15,23,42,0.05)',
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: '0.85rem', fontWeight: 800 }}>
              {(m.full_name ?? '؟').trim().charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }} noWrap>
                  {m.full_name ?? `کاربر ${m.user_id}`}
                  {isMe && <span style={{ color: '#2563eb' }}> (شما)</span>}
                </Typography>
                <TeamRoleBadge role={m.role} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                <MemberStatusChip status={m.status} />
                {m.status === 'active' && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {`عضویت: ${formatPersianDateTime(m.joined_at)}`}
                  </Typography>
                )}
                {m.phone && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }} dir="ltr">
                    {m.phone}
                  </Typography>
                )}
              </Box>
            </Box>

            {isPendingInviteForMe && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button size="sm" variant="gradient" loading={acceptInv.isPending} onClick={() => handleAccept(m)}>
                  پذیرش دعوت
                </Button>
                <Button size="sm" variant="outline" loading={declineInv.isPending} onClick={() => handleDecline(m)}>
                  رد
                </Button>
              </Box>
            )}

            {isCaptain && m.status === 'active' && m.role !== 'captain' && (
              <Tooltip title="تغییر نقش">
                <IconButton
                  size="small"
                  onClick={(e) => setRoleMenuFor({ member: m, anchor: e.currentTarget })}
                  disabled={setRole.isPending}
                  sx={{ color: '#2563eb' }}
                >
                  <Icon icon={m.role === 'admin' ? 'mdi:shield-account' : 'mdi:shield-account-outline'} style={{ width: 18, height: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {removable && m.role !== 'captain' && (
              <Tooltip title={m.status === 'pending' ? 'ابطال دعوت' : 'حذف از تیم'}>
                <IconButton size="small" onClick={() => setConfirmRemove(m)} sx={{ color: '#dc2626' }}>
                  <Icon icon={m.status === 'pending' ? 'mdi:email-cancel-outline' : 'mdi:account-remove-outline'} style={{ width: 18, height: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })}

      {isCaptain && transferCandidates.length > 0 && (
        <Box sx={{ pt: 1 }}>
          <Button size="sm" variant="default" icon="mdi:crown-outline" onClick={() => setTransferOpen(true)}>
            انتقال کاپیتانی
          </Button>
        </Box>
      )}

      {roleMenuFor && (
        <Menu anchorEl={roleMenuFor.anchor} open onClose={() => setRoleMenuFor(null)} slotProps={{ paper: { sx: ROLE_MENU_SX } }}>
          {roleMenuFor.member.role !== 'admin' && (
            <MenuItem onClick={() => handlePickRole(roleMenuFor.member, 'admin')}>منصوب کردن به مدیر</MenuItem>
          )}
          {roleMenuFor.member.role === 'admin' && (
            <MenuItem onClick={() => handlePickRole(roleMenuFor.member, 'member')}>برداشتن مدیریت</MenuItem>
          )}
        </Menu>
      )}

      <ConfirmModal
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title={confirmRemove?.status === 'pending' ? 'ابطال دعوت' : 'حذف عضو'}
        description={removeDescription(confirmRemove)}
        confirmText="حذف"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={handleRemove}
      />

      <TransferCaptainDialog open={transferOpen} onClose={() => setTransferOpen(false)} team={team} candidates={transferCandidates} />
    </Box>
  )
}

export default TeamMemberList
