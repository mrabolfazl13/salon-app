// frontend/src/components/game/GameFormDialog.tsx
// فرم ساخت/ویرایش بازی — ساخت روی رزرو تأییدشده (booking_id از فراخوان)؛ ویرایش فیلدهای مجاز

import React, { useEffect, useState } from 'react'
import { Box, Typography, TextField, MenuItem, InputAdornment } from '@mui/material'

import type { Game, GameVisibility, PaymentMode, SkillLevel } from '@/types/game'
import {
  GAME_VISIBILITY_LABELS,
  PAYMENT_MODE_LABELS,
  SKILL_LEVEL_LABELS,
} from '@/types/game'
import { useCreateGame, useUpdateGame } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { SPORTS } from '@/components/mobile/SportChip'
import { getGameError } from './shared'

interface Props {
  open: boolean
  onClose: () => void
  /** حالت ویرایش: بازی موجود؛ حالت ساخت: null */
  game?: Game | null
  /** رزرو تأییدشده‌ای که بازی روی آن ساخته می‌شود (فقط حالت ساخت) */
  bookingId?: number | null
  /** خلاصه‌ی خوانای رزرو برای نمایش (فقط حالت ساخت) */
  bookingLabel?: string
  /** پس از ساخت موفق — شناسه‌ی بازی جدید به فراخوان داده می‌شود (مثلاً برای redirect) */
  onCreated?: (game: Game) => void
}

const VISIBILITIES: GameVisibility[] = ['public', 'public_approval', 'private']
const SKILLS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'pro']
const PAYMENT_MODES: PaymentMode[] = ['split_payment', 'organizer_pays', 'free']

const GameFormDialog: React.FC<Props> = ({ open, onClose, game = null, bookingId = null, bookingLabel, onCreated }) => {
  const toast = useToast()
  const isEdit = !!game

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sport, setSport] = useState('futsal')
  const [maxPlayers, setMaxPlayers] = useState<number | ''>(8)
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate')
  const [visibility, setVisibility] = useState<GameVisibility>('public')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('split_payment')

  const createGame = useCreateGame()
  const updateGame = useUpdateGame(game?.id ?? 0)

  // مقداردهی اولیه هنگام باز شدن دیالوگ
  useEffect(() => {
    if (!open) return
    if (game) {
      setName(game.name)
      setDescription(game.description ?? '')
      setSport(game.sport)
      setMaxPlayers(game.max_players)
      setSkillLevel(game.skill_level)
      setVisibility(game.visibility)
    } else {
      setName('')
      setDescription('')
      setSport('futsal')
      setMaxPlayers(8)
      setSkillLevel('intermediate')
      setVisibility('public')
      setPaymentMode('split_payment')
    }
  }, [open, game])

  const validate = (): string | null => {
    if (name.trim().length < 3) return 'نام بازی باید حداقل ۳ حرف باشد.'
    if (!maxPlayers || maxPlayers < 2) return 'حداقل بازیکنان ۲ نفر است.'
    if (maxPlayers > 100) return 'حداکثر بازیکنان ۱۰۰ نفر است.'
    if (!isEdit && !bookingId) return 'برای ساخت بازی، یک رزرو تأییدشده لازم است.'
    if (isEdit && game && maxPlayers < game.current_players) {
      return `ظرفیت نمی‌تواند کمتر از تعداد بازیکنان فعلی (${game.current_players.toLocaleString('fa-IR')} نفر) باشد.`
    }
    return null
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    if (isEdit && game) {
      updateGame.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          max_players: maxPlayers as number,
          skill_level: skillLevel,
          visibility,
        },
        {
          onSuccess: () => {
            toast.success('بازی به‌روزرسانی شد')
            onClose()
          },
          onError: (e) => toast.error(getGameError(e)),
        },
      )
    } else {
      createGame.mutate(
        {
          booking_id: bookingId as number,
          name: name.trim(),
          description: description.trim() || undefined,
          sport,
          max_players: maxPlayers as number,
          skill_level: skillLevel,
          visibility,
          payment_mode: paymentMode,
        },
        {
          onSuccess: (created) => {
            toast.success('بازی ساخته شد')
            onClose()
            onCreated?.(created)
          },
          onError: (e) => toast.error(getGameError(e)),
        },
      )
    }
  }

  const pending = createGame.isPending || updateGame.isPending

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'ویرایش بازی' : 'ساخت بازی گروهی'} maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        {!isEdit && (
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderRadius: '14px',
              bgcolor: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
              رزرو پایه‌ی بازی
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#334155', mt: 0.25 }}>
              {bookingLabel || `رزرو #${(bookingId ?? 0).toLocaleString('fa-IR')}`}
            </Typography>
          </Box>
        )}

        <TextField
          label="نام بازی"
          size="small"
          required
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <TextField
          label="توضیحات (اختیاری)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />

        {!isEdit && (
          <TextField select label="ورزش" size="small" value={sport} onChange={(e) => setSport(e.target.value)}>
            {SPORTS.map((s) => (
              <MenuItem key={s.key} value={s.key}>{`${s.emoji} ${s.label}`}</MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="حداکثر بازیکنان"
            size="small"
            type="number"
            required
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value === '' ? '' : Math.max(2, Number(e.target.value)))}
            slotProps={{
              input: { endAdornment: <InputAdornment position="end">نفر</InputAdornment> },
            }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            select
            label="سطح بازی"
            size="small"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
            sx={{ minWidth: 150 }}
          >
            {SKILLS.map((s) => (
              <MenuItem key={s} value={s}>{SKILL_LEVEL_LABELS[s]}</MenuItem>
            ))}
          </TextField>
        </Box>

        <TextField
          select
          label="نوع دسترسی"
          size="small"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as GameVisibility)}
        >
          {VISIBILITIES.map((v) => (
            <MenuItem key={v} value={v}>{GAME_VISIBILITY_LABELS[v]}</MenuItem>
          ))}
        </TextField>
        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: -1 }}>
          خصوصی: فقط با لینک دعوت یا دعوت مستقیم - عمومی با تأیید: نیازمند تأیید مدیر - عمومی: پیوستن آزاد
        </Typography>

        {!isEdit && (
          <>
            <TextField
              select
              label="نحوه پرداخت"
              size="small"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              {PAYMENT_MODES.map((m) => (
                <MenuItem key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</MenuItem>
              ))}
            </TextField>
            {game === null && bookingLabel && (
              <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: -1 }}>
                در حالت سهمی، هزینه‌ی رزرو بین بازیکنان تقسیم می‌شود.
              </Typography>
            )}
          </>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 0.5 }}>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            انصراف
          </Button>
          <Button variant="gradient" onClick={handleSubmit} loading={pending} icon={isEdit ? 'mdi:content-save' : 'mdi:plus'}>
            {isEdit ? 'ذخیره تغییرات' : 'ساخت بازی'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default GameFormDialog
