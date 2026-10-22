// frontend/src/components/team/TeamChallengePanel.tsx
// صندوق چالش‌های بازی (P010) — inbox/outbox با پذیرش، رد و پس‌گرفتن.
// دروازه همان سرور است: پذیرش/رد فقط مدیر تیم مقصد، پس‌گرفتن فقط تیم فرستنده و
// فقط پیش از پاسخ. اینجا دکمه بر اساس direction و status پنهان می‌شود، نه مجوز.

import React, { useState } from 'react'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { EmptyBox, ErrorBox, LoadingBox } from '@/components/finance/shared'
import {
  useAcceptChallenge, useCancelChallenge, useChallenges, useDeclineChallenge,
} from '@/hooks/useMatching'
import { useToast } from '@/hooks/useToast'
import { formatJalaliDate, formatJalaliDateTime } from '@/lib/jalali'
import { formatTimeFa } from '@/lib/utils'
import type { ChallengeRow, ChallengeStatus } from '@/types/matching'
import { getTeamError } from './shared'

const STATUS_FA: Record<ChallengeStatus, string> = {
  pending: 'در انتظار پاسخ',
  accepted: 'پذیرفته شد',
  declined: 'رد شد',
  cancelled: 'پس گرفته شد',
  expired: 'مهلت تمام شد',
}

const STATUS_TONE: Record<ChallengeStatus, { color: string; bg: string }> = {
  pending: { color: '#b45309', bg: 'rgba(245,158,11,0.14)' },
  accepted: { color: '#047857', bg: 'rgba(16,185,129,0.14)' },
  declined: { color: '#334155', bg: 'rgba(100,116,139,0.14)' },
  cancelled: { color: '#334155', bg: 'rgba(100,116,139,0.14)' },
  expired: { color: '#b91c1c', bg: 'rgba(239,68,68,0.12)' },
}

const VIEWS = [
  { key: 'inbox', label: 'ورودی', icon: 'mdi:tray-arrow-down' },
  { key: 'outbox', label: 'ارسال‌شده', icon: 'mdi:tray-arrow-up' },
  { key: 'all', label: 'همه', icon: 'mdi:view-grid-outline' },
] as const

type ViewKey = (typeof VIEWS)[number]['key']

const DeclineDialog: React.FC<{ row: ChallengeRow | null; onClose: () => void }> = ({
  row,
  onClose,
}) => {
  const toast = useToast()
  const decline = useDeclineChallenge()
  const [note, setNote] = useState('')

  const submit = () => {
    if (!row) return
    decline.mutate({ id: row.id, note: note.trim() || undefined }, {
      onSuccess: () => {
        toast.success(`چالش «${row.from_team_name}» رد شد.`)
        setNote('')
        onClose()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  return (
    <Dialog open={!!row} onClose={onClose} title={row ? `رد چالش «${row.from_team_name}»` : ''} maxWidth="xs">
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="challenge-decline-note">دلیل (اختیاری — برای کاپیتان حریف نمایش داده می‌شود)</Label>
          <Textarea
            id="challenge-decline-note"
            rows={2}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: آن هفته میزبان هستیم…"
            className="min-h-[72px]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={decline.isPending}>انصراف</Button>
          <Button variant="outline" loading={decline.isPending} onClick={submit} icon="mdi:close" data-testid="challenge-decline-confirm">
            رد چالش
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

const ChallengeCard: React.FC<{
  row: ChallengeRow
  canRespond: boolean
  onDecline: (row: ChallengeRow) => void
}> = ({ row, canRespond, onDecline }) => {
  const toast = useToast()
  const accept = useAcceptChallenge()
  const cancel = useCancelChallenge()
  const tone = STATUS_TONE[row.status]
  const isOpen = row.status === 'pending'

  const proposal = [
    row.proposed_date ? formatJalaliDate(row.proposed_date, { format: 'numeric' }) : null,
    row.proposed_time ? formatTimeFa(row.proposed_time) : null,
    row.proposed_venue_name,
  ].filter(Boolean).join(' • ')

  const opponent = row.direction === 'inbox' ? row.from_team_name : row.to_team_name

  return (
    <div
      data-testid={`challenge-card-${row.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Icon icon="mdi:swords" style={{ width: 18, height: 18, color: '#2563eb', flexShrink: 0 }} />
        <p className="min-w-0 truncate text-[0.9rem] font-black text-slate-900 dark:text-slate-100">
          {`بازی با «${opponent}»`}
        </p>
        <span
          className="ms-auto whitespace-nowrap rounded-[10px] px-2 py-0.5 text-[0.72rem] font-extrabold"
          style={{ backgroundColor: tone.bg, color: tone.color }}
        >
          {STATUS_FA[row.status]}
        </span>
      </div>

      <p className="text-[0.76rem] leading-[1.9] text-slate-600 dark:text-slate-300">
        {row.message || 'بدون پیام'}
      </p>

      <div className="flex flex-wrap gap-2.5 text-[0.72rem] text-slate-500 dark:text-slate-400">
        <span className="text-[0.72rem] text-slate-500 dark:text-slate-400">
          {`فرستنده: ${row.created_by_name ?? '—'}`}
        </span>
        {proposal && (
          <span className="text-[0.72rem] text-slate-500 dark:text-slate-400">
            {`پیشنهاد: ${proposal}`}
          </span>
        )}
        {isOpen && (
          <span className="text-[0.72rem] text-slate-400 dark:text-slate-500">
            {`مهلت پاسخ تا ${formatJalaliDateTime(row.expires_at)}`}
          </span>
        )}
        {row.response_note && (
          <span className="text-[0.72rem] text-slate-500 dark:text-slate-400">
            {`پاسخ: ${row.response_note}`}
          </span>
        )}
        {row.accepted_by_name && (
          <span className="text-[0.72rem] text-slate-500 dark:text-slate-400">
            {`تأییدکننده: ${row.accepted_by_name}`}
          </span>
        )}
      </div>

      {isOpen && canRespond && row.direction === 'inbox' && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button
            size="sm"
            variant="gradient"
            icon="mdi:check-bold"
            loading={accept.isPending}
            data-testid={`challenge-accept-${row.id}`}
            onClick={() =>
              accept.mutate({ id: row.id }, {
                onSuccess: () => toast.success(`چالش «${row.from_team_name}» پذیرفته شد.`),
                onError: (err) => toast.error(getTeamError(err)),
              })
            }
          >
            پذیرفتن
          </Button>
          <Button size="sm" variant="outline" icon="mdi:close" data-testid={`challenge-decline-open-${row.id}`} onClick={() => onDecline(row)}>
            رد
          </Button>
          <p className="self-center text-[0.7rem] text-slate-400 dark:text-slate-500">
            پذیرش رزرو نمی‌سازد؛ سالن را جدا رزرو کنید.
          </p>
        </div>
      )}

      {isOpen && canRespond && row.direction === 'outbox' && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Button
            size="sm"
            variant="outline"
            icon="mdi:undo-variant"
            loading={cancel.isPending}
            data-testid={`challenge-cancel-${row.id}`}
            onClick={() =>
              cancel.mutate(row.id, {
                onSuccess: () => toast.success('چالش پس گرفته شد.'),
                onError: (err) => toast.error(getTeamError(err)),
              })
            }
          >
            پس‌گرفتن چالش
          </Button>
        </div>
      )}
    </div>
  )
}

const TeamChallengePanel: React.FC<{ teamId: number; canRespond: boolean }> = ({
  teamId,
  canRespond,
}) => {
  const [view, setView] = useState<ViewKey>('inbox')
  const [pendingOnly, setPendingOnly] = useState(true)
  const [declineTarget, setDeclineTarget] = useState<ChallengeRow | null>(null)

  const challengesQ = useChallenges({
    team_id: teamId,
    direction: view,
    status: pendingOnly ? 'pending' : undefined,
  })

  const rows = challengesQ.data?.items ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <Button
            key={v.key}
            size="sm"
            variant={view === v.key ? 'gradient' : 'outline'}
            icon={v.icon}
            data-testid={`challenge-view-${v.key}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </Button>
        ))}
        <div className="ms-auto">
          <Button
            size="sm"
            variant={pendingOnly ? 'gradient' : 'outline'}
            icon="mdi:filter-variant"
            data-testid="challenge-filter-pending"
            onClick={() => setPendingOnly((p) => !p)}
          >
            فقط در انتظار پاسخ
          </Button>
        </div>
      </div>

      {!canRespond && (
        <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
          شما عضو این تیم هستید؛ فقط کاپیتان و مدیران می‌توانند به چالش پاسخ دهند یا آن را پس بگیرند.
        </p>
      )}

      {challengesQ.isPending && <LoadingBox />}
      {challengesQ.isError && (
        <ErrorBox message={getTeamError(challengesQ.error)} onRetry={() => challengesQ.refetch()} />
      )}
      {!challengesQ.isPending && !challengesQ.isError && rows.length === 0 && (
        <EmptyBox
          icon="mdi:swords-variant"
          title="چالشی وجود ندارد"
          text={
            pendingOnly
              ? 'چالش در انتظار پاسخی نیست. فیلتر «فقط در انتظار پاسخ» را بردارید تا تاریخچه را ببینید.'
              : 'از بخش «حریف‌یابی» می‌توانید به یک تیم هم‌سطح چالش بازی بفرستید.'
          }
        />
      )}

      {rows.map((row) => (
        <ChallengeCard key={row.id} row={row} canRespond={canRespond} onDecline={setDeclineTarget} />
      ))}

      <DeclineDialog row={declineTarget} onClose={() => setDeclineTarget(null)} />
    </div>
  )
}

export default TeamChallengePanel
