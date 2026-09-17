// frontend/src/components/finance/StatementDialog.tsx
// صورت‌حساب کرونولوژیک یک شخص (موجودی جاری + ردیف افتتاحیه/اختتامیه) و
// ثبت پرداخت نقدی برای همان شخص (POST /finance/accounts/{user_id}/payments).

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import { PersianDateRangePicker } from '@/components/ui/PersianDatePicker'
import {
  useAccountStatement,
  useRecordAccountPayment,
  type FinanceVenue,
} from '@/hooks/useFinance'
import {
  TX_METHOD_LABELS,
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
  TX_TYPE_LABELS,
  labelOf,
  parseAmountInput,
  formatRial,
  extractError,
  StatusChip,
  LoadingBox,
  ErrorBox,
  EmptyBox,
} from './shared'
import type { TransactionMethod } from '@/services/finance'
import { formatJalaliDateTime } from '@/lib/jalali'

interface Props {
  open: boolean
  onClose: () => void
  userId: number | null
  userName?: string | null
  venues: FinanceVenue[]
  /** مدیر (غیر ادمین) باید سالن بدهد؛ سرپرست می‌تواند سراسری ثبت کند */
  venueRequired?: boolean
}

const StatementDialog: React.FC<Props> = ({ open, onClose, userId, userName, venues, venueRequired = false }) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [payOpen, setPayOpen] = useState(false)

  const scope = useMemo(
    () => ({ from: from || undefined, to: to || undefined }),
    [from, to],
  )

  const statement = useAccountStatement(open ? userId : null, scope, open)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" title={`صورت‌حساب — ${userName || `کاربر #${userId ?? ''}`}`}>
      <Box sx={{ mb: 2 }}>
        <PersianDateRangePicker
          size="small"
          start={from}
          end={to}
          onStartChange={setFrom}
          onEndChange={setTo}
        />
      </Box>

      {statement.isPending && open ? <LoadingBox text="در حال دریافت صورت‌حساب..." /> : null}
      {statement.isError ? (
        <ErrorBox
          message={extractError(statement.error, 'خطا در دریافت صورت‌حساب')}
          onRetry={() => statement.refetch()}
        />
      ) : null}

      {statement.data && (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(37,99,235,0.06)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>موجودی افتتاحیه</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatRial(statement.data.opening_balance)}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: statement.data.closing_balance > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>موجودی اختتامیه</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 800, color: statement.data.closing_balance > 0 ? '#dc2626' : '#059669' }}
                >
                  {formatRial(statement.data.closing_balance)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setPayOpen(true)}
                disabled={statement.data.closing_balance <= 0}
                title={statement.data.closing_balance <= 0 ? 'شخص بدهکار نیست' : undefined}
                sx={{
                  height: '100%',
                  minHeight: 56,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  '&:hover': { background: 'linear-gradient(135deg, #047857, #059669)' },
                }}
                startIcon={<Icon icon="mdi:cash-plus" className="h-5 w-5" />}
              >
                ثبت پرداخت
              </Button>
            </Grid>
          </Grid>

          {statement.data.entries.length === 0 ? (
            <EmptyBox icon="mdi:file-document-outline" title="ردیفی در این بازه نیست" text="برای بازه انتخاب‌شده تراکنشی ثبت نشده است." />
          ) : (
            <Box sx={{ maxHeight: 380, overflow: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                    {['تاریخ', 'نوع', 'مبلغ', 'اثر', 'موجودی جاری', 'وضعیت', 'شرح'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statement.data.entries.map((e) => (
                    <tr key={e.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{formatJalaliDateTime(e.occurred_at, { format: 'numeric' })}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{labelOf(TX_TYPE_LABELS, e.type)}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{formatRial(e.amount, false)}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontWeight: 700, color: e.delta > 0 ? '#dc2626' : '#059669' }}>
                        {e.delta > 0 ? '+' : ''}{formatRial(e.delta, false)}
                      </td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontWeight: 700 }}>{formatRial(e.running_balance, false)}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <StatusChip label={labelOf(TX_STATUS_LABELS, e.status)} color={TX_STATUS_COLORS[e.status] ?? '#6b7280'} />
                      </td>
                      <td style={{ padding: '7px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {e.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </>
      )}

      {userId !== null && (
        <PaymentDialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          userId={userId}
          userName={userName ?? statement.data?.full_name ?? null}
          venues={venues}
          venueRequired={venueRequired}
        />
      )}
    </Dialog>
  )
}

// ─────────────── ثبت پرداخت ───────────────

const METHOD_OPTIONS: TransactionMethod[] = ['cash', 'card_to_card', 'gateway', 'pos', 'credit', 'other']

const generateIdempotencyKey = () =>
  `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const PaymentDialog: React.FC<{
  open: boolean
  onClose: () => void
  userId: number
  userName?: string | null
  venues: FinanceVenue[]
  venueRequired?: boolean
}> = ({ open, onClose, userId, userName, venues, venueRequired = false }) => {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [venueId, setVenueId] = useState<number | ''>(venues.length === 1 ? venues[0].id : '')
  const [description, setDescription] = useState('')
  const [idempotencyKey] = useState(generateIdempotencyKey)

  const mutation = useRecordAccountPayment()

  const reset = () => {
    setAmount('')
    setMethod('cash')
    setDescription('')
    onClose()
  }

  const submit = () => {
    const parsed = amount.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[,\s]/g, '')
    const value = Number(parsed)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('مبلغ را به درستی وارد کنید')
      return
    }
    if (venueRequired && venueId === '') {
      toast.error('انتخاب سالن الزامی است')
      return
    }
    mutation.mutate(
      {
        userId,
        data: {
          amount: Math.round(value),
          method,
          venue_id: venueId === '' ? null : venueId,
          description: description.trim(),
          idempotency_key: idempotencyKey,
        },
      },
      {
        onSuccess: (tx) => {
          toast.success(`پرداخت ثبت شد (ردیف #${tx.id})`)
          reset()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ثبت پرداخت')),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" title={`ثبت پرداخت — ${userName || `کاربر #${userId}`}`}>
      <Grid container spacing={2} sx={{ pt: 0.5 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="مبلغ (ریال)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>روش</InputLabel>
            <Select
              value={method}
              label="روش"
              onChange={(e) => setMethod(e.target.value as TransactionMethod)}
              sx={{ borderRadius: '10px' }}
            >
              {METHOD_OPTIONS.map((m) => (
                <MenuItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" required={venueRequired}>
            <InputLabel>سالن</InputLabel>
            <Select
              value={venueId}
              label="سالن"
              onChange={(e) => { const sel = e.target.value as number | ''; setVenueId(sel === '' ? '' : sel) }}
              sx={{ borderRadius: '10px' }}
            >
              {!venueRequired && <MenuItem value="">سراسری (بدون سالن)</MenuItem>}
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
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
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>
      <Divider sx={{ mt: 2, mb: 0 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
        <Button variant="outlined" onClick={onClose} disabled={mutation.isPending}>
          انصراف
        </Button>
        <Chip
          label={`مبلغ: ${formatRial(Number.isNaN(parseAmountInput(amount)) ? 0 : parseAmountInput(amount))}`}
          size="small"
          sx={{ fontWeight: 700, mr: 'auto', borderRadius: '8px' }}
          icon={<Icon icon="mdi:bank-outline" className="h-4 w-4" />}
        />
        <Button
          variant="contained"
          onClick={submit}
          disabled={mutation.isPending}
          sx={{ background: 'linear-gradient(135deg, #059669, #10b981)', '&:hover': { background: '#047857' } }}
        >
          {mutation.isPending ? 'در حال ثبت...' : 'ثبت پرداخت'}
        </Button>
      </Box>
    </Dialog>
  )
}

export default StatementDialog
