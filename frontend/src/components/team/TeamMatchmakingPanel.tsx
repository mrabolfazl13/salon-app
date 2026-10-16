// frontend/src/components/team/TeamMatchmakingPanel.tsx
// حریف‌یابی تیم (P010) — پیشنهادهای سرور بر پایهٔ سطح/منطقه/زمان + ارسال چالش بازی.
// امتیاز را سرور می‌سازد (MatchmakingService)؛ اینجا فقط خواندن و نشان دادن.
// سیگنالِ «بداده» مقدار null دارد و در UI صفر نشان داده نمی‌شود — چون در مخرج
// امتیاز هم حساب نشده است.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Card, Chip, LinearProgress, Paper, TextField, Typography } from '@mui/material'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { EmptyBox, ErrorBox, LoadingBox } from '@/components/finance/shared'
import { useMatchSuggestions, useSendChallenge } from '@/hooks/useMatching'
import { useToast } from '@/hooks/useToast'
import { toPersianDigits } from '@/lib/jalali'
import type { MatchSuggestion, SignalScore } from '@/types/matching'
import type { Team } from '@/types/team'
import { SPORT_EMOJI, SPORT_NAME_FA, getTeamError } from './shared'

const SUGGESTION_LIMIT = 20

const SIGNAL_META: Record<'level' | 'region' | 'schedule', { icon: string; label: string }> = {
  level: { icon: 'mdi:chart-line', label: 'سطح بازی' },
  region: { icon: 'mdi:map-marker-radius-outline', label: 'نزدیکی سالن' },
  schedule: { icon: 'mdi:clock-fast', label: 'هماهنگی زمانی' },
}

function scoreTone(score: number): { color: string; bg: string } {
  if (score >= 80) return { color: '#047857', bg: 'rgba(16,185,129,0.14)' }
  if (score >= 55) return { color: '#b45309', bg: 'rgba(245,158,11,0.14)' }
  return { color: '#334155', bg: 'rgba(100,116,139,0.14)' }
}

const SignalRow: React.FC<{ kind: 'level' | 'region' | 'schedule'; signal: SignalScore }> = ({
  kind,
  signal,
}) => {
  const meta = SIGNAL_META[kind]
  const known = signal.value !== null
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon icon={meta.icon} style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', minWidth: 74, fontWeight: 700 }}>
        {meta.label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <LinearProgress
          variant="determinate"
          value={known ? signal.value! * 100 : 0}
          aria-label={`${meta.label}: ${known ? `${toPersianDigits(Math.round(signal.value! * 100))}٪` : 'داده ندارد'}`}
          sx={{
            height: 5,
            borderRadius: 999,
            bgcolor: 'rgba(100,116,139,0.16)',
            '& .MuiLinearProgress-bar': { bgcolor: known ? '#10b981' : 'transparent' },
          }}
        />
        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }} noWrap>
          {signal.note ?? '—'}
        </Typography>
      </Box>
    </Box>
  )
}

const ChallengeDialog: React.FC<{
  team: Team
  target: MatchSuggestion | null
  onClose: () => void
}> = ({ team, target, onClose }) => {
  const toast = useToast()
  const send = useSendChallenge()
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const submit = () => {
    if (!target) return
    const timeValue = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : undefined
    send.mutate(
      {
        from_team_id: team.id,
        to_team_id: target.team_id,
        message: message.trim() || undefined,
        proposed_date: date || undefined,
        proposed_time: timeValue,
      },
      {
        onSuccess: (row) => {
          toast.success(`چالش بازی به «${row.to_team_name}» ارسال شد.`)
          setMessage('')
          setDate('')
          setTime('')
          onClose()
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Dialog open={!!target} onClose={onClose} title={target ? `چالش بازی با «${target.team_name}»` : ''} maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.9 }}>
          چالش فقط توافق دو تیم را ثبت می‌کند و برای مدیران حریف اعلان می‌فرستد — رزرو سالن و
          پرداخت در همان جریان همیشگی رزرو انجام می‌شود.
        </Typography>
        <TextField
          label="پیام شما (اختیاری)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="مثلاً: جمعه عصر، اگر موافقید هماهنگ کنیم…"
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            label="تاریخ پیشنهادی"
            type="date"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label="ساعت پیشنهادی"
            type="time"
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={send.isPending}>انصراف</Button>
          <Button variant="gradient" loading={send.isPending} onClick={submit} icon="mdi:swords" data-testid="match-challenge-send">
            ارسال چالش
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

const SuggestionCard: React.FC<{
  row: MatchSuggestion
  canChallenge: boolean
  onChallenge: (row: MatchSuggestion) => void
}> = ({ row, canChallenge, onChallenge }) => {
  const tone = scoreTone(row.score)
  return (
    <Card
      data-testid={`match-suggestion-${row.team_id}`}
      sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25, borderRadius: '16px' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          role="img"
          aria-label={SPORT_NAME_FA[row.sport] ?? row.sport}
          sx={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}
        >
          {SPORT_EMOJI[row.sport] ?? '🏅'}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.92rem', color: '#0f172a' }} noWrap>
              {row.team_name}
            </Typography>
            {row.is_official && (
              <Chip
                label="رسمی"
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(37,99,235,0.10)', color: '#2563eb' }}
              />
            )}
          </Box>
          <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mt: 0.25 }}>
            {[
              `${toPersianDigits(row.member_count)} عضو`,
              row.played ? `${toPersianDigits(row.won)} برد از ${toPersianDigits(row.played)} بازی` : 'بدون سابقۀ بازی',
              row.rank ? `رتبهٔ ${toPersianDigits(row.rank)}` : null,
              row.distance_km !== null ? `${toPersianDigits(row.distance_km)} کیلومتر فاصله` : null,
            ]
              .filter(Boolean)
              .join(' • ')}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.1,
            py: 0.4,
            borderRadius: '12px',
            bgcolor: tone.bg,
            color: tone.color,
            fontWeight: 900,
            fontSize: '0.92rem',
            flexShrink: 0,
          }}
          aria-label={`امتیاز تطبیق ${toPersianDigits(row.score)} از ۱۰۰`}
        >
          {toPersianDigits(row.score)}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <SignalRow kind="level" signal={row.level} />
        <SignalRow kind="region" signal={row.region} />
        <SignalRow kind="schedule" signal={row.schedule} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {row.has_open_challenge ? (
          <Chip
            label="چالش باز دارید"
            size="small"
            data-testid={`match-open-challenge-${row.team_id}`}
            icon={<Icon icon="mdi:clock-outline" />}
            sx={{ height: 24, fontSize: '0.74rem', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.12)', color: 'warning.dark' }}
          />
        ) : (
          canChallenge && (
            <Button
              size="sm"
              variant="gradient"
              icon="mdi:swords"
              data-testid={`match-challenge-open-${row.team_id}`}
              onClick={() => onChallenge(row)}
            >
              چالش بازی
            </Button>
          )
        )}
        {!canChallenge && (
          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            فقط کاپیتان یا مدیر تیم می‌تواند چالش بفرستد.
          </Typography>
        )}
      </Box>
    </Card>
  )
}

const TeamMatchmakingPanel: React.FC<{ team: Team; canChallenge: boolean }> = ({
  team,
  canChallenge,
}) => {
  const suggestionsQ = useMatchSuggestions(team.id, { limit: SUGGESTION_LIMIT }, true)
  const [target, setTarget] = useState<MatchSuggestion | null>(null)

  const basis = suggestionsQ.data?.basis
  const header = useMemo(() => {
    if (!basis) return null
    return `${toPersianDigits(basis.pool)} حریف بررسی شده • ${toPersianDigits(basis.results_used)} تیم با سابقۀ بازی • ${toPersianDigits(basis.bookings_scanned)} رزرو تیمی برای منطقه و زمان`
  }, [basis])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'rgba(37,99,235,0.05)' }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:swords" style={{ width: 18, height: 18, color: '#2563eb' }} />
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
            حریف متناسب با تیم شما
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#475569', mt: 0.5, lineHeight: 1.9 }}>
          امتیاز از سه نشانه ساخته می‌شود: سطح نتایج بازی‌ها، نزدیکی سالن اصلی و هم‌پوشانی
          بازه‌های زمانی رزروها. تیمی که داده‌ای ندارد جریمه نمی‌شود.
        </Typography>
        {header && (
          <Typography data-testid="match-basis" sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.5 }}>{header}</Typography>
        )}
      </Paper>

      {suggestionsQ.isPending && <LoadingBox />}
      {suggestionsQ.isError && (
        <ErrorBox message={getTeamError(suggestionsQ.error)} onRetry={() => suggestionsQ.refetch()} />
      )}
      {!suggestionsQ.isPending && !suggestionsQ.isError && (suggestionsQ.data?.items.length ?? 0) === 0 && (
        <EmptyBox
          icon="mdi:handshake-outline"
          title="حریفی پیدا نشد"
          text="تیم عمومی هم‌ورزشی در سامانه نیست؛ ورزش تیمتان را بررسی کنید."
        />
      )}

      {suggestionsQ.data?.items.map((row) => (
        <SuggestionCard key={row.team_id} row={row} canChallenge={canChallenge} onChallenge={setTarget} />
      ))}

      <ChallengeDialog team={team} target={target} onClose={() => setTarget(null)} />
    </Box>
  )
}

export default TeamMatchmakingPanel
