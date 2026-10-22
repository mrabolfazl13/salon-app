// frontend/src/components/game/GameResultDialog.tsx
// دیالوگ ثبت نتیجه بازی — انتخاب چندگانه برندگان از میان شرکت‌کننده‌های پذیرفته‌شده

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'

import type { GameResultResponse, Participant } from '@/types/game'
import { useSetGameResult } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { toPersianDigits } from '@/lib/jalali'
import { getGameResultError } from './shared'

interface Props {
  open: boolean
  onClose: () => void
  gameId: number
  participants: Participant[]
  onSuccess?: (res: GameResultResponse) => void
}

const GameResultDialog: React.FC<Props> = ({ open, onClose, gameId, participants, onSuccess }) => {
  const toast = useToast()
  const setResult = useSetGameResult(gameId)
  const [selected, setSelected] = useState<number[]>([])

  const accepted = useMemo(() => participants.filter((p) => p.status === 'accepted'), [participants])

  const toggle = (userId: number) => {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleClose = () => {
    if (setResult.isPending) return
    setSelected([])
    onClose()
  }

  const submit = () => {
    if (selected.length === 0) {
      toast.error('حداقل یک برنده انتخاب کنید.')
      return
    }
    setResult.mutate(selected, {
      onSuccess: (res) => {
        toast.success(`نتیجه ثبت شد و ${toPersianDigits(res.points_each)} امتیاز به هر برنده اضافه شد`)
        setSelected([])
        onSuccess?.(res)
        onClose()
      },
      onError: (err) => toast.error(getGameResultError(err)),
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} title="ثبت نتیجه بازی" maxWidth="sm">
      <div className="flex flex-col gap-3 pt-1">
        <p className="flex items-center gap-2 text-[0.78rem] text-muted-foreground">
          <Icon icon="mdi:information-outline" style={{ width: 16, height: 16, flexShrink: 0 }} />
          برندگان بازی را انتخاب کنید. به هر برنده امتیاز وفاداری اضافه می‌شود و وضعیت بازی «به پایان رسیده» ثبت خواهد شد.
        </p>

        {accepted.length === 0 ? (
          <div className="py-4 text-center text-[0.85rem] text-muted-foreground">
            شرکت‌کننده‌ی پذیرفته‌شده‌ای برای انتخاب وجود ندارد.
          </div>
        ) : (
          <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
            {accepted.map((p) => {
              const on = selected.includes(p.user_id)
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.user_id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-start text-foreground transition-colors',
                    // ردیف در لیست اسکرول‌شونده: حلقه فوکوس داخل خود ردیف تا بریده نشود
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    on ? 'border-blue-600/40 bg-blue-600/[0.06]' : 'border-border bg-transparent'
                  )}
                >
                  {/* چک‌باکس فقط بصری است؛ کنترل اصلی همان ردیفِ دکمه است */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      on ? 'border-blue-600 bg-blue-600 text-white' : 'border-input bg-card text-transparent'
                    )}
                  >
                    <Icon icon="mdi:check" style={{ width: 13, height: 13 }} />
                  </span>
                  <Avatar className="h-[30px] w-[30px]">
                    <AvatarFallback className="bg-blue-600/10 text-[0.8rem] font-extrabold text-blue-600 dark:text-blue-300">
                      {(p.full_name ?? '؟').trim().charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-[0.85rem] font-bold">
                    {p.full_name ?? `کاربر ${p.user_id}`}
                  </span>
                  {on && <Icon icon="mdi:trophy" style={{ width: 18, height: 18, color: '#b45309' }} />}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={handleClose} disabled={setResult.isPending}>
            انصراف
          </Button>
          <Button variant="gradient" icon="mdi:flag-checkered" loading={setResult.isPending} disabled={selected.length === 0} onClick={submit}>
            ثبت نتیجه
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default GameResultDialog
