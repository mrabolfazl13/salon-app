// frontend/src/components/team/TeamMemberList.tsx
// لیست اعضا — چیپ نقش، ردیف در-انتظارِ بیننده با پذیرش/رد، حذف (با اخطار کاپیتان)،
// تغییر نقش (فقط کاپیتان) و انتقال کاپیتانی — الگوی ParticipantList بازی

import React, { useState } from 'react'
import { Icon } from '@iconify/react'

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
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { cn } from '@/lib/utils'
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
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-[0.68rem] text-muted-foreground">
          با انتقال کاپیتانی، نقش شما به «مدیر» تغییر می‌کند. این اقدام قابل بازگشت نیست و فقط کاپیتان فعلی می‌تواند انجامش دهد.
        </p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5">
          {candidates.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span className="text-[0.82rem] font-bold">{m.full_name ?? `کاربر ${m.user_id}`}</span>
              <Button
                size="sm"
                variant={target === m.user_id ? 'gradient' : 'outline'}
                onClick={() => setTarget(m.user_id)}
              >
                انتخاب
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-3">
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
        </div>
      </div>
    </Dialog>
  )
}

const TeamMemberList: React.FC<Props> = ({ team, members, isCaptain, canManage }) => {
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const acceptInv = useAcceptTeamInvitation()
  const declineInv = useDeclineTeamInvitation()
  const remove = useRemoveTeamMember(team.id)
  const setRole = useSetTeamMemberRole(team.id)
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

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
      <p className="py-2 text-[0.85rem] text-muted-foreground">
        هنوز عضو فعال یا در انتظار پاسخی در تیم نیست.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {rows.map((m) => {
        const isMe = me?.id === m.user_id
        const isPendingInviteForMe = m.status === 'pending' && isMe
        const removable = canManage && m.role !== 'captain' && !isMe && (isCaptain || m.role === 'member')
        return (
          <div
            key={m.id}
            className={cn(
              'flex flex-wrap items-center gap-2.5 rounded-[14px] border px-2.5 py-2 sm:flex-nowrap',
              isMe
                ? 'bg-blue-600/5'
                : m.status === 'pending'
                  ? 'bg-amber-500/5'
                  : 'bg-transparent',
              m.status === 'pending'
                ? 'border-amber-500/25'
                : 'border-slate-900/5 dark:border-white/10',
            )}
          >
            <Avatar className="h-[34px] w-[34px]">
              <AvatarFallback className="bg-blue-600/10 text-[0.85rem] font-extrabold text-blue-700 dark:text-blue-300">
                {(m.full_name ?? '؟').trim().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p className="truncate text-[0.85rem] font-bold text-slate-900 dark:text-slate-100">
                  {m.full_name ?? `کاربر ${m.user_id}`}
                  {isMe && <span className="text-blue-600 dark:text-blue-400"> (شما)</span>}
                </p>
                <TeamRoleBadge role={m.role} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <MemberStatusChip status={m.status} />
                {m.status === 'active' && (
                  <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
                    {`عضویت: ${formatPersianDateTime(m.joined_at)}`}
                  </p>
                )}
                {m.phone && (
                  <p className="text-[0.68rem] text-slate-500 dark:text-slate-400" dir="ltr">
                    {m.phone}
                  </p>
                )}
              </div>
            </div>

            {isPendingInviteForMe && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="gradient" loading={acceptInv.isPending} onClick={() => handleAccept(m)}>
                  پذیرش دعوت
                </Button>
                <Button size="sm" variant="outline" loading={declineInv.isPending} onClick={() => handleDecline(m)}>
                  رد
                </Button>
              </div>
            )}

            {isCaptain && m.status === 'active' && m.role !== 'captain' && (
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={setRole.isPending}
                        aria-label={`تغییر نقش ${m.full_name ?? ''}`}
                        className="inline-flex h-9 w-11 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-blue-400"
                      >
                        <Icon icon={m.role === 'admin' ? 'mdi:shield-account' : 'mdi:shield-account-outline'} style={{ width: 18, height: 18 }} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <DropdownMenuContent align="start">
                    {m.role !== 'admin' && (
                      <DropdownMenuItem onClick={() => handlePickRole(m, 'admin')}>منصوب کردن به مدیر</DropdownMenuItem>
                    )}
                    {m.role === 'admin' && (
                      <DropdownMenuItem onClick={() => handlePickRole(m, 'member')}>برداشتن مدیریت</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent>تغییر نقش</TooltipContent>
              </Tooltip>
            )}
            {removable && m.role !== 'captain' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(m)}
                    aria-label={m.status === 'pending' ? `ابطال دعوت ${m.full_name ?? ''}` : `حذف ${m.full_name ?? ''} از تیم`}
                    className="inline-flex h-9 w-11 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-red-400"
                  >
                    <Icon icon={m.status === 'pending' ? 'mdi:email-cancel-outline' : 'mdi:account-remove-outline'} style={{ width: 18, height: 18 }} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{m.status === 'pending' ? 'ابطال دعوت' : 'حذف از تیم'}</TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      })}

      {isCaptain && transferCandidates.length > 0 && (
        <div className="pt-2">
          <Button size="sm" variant="default" icon="mdi:crown-outline" onClick={() => setTransferOpen(true)}>
            انتقال کاپیتانی
          </Button>
        </div>
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
    </div>
  )
}

export default TeamMemberList
