// frontend/src/components/game/ParticipantList.tsx
// لیست شرکت‌کننده‌ها — نقش‌ها، وضعیت پرداخت، اقدامات مدیریتی (ارتقای ادمین/حذف)

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

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
  left: '#64748b',
  removed: '#64748b',
}

const iconButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

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
    return <p className="py-2 text-[0.85rem] text-muted-foreground">هنوز بازیکنی به بازی نپیوسته است.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {active.map((p) => {
        const isMe = me?.id === p.user_id
        return (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-2.5 rounded-[14px] border border-border px-2.5 py-2',
              isMe ? 'bg-blue-600/[0.05] dark:bg-blue-400/[0.07]' : 'bg-transparent'
            )}
          >
            <Avatar className="h-[34px] w-[34px]">
              <AvatarFallback className="bg-blue-600/10 text-[0.85rem] font-extrabold text-blue-700 dark:text-blue-300">
                {(p.full_name ?? '؟').trim().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="truncate text-[0.85rem] font-bold text-foreground">
                  {p.full_name ?? `کاربر ${p.user_id}`}
                  {isMe && <span className="text-blue-700 dark:text-blue-400"> (شما)</span>}
                </p>
                <RoleBadge role={p.role} />
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className="text-[0.68rem] font-semibold"
                  style={{ color: STATUS_COLORS[p.status] ?? '#64748b' }}
                >
                  {PARTICIPANT_STATUS_LABELS[p.status as keyof typeof PARTICIPANT_STATUS_LABELS] ?? p.status}
                </span>
                {p.payment_status === 'paid' && (
                  <span className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-emerald-700 dark:text-emerald-400">
                    <Icon icon="mdi:check-circle" style={{ width: 13, height: 13 }} />
                    پرداخت‌شده
                  </span>
                )}
                {p.payment_status === 'pending' && (
                  <span className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-amber-800 dark:text-amber-400">
                    <Icon icon="mdi:clock-outline" style={{ width: 13, height: 13 }} />
                    سهم پرداخت‌نشده
                  </span>
                )}
              </div>
            </div>

            {/* اقدامات مدیریتی */}
            {isOrganizer && p.role !== 'organizer' && p.status === 'accepted' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleToggleAdmin(p)}
                    disabled={setRole.isPending}
                    aria-label={p.role === 'admin' ? `برداشتن ادمین از ${p.full_name ?? ''}` : `منصوب کردن ${p.full_name ?? ''} به ادمین`}
                    aria-pressed={p.role === 'admin'}
                    className={cn(
                      iconButtonClass,
                      'hover:bg-violet-600/10',
                      p.role === 'admin' ? 'text-violet-700 dark:text-violet-400' : 'text-blue-700 dark:text-blue-400'
                    )}
                  >
                    <Icon icon={p.role === 'admin' ? 'mdi:crown-cancel-outline' : 'mdi:crown-outline'} style={{ width: 18, height: 18 }} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{p.role === 'admin' ? 'برداشتن دسترسی ادمین' : 'منصوب کردن به ادمین'}</TooltipContent>
              </Tooltip>
            )}
            {canManage && p.role !== 'organizer' && !isMe && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(p)}
                    aria-label={`حذف ${p.full_name ?? ''} از بازی`}
                    className={cn(iconButtonClass, 'text-red-600 hover:bg-red-600/10 dark:text-red-400')}
                  >
                    <Icon icon="mdi:account-remove-outline" style={{ width: 18, height: 18 }} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>حذف از بازی</TooltipContent>
              </Tooltip>
            )}
          </div>
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
    </div>
  )
}

export default ParticipantList
