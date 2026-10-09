// frontend/src/components/crm/CustomersTab.tsx
// «مشتریان» — نوار فیلتر (جست‌وجو/segment/VIP/مرتب‌سازی) + جدول با صفحه‌بندی
// سمت سرور + سوییچ سریع VIP + پنل جزئیات (CustomerDetailDialog).

import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Pagination,
  PaginationItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { EmptyBox, ErrorBox, LoadingBox, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { useCrmCustomers, useUpdateCrmCustomer } from '@/hooks/useCrm'
import type { CrmCustomerRow, CrmSort } from '@/services/crm'
import CustomerDetailDialog from './CustomerDetailDialog'
import { ForbiddenPanel, SegmentChip, SEGMENT_LABELS, SEGMENT_ORDER, ConsentIcon, crmErrorMessage, isForbidden } from './shared'

const PAGE_SIZE = 20

const SORT_OPTIONS: { value: CrmSort; label: string }[] = [
  { value: 'last_visit', label: 'آخرین بازدید' },
  { value: 'spend', label: 'بیشترین پرداختی' },
  { value: 'bookings', label: 'بیشترین رزرو' },
]

interface Props {
  venueId: number
}

const CustomersTab: React.FC<Props> = ({ venueId }) => {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<string | null>(null)
  const [vipOnly, setVipOnly] = useState(false)
  const [sort, setSort] = useState<CrmSort>('last_visit')
  const [page, setPage] = useState(1)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  // debounce جست‌وجو
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const params = useMemo(
    () => ({
      venue_id: venueId,
      search: search || undefined,
      segment: segment ?? undefined,
      is_vip: vipOnly ? true : undefined,
      sort,
      status: 'all' as const,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [venueId, search, segment, vipOnly, sort, page],
  )

  const query = useCrmCustomers(params)
  const updateCustomer = useUpdateCrmCustomer()
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const toggleVip = (row: CrmCustomerRow) => {
    updateCustomer.mutate(
      { userId: row.user_id, venueId, data: { is_vip: !row.is_vip } },
      {
        onSuccess: () => toast.success(row.is_vip ? 'VIP برداشته شد' : 'مشتری ویژه شد ⭐'),
        onError: (err) => toast.error(crmErrorMessage(err, 'خطا در تغییر وضعیت VIP')),
      },
    )
  }

  const inactiveBadge = (row: CrmCustomerRow) => {
    if (row.inactive_days === null) return <Typography variant="caption" color="text.secondary">بدون بازدید</Typography>
    const color = row.segment === 'dormant' ? '#64748b' : row.segment === 'at_risk' ? '#ef4444' : '#059669'
    return (
      <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color, mr: 0.75 }}>
        {toPersianDigits(row.inactive_days)} روز
      </Box>
    )
  }

  return (
    <Box>
      {/* نوار فیلتر */}
      <Box
        sx={{
          display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2,
          p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
        }}
      >
        <TextField
          size="small"
          placeholder="جست‌وجوی نام یا شماره موبایل..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={segment}
          onChange={(_, v) => { setSegment(v ?? null); setPage(1) }}
          sx={{
            flexWrap: 'wrap',
            rowGap: 1,
            '& .MuiToggleButton-root': {
              textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', px: 1.5, borderRadius: '9px !important', mx: 0.25, border: 'none',
            },
          }}
        >
          {SEGMENT_ORDER.map((s) => (
            <ToggleButton key={s} value={s}>{SEGMENT_LABELS[s]}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Chip
          icon={<Icon icon="mdi:star" />}
          label="فقط VIP"
          color={vipOnly ? 'warning' : 'default'}
          variant={vipOnly ? 'filled' : 'outlined'}
          onClick={() => { setVipOnly((v) => !v); setPage(1) }}
          sx={{ borderRadius: '9px', fontWeight: 700, fontSize: '0.75rem', height: 32 }}
        />
        <FormControl size="small" sx={{ minWidth: 150, mr: 'auto' }}>
          <Select value={sort} onChange={(e) => { setSort(e.target.value as CrmSort); setPage(1) }} sx={{ borderRadius: '10px' }}>
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {query.isPending ? (
        <LoadingBox text="در حال دریافت مشتریان..." />
      ) : query.isError ? (
        isForbidden(query.error) ? <ForbiddenPanel /> : (
          <ErrorBox message={crmErrorMessage(query.error, 'دریافت مشتریان ممکن نشد')} onRetry={() => query.refetch()} />
        )
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:account-group-outline" title="مشتری‌ای با این فیلترها پیدا نشد" text="ابتدا در سالن خود رزرو ثبت کنید تا مشتریان اینجا نمایش داده شوند." />
      ) : (
        <>
          <Box sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '16px', overflow: 'auto', bgcolor: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 28px rgba(15,23,42,0.06)' }}>
            <Table size="small" sx={{ minWidth: 880 }}>
              <TableHead>
                <TableRow>
                  {['مشتری', 'موبایل', 'رزرو', 'مجموع پرداختی', 'مانده', 'امتیاز', 'آخرین بازدید', 'گروه', ''].map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 800, whiteSpace: 'nowrap', bgcolor: 'rgba(248,250,252,0.8)' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow
                    key={row.user_id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(37,99,235,0.04)' } }}
                    onClick={() => setDetailUserId(row.user_id)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.full_name ?? '—'}
                        </Typography>
                        {row.tags.slice(0, 2).map((t) => (
                          <Chip key={t} label={t} size="small" sx={{ height: 16, fontSize: '0.6rem', borderRadius: '6px', bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed' }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }} dir="ltr">{row.phone ?? '—'}</TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(row.bookings_count)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatRial(row.total_spend)}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                        color: row.balance_due > 0 ? '#dc2626' : row.balance_due < 0 ? '#059669' : 'text.secondary',
                      }}
                    >
                      {row.balance_due > 0 ? formatRial(row.balance_due) : row.balance_due < 0 ? formatRial(-row.balance_due) + ' (اعتبار)' : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="امتیاز وفاداری">
                        <Chip
                          icon={<Icon icon="mdi:star-four-points" />}
                          label={toPersianDigits(row.loyalty_balance ?? 0)}
                          size="small"
                          sx={{ height: 22, fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', bgcolor: 'rgba(217,119,6,0.1)', color: '#b45309', '& .MuiChip-icon': { color: '#d97706' } }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                        {row.last_booking_date ? formatJalaliDate(row.last_booking_date, { format: 'numeric' }) : '—'}
                      </Typography>
                      {inactiveBadge(row)}
                    </TableCell>
                    <TableCell><SegmentChip segment={row.segment} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <Tooltip title="رضایت بازاریابی">
                          <Box component="span" sx={{ display: 'inline-flex', px: 0.5 }}><ConsentIcon consent={row.marketing_consent} /></Box>
                        </Tooltip>
                        <Tooltip title={row.is_vip ? 'حذف از مشتریان ویژه' : 'افزودن به مشتریان ویژه'}>
                          <IconButton size="small" onClick={() => toggleVip(row)} disabled={updateCustomer.isPending}>
                            <Icon
                              icon={row.is_vip ? 'mdi:star' : 'mdi:star-outline'}
                              className="h-5 w-5"
                              style={{ color: row.is_vip ? '#d97706' : '#9ca3af' }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((row) => (
              <Box
                key={row.user_id}
                onClick={() => setDetailUserId(row.user_id)}
                sx={{
                  p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                  cursor: 'pointer', '&:active': { transform: 'scale(0.98)' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.full_name ?? '—'}
                    </Typography>
                    <Typography variant="caption" dir="ltr" sx={{ color: 'text.secondary', display: 'block' }}>
                      {row.phone ?? '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <ConsentIcon consent={row.marketing_consent} />
                    <IconButton size="small" onClick={() => toggleVip(row)} disabled={updateCustomer.isPending} sx={{ p: 0.5 }}>
                      <Icon icon={row.is_vip ? 'mdi:star' : 'mdi:star-outline'} className="h-5 w-5" style={{ color: row.is_vip ? '#d97706' : '#9ca3af' }} />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <SegmentChip segment={row.segment} />
                  <Chip
                    icon={<Icon icon="mdi:calendar-check-outline" />}
                    label={`${toPersianDigits(row.bookings_count)} رزرو`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb' }}
                  />
                  <Chip
                    icon={<Icon icon="mdi:star-four-points" />}
                    label={toPersianDigits(row.loyalty_balance ?? 0)}
                    size="small"
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', bgcolor: 'rgba(217,119,6,0.1)', color: '#b45309', '& .MuiChip-icon': { color: '#d97706' } }}
                  />
                  {row.tags.slice(0, 2).map((t) => (
                    <Chip key={t} label={t} size="small" sx={{ height: 22, fontSize: '0.75rem', borderRadius: '8px', bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed' }} />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>پرداختی</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {formatRial(row.total_spend)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>مانده</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: row.balance_due > 0 ? '#dc2626' : row.balance_due < 0 ? '#059669' : 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {row.balance_due > 0 ? formatRial(row.balance_due) : row.balance_due < 0 ? formatRial(-row.balance_due) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>بازدید</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      {row.last_booking_date ? formatJalaliDate(row.last_booking_date, { format: 'numeric' }) : '—'}
                    </Typography>
                    {inactiveBadge(row)}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      {!query.isPending && !query.isError && total > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
            renderItem={(item) => (
              <PaginationItem {...item} component={Button} sx={{ fontWeight: 700 }} />
            )}
          />
        </Box>
      )}
      {!query.isPending && !query.isError && total > 0 && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary' }}>
          {toPersianDigits(total)} مشتری — صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
        </Typography>
      )}

      <CustomerDetailDialog userId={detailUserId} venueId={venueId} onClose={() => setDetailUserId(null)} />
    </Box>
  )
}

export default CustomersTab
