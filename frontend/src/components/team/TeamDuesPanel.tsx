// frontend/src/components/team/TeamDuesPanel.tsx
// حصه‌ها (سهم/حق‌عضویت) — لیست صفحه‌بندی‌شده + فیلتر وضعیت، پرداخت خودی/وصول مدیر،
// ایجاد حصه سرانه (کاپیتان/مدیر)، برنامه «خودکار/دستی» و ابطال با دلیل — همه مبالغ ریالِ عددصحیح

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

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
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import { Switch } from '@/components/ui/shadcn/switch'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { EmptyBox, ErrorBox, LoadingBox, formatRial, parseAmountInput } from '@/components/finance/shared'
import { formatJalaliDate, getTodayISO, toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'
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
      <div className="flex flex-col gap-4 pt-1">
        {due && (
          <div className="rounded-[14px] border border-blue-600/[0.12] bg-blue-600/5 px-4 py-3">
            <p className="text-[0.9rem] font-extrabold">{due.title}</p>
            <p className="mt-0.5 text-[0.78rem] text-muted-foreground" dir="rtl">
              {`${formatRial(due.amount)} — سررسید ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
            </p>
          </div>
        )}
        <p className="text-[0.68rem] text-muted-foreground">
          توجه: روش «درگاه» در این نسخه همانند بک‌اند به‌صورت قطعی ثبت می‌شود (پرداخت بانکی واقعی انجام نمی‌شود) — برای دریافت لینک پرداخت از flow رزروها استفاده کنید.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-method">روش</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as DuesPayMethod)}>
            <SelectTrigger id="due-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DUE_METHOD_LABELS) as DuesPayMethod[]).map((m) => (
                <SelectItem key={m} value={m}>{DUE_METHOD_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-reference">شناسه/کد پیگیری (اختیاری)</Label>
          <Input
            id="due-reference"
            maxLength={120}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={pay.isPending}>انصراف</Button>
          <Button variant="gradient" loading={pay.isPending} onClick={handlePay} icon="mdi:cash-check">
            {isCollecting ? 'ثبت وصول' : 'پرداخت'}
          </Button>
        </div>
      </div>
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
      setFieldError('مبلغ را به تومان و بزرگ‌تر از صفر وارد کنید.')
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
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-[0.68rem] text-muted-foreground">
          مبلغ سرانه‌ی هر عضو است و برای همه‌ی اعضای انتخابی (پیش‌فرض: همه) به یکی از همین مبلغ ساخته می‌شود؛ کاپیتان هم شامل می‌شود.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-title">
            عنوان حصه <span className="text-red-600 dark:text-red-400">*</span>
          </Label>
          <Input
            id="due-title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: سهم هفته — سالن انقلاب"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due-amount">
            مبلغ سرانه (تومان) <span className="text-red-600 dark:text-red-400">*</span>
          </Label>
          <Input
            id="due-amount"
            inputMode="numeric"
            required
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value); setFieldError('') }}
            placeholder="۵۰۰٬۰۰۰"
          />
        </div>
        <PersianDatePicker
          label="سررسید"
          size="small"
          value={dueDate}
          onChange={setDueDate}
          min={getTodayISO()}
          clearable={false}
        />
        <div>
          <p className="mb-1 text-[0.68rem] font-bold text-muted-foreground">
            اعضا ({toPersianDigits(targets.length)} نفر)
          </p>
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {active.map((m) => {
              const on = allSelected || (selected ?? []).includes(m.user_id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(m.user_id)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    on
                      ? 'bg-blue-600/10 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-900/5 text-muted-foreground hover:bg-slate-900/10 dark:bg-white/5',
                  )}
                >
                  <Icon icon={on ? 'mdi:check-circle' : 'mdi:circle-outline'} style={{ width: 14, height: 14 }} />
                  {m.full_name ?? `کاربر ${m.user_id}`}
                </button>
              )
            })}
          </div>
        </div>
        {fieldError && <p role="alert" className="text-[0.68rem] font-semibold text-red-600 dark:text-red-400">{fieldError}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={generate.isPending}>انصراف</Button>
          <Button variant="gradient" loading={generate.isPending} onClick={handleSubmit} icon="mdi:plus-circle-outline">
            ساخت حصه‌ها
          </Button>
        </div>
      </div>
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
      setFieldError('برای سهم خودکار، مبلغ ماهانه را به تومان وارد کنید.')
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
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex min-h-9 items-center gap-2">
          <Switch
            id="dues-auto"
            checked={auto}
            onCheckedChange={(checked) => { setAuto(checked); setFieldError('') }}
          />
          <Label htmlFor="dues-auto" className="flex cursor-pointer items-center gap-1 text-[0.85rem] font-bold">
            <Icon icon={auto ? 'mdi:repeat' : 'mdi:hand-coin-outline'} style={{ width: 16, height: 16 }} />
            سهم خودکار هر ماه
          </Label>
        </div>
        <p className="text-[0.68rem] text-muted-foreground">
          با روشن بودن این گزینه، سرور هر ماه به‌صورت خودکار برای همه اعضای فعال سهم می‌سازد و
          نیازی به دکمه «ایجاد حصه» نیست؛ با خاموشی، سهم‌ها دستی ساخته می‌شوند.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plan-title">عنوان حصه</Label>
          <Input
            id="plan-title"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plan-amount">
            مبلغ ماهانه سرانه (تومان){auto && <span className="text-red-600 dark:text-red-400"> *</span>}
          </Label>
          <Input
            id="plan-amount"
            inputMode="numeric"
            required={auto}
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value); setFieldError('') }}
            placeholder="۵۰۰٬۰۰۰"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plan-due-day">روز سررسید هر ماه</Label>
          <Select value={String(dueDay)} onValueChange={(v) => setDueDay(Number(v))}>
            <SelectTrigger id="plan-due-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DUE_DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>{toPersianDigits(d)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plan-pct">جریمه دیرکرد (٪)</Label>
          <Input
            id="plan-pct"
            inputMode="numeric"
            value={pctStr}
            onChange={(e) => { setPctStr(e.target.value); setFieldError('') }}
          />
          <p className="text-[0.68rem] text-muted-foreground">
            {`۰ یعنی بدون جریمه — بعد از ${toPersianDigits(graceDays)} روز مهلت، یک‌بار به همان حصه اضافه می‌شود.`}
          </p>
        </div>
        {fieldError && (
          <p role="alert" className="text-[0.68rem] font-semibold text-red-600 dark:text-red-400">{fieldError}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={setPlan.isPending}>انصراف</Button>
          <Button variant="gradient" loading={setPlan.isPending} onClick={handleSubmit} icon="mdi:content-save-outline">
            ذخیره برنامه
          </Button>
        </div>
      </div>
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
    <div className="flex flex-col gap-3">
      {plan && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2.5',
            plan.dues_auto
              ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
              : 'border-slate-900/10 bg-slate-900/[0.03] dark:border-white/10 dark:bg-white/5',
          )}
        >
          <Icon
            icon={plan.dues_auto ? 'mdi:repeat' : 'mdi:hand-coin-outline'}
            style={{ width: 20, height: 20, color: plan.dues_auto ? '#059669' : '#64748b' }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[0.85rem] font-extrabold text-slate-900 dark:text-slate-100">
              {plan.dues_auto ? 'حق‌عضویت خودکار' : 'حق‌عضویت دستی'}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-muted-foreground" dir="rtl">
              {plan.dues_auto && plan.amount
                ? `هر ماه ${formatRial(plan.amount)} — سررسید روز ${toPersianDigits(plan.due_day)} هر ماه${
                    plan.late_fee_pct > 0
                      ? ` | جریمه دیرکرد ${toPersianDigits(plan.late_fee_pct)}٪ بعد از ${toPersianDigits(plan.grace_days)} روز`
                      : ''
                  }`
                : 'سهم‌ها را کاپیتان/مدیر با دکمه «ایجاد حصه» می‌سازد.'}
            </p>
          </div>
          {isManager && (
            <Button size="sm" variant="outline" icon="mdi:cog-outline" onClick={() => setPlanOpen(true)}>
              ویرایش برنامه
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CHIPS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={status === s.value ? 'gradient' : 'secondary'}
              onClick={() => { setStatus(s.value); setPage(1) }}
              className="rounded-full px-3 font-bold"
            >
              {s.label}
            </Button>
          ))}
        </div>
        {isManager && (
          <Button size="sm" variant="gradient" icon="mdi:plus-circle-outline" onClick={() => setGenerateOpen(true)}>
            ایجاد حصه
          </Button>
        )}
      </div>

      {duesQ.isPending ? (
        <LoadingBox text="در حال دریافت حصه‌ها..." />
      ) : duesQ.isError ? (
        <ErrorBox message="دریافت حصه‌ها ممکن نشد." onRetry={() => duesQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:cash-clock-outline" title="حصه‌ای ثبت نشده" text={isManager ? 'با دکمه‌ی «ایجاد حصه» برای اعضا سهم سرانه بسازید.' : 'هنوز سهمی برای شما ثبت نشده است.'} />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((due) => {
            const mine = due.user_id === me?.id
            return (
              <div
                key={due.id}
                className={cn(
                  'flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-900/[0.06] px-3 py-2.5 dark:border-white/10',
                  due.is_paid
                    ? 'bg-emerald-500/[0.04]'
                    : due.is_voided
                      ? 'bg-slate-500/[0.04]'
                      : 'bg-amber-500/[0.04]',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.85rem] font-bold text-slate-900 dark:text-slate-100">
                    {due.title}
                    {mine && <span className="text-[0.68rem] text-blue-700 dark:text-blue-400"> (شما)</span>}
                    {due.penalty_for_id && (
                      <span className="text-[0.72rem] font-bold text-amber-800 dark:text-amber-400"> — جریمه دیرکرد</span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="text-[0.68rem] font-extrabold text-slate-900 dark:text-slate-100" dir="rtl">
                      {formatRial(due.amount)}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      {`سررسید: ${formatJalaliDate(due.due_date, { format: 'numeric' })}`}
                    </p>
                    {isManager && !mine && (
                      <p className="text-[0.68rem] font-semibold text-muted-foreground">
                        {due.full_name ?? `کاربر ${due.user_id}`}
                      </p>
                    )}
                    {due.payment_method && (
                      <p className="text-[0.68rem] text-muted-foreground">
                        {DUE_METHOD_LABELS[due.payment_method] ?? due.payment_method}
                      </p>
                    )}
                  </div>
                  {due.void_reason && (
                    <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{`دلیل ابطال: ${due.void_reason}`}</p>
                  )}
                </div>
                <DueStatusChip isPaid={due.is_paid} isVoided={due.is_voided} overdue={due.overdue} />
                {canPay(due) && (
                  <Button size="sm" variant="gradient" icon="mdi:cash-check" onClick={() => setPayTarget(due)}>
                    {isCollecting(due) ? 'وصول' : 'پرداخت'}
                  </Button>
                )}
                {isManager && !due.is_paid && !due.is_voided && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVoidTarget(due)}
                    className="text-[0.68rem] font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    ابطال
                  </Button>
                )}
              </div>
            )
          })}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="sm" variant="ghost" disabled={page <= 1 || duesQ.isFetching} onClick={() => setPage((p) => p - 1)} className="font-bold">
                قبلی
              </Button>
              <p className="text-[0.68rem] font-bold text-muted-foreground">
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </p>
              <Button size="sm" variant="ghost" disabled={page >= pageCount || duesQ.isFetching} onClick={() => setPage((p) => p + 1)} className="font-bold">
                بعدی
              </Button>
            </div>
          )}
        </div>
      )}

      <DuePayDialog team={team} due={payTarget} onClose={() => setPayTarget(null)} isCollecting={!!payTarget && isCollecting(payTarget)} />
      <DuesGenerateDialog team={team} members={members} open={generateOpen} onClose={() => setGenerateOpen(false)} />
      {planOpen && <DuesPlanDialog team={team} onClose={() => setPlanOpen(false)} />}
      <Dialog open={!!voidTarget} onClose={() => setVoidTarget(null)} title="ابطال حصه" maxWidth="xs">
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-[0.8rem] text-muted-foreground">
            {voidTarget ? `حصه‌«${voidTarget.title}» (${formatRial(voidTarget.amount)}) باطل شود؟ حصه‌های پرداخت‌شده قابل ابطال نیستند.` : ''}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="void-reason">دلیل (اختیاری)</Label>
            <Textarea
              id="void-reason"
              rows={2}
              maxLength={300}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="min-h-[72px]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setVoidTarget(null)} disabled={voidDue.isPending}>انصراف</Button>
            <Button variant="destructive" loading={voidDue.isPending} onClick={handleVoid} icon="mdi:delete-cancel-outline">
              ابطال
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default TeamDuesPanel
