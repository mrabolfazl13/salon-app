// frontend/src/components/game/JoinRequestList.tsx
// درخواست‌های پیوستن در انتظار تأیید (بازی‌های «عمومی با تأیید») — تأیید/رد توسط مدیر

import React from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

import type { JoinRequest } from '@/types/game'
import { useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { formatPersianDateTime, getInitials } from '@/utils/helpers'
import { getGameError } from './shared'

interface Props {
  gameId: number
  requests: JoinRequest[]
}

const iconButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

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
    return <p className="py-2 text-[0.85rem] text-muted-foreground">درخواست در انتظاری وجود ندارد.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2.5"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-amber-500/[0.15] text-[0.85rem] font-bold text-amber-700 dark:text-amber-400">
              {getInitials(req.full_name || '؟')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.85rem] font-bold text-foreground">{req.full_name || `کاربر ${req.user_id}`}</p>
            <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
              {`ثبت: ${formatPersianDateTime(req.created_at)}${req.message ? ` - ${req.message}` : ''}`}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDecide(req, true)}
                aria-label={`تأیید درخواست ${req.full_name ?? ''}`}
                className={cn(
                  iconButtonClass,
                  'bg-emerald-500/[0.12] text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                )}
              >
                <Icon icon="mdi:check-bold" style={{ width: 18, height: 18 }} />
              </button>
            </TooltipTrigger>
            <TooltipContent>تأیید و افزودن به بازی</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDecide(req, false)}
                aria-label={`رد درخواست ${req.full_name ?? ''}`}
                className={cn(
                  iconButtonClass,
                  'bg-red-500/10 text-red-600 hover:bg-red-500/[0.18] dark:text-red-400'
                )}
              >
                <Icon icon="mdi:close" style={{ width: 18, height: 18 }} />
              </button>
            </TooltipTrigger>
            <TooltipContent>رد درخواست</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}

export default JoinRequestList
