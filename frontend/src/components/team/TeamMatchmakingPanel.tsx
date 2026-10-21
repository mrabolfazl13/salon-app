// frontend/src/components/team/TeamMatchmakingPanel.tsx
// حریف‌یابی تیم (P010) — پیشنهادهای سرور بر پایهٔ سطح/منطقه/زمان + ارسال چالش بازی.
// امتیاز را سرور می‌سازد (MatchmakingService)؛ اینجا فقط خواندن و نشان دادن.
// سیگنالِ «بداده» مقدار null دارد و در UI صفر نشان داده نمی‌شود — چون در مخرج
// امتیاز هم حساب نشده است.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Progress } from '@/components/ui/shadcn/progress'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { EmptyBox, ErrorBox, LoadingBox } from '@/components/finance/shared'
import { useMatchSuggestions, useSendChallenge } from '@/hooks/useMatching'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
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
    <div className="flex items-center gap-2">
      <Icon icon={meta.icon} style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
      <p className="min-w-[74px] text-xs font-bold text-slate-500 dark:text-slate-400">
        {meta.label}
      </p>
      <div className="min-w-0 flex-1">
        <Progress
          value={known ? signal.value! * 100 : 0}
          aria-label={`${meta.label}: ${known ? `${toPersianDigits(Math.round(signal.value! * 100))}٪` : 'داده ندارد'}`}
          className={cn(
            'h-[5px] bg-slate-500/[0.16] dark:bg-white/10',
            known ? '[&>div]:bg-emerald-500' : '[&>div]:bg-transparent',
          )}
        />
        <p className="mt-0.5 truncate text-[0.72rem] text-slate-400 dark:text-slate-500">
          {signal.note ?? '—'}
        </p>
      </div>
    </div>
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
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-xs leading-[1.9] text-muted-foreground">
          چالش فقط توافق دو تیم را ثبت می‌کند و برای مدیران حریف اعلان می‌فرستد — رزرو سالن و
          پرداخت در همان جریان همیشگی رزرو انجام می‌شود.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="challenge-message">پیام شما (اختیاری)</Label>
          <Textarea
            id="challenge-message"
            rows={2}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="مثلاً: جمعه عصر، اگر موافقید هماهنگ کنیم…"
            className="min-h-[72px]"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="challenge-date">تاریخ پیشنهادی</Label>
            <Input
              id="challenge-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="challenge-time">ساعت پیشنهادی</Label>
            <Input
              id="challenge-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={send.isPending}>انصراف</Button>
          <Button variant="gradient" loading={send.isPending} onClick={submit} icon="mdi:swords" data-testid="match-challenge-send">
            ارسال چالش
          </Button>
        </div>
      </div>
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
    <div
      data-testid={`match-suggestion-${row.team_id}`}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <div
          role="img"
          aria-label={SPORT_NAME_FA[row.sport] ?? row.sport}
          className="shrink-0 text-2xl leading-none"
        >
          {SPORT_EMOJI[row.sport] ?? '🏅'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[0.92rem] font-black text-slate-900 dark:text-slate-100">
              {row.team_name}
            </p>
            {row.is_official && (
              <span className="inline-flex h-5 items-center rounded-full bg-blue-600/10 px-2 text-[0.68rem] font-bold text-blue-700 dark:text-blue-300">
                رسمی
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[0.74rem] text-slate-500 dark:text-slate-400">
            {[
              `${toPersianDigits(row.member_count)} عضو`,
              row.played ? `${toPersianDigits(row.won)} برد از ${toPersianDigits(row.played)} بازی` : 'بدون سابقۀ بازی',
              row.rank ? `رتبهٔ ${toPersianDigits(row.rank)}` : null,
              row.distance_km !== null ? `${toPersianDigits(row.distance_km)} کیلومتر فاصله` : null,
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
        <div
          className="shrink-0 rounded-xl px-[9px] py-1 text-[0.92rem] font-black"
          style={{ backgroundColor: tone.bg, color: tone.color }}
          aria-label={`امتیاز تطبیق ${toPersianDigits(row.score)} از ۱۰۰`}
        >
          {toPersianDigits(row.score)}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <SignalRow kind="level" signal={row.level} />
        <SignalRow kind="region" signal={row.region} />
        <SignalRow kind="schedule" signal={row.schedule} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {row.has_open_challenge ? (
          <span
            className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-500/[0.12] px-2 text-[0.74rem] font-bold text-amber-700 dark:text-amber-400"
            data-testid={`match-open-challenge-${row.team_id}`}
          >
            <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
            چالش باز دارید
          </span>
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
          <p className="text-[0.72rem] text-slate-400 dark:text-slate-500">
            فقط کاپیتان یا مدیر تیم می‌تواند چالش بفرستد.
          </p>
        )}
      </div>
    </div>
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
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-blue-600/5 p-3">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:swords" style={{ width: 18, height: 18, color: '#2563eb' }} />
          <p className="text-[0.82rem] font-extrabold text-slate-800 dark:text-slate-200">
            حریف متناسب با تیم شما
          </p>
        </div>
        <p className="mt-1 text-xs leading-[1.9] text-slate-600 dark:text-slate-400">
          امتیاز از سه نشانه ساخته می‌شود: سطح نتایج بازی‌ها، نزدیکی سالن اصلی و هم‌پوشانی
          بازه‌های زمانی رزروها. تیمی که داده‌ای ندارد جریمه نمی‌شود.
        </p>
        {header && (
          <p data-testid="match-basis" className="mt-1 text-[0.72rem] text-slate-500 dark:text-slate-400">{header}</p>
        )}
      </div>

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
    </div>
  )
}

export default TeamMatchmakingPanel
