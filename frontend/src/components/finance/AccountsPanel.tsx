// frontend/src/components/finance/AccountsPanel.tsx
// «حساب‌ها» — لیست بدهکاران/اعتبارها با فیلتر نوع و صفحه‌بندی سمت سرور
// + صورت‌حساب/ثبت پرداخت از طریق StatementDialog.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
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
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useAccounts, type FinanceVenue } from '@/hooks/useFinance'
import { useAuthStore } from '@/store/authStore'
import {
  ErrorBox,
  LoadingBox,
  SectionCard,
  StatusChip,
  extractError,
  formatRial,
} from './shared'
import StatementDialog from './StatementDialog'
import type { AccountKind } from '@/services/finance'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const PAGE_SIZE = 25

const KIND_FILTERS: { value: AccountKind; label: string; icon: string }[] = [
  { value: 'debtors', label: 'بدهکاران', icon: 'mdi:account-arrow-down' },
  { value: 'creditors', label: 'اعتبارها', icon: 'mdi:account-arrow-up' },
  { value: 'all', label: 'همه', icon: 'mdi:accounts-outline' },
]

const AccountsPanel: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')
  const [kind, setKind] = useState<AccountKind>('debtors')
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [statementUser, setStatementUser] = useState<{ id: number; name: string | null } | null>(null)

  const params = useMemo(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      kind,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [venueSel, kind, page],
  )

  const { data, isPending, isError, error, refetch } = useAccounts(params)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Box>
      <SectionCard title="حساب‌های اشخاص" icon="mdi:account-group-outline" color="#0891b2">
        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {KIND_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  size="small"
                  icon={<Icon icon={f.icon} className="h-4 w-4" />}
                  onClick={() => {
                    setKind(f.value)
                    setPage(1)
                  }}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    bgcolor: kind === f.value ? 'primary.main' : 'rgba(0,0,0,0.04)',
                    color: kind === f.value ? 'white' : 'text.primary',
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>سالن</InputLabel>
              <Select
                value={venueSel}
                label="سالن"
                onChange={(e) => {
                  setVenueSel(e.target.value as number | 'all')
                  setPage(1)
                }}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">همه سالن‌ها</MenuItem>
                {venues.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {data ? `مجموع: ${toPersianDigits(total)} شخص` : ''}
            </Typography>
          </Grid>
        </Grid>

        {isPending && items.length === 0 ? (
          <LoadingBox text="در حال دریافت حساب‌ها..." />
        ) : isError ? (
          <ErrorBox message={extractError(error, 'خطا در دریافت حساب‌ها')} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Icon icon="mdi:shield-check-outline" className="h-9 w-9" style={{ color: '#10b981' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              شخصی در این دسته موجودی ندارد
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>شخص</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>نوع</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>موجودی</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>آخرین فعالیت</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((acc) => {
                  const debtor = acc.balance > 0
                  return (
                    <TableRow
                      key={acc.user_id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(37,99,235,0.03)' } }}
                      onClick={() => setStatementUser({ id: acc.user_id, name: acc.full_name })}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '10px',
                              bgcolor: debtor ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon
                              icon={debtor ? 'mdi:account-minus-outline' : 'mdi:account-check-outline'}
                              className="h-5 w-5"
                              style={{ color: debtor ? '#ef4444' : '#10b981' }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {acc.full_name || 'بدون نام'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              کاربر #{toPersianDigits(acc.user_id)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          label={debtor ? 'بدهکار' : 'اعتباری'}
                          color={debtor ? '#dc2626' : '#059669'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          dir="rtl"
                          sx={{ fontWeight: 800, color: debtor ? '#dc2626' : '#059669', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                        >
                          {formatRial(acc.balance)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {acc.last_activity ? formatJalaliDateTime(acc.last_activity, { format: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation()
                            setStatementUser({ id: acc.user_id, name: acc.full_name })
                          }}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderColor: 'rgba(37,99,235,0.25)',
                            color: 'primary.main',
                          }}
                          startIcon={<Icon icon="mdi:file-document-outline" className="h-3.5 w-3.5" />}
                        >
                          صورت‌حساب
                        </Button>
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

      <StatementDialog
        open={statementUser !== null}
        onClose={() => setStatementUser(null)}
        userId={statementUser?.id ?? null}
        userName={statementUser?.name}
        venues={venues}
        venueRequired={!isSuper}
      />
    </Box>
  )
}

export default AccountsPanel