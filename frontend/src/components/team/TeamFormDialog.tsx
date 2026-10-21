// frontend/src/components/team/TeamFormDialog.tsx
// ساخت/ویرایش تیم — نام، ورزش، سطح دسترسی، توضیحات (لوگو: آپلود مدیر گیت است — فعلاً URL اختیاری)

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'

import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { SPORTS } from '@/components/mobile'
import type { Team, TeamCreatePayload, TeamVisibility } from '@/types/team'
import { TEAM_VISIBILITY_LABELS } from '@/types/team'
import { getTeamError } from './shared'

interface Props {
  open: boolean
  onClose: () => void
  /** اگر ارسال شود → حالت ویرایش */
  team?: Team | null
}

const VISIBILITY_HINTS: Record<TeamVisibility, string> = {
  public: 'در بخش «کاوش تیم‌ها» نمایش داده می‌شود؛ عضویت با درخواست و تأیید مدیران.',
  invite_only: 'در کاوش دیده نمی‌شود؛ فقط با دعوت مستقیم مدیران می‌توان پیوست.',
  private: 'فقط اعضا تیم را می‌بینند؛ ورود تنها با دعوت مستقیم.',
}

const TeamFormDialog: React.FC<Props> = ({ open, onClose, team }) => {
  const toast = useToast()
  const editing = !!team
  const create = useCreateTeam()
  const update = useUpdateTeam(team?.id ?? 0)
  const busy = create.isPending || update.isPending

  const [name, setName] = useState('')
  const [sport, setSport] = useState('futsal')
  const [visibility, setVisibility] = useState<TeamVisibility>('private')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(team?.name ?? '')
    setSport(team?.sport ?? 'futsal')
    setVisibility(team?.visibility ?? 'private')
    setDescription(team?.description ?? '')
    setLogoUrl(team?.logo_url ?? '')
    setNameError('')
  }, [open, team])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setNameError('نام تیم باید حداقل ۳ کاراکتر باشد.')
      return
    }
    const common = {
      description: description.trim() || undefined,
      sport,
      visibility,
      logo_url: logoUrl.trim() || undefined,
    }
    const onCreated = (t: Team) => {
      toast.success(editing ? 'تیم به‌روزرسانی شد' : `تیم «${t.name}» ساخته شد`)
      onClose()
    }
    const onError = (err: unknown) => toast.error(getTeamError(err))

    if (editing && team) {
      update.mutate({ name: trimmed, ...common }, { onSuccess: onCreated, onError })
    } else {
      const payload: TeamCreatePayload = { name: trimmed, ...common }
      create.mutate(payload, { onSuccess: onCreated, onError })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'ویرایش تیم' : 'تیم جدید'} maxWidth="sm">
      <div className="flex flex-col gap-[18px] pt-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-name">
            نام تیم <span className="text-red-600 dark:text-red-400">*</span>
          </Label>
          <Input
            id="team-name"
            required
            value={name}
            error={nameError || undefined}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) setNameError('')
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-sport">رشته ورزشی</Label>
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger id="team-sport">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.emoji} {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1 text-[0.78rem] font-bold text-slate-500 dark:text-slate-400">
            سطح دسترسی
          </p>
          <RadioGroup
            value={visibility}
            onValueChange={(v) => setVisibility(v as TeamVisibility)}
            className="flex flex-wrap gap-2"
          >
            {(Object.keys(TEAM_VISIBILITY_LABELS) as TeamVisibility[]).map((v) => (
              <div key={v} className="flex min-h-11 items-center gap-2">
                <RadioGroupItem value={v} id={`team-visibility-${v}`} />
                <Label htmlFor={`team-visibility-${v}`} className="cursor-pointer text-[0.8rem] font-semibold">
                  {TEAM_VISIBILITY_LABELS[v]}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="mt-1 text-xs leading-[1.8] text-slate-500 dark:text-slate-400">
            {VISIBILITY_HINTS[visibility]}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-description">توضیحات</Label>
          <Textarea
            id="team-description"
            rows={2}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[72px]"
          />
        </div>

        {/* آپلود لوگو در این فاز پیاده نشده — در صورت وجود، URL مستقیم تصویر پذیرفته می‌شود */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-logo">نشانی تصویر لوگو (اختیاری)</Label>
          <Input
            id="team-logo"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="mt-1 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            انصراف
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            loading={busy}
            icon={editing ? 'mdi:content-save-outline' : 'mdi:shield-plus-outline'}
          >
            {editing ? 'ذخیره تغییرات' : 'ساخت تیم'}
          </Button>
        </div>
        {editing && (
          <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Icon icon="mdi:information-outline" style={{ width: 14, height: 14 }} />
            تغییر نام فقط توسط کاپیتان یا مدیر تیم ذخیره می‌شود.
          </p>
        )}
      </div>
    </Dialog>
  )
}

export default TeamFormDialog
