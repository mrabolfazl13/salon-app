// frontend/src/components/crm/CampaignsTab.tsx
// «کمپین» — ساخت کمپین پیامکی (segment یا انتخاب دستی مشتری) با پیش‌نمایش دامنه
// از /crm/stats + جعبه هشدار قاعده‌ی فقط-رضایت + تاریخچه کمپین‌ها.
// نکته: بک‌اند تعدادِ دارایِ رضایت را در stats منتشر نمی‌کند؛ فیلتر رضایت
// سمت سرور اعمال و در پاسخ sent_count/skipped_no_consent برمی‌گردد.

import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useCrmCampaigns, useCrmStats, useCreateCampaign } from '@/hooks/useCrm'
import { crmService, type CrmCustomerRow } from '@/services/crm'
import { ForbiddenPanel, SEGMENT_LABELS, SEGMENT_ORDER, crmErrorMessage, isForbidden } from './shared'

const MAX_SELECTED = 2000

interface Props {
  venueId: number
}

const CampaignsTab: React.FC<Props> = ({ venueId }) => {
  const [targetMode, setTargetMode] = useState<'segment' | 'customers'>('segment')
  const [segment, setSegment] = useState<string>('regular')
  const [selected, setSelected] = useState<CrmCustomerRow[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [candidates, setCandidates] = useState<CrmCustomerRow[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [discount, setDiscount] = useState('')

  const statsQuery = useCrmStats(venueId)
  const campaignsQuery = useCrmCampaigns(venueId)
  const createCampaign = useCreateCampaign()

  // جست‌وجوی مشتری برای انتخاب دستی (debounce)
  useEffect(() => {
    if (targetMode !== 'customers') return
    const t = setTimeout(async () => {
      const q = searchInput.trim()
      if (!q) { setCandidates([]); return }
      try {
        const res = await crmService.listCustomers({ venue_id: venueId, search: q, limit: 10, offset: 0, status: 'all' })
        setCandidates(res.items)
      } catch (err) {
        toast.error(crmErrorMessage(err, 'جست‌وجوی مشتریان ناموفق بود'))
      }
    }, 350)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMode, searchInput, venueId])

  const reachCount = useMemo(() => {
    if (targetMode === 'customers') return selected.length
    return statsQuery.data?.segments?.[segment] ?? null
  }, [targetMode, segment, selected.length, statsQuery.data])

  const toggle = (row: CrmCustomerRow) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.user_id === row.user_id)
      if (!exists && prev.length >= MAX_SELECTED) {
        toast.error(`حداکثر ${toPersianDigits(MAX_SELECTED)} مشتری قابل انتخاب است`)
        return prev
      }
      return exists ? prev.filter((p) => p.user_id !== row.user_id) : [...prev, row]
    })
  }

  const submit = () => {
    if (title.trim().length < 3) { toast.error('عنوان باید حداقل ۳ کاراکتر باشد'); return }
    if (message.trim().length < 3) { toast.error('متن پیام باید حداقل ۳ کاراکتر باشد'); return }
    if (targetMode === 'customers' && selected.length === 0) { toast.error('حداقل یک مشتری را انتخاب کنید'); return }
    createCampaign.mutate(
      {
        venue_id: venueId,
        segment: targetMode === 'segment' ? segment : null,
        customer_ids: targetMode === 'customers' ? selected.map((s) => s.user_id) : null,
        title: title.trim(),
        message: message.trim(),
        discount_code: discount.trim() || null,
      },
      {
        onSuccess: (res) => {
          toast.success(`${toPersianDigits(res.sent_count)} پیام ارسال شد — ${toPersianDigits(res.skipped_no_consent)} بدون رضایت رد شدند`)
          setTitle(''); setMessage(''); setDiscount(''); setSelected([]); setCandidates([]); setSearchInput('')
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ارسال کمپین')),
      },
    )
  }

  const items = campaignsQuery.data?.items ?? []

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
      {/* فرم ساخت */}
      <SectionCard title="کمپین جدید" icon="mdi:message-alert-outline" color="#d97706">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <RadioGroup row value={targetMode} onChange={(e) => setTargetMode(e.target.value as 'segment' | 'customers')}>
            <FormControlLabel value="segment" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>بر اساس گروه مشتریان</Typography>} />
            <FormControlLabel value="customers" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>انتخاب دستی مشتریان</Typography>} />
          </RadioGroup>

          {targetMode === 'segment' ? (
            <FormControl size="small" fullWidth>
              <Select value={segment} onChange={(e) => setSegment(e.target.value)} sx={{ borderRadius: '10px' }}>
                {SEGMENT_ORDER.map((s) => (
                  <MenuItem key={s} value={s}>{SEGMENT_LABELS[s]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Box>
              <TextField
                size="small"
                fullWidth
                placeholder="جست‌وجوی نام یا موبایل مشتری..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              {candidates.length > 0 && (
                <Box sx={{ mt: 1, border: '1px solid rgba(15,23,42,0.08)', borderRadius: '12px', maxHeight: 200, overflow: 'auto' }}>
                  {candidates.map((c) => {
                    const picked = selected.some((p) => p.user_id === c.user_id)
                    return (
                      <Box
                        key={c.user_id}
                        onClick={() => toggle(c)}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                          px: 1.5, py: 1, cursor: 'pointer',
                          bgcolor: picked ? 'rgba(37,99,235,0.06)' : 'transparent',
                          borderBottom: '1px solid rgba(15,23,42,0.04)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          {picked && <Icon icon="mdi:checkbox-marked" className="h-4 w-4" style={{ color: '#2563eb' }} />}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.full_name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary" dir="ltr">{c.phone}</Typography>
                        </Box>
                        {!c.marketing_consent && (
                          <Chip label="بدون رضایت" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }} />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                {selected.map((s) => (
                  <Chip
                    key={s.user_id}
                    label={s.full_name ?? String(s.user_id)}
                    size="small"
                    onDelete={() => toggle(s)}
                    sx={{ borderRadius: '8px', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* پیش‌نمایش دامنه */}
          <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              <Icon icon="mdi:account-multiple-outline" className="h-4 w-4 inline ml-1" />
              دامنه پیش‌بینی‌شده: {reachCount === null ? '…' : `${toPersianDigits(reachCount)} مشتری`}
              {targetMode === 'segment' && ` در گروه «${SEGMENT_LABELS[segment]}»`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              شمارش نهاییِ دارایانِ رضایت سمت سرور انجام می‌شود؛ سقف روزانه کمپین هر سالن هم اعمال می‌گردد.
            </Typography>
          </Box>

          <Alert severity="warning" icon="mdi:shield-lock-outline" sx={{ borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
            فقط به مشتریان با رضایت پیام ارسال می‌شود — مشتریان بدون «رضایت بازاریابی» خودکار رد شده و در گزارش تاریخچه ثبت می‌گردد.
          </Alert>

          <TextField label="عنوان پیام" size="small" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          <TextField
            label="متن پیام"
            size="small"
            multiline
            minRows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1500))}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            label="کد تخفیف (اختیاری)"
            size="small"
            value={discount}
            onChange={(e) => setDiscount(e.target.value.slice(0, 40))}
            helperText="در ابتدای پیام به صورت «| کد تخفیف: ...» افزوده می‌شود"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Button
            variant="contained"
            onClick={submit}
            disabled={createCampaign.isPending}
            startIcon={createCampaign.isPending ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:send" />}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#d97706,#f59e0b)', alignSelf: 'flex-start', px: 3 }}
          >
            ارسال کمپین
          </Button>
        </Box>
      </SectionCard>

      {/* تاریخچه */}
      <SectionCard title={`تاریخچه کمپین‌ها (${toPersianDigits(campaignsQuery.data?.total ?? 0)})`} icon="mdi:history" color="#2563eb">
        {campaignsQuery.isPending ? (
          <LoadingBox text="در حال دریافت تاریخچه..." />
        ) : campaignsQuery.isError ? (
          isForbidden(campaignsQuery.error) ? <ForbiddenPanel /> : <ErrorBox message={crmErrorMessage(campaignsQuery.error, 'دریافت تاریخچه ممکن نشد')} onRetry={() => campaignsQuery.refetch()} />
        ) : items.length === 0 ? (
          <EmptyBox icon="mdi:message-text-outline" title="هنوز کمپینی ارسال نشده" />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 560, overflow: 'auto', pl: 0.5 }}>
            {items.map((c) => (
              <Box key={c.id} sx={{ p: 1.75, borderRadius: '14px', border: '1px solid rgba(15,23,42,0.06)', bgcolor: 'rgba(248,250,252,0.6)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{c.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.created_at ? formatJalaliDateTime(c.created_at, { format: 'numeric' }) : '—'} · {c.created_by_name ?? '—'}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {c.message.length > 110 ? `${c.message.slice(0, 110)}…` : c.message}
                  {c.discount_code ? ` | کد: ${c.discount_code}` : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
                  {c.segment && (
                    <Chip label={SEGMENT_LABELS[c.segment] ?? c.segment} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed' }} />
                  )}
                  <Chip icon={<Icon icon="mdi:email-check" />} label={`${toPersianDigits(c.sent_count)} ارسال`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(5,150,105,0.1)', color: '#059669' }} />
                  {c.skipped_no_consent > 0 && (
                    <Chip icon={<Icon icon="mdi:email-off" />} label={`${toPersianDigits(c.skipped_no_consent)} بدون رضایت`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444' }} />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>
    </Box>
  )
}

export default CampaignsTab