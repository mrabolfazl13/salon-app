// frontend/src/components/team/TeamFormDialog.tsx
// ساخت/ویرایش تیم — نام، ورزش، سطح دسترسی، توضیحات (لوگو: آپلود مدیر گیت است — فعلاً URL اختیاری)

import React, { useEffect, useState } from 'react'
import { Box, MenuItem, Radio, FormControlLabel, RadioGroup, TextField, Typography } from '@mui/material'
import { Icon } from '@iconify/react'

import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 0.5 }}>
        <TextField
          label="نام تیم"
          size="small"
          required
          fullWidth
          value={name}
          error={!!nameError}
          helperText={nameError || undefined}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError('')
          }}
        />
        <TextField
          select
          label="رشته ورزشی"
          size="small"
          fullWidth
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        >
          {SPORTS.map((s) => (
            <MenuItem key={s.key} value={s.key}>
              {s.emoji} {s.label}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', mb: 0.5 }}>
            سطح دسترسی
          </Typography>
          <RadioGroup
            row
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as TeamVisibility)}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {(Object.keys(TEAM_VISIBILITY_LABELS) as TeamVisibility[]).map((v) => (
              <FormControlLabel
                key={v}
                value={v}
                control={<Radio size="small" />}
                label={
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {TEAM_VISIBILITY_LABELS[v]}
                  </Typography>
                }
                sx={{ mr: 0.5 }}
              />
            ))}
          </RadioGroup>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5, lineHeight: 1.8 }}>
            {VISIBILITY_HINTS[visibility]}
          </Typography>
        </Box>

        <TextField
          label="توضیحات"
          size="small"
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* آپلود لوگو در این فاز پیاده نشده — در صورت وجود، URL مستقیم تصویر پذیرفته می‌شود */}
        <TextField
          label="نشانی تصویر لوگو (اختیاری)"
          size="small"
          fullWidth
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 0.5 }}>
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
        </Box>
        {editing && (
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Icon icon="mdi:information-outline" style={{ width: 14, height: 14 }} />
            تغییر نام فقط توسط کاپیتان یا مدیر تیم ذخیره می‌شود.
          </Typography>
        )}
      </Box>
    </Dialog>
  )
}

export default TeamFormDialog