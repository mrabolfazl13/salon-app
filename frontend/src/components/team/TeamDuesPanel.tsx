// frontend/src/components/team/TeamDuesPanel.tsx
// حصه‌ها (سهم/حق‌عضویت) — لیست صفحه‌بندی‌شده + فیلتر وضعیت، پرداخت خودی/وصول مدیر،
// ایجاد حصه سرانه (کاپیتان/مدیر)، برنامه «خودکار/دستی» و ابطال با دلیل — همه مبالغ ریالِ عددصحیح

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box,
  Button as MuiButton,
  Chip,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

import type { DuesPayMethod, Team, TeamDue, TeamMember } from '@/types/team'
import { DUE_METHOD_LABELS } from '@/types/team'
import {
  useGenerateTeamDues,
  usePayTeamDue,
  useSetTeamDuesPlan,
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
  { value: ALL, label: 'همه' },
  { value: 'pending', label: 'پرداخت‌نشده' },
  { value: 'overdue', label: 'معوق' },
  { value: 'paid', label: 'پرداخت‌شده' },
  { value: 'voided', label: 'باطل' },
]

// ─────────────── دیالوگ پرداخت/وصول ───────────────

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
          toast.success(isCollecting ? 'سهم وصول شد' : 'سهم پرداخت شد')
          setReference('')
          onClose()
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title={isCollecting ? 'وصول حصه' : 'پرداخت حصه'} maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        {due && (
          <Box sx={{ px: 2, py: 1.5, borderRadius: '14px', bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{due.title}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.25 }} dir="rtl">
              {`${formatRial(due.amount)} — سررسید ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
          توجه: روش «درگاه» در این نسخه همانند بک‌اند به‌صورت قطعی ثبت می‌شود (پرداخت بانکی واقعی انجام نمی‌شود) — برای دریافت لینک پرداخت از flow رزروها استفاده کنید.
        </Typography>
        <TextField
          select
          label="روش"
          size="small"
          value={method}
          onChange={(e) => setMethod(e.target.value as DuesPayMethod)}
        >
          {(Object.keys(DUE_METHOD_LABELS) as DuesPayMethod[]).map((m) => (
            <MenuItem key={m} value={m}>{DUE_METHOD_LABELS[m]}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="شناسه/کد پیگیری (اختیاری)"
          size="small"
          fullWidth
          value={reference}
          slotProps={{ htmlInput: { maxLength: 120 } }}
          onChange={(e) => setReference(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={pay.isPending}>انصراف</Button>
          <Button variant="gradient" loading={pay.isPending} onClick={handlePay} icon="mdi:cash-check">
            {isCollecting ? 'ثبت وصول' : 'پرداخت'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

// ─────────────── دیالوگ ایجاد حصه ───────────────

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
  const [selected, setSelected] = useState<number[] | null>(null) // null = همه اعضای فعال
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
      setFieldError('مبلغ را به ریال و بزرگ‌تر از صفر وارد کنید.')
      return
    }
    if (title.trim().length < 2) {
      setFieldError('عنوان حصه حداقل ۲ کاراکتر باشد.')
      return
    }
    if (!dueDate) {
      setFieldError('تاریخ سررسید را انتخاب کنید.')
      return
    }
    if (targets.length === 0) {
      setFieldError('حداقل یک عضو را انتخاب کنید.')
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
          toast.success(`${toPersianDigits(res.created)} حصه ساخته شد${res.skipped ? ` و ${toPersianDigits(res.skipped)} مورد تکراری رد شد` : ''}.`)
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
    <Dialog open={open} onClose={onClose} title="ایجاد حصه برای اعضا" maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          مبلغ سرانه‌ی هر عضو است و برای همه‌ی اعضای انتخابی (پیش‌فرض: همه) به یکی از همین مبلغ ساخته می‌شود؛ کاپیتان هم شامل می‌شود.
        </Typography>
        <TextField
          label="عنوان حصه"
          size="small"
          required
          fullWidth
          value={title}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثلاً: سهم هفته — سالن انقلاب"
        />
        <TextField
          label="مبلغ سرانه (ریال)"
          size="small"
          required
          fullWidth
          value={amountStr}
          onChange={(e) => { setAmountStr(e.target.value); setFieldError('') }}
          placeholder="۵۰۰٬۰۰۰"
        />
        <PersianDatePicker
          label="سررسید"
          size="small"
          value={dueDate}
          onChange={setDueDate}
          min={getTodayISO()}
          clearable={false}
        />
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', mb: 0.5 }}>
            اعضا ({toPersianDigits(targets.length)} نفر)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 160, overflowY: 'auto' }}>
            {active.map((m) => {
              const on = allSelected || (selected ?? []).includes(m.user_id)
              return (
                <Chip
                  key={m.id}
                  size="small"
                  label={m.full_name ?? `کاربر ${m.user_id}`}
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
        {fieldError && <Typography role="alert" sx={{ fontSize: '0.75rem', color: 'error.main', fontWeight: 600 }}>{fieldError}</Typography>}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={generate.isPending}>انصراف</Button>
          <Button variant="gradient" loading={generate.isPending} onClick={handleSubmit} icon="mdi:plus-circle-outline">
            ساخت حصه‌ها
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

// ─────────────── دیالوگ برنامه حق‌عضویت ───────────────

// روز ۲۹–۳۱ در بعضی ماه‌ها وجود ندارد؛ بک‌اند هم le=28 می‌گیرد، پس لیست همین‌جا محدود است
const DUE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

const DuesPlanDialog: React.FC<{
  team: Team
  onClose: () => void
}> = ({ team, onClose }) => {
  const toast = useToast()
  const setPlan = useSetTeamDuesPlan(team.id)
  const plan = team.dues_plan
  const [auto, setAuto] = useState(plan?.dues_auto ?? false)
  const [amountStr, setAmountStr] = useState(plan?.amount ? String(plan.amount) : '')
  const [title, setTitle] = useState(plan?.title ?? 'حق عضویت ماهانه')
  const [dueDay, setDueDay] = useState(plan?.due_day ?? 1)
  const [pctStr, setPctStr] = useState(String(plan?.late_fee_pct ?? 0))
  const [fieldError, setFieldError] = useState('')

  const graceDays = plan?.grace_days ?? 3

  const handleSubmit = () => {
    const amount = parseAmountInput(amountStr)
    if (auto && (!Number.isInteger(amount) || amount <= 0)) {
      setFieldError('برای سهم خودکار، مبلغ ماهانه را به ریال وارد کنید.')
      return
    }
    if (title.trim().length < 2) {
      setFieldError('عنوان حصه حداقل ۲ کاراکتر باشد.')
      return
    }
    const pct = Number(pctStr)
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      setFieldError('درصد جریمه عددی بین ۰ تا ۱۰۰ است.')
      return
    }
    setPlan.mutate(
      {
        dues_auto: auto,
        amount: amount > 0 ? amount : null,
        title: title.trim(),
        due_day: dueDay,
        late_fee_pct: pct,
      },
      {
        onSuccess: () => {
          toast.success(auto ? 'حق‌عضویت خودکار فعال شد' : 'برنامه حق‌عضویت ذخیره شد')
          onClose()
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Dialog open onClose={onClose} title="برنامه حق‌عضویت" maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <FormControlLabel
          control={<Switch checked={auto} onChange={(e) => { setAuto(e.target.checked); setFieldError('') }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Icon icon={auto ? 'mdi:repeat' : 'mdi:hand-coin-outline'} style={{ width: 16, height: 16 }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>سهم خودکار هر ماه</Typography>
            </Box>
          }
          sx={{ mx: 0 }}
        />
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          با روشن بودن این گزینه، سرور هر ماه به‌صورت خودکار برای همه اعضای فعال سهم می‌سازد و
          نیازی به دکمه «ایجاد حصه» نیست؛ با خاموشی، سهم‌ها دستی ساخته می‌شوند.
        </Typography>
        <TextField
          label="عنوان حصه"
          size="small"
          fullWidth
          value={title}
          slotProps={{ htmlInput: { maxLength: 80 } }}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="مبلغ ماهانه سرانه (ریال)"
          size="small"
          fullWidth
          required={auto}
          value={amountStr}
          inputMode="numeric"
          onChange={(e) => { setAmountStr(e.target.value); setFieldError('') }}
          placeholder="۵۰۰٬۰۰۰"
        />
        <TextField
          select
          label="روز سررسید هر ماه"
          size="small"
          value={dueDay}
          onChange={(e) => setDueDay(Number(e.target.value))}
        >
          {DUE_DAYS.map((d) => (
            <MenuItem key={d} value={d}>{toPersianDigits(d)}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="جریمه دیرکرد (٪)"
          size="small"
          value={pctStr}
          inputMode="numeric"
          onChange={(e) => { setPctStr(e.target.value); setFieldError('') }}
          helperText={`۰ یعنی بدون جریمه — بعد از ${toPersianDigits(graceDays)} روز مهلت، یک‌بار به همان حصه اضافه می‌شود.`}
        />
        {fieldError && (
          <Typography role="alert" sx={{ fontSize: '0.75rem', color: 'error.main', fontWeight: 600 }}>{fieldError}</Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={setPlan.isPending}>انصراف</Button>
          <Button variant="gradient" loading={setPlan.isPending} onClick={handleSubmit} icon="mdi:content-save-outline">
            ذخیره برنامه
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

// ─────────────── پنل اصلی ───────────────

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
  const [planOpen, setPlanOpen] = useState(false)
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
  const plan = team.dues_plan

  const handleVoid = () => {
    if (!voidTarget) return
    voidDue.mutate(
      { dueId: voidTarget.id, reason: voidReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('حصه باطل شد.')
          setVoidTarget(null)
          setVoidReason('')
        },
        onError: (err) => toast.error(getTeamError(err)),
      },
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {plan && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
            px: 1.5,
            py: 1.25,
            borderRadius: '16px',
            border: `1px solid ${plan.dues_auto ? 'rgba(16,185,129,0.25)' : 'rgba(15,23,42,0.08)'}`,
            bgcolor: plan.dues_auto ? 'rgba(16,185,129,0.06)' : 'rgba(15,23,42,0.03)',
          }}
        >
          <Icon
            icon={plan.dues_auto ? 'mdi:repeat' : 'mdi:hand-coin-outline'}
            style={{ width: 20, height: 20, color: plan.dues_auto ? '#059669' : '#64748b' }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              {plan.dues_auto ? 'حق‌عضویت خودکار' : 'حق‌عضویت دستی'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }} dir="rtl">
              {plan.dues_auto && plan.amount
                ? `هر ماه ${formatRial(plan.amount)} — سررسید روز ${toPersianDigits(plan.due_day)} هر ماه${
                    plan.late_fee_pct > 0
                      ? ` | جریمه دیرکرد ${toPersianDigits(plan.late_fee_pct)}٪ بعد از ${toPersianDigits(plan.grace_days)} روز`
                      : ''
                  }`
                : 'سهم‌ها را کاپیتان/مدیر با دکمه «ایجاد حصه» می‌سازد.'}
            </Typography>
          </Box>
          {isManager && (
            <Button size="sm" variant="outline" icon="mdi:cog-outline" onClick={() => setPlanOpen(true)}>
              ویرایش برنامه
            </Button>
          )}
        </Box>
      )}
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
            ایجاد حصه
          </Button>
        )}
      </Box>

      {duesQ.isPending ? (
        <LoadingBox text="در حال دریافت حصه‌ها..." />
      ) : duesQ.isError ? (
        <ErrorBox message="دریافت حصه‌ها ممکن نشد." onRetry={() => duesQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:cash-clock-outline" title="حصه‌ای ثبت نشده" text={isManager ? 'با دکمه‌ی «ایجاد حصه» برای اعضا سهم سرانه بسازید.' : 'هنوز سهمی برای شما ثبت نشده است.'} />
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
                    {mine && <span style={{ color: '#2563eb', fontSize: '0.75rem' }}> (شما)</span>}
                    {due.penalty_for_id && (
                      <span style={{ color: '#b45309', fontSize: '0.72rem', fontWeight: 700 }}> — جریمه دیرکرد</span>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }} dir="rtl">
                      {formatRial(due.amount)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {`سررسید: ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
                    </Typography>
                    {isManager && !mine && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        {due.full_name ?? `کاربر ${due.user_id}`}
                      </Typography>
                    )}
                    {due.payment_method && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {DUE_METHOD_LABELS[due.payment_method] ?? due.payment_method}
                      </Typography>
                    )}
                  </Box>
                  {due.void_reason && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{`دلیل ابطال: ${due.void_reason}`}</Typography>
                  )}
                </Box>
                <DueStatusChip isPaid={due.is_paid} isVoided={due.is_voided} overdue={due.overdue} />
                {canPay(due) && (
                  <Button size="sm" variant="gradient" icon="mdi:cash-check" onClick={() => setPayTarget(due)}>
                    {isCollecting(due) ? 'وصول' : 'پرداخت'}
                  </Button>
                )}
                {isManager && !due.is_paid && !due.is_voided && (
                  <MuiButton
                    size="small"
                    onClick={() => setVoidTarget(due)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'error.main' }}
                  >
                    ابطال
                  </MuiButton>
                )}
              </Box>
            )
          })}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 1 }}>
              <MuiButton size="small" disabled={page <= 1 || duesQ.isFetching} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                قبلی
              </MuiButton>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </Typography>
              <MuiButton size="small" disabled={page >= pageCount || duesQ.isFetching} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                بعدی
              </MuiButton>
            </Box>
          )}
        </Box>
      )}

      <DuePayDialog team={team} due={payTarget} onClose={() => setPayTarget(null)} isCollecting={!!payTarget && isCollecting(payTarget)} />
      <DuesGenerateDialog team={team} members={members} open={generateOpen} onClose={() => setGenerateOpen(false)} />
      {planOpen && <DuesPlanDialog team={team} onClose={() => setPlanOpen(false)} />}
      <Dialog open={!!voidTarget} onClose={() => setVoidTarget(null)} title="ابطال حصه" maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {voidTarget ? `حصه‌«${voidTarget.title}» (${formatRial(voidTarget.amount)}) باطل شود؟ حصه‌های پرداخت‌شده قابل ابطال نیستند.` : ''}
          </Typography>
          <TextField
            label="دلیل (اختیاری)"
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setVoidTarget(null)} disabled={voidDue.isPending}>انصراف</Button>
            <Button variant="destructive" loading={voidDue.isPending} onClick={handleVoid} icon="mdi:delete-cancel-outline">
              ابطال
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default TeamDuesPanel
