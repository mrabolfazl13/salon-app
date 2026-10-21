// frontend/src/components/team/TeamJoinRequestList.tsx
// درخواست‌های پیوستن تیم‌های عمومی — تأیید/رد توسط کاپیتان/مدیر (الگوی JoinRequestList بازی)

import React from 'react'
import { Icon } from '@iconify/react'

import type { TeamJoinRequest } from '@/types/team'
import { useApproveTeamJoinRequest, useRejectTeamJoinRequest } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { formatPersianDateTime, getInitials } from '@/utils/helpers'
import { getTeamError } from './shared'

interface Props {
  teamId: number
  requests: TeamJoinRequest[]
}

const TeamJoinRequestList: React.FC<Props> = ({ teamId, requests }) => {
  const toast = useToast()
  const approve = useApproveTeamJoinRequest(teamId)
  const reject = useRejectTeamJoinRequest(teamId)
  const busy = approve.isPending || reject.isPending

  const handleDecide = (req: TeamJoinRequest, accept: boolean) => {
    const mutation = accept ? approve : reject
    mutation.mutate(req.id, {
      onSuccess: () => toast.success(accept ? 'درخواست تأیید شد و کاربر به تیم اضافه گردید.' : 'درخواست رد شد.'),
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  if (requests.length === 0) {
    return (
      <p className="py-2 text-[0.85rem] text-muted-foreground">
        درخواست در انتظاری وجود ندارد.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-amber-500/15 text-[0.85rem] font-bold text-amber-700 dark:text-amber-300">
              {getInitials(req.full_name || '؟')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.85rem] font-bold text-slate-900 dark:text-slate-100">
              {req.full_name || `کاربر ${req.user_id}`}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {`ثبت: ${formatPersianDateTime(req.created_at)}${req.message ? ` - ${req.message}` : ''}`}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDecide(req, true)}
                aria-label={`تأیید درخواست عضویت ${req.full_name ?? ''}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/[0.12] text-emerald-700 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-emerald-300"
              >
                <Icon icon="mdi:check-bold" style={{ width: 18, height: 18 }} />
              </button>
            </TooltipTrigger>
            <TooltipContent>تأیید و افزودن به تیم</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDecide(req, false)}
                aria-label={`رد درخواست عضویت ${req.full_name ?? ''}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-red-400"
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

export default TeamJoinRequestList
