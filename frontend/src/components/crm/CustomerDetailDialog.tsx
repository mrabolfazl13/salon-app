// frontend/src/components/crm/CustomerDetailDialog.tsx
// پنل جزئیات مشتری — پروفایل + ویرایش VIP/برچسب/یادداشت (PUT /crm/customers) +
// اخیر رزروها/پرداخت‌ها و خلاصه صورتحساب از پاسخ GET /crm/customers/{user_id}.

import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import {
  EmptyBox,
  ErrorBox,
  LoadingBox,
  SectionCard,
  TX_TYPE_LABELS,
  extractError,
  formatRial,
  labelOf,
} from '@/components/finance/shared'
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useCrmCustomer, useUpdateCrmCustomer } from '@/hooks/useCrm'
import { BookingStatusChip, ForbiddenPanel, SegmentChip, crmErrorMessage, isForbidden } from './shared'

interface Props {
  userId: number | null
  venueId: number | null
  onClose: () => void
}

const CustomerDetailDialog: React.FC<Props> = ({ userId, venueId, onClose }) => {
  const detailQuery = useCrmCustomer(userId, venueId)
  const updateCustomer = useUpdateCrmCustomer()

  const [isVip, setIsVip] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [notes, setNotes] = useState('')

  const detail = detailQuery.data
  const dirty = useMemo(() => {
    if (!detail) return false
    const origTags = detail.customer.tags.join('،')
    return (
      isVip !== detail.customer.is_vip ||
      tags.join('،') !== origTags ||
      notes.trim() !== (detail.customer.notes ?? '').trim()
    )
  }, [detail, isVip, tags, notes])

  useEffect(() => {
    if (detail) {
      setIsVip(detail.customer.is_vip)
      setTags(detail.customer.tags)
      setNotes(detail.customer.notes ?? '')
      setTagInput('')
    }
  }, [detail])

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (tags.length >= 10) {
      toast.error('حداکثر ۱۰ برچسب مجاز است')
      return
    }
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) return
    setTags([...tags, t])
    setTagInput('')
  }

  const save = () => {
    if (userId === null || venueId === null) return
    updateCustomer.mutate(
      { userId, venueId, data: { is_vip: isVip, tags, notes: notes.trim().slice(0, 2000) || '' } },
      {
        onSuccess: () => toast.success('اطلاعات مشتری ذخیره شد'),
        onError: (err) => toast.error(extractError(err, 'خطا در ذخیره تغییرات')),
      },
    )
  }

  return (
    <Dialog open={userId !== null} onClose={onClose} maxWidth="md" title="جزئیات مشتری">
      {detailQuery.isPending ? (
        <LoadingBox text='در حال دریافت جزئیات...' />
      ) : detailQuery.isError ? (
        isForbidden(detailQuery.error) ? (
          <ForbiddenPanel />
        ) : (
          <ErrorBox message={crmErrorMessage(detailQuery.error, 'دریافت جزئیات ممکن نشد')} onRetry={() => detailQuery.refetch()} />
        )
      ) : !detail ? (
        <EmptyBox icon="mdi:account-off-outline" title="مشتری یافت نشد" />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* هدر پروفایل */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
                bgcolor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:account" className="h-6 w-6" style={{ color: '#2563eb' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {detail.customer.full_name ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" dir="ltr">
                {detail.customer.phone ?? '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mr: 'auto' }}>
              {detail.customer.is_vip && (
                <Chip icon={<Icon icon="mdi:star" />} label="VIP" size="small" sx={{ borderRadius: '8px', fontWeight: 700, color: '#d97706', bgcolor: 'rgba(217,119,6,0.1)' }} />
              )}
              <SegmentChip segment={detail.customer.segment} small />
            </Box>
          </Box>

          {/* آمار مشتری */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1 }}>
            {[
              { label: 'رزروها', value: `${toPersianDigits(detail.customer.bookings_count)}`, icon: 'mdi:calendar-check' },
              { label: 'مجموع پرداختی', value: formatRial(detail.customer.total_spend), icon: 'mdi:cash' },
              { label: 'مانده حساب', value: formatRial(detail.customer.balance_due), icon: 'mdi:book-alert' },
              { label: 'امتیاز وفاداری', value: toPersianDigits(detail.customer.loyalty_balance ?? 0), icon: 'mdi:star-four-points' },
              { label: 'آخرین بازدید', value: detail.customer.last_booking_date ? formatJalaliDate(detail.customer.last_booking_date, { format: 'numeric' }) : '—', icon: 'mdi:eye' },
            ].map((s) => (
              <Box key={s.label} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.06)', bgcolor: 'rgba(248,250,252,0.6)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{s.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>{s.value}</Typography>
              </Box>
            ))}
          </Box>

          {/* ویرایش */}
          <SectionCard title="ویرایش اطلاعات (ویژه / برچسب / یادداشت)" icon="mdi:account-edit" color="#7c3aed" dense>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <FormControlLabel
                control={<Switch checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:star" className="h-4 w-4" style={{ color: '#d97706' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>مشتری ویژه (VIP)</Typography>
                  </Box>
                }
                sx={{ mr: 0 }}
              />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  برچسب‌ها (حداکثر ۱۰)
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
                  {tags.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      onDelete={() => setTags(tags.filter((x) => x !== t))}
                      sx={{ borderRadius: '8px', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 600 }}
                    />
                  ))}
                  {tags.length === 0 && (
                    <Typography variant="caption" color="text.secondary">بدون برچسب</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="افزودن برچسب..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <Button size="small" variant="outlined" onClick={addTag} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
                    افزودن
                  </Button>
                </Box>
              </Box>
              <TextField
                label="یادداشت"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  disabled={!dirty || updateCustomer.isPending}
                  onClick={save}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
                >
                  {updateCustomer.isPending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'ذخیره تغییرات'}
                </Button>
              </Box>
            </Box>
          </SectionCard>

          {/* فعالیت اخیر */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <SectionCard title={`رزروهای اخیر (${detail.recent_bookings.length})`} icon="mdi:calendar-month" dense>
              {detail.recent_bookings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">رزروی ثبت نشده است.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {detail.recent_bookings.map((b) => (
                    <Box key={b.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatJalaliDate(b.slot_date, { format: 'numeric' })} — {b.start_time}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ثبت: {formatJalaliDateTime(b.booked_at, { format: 'numeric' })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        {b.payment_amount !== null && (
                          <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {formatRial(b.payment_amount)}
                          </Typography>
                        )}
                        <BookingStatusChip status={b.status} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </SectionCard>
            <SectionCard title={`پرداخت‌های اخیر (${detail.recent_payments.length})`} icon="mdi:cash-sync" color="#059669" dense>
              {detail.recent_payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">تراکنشی ثبت نشده است.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {detail.recent_payments.map((t) => (
                    <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {labelOf(TX_TYPE_LABELS, t.type)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatJalaliDate(t.occurred_at, { format: 'numeric' })}
                          {t.status === 'voided' ? ' — باطل' : ''}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: t.direction === 'income' ? '#059669' : '#dc2626' }} dir="rtl">
                        {t.direction === 'income' ? '＋' : '−'}{formatRial(t.amount)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  خلاصه صورتحساب · {toPersianDigits(detail.statement.entries.length)} ردیف
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  موجودی: {formatRial(detail.statement.closing_balance)}
                </Typography>
              </Box>
            </SectionCard>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}

export default CustomerDetailDialog