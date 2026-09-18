// frontend/src/components/game/GameResultDialog.tsx
// دیالوگ ثبت نتیجه بازی — انتخاب چندگانه برندگان از میان شرکت‌کننده‌های پذیرفته‌شده

import React, { useMemo, useState } from 'react'
import { Avatar, Box, Checkbox, Typography } from '@mui/material'
import { Icon } from '@iconify/react'

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Icon icon="mdi:information-outline" style={{ width: 16, height: 16, flexShrink: 0 }} />
          برندگان بازی را انتخاب کنید. به هر برنده امتیاز وفاداری اضافه می‌شود و وضعیت بازی «به پایان رسیده» ثبت خواهد شد.
        </Typography>

        {accepted.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            شرکت‌کننده‌ی پذیرفته‌شده‌ای برای انتخاب وجود ندارد.
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 320, overflowY: 'auto' }}>
            {accepted.map((p) => {
              const on = selected.includes(p.user_id)
              return (
                <Box
                  key={p.id}
                  onClick={() => toggle(p.user_id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: on ? 'rgba(37,99,235,0.4)' : 'rgba(15,23,42,0.06)',
                    bgcolor: on ? 'rgba(37,99,235,0.06)' : 'transparent',
                  }}
                >
                  <Checkbox checked={on} size="small" sx={{ p: 0.5 }} />
                  <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: '0.8rem', fontWeight: 800 }}>
                    {(p.full_name ?? '؟').trim().charAt(0)}
                  </Avatar>
                  <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }} noWrap>
                    {p.full_name ?? `کاربر ${p.user_id}`}
                  </Typography>
                  {on && <Icon icon="mdi:trophy" style={{ width: 18, height: 18, color: '#b45309' }} />}
                </Box>
              )
            })}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 0.5 }}>
          <Button variant="outline" onClick={handleClose} disabled={setResult.isPending}>انصراف</Button>
          <Button variant="gradient" icon="mdi:flag-checkered" loading={setResult.isPending} disabled={selected.length === 0} onClick={submit}>
            ثبت نتیجه
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default GameResultDialog