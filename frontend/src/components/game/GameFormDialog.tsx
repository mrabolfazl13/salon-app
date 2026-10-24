// frontend/src/components/game/GameFormDialog.tsx
// فرم ساخت/ویرایش بازی — ساخت روی رزرو تأییدشده (booking_id از فراخوان)؛ ویرایش فیلدهای مجاز

import React, { useEffect, useId, useState } from 'react'

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
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Label } from '@/components/ui/shadcn/label'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import { SPORTS } from '@/components/mobile/SportChip'
import { getGameError } from './shared'
import SplitPaymentDialog from '@/components/split-payment/SplitPaymentDialog'
import { teamService } from '@/services/team'

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
  const [showSplitPaymentDialog, setShowSplitPaymentDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const createGame = useCreateGame()
  const updateGame = useUpdateGame(game?.id ?? 0)

  const fieldId = useId()
  const nameId = `${fieldId}-name`
  const descriptionId = `${fieldId}-description`
  const sportId = `${fieldId}-sport`
  const maxPlayersId = `${fieldId}-max-players`
  const skillId = `${fieldId}-skill`
  const visibilityId = `${fieldId}-visibility`
  const paymentModeId = `${fieldId}-payment-mode`

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

  // Load team members when split payment is selected
  const loadTeamMembers = async () => {
    try {
      const teams = await teamService.getMyTeams()
      if (teams.length > 0) {
        const members = await teamService.getMembers(teams[0].id)
        setTeamMembers(members)
      }
    } catch (err) {
      console.error('Failed to load team members:', err)
    }
  }

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
            // If split payment mode was selected, open split payment dialog
            if (paymentMode === 'split_payment' && teamMembers.length > 0) {
              setShowSplitPaymentDialog(true)
              // Store created game for later use
              ;(window as any).__lastCreatedGame = created
            } else {
              toast.success('بازی ساخته شد')
              onClose()
              onCreated?.(created)
            }
          },
          onError: (e) => toast.error(getGameError(e)),
        },
      )
    }
  }

  const handleSplitPaymentSuccess = (paymentId: number) => {
    toast.success(`پرداخت اشتراکی #${paymentId} ایجاد شد`)
    const createdGame = (window as any).__lastCreatedGame
    if (createdGame) {
      onCreated?.(createdGame)
      delete (window as any).__lastCreatedGame
    }
  }

  const pending = createGame.isPending || updateGame.isPending

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'ویرایش بازی' : 'ساخت بازی گروهی'} maxWidth="sm">
      <div className="flex flex-col gap-4 pt-1">
        {!isEdit && (
          <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5">
            <p className="text-[0.78rem] font-bold text-emerald-700 dark:text-emerald-400">رزرو پایه‌ی بازی</p>
            <p className="mt-0.5 text-[0.68rem] text-slate-700 dark:text-slate-300">
              {bookingLabel || `رزرو #${(bookingId ?? 0).toLocaleString('fa-IR')}`}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameId}>
            نام بازی <span className="text-red-600">*</span>
          </Label>
          <Input
            id={nameId}
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={descriptionId}>توضیحات (اختیاری)</Label>
          <Textarea
            id={descriptionId}
            rows={2}
            maxLength={1000}
            className="min-h-[64px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label id={sportId}>ورزش</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger aria-labelledby={sportId} className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{`${s.emoji} ${s.label}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="flex min-w-[160px] flex-col gap-1.5">
            <Label htmlFor={maxPlayersId}>
              حداکثر بازیکنان <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Input
                id={maxPlayersId}
                type="number"
                inputMode="numeric"
                min={2}
                max={100}
                required
                className="pe-12"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value === '' ? '' : Math.max(2, Number(e.target.value)))}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[0.68rem] text-muted-foreground">
                نفر
              </span>
            </div>
          </div>
          <div className="flex min-w-[150px] flex-col gap-1.5">
            <Label id={skillId}>سطح بازی</Label>
            <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as SkillLevel)}>
              <SelectTrigger aria-labelledby={skillId} className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILLS.map((s) => (
                  <SelectItem key={s} value={s}>{SKILL_LEVEL_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label id={visibilityId}>نوع دسترسی</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as GameVisibility)}>
            <SelectTrigger aria-labelledby={visibilityId} className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITIES.map((v) => (
                <SelectItem key={v} value={v}>{GAME_VISIBILITY_LABELS[v]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="-mt-2 text-[0.68rem] text-muted-foreground">
          خصوصی: فقط با لینک دعوت یا دعوت مستقیم - عمومی با تأیید: نیازمند تأیید مدیر - عمومی: پیوستن آزاد
        </p>

        {!isEdit && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label id={paymentModeId}>نحوه پرداخت</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger aria-labelledby={paymentModeId} className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paymentMode === 'split_payment' && teamMembers.length > 0 && (
              <Alert variant="info">
                <AlertDescription className="flex flex-col gap-2 text-[0.68rem]">
                  می‌توانید پس از ساخت بازی، هزینه را بین اعضای تیم تقسیم کنید.
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => loadTeamMembers()}
                  >
                    بارگذاری اعضا
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {game === null && bookingLabel && (
              <p className="-mt-2 text-[0.68rem] text-muted-foreground">
                در حالت سهمی، هزینه‌ی رزرو بین بازیکنان تقسیم می‌شود.
              </p>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            انصراف
          </Button>
          <Button variant="gradient" onClick={handleSubmit} loading={pending} icon={isEdit ? 'mdi:content-save' : 'mdi:plus'}>
            {isEdit ? 'ذخیره تغییرات' : 'ساخت بازی'}
          </Button>
        </div>
      </div>

      {/* Split Payment Dialog */}
      {teamMembers.length > 0 && (
        <SplitPaymentDialog
          open={showSplitPaymentDialog}
          onClose={() => setShowSplitPaymentDialog(false)}
          teamId={teamMembers[0]?.team_id || 0}
          members={teamMembers}
          onSuccess={handleSplitPaymentSuccess}
        />
      )}
    </Dialog>
  )
}

export default GameFormDialog
