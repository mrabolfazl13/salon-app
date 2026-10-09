// frontend/src/components/team/TeamDuesPanel.tsx
// Ø­ØµÙ‡â€ŒÙ‡Ø§ (Ø³Ù‡Ù…/Ø­Ù‚â€ŒØ¹Ø¶ÙˆÛŒØª) â€” Ù„ÛŒØ³Øª ØµÙØ­Ù‡â€ŒØ¨Ù†Ø¯ÛŒâ€ŒØ´Ø¯Ù‡ + ÙÛŒÙ„ØªØ± ÙˆØ¶Ø¹ÛŒØªØŒ Ù¾Ø±Ø¯Ø§Ø®Øª Ø®ÙˆØ¯ÛŒ/ÙˆØµÙˆÙ„ Ù…Ø¯ÛŒØ±ØŒ
// Ø§ÛŒØ¬Ø§Ø¯ Ø­ØµÙ‡ Ø³Ø±Ø§Ù†Ù‡ (Ú©Ø§Ù¾ÛŒØªØ§Ù†/Ù…Ø¯ÛŒØ±) Ùˆ Ø§Ø¨Ø·Ø§Ù„ Ø¨Ø§ Ø¯Ù„ÛŒÙ„ â€” Ù‡Ù…Ù‡ Ù…Ø¨Ø§Ù„Øº Ø±ÛŒØ§Ù„Ù Ø¹Ø¯Ø¯ØµØ­ÛŒØ­

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box,
  Button as MuiButton,
  Chip,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'

import type { DuesPayMethod, Team, TeamDue, TeamMember } from '@/types/team'
import { DUE_METHOD_LABELS } from '@/types/team'
import {
  useGenerateTeamDues,
  usePayTeamDue,
  useTeamDues,
  useVoidTeamDue,
} from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { EmptyBox, ErrorBox, LoadingBox, formatRial, parseAmountInput } from '@/components/finance/shared'
import { formatJalaliDate, getTodayISO, toPersianDigits } from '@/lib/jalali'
import { getTeamError, DueStatusChip } from './shared'

const PAGE_SIZE = 20
const ALL = 'all' as const
type StatusFilter = typeof ALL | 'pending' | 'paid' | 'voided' | 'overdue'

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: ALL, label: 'Ù‡Ù…Ù‡' },
  { value: 'pending', label: 'Ù¾Ø±Ø¯Ø§Ø®Øªâ€ŒÙ†Ø´Ø¯Ù‡' },
  { value: 'overdue', label: 'Ù…Ø¹ÙˆÙ‚' },
  { value: 'paid', label: 'Ù¾Ø±Ø¯Ø§Ø®Øªâ€ŒØ´Ø¯Ù‡' },
  { value: 'voided', label: 'Ø¨Ø§Ø·Ù„' },
]

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ù¾Ø±Ø¯Ø§Ø®Øª/ÙˆØµÙˆÙ„ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DuePayDialog: React.FC<{
  team: Team
  due: TeamDue | null
  onClose: () => void
  isCollecting: boolean
}> = ({ team, due, onClose, isCollecting }) => {
  const toast = useToast()
  const pay = usePayTeamDue(team.id)
  const [method, setMethod] = useState<DuesPayMethod>('cash')
  const [reference, setReference] = useState('')

  const open = !!due
  const handlePay = () => {
    if (!due) return
    pay.mutate(
      { dueId: due.id, data: { method, reference: reference.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(isCollecting ? 'Ø³Ù‡Ù… ÙˆØµÙˆÙ„ Ø´Ø¯' : 'Ø³Ù‡Ù… Ù¾Ø±Ø¯Ø§Ø®Øª Ø´Ø¯')
          setReference('')
          onClose()
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title={isCollecting ? 'ÙˆØµÙˆÙ„ Ø­ØµÙ‡' : 'Ù¾Ø±Ø¯Ø§Ø®Øª Ø­ØµÙ‡'} maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        {due && (
          <Box sx={{ px: 2, py: 1.5, borderRadius: '14px', bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{due.title}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.25 }} dir="rtl">
              {`${formatRial(due.amount)} â€” Ø³Ø±Ø±Ø³ÛŒØ¯ ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
          ØªÙˆØ¬Ù‡: Ø±ÙˆØ´ Â«Ø¯Ø±Ú¯Ø§Ù‡Â» Ø¯Ø± Ø§ÛŒÙ† Ù†Ø³Ø®Ù‡ Ù‡Ù…Ø§Ù†Ù†Ø¯ Ø¨Ú©â€ŒØ§Ù†Ø¯ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ù‚Ø·Ø¹ÛŒ Ø«Ø¨Øª Ù…ÛŒâ€ŒØ´ÙˆØ¯ (Ù¾Ø±Ø¯Ø§Ø®Øª Ø¨Ø§Ù†Ú©ÛŒ ÙˆØ§Ù‚Ø¹ÛŒ Ø§Ù†Ø¬Ø§Ù… Ù†Ù…ÛŒâ€ŒØ´ÙˆØ¯) â€” Ø¨Ø±Ø§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ù„ÛŒÙ†Ú© Ù¾Ø±Ø¯Ø§Ø®Øª Ø§Ø² flow Ø±Ø²Ø±ÙˆÙ‡Ø§ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ú©Ù†ÛŒØ¯.
        </Typography>
        <TextField
          select
          label="Ø±ÙˆØ´"
          size="small"
          value={method}
          onChange={(e) => setMethod(e.target.value as DuesPayMethod)}
        >
          {(Object.keys(DUE_METHOD_LABELS) as DuesPayMethod[]).map((m) => (
            <MenuItem key={m} value={m}>{DUE_METHOD_LABELS[m]}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Ø´Ù†Ø§Ø³Ù‡/Ú©Ø¯ Ù¾ÛŒÚ¯ÛŒØ±ÛŒ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)"
          size="small"
          fullWidth
          value={reference}
          slotProps={{ htmlInput: { maxLength: 120 } }}
          onChange={(e) => setReference(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={pay.isPending}>Ø§Ù†ØµØ±Ø§Ù</Button>
          <Button variant="gradient" loading={pay.isPending} onClick={handlePay} icon="mdi:cash-check">
            {isCollecting ? 'Ø«Ø¨Øª ÙˆØµÙˆÙ„' : 'Ù¾Ø±Ø¯Ø§Ø®Øª'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ø§ÛŒØ¬Ø§Ø¯ Ø­ØµÙ‡ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DuesGenerateDialog: React.FC<{
  team: Team
  members: TeamMember[]
  open: boolean
  onClose: () => void
}> = ({ team, members, open, onClose }) => {
  const toast = useToast()
  const generate = useGenerateTeamDues(team.id)
  const active = useMemo(() => members.filter((m) => m.status === 'active'), [members])
  const [amountStr, setAmountStr] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selected, setSelected] = useState<number[] | null>(null) // null = Ù‡Ù…Ù‡ Ø§Ø¹Ø¶Ø§ÛŒ ÙØ¹Ø§Ù„
  const [fieldError, setFieldError] = useState('')

  const targets = selected ?? active.map((m) => m.user_id)
  const allSelected = selected === null || selected.length === active.length

  const toggle = (userId: number) => {
    const current = selected ?? active.map((m) => m.user_id)
    const next = current.includes(userId) ? current.filter((u) => u !== userId) : [...current, userId]
    setSelected(next.length === active.length ? null : next)
  }

  const handleSubmit = () => {
    const amount = parseAmountInput(amountStr)
    if (!Number.isInteger(amount) || amount <= 0) {
      setFieldError('Ù…Ø¨Ù„Øº Ø±Ø§ Ø¨Ù‡ Ø±ÛŒØ§Ù„ Ùˆ Ø¨Ø²Ø±Ú¯â€ŒØªØ± Ø§Ø² ØµÙØ± ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.')
      return
    }
    if (title.trim().length < 2) {
      setFieldError('Ø¹Ù†ÙˆØ§Ù† Ø­ØµÙ‡ Ø­Ø¯Ø§Ù‚Ù„ Û² Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯.')
      return
    }
    if (!dueDate) {
      setFieldError('ØªØ§Ø±ÛŒØ® Ø³Ø±Ø±Ø³ÛŒØ¯ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.')
      return
    }
    if (targets.length === 0) {
      setFieldError('Ø­Ø¯Ø§Ù‚Ù„ ÛŒÚ© Ø¹Ø¶Ùˆ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.')
      return
    }
    generate.mutate(
      {
        amount,
        title: title.trim(),
        due_date: dueDate,
        member_user_ids: allSelected ? undefined : targets,
      },
      {
        onSuccess: (res) => {
          toast.success(`${toPersianDigits(res.created)} Ø­ØµÙ‡ Ø³Ø§Ø®ØªÙ‡ Ø´Ø¯${res.skipped ? ` Ùˆ ${toPersianDigits(res.skipped)} Ù…ÙˆØ±Ø¯ ØªÚ©Ø±Ø§Ø±ÛŒ Ø±Ø¯ Ø´Ø¯` : ''}.`)
          setAmountStr('')
          setTitle('')
          setDueDate('')
          setSelected(null)
          setFieldError('')
          onClose()
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title="Ø§ÛŒØ¬Ø§Ø¯ Ø­ØµÙ‡ Ø¨Ø±Ø§ÛŒ Ø§Ø¹Ø¶Ø§" maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Ù…Ø¨Ù„Øº Ø³Ø±Ø§Ù†Ù‡â€ŒÛŒ Ù‡Ø± Ø¹Ø¶Ùˆ Ø§Ø³Øª Ùˆ Ø¨Ø±Ø§ÛŒ Ù‡Ù…Ù‡â€ŒÛŒ Ø§Ø¹Ø¶Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ÛŒ (Ù¾ÛŒØ´â€ŒÙØ±Ø¶: Ù‡Ù…Ù‡) Ø¨Ù‡ ÛŒÚ©ÛŒ Ø§Ø² Ù‡Ù…ÛŒÙ† Ù…Ø¨Ù„Øº Ø³Ø§Ø®ØªÙ‡ Ù…ÛŒâ€ŒØ´ÙˆØ¯Ø› Ú©Ø§Ù¾ÛŒØªØ§Ù† Ù‡Ù… Ø´Ø§Ù…Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯.
        </Typography>
        <TextField
          label="Ø¹Ù†ÙˆØ§Ù† Ø­ØµÙ‡"
          size="small"
          required
          fullWidth
          value={title}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ù…Ø«Ù„Ø§Ù‹: Ø³Ù‡Ù… Ù‡ÙØªÙ‡ â€” Ø³Ø§Ù„Ù† Ø§Ù†Ù‚Ù„Ø§Ø¨"
        />
        <TextField
          label="Ù…Ø¨Ù„Øº Ø³Ø±Ø§Ù†Ù‡ (Ø±ÛŒØ§Ù„)"
          size="small"
          required
          fullWidth
          value={amountStr}
          onChange={(e) => { setAmountStr(e.target.value); setFieldError('') }}
          placeholder="ÛµÛ°Û°Ù¬Û°Û°Û°"
        />
        <PersianDatePicker
          label="Ø³Ø±Ø±Ø³ÛŒØ¯"
          size="small"
          value={dueDate}
          onChange={setDueDate}
          min={getTodayISO()}
          clearable={false}
        />
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', mb: 0.5 }}>
            Ø§Ø¹Ø¶Ø§ ({toPersianDigits(targets.length)} Ù†ÙØ±)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 160, overflowY: 'auto' }}>
            {active.map((m) => {
              const on = allSelected || (selected ?? []).includes(m.user_id)
              return (
                <Chip
                  key={m.id}
                  size="small"
                  label={m.full_name ?? `Ú©Ø§Ø±Ø¨Ø± ${m.user_id}`}
                  onClick={() => toggle(m.user_id)}
                  icon={<Icon icon={on ? 'mdi:check-circle' : 'mdi:circle-outline'} style={{ width: 14, height: 14 }} />}
                  sx={{
                    fontWeight: 600,
                    bgcolor: on ? 'rgba(37,99,235,0.10)' : 'rgba(15,23,42,0.04)',
                    color: on ? '#2563eb' : '#64748b',
                  }}
                />
              )
            })}
          </Box>
        </Box>
        {fieldError && <Typography sx={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>{fieldError}</Typography>}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={generate.isPending}>Ø§Ù†ØµØ±Ø§Ù</Button>
          <Button variant="gradient" loading={generate.isPending} onClick={handleSubmit} icon="mdi:plus-circle-outline">
            Ø³Ø§Ø®Øª Ø­ØµÙ‡â€ŒÙ‡Ø§
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Ù¾Ù†Ù„ Ø§ØµÙ„ÛŒ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TeamDuesPanel: React.FC<{ team: Team; members: TeamMember[]; isManager: boolean }> = ({
  team,
  members,
  isManager,
}) => {
  const me = useAuthStore((s) => s.user)
  const toast = useToast()
  const [status, setStatus] = useState<StatusFilter>(ALL)
  const [page, setPage] = useState(1)
  const [payTarget, setPayTarget] = useState<TeamDue | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<TeamDue | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const voidDue = useVoidTeamDue(team.id)

  const filters = useMemo(
    () => ({
      status: status === ALL ? undefined : status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [status, page],
  )
  const duesQ = useTeamDues(team.id, filters)
  const items = duesQ.data?.items ?? []
  const total = duesQ.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const canPay = (due: TeamDue) => !due.is_paid && !due.is_voided && (due.user_id === me?.id || isManager)
  const isCollecting = (due: TeamDue) => due.user_id !== me?.id

  const handleVoid = () => {
    if (!voidTarget) return
    voidDue.mutate(
      { dueId: voidTarget.id, reason: voidReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Ø­ØµÙ‡ Ø¨Ø§Ø·Ù„ Ø´Ø¯.')
          setVoidTarget(null)
          setVoidReason('')
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {STATUS_CHIPS.map((s) => (
            <MuiButton
              key={s.value}
              size="small"
              variant={status === s.value ? 'contained' : 'outlined'}
              onClick={() => { setStatus(s.value); setPage(1) }}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                px: 1.5,
                py: 0.25,
                ...(status === s.value ? { background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none' } : {}),
              }}
            >
              {s.label}
            </MuiButton>
          ))}
        </Box>
        {isManager && (
          <Button size="sm" variant="gradient" icon="mdi:plus-circle-outline" onClick={() => setGenerateOpen(true)}>
            Ø§ÛŒØ¬Ø§Ø¯ Ø­ØµÙ‡
          </Button>
        )}
      </Box>

      {duesQ.isPending ? (
        <LoadingBox text="Ø¯Ø± Ø­Ø§Ù„ Ø¯Ø±ÛŒØ§ÙØª Ø­ØµÙ‡â€ŒÙ‡Ø§..." />
      ) : duesQ.isError ? (
        <ErrorBox message="Ø¯Ø±ÛŒØ§ÙØª Ø­ØµÙ‡â€ŒÙ‡Ø§ Ù…Ù…Ú©Ù† Ù†Ø´Ø¯." onRetry={() => duesQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:cash-clock-outline" title="Ø­ØµÙ‡â€ŒØ§ÛŒ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡" text={isManager ? 'Ø¨Ø§ Ø¯Ú©Ù…Ù‡â€ŒÛŒ Â«Ø§ÛŒØ¬Ø§Ø¯ Ø­ØµÙ‡Â» Ø¨Ø±Ø§ÛŒ Ø§Ø¹Ø¶Ø§ Ø³Ù‡Ù… Ø³Ø±Ø§Ù†Ù‡ Ø¨Ø³Ø§Ø²ÛŒØ¯.' : 'Ù‡Ù†ÙˆØ² Ø³Ù‡Ù…ÛŒ Ø¨Ø±Ø§ÛŒ Ø´Ù…Ø§ Ø«Ø¨Øª Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.'} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((due) => {
            const mine = due.user_id === me?.id
            return (
              <Box
                key={due.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  flexWrap: 'wrap',
                  px: 1.5,
                  py: 1.25,
                  borderRadius: '16px',
                  border: '1px solid rgba(15,23,42,0.06)',
                  bgcolor: due.is_paid ? 'rgba(16,185,129,0.04)' : due.is_voided ? 'rgba(100,116,139,0.04)' : 'rgba(245,158,11,0.04)',
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {due.title}
                    {mine && <span style={{ color: '#2563eb', fontSize: '0.75rem' }}> (Ø´Ù…Ø§)</span>}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }} dir="rtl">
                      {formatRial(due.amount)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {`Ø³Ø±Ø±Ø³ÛŒØ¯: ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
                    </Typography>
                    {isManager && !mine && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        {due.full_name ?? `Ú©Ø§Ø±Ø¨Ø± ${due.user_id}`}
                      </Typography>
                    )}
                    {due.payment_method && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {DUE_METHOD_LABELS[due.payment_method] ?? due.payment_method}
                      </Typography>
                    )}
                  </Box>
                  {due.void_reason && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{`Ø¯Ù„ÛŒÙ„ Ø§Ø¨Ø·Ø§Ù„: ${due.void_reason}`}</Typography>
                  )}
                </Box>
                <DueStatusChip isPaid={due.is_paid} isVoided={due.is_voided} overdue={due.overdue} />
                {canPay(due) && (
                  <Button size="sm" variant="gradient" icon="mdi:cash-check" onClick={() => setPayTarget(due)}>
                    {isCollecting(due) ? 'ÙˆØµÙˆÙ„' : 'Ù¾Ø±Ø¯Ø§Ø®Øª'}
                  </Button>
                )}
                {isManager && !due.is_paid && !due.is_voided && (
                  <MuiButton
                    size="small"
                    onClick={() => setVoidTarget(due)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#dc2626' }}
                  >
                    Ø§Ø¨Ø·Ø§Ù„
                  </MuiButton>
                )}
              </Box>
            )
          })}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 1 }}>
              <MuiButton size="small" disabled={page <= 1 || duesQ.isFetching} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Ù‚Ø¨Ù„ÛŒ
              </MuiButton>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </Typography>
              <MuiButton size="small" disabled={page >= pageCount || duesQ.isFetching} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Ø¨Ø¹Ø¯ÛŒ
              </MuiButton>
            </Box>
          )}
        </Box>
      )}

      <DuePayDialog team={team} due={payTarget} onClose={() => setPayTarget(null)} isCollecting={!!payTarget && isCollecting(payTarget)} />
      <DuesGenerateDialog team={team} members={members} open={generateOpen} onClose={() => setGenerateOpen(false)} />
      <Dialog open={!!voidTarget} onClose={() => setVoidTarget(null)} title="Ø§Ø¨Ø·Ø§Ù„ Ø­ØµÙ‡" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {voidTarget ? `Ø­ØµÙ‡â€ŒÂ«${voidTarget.title}Â» (${formatRial(voidTarget.amount)}) Ø¨Ø§Ø·Ù„ Ø´ÙˆØ¯ØŸ Ø­ØµÙ‡â€ŒÙ‡Ø§ÛŒ Ù¾Ø±Ø¯Ø§Ø®Øªâ€ŒØ´Ø¯Ù‡ Ù‚Ø§Ø¨Ù„ Ø§Ø¨Ø·Ø§Ù„ Ù†ÛŒØ³ØªÙ†Ø¯.` : ''}
          </Typography>
          <TextField
            label="Ø¯Ù„ÛŒÙ„ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)"
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setVoidTarget(null)} disabled={voidDue.isPending}>Ø§Ù†ØµØ±Ø§Ù</Button>
            <Button variant="destructive" loading={voidDue.isPending} onClick={handleVoid} icon="mdi:delete-cancel-outline">
              Ø§Ø¨Ø·Ø§Ù„
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default TeamDuesPanel
