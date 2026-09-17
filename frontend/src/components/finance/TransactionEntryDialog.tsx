// frontend/src/components/finance/TransactionEntryDialog.tsx
// ثبت دستی ردیف دفتر کل — «دریافت وجه» (payment/income) یا «هزینه» (expense/expense)
// با انتخاب دسته‌بندی + ساخت خطی دسته جدید، روش پرداخت، سالن، طرف‌حساب از /accounts
// و کلید همسانی (idempotency) برای جلوگیری از ثبت دوباره.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
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
}> = ({ open, onClose, venues }) => {
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')
  const venueRequired = !isSuper
  const [mode, setMode] = useState<EntryMode>('payment')
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
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {(
          [
            { value: 'payment', label: 'دریافت وجه', icon: 'mdi:cash-plus', color: '#059669' },
            { value: 'expense', label: 'هزینه', icon: 'mdi:cash-minus', color: '#d97706' },
          ] as { value: EntryMode; label: string; icon: string; color: string }[]
        ).map((m) => (
          <Chip
            key={m.value}
            label={m.label}
            icon={<Icon icon={m.icon} className="h-4 w-4" />}
            onClick={() => setMode(m.value)}
            sx={{
              flex: 1,
              height: 40,
              borderRadius: '12px',
              fontWeight: 800,
              bgcolor: mode === m.value ? m.color : 'rgba(0,0,0,0.04)',
              color: mode === m.value ? 'white' : 'text.primary',
            }}
          />
        ))}
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            required
            label="مبلغ (ریال)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            helperText={Number.isNaN(parseAmountInput(cleanDigits(amount))) && amount ? 'عدد معتبر نیست' : formatRial(parseAmountInput(cleanDigits(amount)))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PersianDatePicker size="small" label="تاریخ واقعه" value={date} onChange={setDate} clearable={false} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>روش</InputLabel>
            <Select value={method} label="روش" onChange={(e) => setMethod(e.target.value as TransactionMethod)} sx={{ borderRadius: '10px' }}>
              {METHOD_OPTIONS.map((m) => (
                <MenuItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>وضعیت</InputLabel>
            <Select value={status} label="وضعیت" onChange={(e) => setStatus(e.target.value as TransactionStatus)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="cleared">قطعی</MenuItem>
              <MenuItem value="pending">در انتظار</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small" required={venueRequired}>
            <InputLabel>سالن</InputLabel>
            <Select
              value={venueId}
              label="سالن"
              onChange={(e) => {
                { const sel = e.target.value as number | ''; setVenueId(sel === '' ? '' : sel) }
                setCategoryId('')
              }}
              sx={{ borderRadius: '10px' }}
            >
              {!venueRequired && <MenuItem value="">سراسری (بدون سالن)</MenuItem>}
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {mode === 'expense' && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>دسته‌بندی هزینه</InputLabel>
                <Select value={categoryId} label="دسته‌بندی هزینه" onChange={(e) => { const sel = e.target.value as number | ''; setCategoryId(sel === '' ? '' : sel) }} sx={{ borderRadius: '10px' }}>
                  <MenuItem value="" disabled>انتخاب کنید</MenuItem>
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 0.75 }}>
                        ({cat.venue_id === null ? 'سراسری' : 'اختصاصی'})
                      </Typography>
                    </MenuItem>
                  ))}
                  {availableCategories.length === 0 && (
                    <MenuItem value="" disabled>
                      دسته‌بندی فعالی نیست — بسازید
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setAddingCategory((v) => !v)}
                sx={{ border: '1px dashed rgba(37,99,235,0.4)', borderRadius: '10px', color: 'primary.main' }}
                title="ایجاد دسته‌بندی جدید"
              >
                <Icon icon={addingCategory ? 'mdi:close' : 'mdi:plus'} className="h-5 w-5" />
              </IconButton>
            </Box>
            {addingCategory && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="مثلاً: هزینه برق"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={submitNewCategory}
                  disabled={createCategory.isPending}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                >
                  {createCategory.isPending ? '...' : 'ساخت'}
                </Button>
              </Box>
            )}
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth size="small">
            <InputLabel>طرف‌حساب (اشخاص دارای حساب)</InputLabel>
            <Select
              value={counterparty}
              label="طرف‌حساب (اشخاص دارای حساب)"
              onChange={(e) => { const sel = e.target.value as number | ''; setCounterparty(sel === '' ? '' : sel) }}
              sx={{ borderRadius: '10px' }}
              MenuProps={{ sx: { maxHeight: 320 } }}
            >
              <MenuItem value="">— بدون طرف‌حساب —</MenuItem>
              {(contacts.data?.items ?? []).map((a) => (
                <MenuItem key={a.user_id} value={a.user_id}>
                  {a.full_name || `کاربر #${a.user_id}`} · بدهی/اعتبار {formatRial(a.balance, false)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="small"
            label="شرح"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mt: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
        <Button variant="outlined" onClick={close} disabled={createTx.isPending}>انصراف</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={createTx.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            background: mode === 'expense' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #059669, #10b981)',
          }}
        >
          {createTx.isPending ? 'در حال ثبت...' : mode === 'expense' ? 'ثبت هزینه' : 'ثبت دریافت وجه'}
        </Button>
      </Box>
    </Dialog>
  )
}

export default TransactionEntryDialog