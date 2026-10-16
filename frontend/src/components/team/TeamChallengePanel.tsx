// frontend/src/components/team/TeamChallengePanel.tsx
// صندوق چالش‌های بازی (P010) — inbox/outbox با پذیرش، رد و پس‌گرفتن.
// دروازه همان سرور است: پذیرش/رد فقط مدیر تیم مقصد، پس‌گرفتن فقط تیم فرستنده و
// فقط پیش از پاسخ. اینجا دکمه بر اساس direction و status پنهان می‌شود، نه مجوز.

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Card, TextField, Typography } from '@mui/material'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <TextField
          label="دلیل (اختیاری — برای کاپیتان حریف نمایش داده می‌شود)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثلاً: آن هفته میزبان هستیم…"
        />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={decline.isPending}>انصراف</Button>
          <Button variant="outline" loading={decline.isPending} onClick={submit} icon="mdi:close" data-testid="challenge-decline-confirm">
            رد چالش
          </Button>
        </Box>
      </Box>
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
    <Card
      data-testid={`challenge-card-${row.id}`}
      sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: '16px' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon="mdi:swords" style={{ width: 18, height: 18, color: '#2563eb', flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', minWidth: 0 }} noWrap>
          {`بازی با «${opponent}»`}
        </Typography>
        <Box
          sx={{
            mr: 'auto',
            px: 1,
            py: 0.25,
            borderRadius: '10px',
            bgcolor: tone.bg,
            color: tone.color,
            fontSize: '0.72rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {STATUS_FA[row.status]}
        </Box>
      </Box>

      <Typography sx={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.9 }}>
        {row.message || 'بدون پیام'}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, fontSize: '0.72rem', color: '#64748b' }}>
        <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>
          {`فرستنده: ${row.created_by_name ?? '—'}`}
        </Typography>
        {proposal && (
          <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            {`پیشنهاد: ${proposal}`}
          </Typography>
        )}
        {isOpen && (
          <Typography component="span" sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {`مهلت پاسخ تا ${formatJalaliDateTime(row.expires_at)}`}
          </Typography>
        )}
        {row.response_note && (
          <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            {`پاسخ: ${row.response_note}`}
          </Typography>
        )}
        {row.accepted_by_name && (
          <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            {`تأییدکننده: ${row.accepted_by_name}`}
          </Typography>
        )}
      </Box>

      {isOpen && canRespond && row.direction === 'inbox' && (
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', pt: 0.25 }}>
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
          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', alignSelf: 'center' }}>
            پذیرش رزرو نمی‌سازد؛ سالن را جدا رزرو کنید.
          </Typography>
        </Box>
      )}

      {isOpen && canRespond && row.direction === 'outbox' && (
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap', pt: 0.25 }}>
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
        </Box>
      )}
    </Card>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
        <Box sx={{ mr: 'auto' }}>
          <Button
            size="sm"
            variant={pendingOnly ? 'gradient' : 'outline'}
            icon="mdi:filter-variant"
            data-testid="challenge-filter-pending"
            onClick={() => setPendingOnly((p) => !p)}
          >
            فقط در انتظار پاسخ
          </Button>
        </Box>
      </Box>

      {!canRespond && (
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
          شما عضو این تیم هستید؛ فقط کاپیتان و مدیران می‌توانند به چالش پاسخ دهند یا آن را پس بگیرند.
        </Typography>
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
    </Box>
  )
}

export default TeamChallengePanel
