// frontend/src/components/finance/TransactionsPanel.tsx
// «هزینه‌ها و تراکنش‌ها» — دفتر کل با صفحه‌بندی سمت سرور (limit/offset)، فیلترهای
// چیپسی جهت/نوع/وضعیت + بازه جلالی، خروجی CSV با همان فیلترها (دانلود blob)،
// ابطال با دلیل اجباری و ساخت ردیف دستی.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  PaginationItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import { PersianDateRangePicker } from '@/components/ui/PersianDatePicker'
import {
  useExportTransactionsCsv,
  useTransactions,
  useVoidTransaction,
  type FinanceVenue,
} from '@/hooks/useFinance'
import { useAuthStore } from '@/store/authStore'
import {
  ErrorBox,
  LoadingBox,
  SectionCard,
  StatusChip,
  TX_DIRECTION_LABELS,
  TX_METHOD_LABELS,
  TX_SOURCE_LABELS,
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
  TX_TYPE_LABELS,
  downloadBlob,
  extractError,
  formatRial,
  labelOf,
} from './shared'
import TransactionEntryDialog from './TransactionEntryDialog'
import ExpenseCategoriesPanel from './ExpenseCategoriesPanel'
import type { FinanceTransaction } from '@/services/finance'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const PAGE_SIZE = 25
const ALL = 'all' as const

type DirectionFilter = typeof ALL | 'income' | 'expense'
type StatusFilter = typeof ALL | 'pending' | 'cleared' | 'voided'

const DIRECTION_CHIPS: { value: DirectionFilter; label: string; color: string }[] = [
  { value: ALL, label: 'همه', color: '#64748b' },
  { value: 'income', label: 'درآمد', color: '#059669' },
  { value: 'expense', label: 'هزینه', color: '#d97706' },
]

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: ALL, label: 'همه وضعیت‌ها' },
  { value: 'cleared', label: 'قطعی' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'voided', label: 'باطل' },
]

const TransactionsPanel: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [direction, setDirection] = useState<DirectionFilter>(ALL)
  const [status, setStatus] = useState<StatusFilter>(ALL)
  const [type, setType] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [voidTx, setVoidTx] = useState<FinanceTransaction | null>(null)

  const filters = useMemo(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      from: from || undefined,
      to: to || undefined,
      direction: direction === ALL ? undefined : direction,
      status: status === ALL ? undefined : status,
      type: type === ALL ? undefined : type,
    }),
    [venueSel, from, to, direction, status, type],
  )

  const params = useMemo(
    () => ({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [filters, page],
  )

  const { data, isPending, isFetching, isError, error, refetch } = useTransactions(params)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const exportCsv = useExportTransactionsCsv()
  const handleExport = () => {
    exportCsv.mutate(
      { ...filters, limit: 20000 },
      {
        onSuccess: (blob) => {
          downloadBlob(blob, 'finance_transactions.csv')
          toast.success('فایل CSV آماده شد')
        },
        onError: (err) => toast.error(extractError(err, 'خطا در دریافت خروجی CSV')),
      },
    )
  }

  const resetPageAnd = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  return (
    <Box>
      {/* ردیف اقدامات */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {DIRECTION_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              size="small"
              onClick={() => resetPageAnd(setDirection)(chip.value)}
              sx={{
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.75rem',
                bgcolor: direction === chip.value ? chip.color : 'rgba(0,0,0,0.04)',
                color: direction === chip.value ? 'white' : 'text.primary',
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleExport}
            disabled={exportCsv.isPending}
            startIcon={exportCsv.isPending ? <CircularProgress size={14} /> : <Icon icon="mdi:file-download-outline" className="h-4 w-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(5,150,105,0.3)', color: '#059669' }}
          >
            خروجی CSV
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            ثبت ردیف دستی
          </Button>
        </Box>
      </Box>

      <SectionCard title="دفتر کل تراکنش‌ها" icon="mdi:book-ledger-outline" color="#2563eb" dense>
        {/* فیلترها */}
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <PersianDateRangePicker size="small" start={from} end={to} onStartChange={resetPageAnd(setFrom)} onEndChange={resetPageAnd(setTo)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>نوع</InputLabel>
              <Select value={type} label="نوع" onChange={(e) => resetPageAnd(setType)(e.target.value)} sx={{ borderRadius: '10px' }}>
                <MenuItem value={ALL}>همه انواع</MenuItem>
                {Object.entries(TX_TYPE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>وضعیت</InputLabel>
              <Select value={status} label="وضعیت" onChange={(e) => resetPageAnd(setStatus)(e.target.value as StatusFilter)} sx={{ borderRadius: '10px' }}>
                {STATUS_CHIPS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>سالن</InputLabel>
              <Select value={venueSel} label="سالن" onChange={(e) => resetPageAnd(setVenueSel)(e.target.value as number | 'all')} sx={{ borderRadius: '10px' }}>
                <MenuItem value="all">همه</MenuItem>
                {venues.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {data ? `مجموع ${toPersianDigits(total)} ردیف — صفحه ${toPersianDigits(page)} از ${toPersianDigits(totalPages)}` : ''}
            {isFetching && data ? ' — به‌روزرسانی...' : ''}
          </Typography>
          {(direction !== ALL || status !== ALL || type !== ALL || venueSel !== 'all' || from || to) && (
            <Button
              size="small"
              onClick={() => {
                setDirection(ALL)
                setStatus(ALL)
                setType(ALL)
                setVenueSel('all')
                setFrom('')
                setTo('')
                setPage(1)
              }}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              startIcon={<Icon icon="mdi:filter-remove-outline" className="h-4 w-4" />}
            >
              پاک‌سازی فیلترها
            </Button>
          )}
        </Box>

        {isPending && items.length === 0 ? (
          <LoadingBox text="در حال دریافت دفتر کل..." />
        ) : isError ? (
          <ErrorBox message={extractError(error, 'خطا در دریافت تراکنش‌ها')} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Icon icon="mdi:book-open-page-variant-outline" className="h-9 w-9" style={{ color: '#64748b' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              ردیفی با این فیلترها یافت نشد
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>ردیف</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>تاریخ</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>نوع / منبع</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>طرف‌حساب / شرح</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>سالن</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>روش</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>وضعیت</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>مبلغ</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((tx) => {
                  const voided = tx.status === 'voided'
                  const income = tx.direction === 'income'
                  const venueName = tx.venue_id ? venues.find((v) => v.id === tx.venue_id)?.name ?? `#${toPersianDigits(tx.venue_id)}` : 'سراسری'
                  return (
                    <TableRow
                      key={tx.id}
                      hover
                      sx={{
                        bgcolor: voided ? 'rgba(239,68,68,0.04)' : undefined,
                        '&:hover': { bgcolor: voided ? 'rgba(239,68,68,0.07)' : 'rgba(37,99,235,0.03)' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          #{toPersianDigits(tx.id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                          {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-start' }}>
                          <StatusChip label={labelOf(TX_TYPE_LABELS, tx.type)} color={income ? '#059669' : '#d97706'} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {labelOf(TX_SOURCE_LABELS, tx.source_type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.counterparty_name ?? ''}>
                          {tx.counterparty_name || (tx.expense_category_name ? `دسته: ${tx.expense_category_name}` : '—')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.description}>
                          {voided && tx.void_reason ? `ابطال: ${tx.void_reason}` : tx.description || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{venueName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{labelOf(TX_METHOD_LABELS, tx.method)}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip label={labelOf(TX_STATUS_LABELS, tx.status)} color={TX_STATUS_COLORS[tx.status] ?? '#6b7280'} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          dir="rtl"
                          sx={{
                            fontWeight: 800,
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                            color: voided ? '#9ca3af' : income ? '#059669' : '#dc2626',
                            textDecoration: voided ? 'line-through' : 'none',
                          }}
                        >
                          {income ? '+' : '-'}{formatRial(tx.amount, false)}
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        {!voided && (
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => setVoidTx(tx)}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }}
                          >
                            ابطال
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {total > PAGE_SIZE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
              size="small"
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  key={item.type === 'page' ? `p-${item.page}` : item.type}
                >
                  {item.type === 'page' ? toPersianDigits(item.page as number) : undefined}
                </PaginationItem>
              )}
            />
          </Box>
        )}
      </SectionCard>

      <Box sx={{ mt: 3 }}>
        <ExpenseCategoriesPanel venues={venues} />
      </Box>

      <TransactionEntryDialog open={createOpen} onClose={() => setCreateOpen(false)} venues={venues} />
      <VoidTransactionDialog tx={voidTx} onClose={() => setVoidTx(null)} />
    </Box>
  )
}

// ─────────────── ابطال با دلیل اجباری ───────────────

const VoidTransactionDialog: React.FC<{ tx: FinanceTransaction | null; onClose: () => void }> = ({ tx, onClose }) => {
  const [reason, setReason] = useState('')
  const voidTx = useVoidTransaction()
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')

  const trimmed = reason.trim()
  const valid = trimmed.length >= 3 && trimmed.length <= 300

  const close = () => {
    setReason('')
    onClose()
  }

  const submit = () => {
    if (!tx || !valid) return
    voidTx.mutate(
      { txId: tx.id, reason: trimmed },
      {
        onSuccess: () => {
          toast.success(`ردیف #${toPersianDigits(tx.id)} باطل شد`)
          close()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ابطال ردیف')),
      },
    )
  }

  return (
    <Dialog open={tx !== null} onClose={close} maxWidth="xs" title="ابطال ردیف دفتر کل">
      {tx && (
        <>
          <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.06)', mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Icon icon="mdi:cash-remove" className="h-6 w-6" style={{ color: '#ef4444' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {formatRial(tx.amount)} · {labelOf(TX_TYPE_LABELS, tx.type)} ({labelOf(TX_DIRECTION_LABELS, tx.direction)})
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ردیف #{toPersianDigits(tx.id)} — {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          {!isSuper && tx.venue_id === null && (
            <Typography variant="caption" sx={{ color: '#d97706', display: 'block', mb: 1 }}>
              توجه: ردیف بدون سالن برای مدیران قابل ابطال نیست (۴۰۳).
            </Typography>
          )}
          <TextField
            fullWidth
            size="small"
            required
            label="دلیل ابطال"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reason.length > 0 && !valid}
            helperText={valid ? '' : 'حداقل ۳ و حداکثر ۳۰۰ نویسه (اجباری)'}
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Divider sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
            <Button variant="outlined" onClick={close} disabled={voidTx.isPending}>انصراف</Button>
            <Button
              variant="contained"
              color="error"
              onClick={submit}
              disabled={!valid || voidTx.isPending}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {voidTx.isPending ? 'در حال ابطال...' : 'ابطال قطعی'}
            </Button>
          </Box>
        </>
      )}
    </Dialog>
  )
}

export default TransactionsPanel
