// frontend/src/components/finance/TransactionEntryDialog.tsx
// ثبت دستی ردیف دفتر کل — «دریافت وجه» (payment/income) یا «هزینه» (expense/expense)
// با انتخاب دسته‌بندی + ساخت خطی دسته جدید، روش پرداخت، سالن، طرف‌حساب از /accounts
// و کلید همسانی (idempotency) برای جلوگیری از ثبت دوباره.

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { useAuthStore } from '@/store/authStore'
import {
  useAccounts,
  useCreateExpenseCategory,
  useCreateTransaction,
  useExpenseCategories,
  type FinanceVenue,
} from '@/hooks/useFinance'
import {
  TX_METHOD_LABELS,
  extractError,
  formatRial,
  parseAmountInput,
  statusPairOf,
} from './shared'
import type { TransactionMethod, TransactionStatus } from '@/services/finance'
import { getTodayISO } from '@/lib/jalali'

const METHOD_OPTIONS: TransactionMethod[] = ['cash', 'card_to_card', 'gateway', 'pos', 'credit', 'other']
const genIdemKey = () => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const cleanDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[,\s٬]/g, '')

type EntryMode = 'payment' | 'expense'

const TransactionEntryDialog: React.FC<{
  open: boolean
  onClose: () => void
  venues: FinanceVenue[]
  /** حالت شروع — «ثبت هزینه» از صفحهٔ هزینه‌ها مستقیم روی هزینه باز می‌شود */
  initialMode?: EntryMode
}> = ({ open, onClose, venues, initialMode = 'payment' }) => {
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')
  const venueRequired = !isSuper
  const [mode, setMode] = useState<EntryMode>(initialMode)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [status, setStatus] = useState<TransactionStatus>('cleared')
  const [venueId, setVenueId] = useState<number | ''>(venues.length === 1 ? venues[0].id : '')
  const [counterparty, setCounterparty] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => getTodayISO())
  const [idempotencyKey, setIdempotencyKey] = useState(genIdemKey)

  const amountId = useId()
  const methodLabelId = useId()
  const statusLabelId = useId()
  const venueLabelId = useId()
  const categoryLabelId = useId()
  const counterpartyLabelId = useId()
  const descriptionId = useId()

  const categories = useExpenseCategories(false, open)
  const contacts = useAccounts({ kind: 'all', limit: 500 }, open)
  const createCategory = useCreateExpenseCategory()
  const createTx = useCreateTransaction()

  const availableCategories = useMemo(() => {
    const list = categories.data ?? []
    if (venueId === '') return list
    return list.filter((c) => c.venue_id === null || c.venue_id === venueId)
  }, [categories.data, venueId])

  const reset = () => {
    setMode('payment')
    setAmount('')
    setMethod('cash')
    setStatus('cleared')
    setCounterparty('')
    setCategoryId('')
    setNewCategory('')
    setAddingCategory(false)
    setDescription('')
    setDate(getTodayISO())
    setIdempotencyKey(genIdemKey())
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = () => {
    const value = parseAmountInput(cleanDigits(amount))
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('مبلغ را به عدد وارد کنید (ریال)')
      return
    }
    if (venueRequired && venueId === '') {
      toast.error('برای مدیر، انتخاب سالن الزامی است')
      return
    }
    if (mode === 'expense' && categoryId === '') {
      toast.error('برای هزینه، انتخاب دسته‌بندی الزامی است')
      return
    }
    createTx.mutate(
      {
        type: mode === 'expense' ? 'expense' : 'payment',
        direction: mode === 'expense' ? 'expense' : 'income',
        amount: Math.round(value),
        method,
        status,
        venue_id: venueId === '' ? null : venueId,
        counterparty: counterparty === '' ? null : counterparty,
        counterparty_type: counterparty === '' ? null : 'user',
        expense_category_id: mode === 'expense' ? (categoryId as number) : null,
        source_type: 'manual',
        description: description.trim(),
        occurred_at: date ? `${date}T00:00:00` : null,
        idempotency_key: idempotencyKey,
      },
      {
        onSuccess: (tx) => {
          toast.success(mode === 'expense' ? `هزینه ثبت شد (ردیف #${tx.id})` : `دریافت وجه ثبت شد (ردیف #${tx.id})`)
          close()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ثبت ردیف')),
      },
    )
  }

  const submitNewCategory = () => {
    const name = newCategory.trim()
    if (name.length < 2) {
      toast.error('نام دسته‌بندی حداقل ۲ نویسه است')
      return
    }
    if (venueRequired && venueId === '') {
      toast.error('ابتدا سالن دسته‌بندی را مشخص کنید')
      return
    }
    createCategory.mutate(
      { name, venue_id: venueId === '' ? null : venueId },
      {
        onSuccess: (cat) => {
          toast.success('دسته‌بندی ایجاد شد')
          setCategoryId(cat.id)
          setNewCategory('')
          setAddingCategory(false)
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ایجاد دسته‌بندی')),
      },
    )
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" title="ثبت ردیف مالی دستی">
      {/* نوع: دریافت وجه / هزینه */}
      <div className="mb-4 flex gap-2">
        {(
          [
            { value: 'payment', label: 'دریافت وجه', icon: 'mdi:cash-plus', color: '#059669' },
            { value: 'expense', label: 'هزینه', icon: 'mdi:cash-minus', color: '#d97706' },
          ] as { value: EntryMode; label: string; icon: string; color: string }[]
        ).map((m) => {
          const active = mode === m.value
          const pair = statusPairOf(null, m.color)
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={active}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                backgroundColor: active ? pair.main : 'rgba(0,0,0,0.04)',
                color: active ? pair.on : undefined,
              }}
            >
              <Icon icon={m.icon} className="h-4 w-4" aria-hidden="true" />
              {m.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-12">
        <div className="col-span-2 sm:col-span-6">
          <Label htmlFor={amountId} className="mb-1.5 block">
            مبلغ (ریال) <span className="text-red-600">*</span>
          </Label>
          <Input
            id={amountId}
            autoFocus
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            aria-invalid={Number.isNaN(parseAmountInput(cleanDigits(amount))) && amount ? true : undefined}
          />
          <p className={Number.isNaN(parseAmountInput(cleanDigits(amount))) && amount ? 'mt-1.5 text-xs text-red-600 dark:text-red-400' : 'mt-1.5 text-xs text-muted-foreground'}>
            {Number.isNaN(parseAmountInput(cleanDigits(amount))) && amount ? 'عدد معتبر نیست' : formatRial(parseAmountInput(cleanDigits(amount)))}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-6">
          <PersianDatePicker size="small" label="تاریخ واقعه" value={date} onChange={setDate} clearable={false} />
        </div>
        <div className="col-span-1 sm:col-span-4">
          <Label id={methodLabelId} className="mb-1.5 block">روش</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as TransactionMethod)}>
            <SelectTrigger className="h-11" aria-labelledby={methodLabelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 sm:col-span-4">
          <Label id={statusLabelId} className="mb-1.5 block">وضعیت</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
            <SelectTrigger className="h-11" aria-labelledby={statusLabelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cleared">قطعی</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Label id={venueLabelId} className="mb-1.5 block">
            سالن {venueRequired && <span className="text-red-600">*</span>}
          </Label>
          <Select
            value={venueId === '' ? '' : String(venueId)}
            onValueChange={(v) => {
              const sel = v === 'global' ? '' : Number(v)
              setVenueId(sel)
              setCategoryId('')
            }}
          >
            <SelectTrigger className="h-11" aria-labelledby={venueLabelId}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {!venueRequired && <SelectItem value="global">سراسری (بدون سالن)</SelectItem>}
              {venues.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === 'expense' && (
          <div className="col-span-2 sm:col-span-12">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label id={categoryLabelId} className="mb-1.5 block">
                  دسته‌بندی هزینه <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={categoryId === '' ? '' : String(categoryId)}
                  onValueChange={(v) => setCategoryId(Number(v))}
                >
                  <SelectTrigger className="h-11" aria-labelledby={categoryLabelId}>
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                        <span className="ms-1.5 text-xs text-muted-foreground">
                          ({cat.venue_id === null ? 'سراسری' : 'اختصاصی'})
                        </span>
                      </SelectItem>
                    ))}
                    {availableCategories.length === 0 && (
                      <SelectItem value="__empty__" disabled>
                        دسته‌بندی فعالی نیست — بسازید
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setAddingCategory((v) => !v)}
                aria-expanded={addingCategory}
                aria-label="ایجاد دسته‌بندی جدید"
                title="ایجاد دسته‌بندی جدید"
                className="mt-6 border-dashed border-blue-600/40 text-blue-700 dark:text-blue-400"
              >
                <Icon icon={addingCategory ? 'mdi:close' : 'mdi:plus'} className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            {addingCategory && (
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="مثلاً: هزینه برق"
                  aria-label="نام دسته‌بندی جدید"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={submitNewCategory}
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? '...' : 'ساخت'}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="col-span-2 sm:col-span-12">
          <Label id={counterpartyLabelId} className="mb-1.5 block">طرف‌حساب (اشخاص دارای حساب)</Label>
          <Select
            value={counterparty === '' ? 'none' : String(counterparty)}
            onValueChange={(v) => setCounterparty(v === 'none' ? '' : Number(v))}
          >
            <SelectTrigger className="h-11" aria-labelledby={counterpartyLabelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— بدون طرف‌حساب —</SelectItem>
              {(contacts.data?.items ?? []).map((a) => (
                <SelectItem key={a.user_id} value={String(a.user_id)}>
                  {a.full_name || `کاربر #${a.user_id}`} · بدهی/اعتبار {formatRial(a.balance, false)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-12">
          <Label htmlFor={descriptionId} className="mb-1.5 block">شرح</Label>
          <Textarea
            id={descriptionId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      <Separator className="mt-4" />
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={close} disabled={createTx.isPending}>انصراف</Button>
        <Button
          onClick={submit}
          disabled={createTx.isPending}
          className={
            mode === 'expense'
              ? 'bg-gradient-to-br from-amber-500 to-amber-400 text-stone-900'
              : 'bg-gradient-to-br from-emerald-700 to-emerald-800 text-white'
          }
        >
          {createTx.isPending ? 'در حال ثبت...' : mode === 'expense' ? 'ثبت هزینه' : 'ثبت دریافت وجه'}
        </Button>
      </div>
    </Dialog>
  )
}

export default TransactionEntryDialog
