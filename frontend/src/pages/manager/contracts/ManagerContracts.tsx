// frontend/src/pages/manager/contracts/ManagerContracts.tsx
// «مدیریت قراردادها» — تب صف درخواست‌های PENDING (approve-with-changes/رد با دلیل)
// و تب همه قراردادها با فیلتر وضعیت/سالن/جستجو. جدول‌ها افقی اسکرول می‌شوند (الگوی کنسول مالی).
// نکته: ردیف مدیر شامل user_phone و outstanding_amount است (بک‌اند §8b) — صف تأیید
// و جدول «همه قراردادها» روزهای هفتگی چندروزه (contract.days) را کامل نشان می‌دهند.

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Skeleton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import {
  useManagerAllContracts,
  useManagerPendingContracts,
  useRejectContract,
} from '@/hooks/useContracts'
import { useManagedVenues } from '@/hooks/useStaffMe'
import {
  CONTRACT_STATUS_META,
  CONTRACT_TAB_STATUSES,
  contractStatusMeta,
  EmptyBox,
  ErrorBox,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  ReasonDialog,
  SectionCard,
  StatusChip,
  toPersianDigits,
} from '@/components/contract/shared'
import ContractApproveDialog, { type ApproveTarget } from '@/components/contract/manager/ContractApproveDialog'
import { ForbiddenPanel, isForbidden } from '@/components/crm/shared'
import type { ContractManagerRow, ContractStatusValue } from '@/services/contract'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'

const timeWindow = (start: string, duration: number): string => {
  const [h, m] = (start || '00:00').slice(0, 5).split(':').map(Number)
  const end = ((h * 60 + (m || 0) + duration) % 1440)
  const eh = String(Math.floor(end / 60)).padStart(2, '0')
  const em = String(end % 60).padStart(2, '0')
  return `${toPersianDigits(start.slice(0, 5))} تا ${toPersianDigits(`${eh}:${em}`)}`
}

/** برچسب فارسی روز(های) هفته قرارداد — تک‌روزه fallback به day_of_week */
const dayNamesOf = (c: { day_of_week: number; days?: number[] }): string => {
  const days = c.days && c.days.length > 0 ? c.days : [c.day_of_week]
  return days.map((d) => pyDayNames[d] ?? '—').join('، ')
}

const ManagerContracts: React.FC = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [venueFilter, setVenueFilter] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ContractManagerRow | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const pendingQuery = useManagerPendingContracts(tab === 0)
  const allQuery = useManagerAllContracts(
    { status: (statusFilter || undefined) as ContractStatusValue | undefined, venue_id: venueFilter },
    tab === 1,
  )
  // فیلتر سالن — دامنه ادغام‌شده مدیر + کارمند (/staff/me)
  const venuesQuery = useManagedVenues(tab === 1)
  const rejectMutation = useRejectContract()

  const filteredRows = useMemo(() => {
    const rows = allQuery.data ?? []
    const q = search.trim()
    if (!q) return rows
    return rows.filter((r) =>
      (r.user_full_name || '').includes(q) ||
      String(r.contract.user_id) === q ||
      r.venue_name.includes(q) ||
      String(r.contract.id) === q)
  }, [allQuery.data, search])

  const approveFrom = (row: ContractManagerRow): ApproveTarget => ({
    contractId: row.contract.id,
    venueName: row.venue_name,
    userName: row.user_full_name,
    pricePerSession: row.contract.discounted_price,
    originalPrice: row.contract.original_price,
    totalSessions: row.total_sessions,
    currentPolicy: row.contract.cancellation_policy,
  })

  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>مدیریت قراردادها</Typography>
          <Typography variant="body2" color="text.secondary">
            صف تأیید و پرونده قراردادهای سالن‌های شما
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px' },
            '& .Mui-selected': { bgcolor: 'primary.main', color: 'white !important', borderRadius: '10px' },
          }}
        >
          <Tab
            icon={<Icon icon="mdi:inbox-arrow-up" className="h-5 w-5" />}
            iconPosition="start"
            label={`صف درخواست‌ها${pendingQuery.data ? ` (${toPersianDigits(pendingQuery.data.length)})` : ''}`}
          />
          <Tab
            icon={<Icon icon="mdi:file-document-multiple-outline" className="h-5 w-5" />}
            iconPosition="start"
            label="همه قراردادها"
          />
        </Tabs>

        {/* ─────────── تب صف ─────────── */}
        {tab === 0 && (
          pendingQuery.isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2].map((i) => <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: '16px' }} />)}
            </Box>
          ) : pendingQuery.isError ? (
            isForbidden(pendingQuery.error) ? (
              <ForbiddenPanel detail="برای دیدن صف قراردادها باید contract.view (پذیرش به بالا) یا مدیریت سالن داشته باشید." />
            ) : (
              <ErrorBox message="دریافت صف درخواست‌ها ناموفق بود." onRetry={() => pendingQuery.refetch()} />
            )
          ) : (pendingQuery.data ?? []).length === 0 ? (
            <EmptyBox
              icon="mdi:inbox-arrow-up-outline"
              title="صف خالی است"
              text="درخواست در انتظار تأییدی برای سالن‌های شما وجود ندارد."
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(pendingQuery.data ?? []).map((row) => {
                const c = row.contract
                const diffPct = c.original_price > 0
                  ? Math.round((1 - c.discounted_price / c.original_price) * 100) : 0
                return (
                  <Card key={c.id} sx={{ borderRadius: '16px', p: { xs: 2, md: 2.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {row.user_full_name || `کاربر #${faNum(c.user_id)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" dir="ltr">
                          {`${row.user_phone || '—'} — ${row.venue_name}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <StatusChip label={`قرارداد #${faNum(c.id)}`} color="#6b7280" />
                        <StatusChip
                          label={c.end_date >= getTodayISO() ? `سرعت: ${toPersianDigits(diffPct)}٪ تخفیف` : 'بازه منقضی'}
                          color={c.end_date >= getTodayISO() ? '#d97706' : '#6b7280'}
                        />
                        {(row.outstanding_amount ?? 0) > 0 && (
                          <StatusChip label={`معوق: ${formatRial(row.outstanding_amount ?? 0)}`} color="#dc2626" />
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">زمان هفتگی</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {`${dayNamesOf(c)} — ${timeWindow(c.start_time, c.duration)}`}
                        </Typography>
                        {(c.days?.length ?? 0) > 1 && (
                          <Box sx={{ display: 'flex', gap: 0.4, mt: 0.5, flexWrap: 'wrap' }}>
                            {c.days!.map((d) => (
                              <Chip key={d} label={pyDayNames[d] ?? d} size="small" sx={{ height: 18, fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb' }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">بازه و سانس‌ها</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {`${formatJalaliDate(c.start_date)} تا ${formatJalaliDate(c.end_date)}`}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {`${toPersianDigits(row.total_sessions)} سانس درخواستی`}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">قیمت پیشنهادی / قیمت پایه سانس</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                          {formatRial(c.discounted_price)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {`پایه: ${formatRial(c.original_price)}`}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">مبلغ کل / پیش‌پرداخت درخواستی</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRial(c.total_amount)}</Typography>
                        <Typography variant="caption" color="text.disabled">
                          {c.down_payment_amount ? `پیش‌پرداخت: ${formatRial(c.down_payment_amount)}` : 'بدون پیش‌پرداخت'}
                        </Typography>
                      </Box>
                    </Box>

                    {c.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.8rem' }}>
                        {`یادداشت متقاضی: ${c.description}`}
                      </Typography>
                    )}

                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/manager/contracts/${c.id}`)}
                        sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                        startIcon={<Icon icon="mdi:eye-outline" className="h-4 w-4" />}
                      >
                        مشاهده و اقدام
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        onClick={() => {
                          const t = approveFrom(row)
                          if (!Number.isFinite(t.totalSessions)) t.totalSessions = 0
                          setApproveTarget(t)
                        }}
                        sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                        startIcon={<Icon icon="mdi:check-decagram-outline" className="h-4 w-4" />}
                      >
                        تأیید با تغییرات
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => { setRejectTarget(row); setDialogError(null) }}
                        sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                        startIcon={<Icon icon="mdi:close-octagon-outline" className="h-4 w-4" />}
                      >
                        رد درخواست
                      </Button>
                    </Box>
                  </Card>
                )
              })}
            </Box>
          )
        )}

        {/* ─────────── تب همه قراردادها ─────────── */}
        {tab === 1 && (
          <SectionCard title="فیلترها" icon="mdi:filter-variant" dense>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  label="همه"
                  size="small"
                  onClick={() => setStatusFilter('')}
                  color={statusFilter === '' ? 'primary' : 'default'}
                  variant={statusFilter === '' ? 'filled' : 'outlined'}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
                {CONTRACT_TAB_STATUSES.map((s) => (
                  <Chip
                    key={s}
                    label={CONTRACT_STATUS_META[s].label}
                    size="small"
                    onClick={() => setStatusFilter(s)}
                    color={statusFilter === s ? 'primary' : 'default'}
                    variant={statusFilter === s ? 'filled' : 'outlined'}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  />
                ))}
              </Box>
              <Box sx={{ flex: 1 }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>سالن</InputLabel>
                <Select
                  label="سالن"
                  value={venueFilter}
                  onChange={(e) => { const v = e.target.value as unknown; setVenueFilter(v === 'all' ? '' : Number(v)) }}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">همه سالن‌ها</MenuItem>
                  {(venuesQuery.data ?? []).map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="جستجو: نام کاربر / شناسه"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: 210, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              {allQuery.isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: '12px' }} />)}
                </Box>
              ) : allQuery.isError ? (
                isForbidden(allQuery.error) ? (
                  <ForbiddenPanel detail="برای دیدن قراردادهای سالن باید contract.view (پذیرش به بالا) یا مدیریت سالن داشته باشید." />
                ) : (
                  <ErrorBox message="دریافت قراردادها ناموفق بود." onRetry={() => allQuery.refetch()} />
                )
              ) : filteredRows.length === 0 ? (
                <EmptyBox icon="mdi:file-search-outline" title="قراردادی با این فیلترها نیست" />
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 880 }}>
                    <TableHead>
                      <TableRow>
                        {['#', 'متقاضی', 'سالن', 'بازه / برنامه', 'سانس', 'قیمت و کل', 'پرداخت', 'وضعیت', ''].map((h, i) => (
                          <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRows.map((row) => {
                        const c = row.contract
                        const pm = paymentStatusMeta(c.payment_status)
                        const sm = contractStatusMeta(c.status)
                        return (
                          <TableRow
                            key={c.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/manager/contracts/${c.id}`)}
                          >
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{faNum(c.id)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {row.user_full_name || `کاربر #${faNum(c.user_id)}`}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{row.venue_name}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {`${formatJalaliDate(c.start_date)} تا ${formatJalaliDate(c.end_date)}`}
                              <Typography component="div" variant="caption" color="text.disabled">
                                {`${dayNamesOf(c)} ${(c.start_time || '').slice(0, 5)}`}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {`${toPersianDigits(row.total_sessions)} کل / ${toPersianDigits(row.sessions_upcoming)} آینده`}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {formatRial(c.total_amount)}
                              <Typography component="div" variant="caption" color="text.disabled">
                                {`${formatRial(c.discounted_price)} / سانس`}
                              </Typography>
                            </TableCell>
                            <TableCell><StatusChip label={pm.label} color={pm.color} /></TableCell>
                            <TableCell><StatusChip label={sm.label} color={sm.color} /></TableCell>
                            <TableCell align="left">
                              <Icon icon="mdi:chevron-left" className="h-4 w-4" style={{ color: '#64748b' }} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </SectionCard>
        )}
      </Box>

      <ContractApproveDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        target={approveTarget}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        title="رد درخواست قرارداد"
        description={
          rejectTarget
            ? `با رد، ${toPersianDigits(rejectTarget.sessions_upcoming)} سانس آینده در تقویم سالن آزاد می‌شود و به متقاضی «${rejectTarget.user_full_name || '—'}» اعلام می‌گردد.`
            : ''
        }
        reasonLabel="دلیل رد (حداقل ۳ کاراکتر)"
        confirmText="رد درخواست"
        loading={rejectMutation.isPending}
        errorText={dialogError}
        onClose={() => setRejectTarget(null)}
        onSubmit={async (reason) => {
          if (!rejectTarget) return
          try {
            await rejectMutation.mutateAsync({ contractId: rejectTarget.contract.id, reason })
            toast.success('درخواست رد و سانس‌ها آزاد شدند')
            setRejectTarget(null)
          } catch (err) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
            setDialogError(typeof detail === 'string' ? detail : 'رد درخواست ناموفق بود')
          }
        }}
      />
    </Layout>
  )
}

export default ManagerContracts