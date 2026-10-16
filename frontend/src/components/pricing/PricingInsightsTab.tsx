// frontend/src/components/pricing/PricingInsightsTab.tsx
// C5 — «تقاضا و پیشنهاد»: نقشهٔ اشغال از رزروهای واقعی + پیشنهاد قیمت چسبیده به موتور.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import PersianDatePicker from '@/components/ui/PersianDatePicker'
import {
  EmptyBox,
  ErrorBox,
  LoadingBox,
  SectionCard,
  extractError,
  faNum,
  formatPct,
  formatRial,
} from '@/components/finance/shared'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import {
  PRICING_INSIGHT_WINDOWS,
  useCreatePricingRule,
  usePriceSuggestion,
  usePricingOccupancy,
} from '@/hooks/usePricing'
import type { OccupancyBucket, PriceSuggestion } from '@/services/pricing'
import PricingRuleDialog from './PricingRuleDialog'
import { WEEKDAYS_PY_ORDER, faTime, parseIntFa, timeToHHMM } from './shared'
import type { FinanceVenue } from '@/hooks/useFinance'

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

const CONFIDENCE_LABELS: Record<PriceSuggestion['confidence'], string> = {
  high: 'اطمینان بالا',
  medium: 'اطمینان متوسط',
  low: 'داده کم',
}

/** رنگ فقط مکمل است؛ عدد و متن همیشه دیده می‌شوند (WCAG — color-not-only) */
function occTone(pct: number | null): { bg: string; fg: string } {
  if (pct === null) return { bg: 'rgba(0,0,0,0.02)', fg: 'text.secondary' }
  if (pct >= 80) return { bg: 'rgba(220,38,38,0.14)', fg: '#991b1b' }
  if (pct >= 60) return { bg: 'rgba(217,119,6,0.14)', fg: '#92400e' }
  if (pct >= 40) return { bg: 'rgba(5,150,105,0.12)', fg: '#065f46' }
  if (pct >= 20) return { bg: 'rgba(37,99,235,0.10)', fg: '#1d4ed8' }
  return { bg: 'rgba(0,0,0,0.04)', fg: '#374151' }
}

const PricingInsightsTab: React.FC<Props> = ({ venues, venueId }) => {
  const [days, setDays] = useState<number>(90)
  const [date, setDate] = useState(getTodayISO())
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState('90')
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [ruleDraftOpen, setRuleDraftOpen] = useState(false)

  const occupancyQuery = usePricingOccupancy(venueId, days, venueId != null)
  const suggest = usePriceSuggestion()
  const createRule = useCreatePricingRule(venueId)

  const report = occupancyQuery.data
  const hours = useMemo(
    () => Array.from(new Set((report?.buckets ?? []).map((b) => b.hour))).sort((a, b) => a - b),
    [report],
  )
  const byKey = useMemo(() => {
    const map = new Map<string, OccupancyBucket>()
    for (const b of report?.buckets ?? []) map.set(`${b.weekday}-${b.hour}`, b)
    return map
  }, [report])

  if (venueId == null) {
    return (
      <SectionCard title="تحلیل تقاضا" icon="mdi:chart-bubble" color="#7c3aed">
        <EmptyBox icon="mdi:store-outline" title="ابتدا یک سالن انتخاب کنید" text="اشغال و پیشنهاد قیمت سالن‌محورند؛ سالن خود را از بالا انتخاب کنید." />
      </SectionCard>
    )
  }

  const runSuggestion = () => {
    setSuggestion(null)
    if (!date) {
      toast.error('تاریخ را انتخاب کنید')
      return
    }
    const st = timeToHHMM(time)
    if (!st) {
      toast.error('ساعت را به شکل ۱۸:۳۰ وارد کنید')
      return
    }
    const dur = parseIntFa(duration)
    if (!dur || dur < 15 || dur > 240) {
      toast.error('مدت باید بین ۱۵ تا ۲۴۰ دقیقه باشد')
      return
    }
    suggest.mutate(
      { venue_id: venueId, slot_date: date, start_time: `${st}:00`, duration: dur, days },
      {
        onSuccess: (data) => setSuggestion(data),
        onError: (err) => toast.error(extractError(err, 'خطا در دریافت پیشنهاد قیمت')),
      },
    )
  }

  const venueName = venues.find((v) => v.id === venueId)?.name ?? 'سالن'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SectionCard
        title={`نقشهٔ اشغال ${venueName}`}
        icon="mdi:chart-bubble"
        color="#7c3aed"
        action={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="pi-window-label">پنجرهٔ تاریخچه</InputLabel>
            <Select
              labelId="pi-window-label"
              label="پنجرهٔ تاریخچه"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              sx={{ borderRadius: '10px' }}
            >
              {PRICING_INSIGHT_WINDOWS.map((d) => (
                <MenuItem key={d} value={d}>{`${toPersianDigits(d)} روز اخیر`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          نرخ اشغال از رزروهای تأییدشدهٔ گذشته شمرده می‌شود (رزرو لغوشده شمار نمی‌شود)؛
          «—» یعنی سانسِ فعالی برای آن روز و ساعت در این بازه ثبت نشده، نه اینکه اشغال صفر باشد.
        </Typography>

        {occupancyQuery.isPending ? (
          <LoadingBox text="در حال محاسبهٔ اشغال..." />
        ) : occupancyQuery.isError ? (
          <ErrorBox message="خطا در دریافت تحلیل تقاضا" onRetry={() => occupancyQuery.refetch()} />
        ) : !report || report.buckets.length === 0 ? (
          <EmptyBox
            icon="mdi:calendar-off-outline"
            title="داده‌ای برای این بازه وجود ندارد"
            text="در پنجرهٔ انتخابی هیچ سانس فعالی ثبت نشده. بازه را بزرگ‌تر کنید یا سانس بسازید."
          />
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip size="small" data-testid="insight-overall" label={`میانگین اشغال: ${formatPct(report.overall_occupancy)}`} sx={{ borderRadius: '8px', fontWeight: 700 }} />
              <Chip size="small" label={`${toPersianDigits(report.total_bookings)} رزرو از ${toPersianDigits(report.total_slots)} سانس`} sx={{ borderRadius: '8px' }} />
              <Chip size="small" label={`میانگین پرداخت: ${formatRial(report.overall_avg_paid)}`} sx={{ borderRadius: '8px' }} />
              <Chip size="small" variant="outlined" label={`${toPersianDigits(report.start_date)} تا ${toPersianDigits(report.end_date)}`} sx={{ borderRadius: '8px' }} />
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflowX: 'auto' }}>
              <Table size="small" aria-label="نقشه اشغال به تفکیک روز هفته و ساعت">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableCell scope="col" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>روز</TableCell>
                    {hours.map((h) => (
                      <TableCell key={h} scope="col" align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        {faTime(`${String(h).padStart(2, '0')}:00`)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {WEEKDAYS_PY_ORDER.map((d) => (
                    <TableRow key={d.value}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{d.label}</TableCell>
                      {hours.map((h) => {
                        const b = byKey.get(`${d.value}-${h}`)
                        const tone = occTone(b?.occupancy ?? null)
                        return (
                          <TableCell key={h} align="center" sx={{ p: 0.5 }}>
                            {b ? (
                              <Box
                                data-testid={`insight-cell-${d.value}-${h}`}
                                aria-label={`${d.label} ساعت ${faTime(`${String(h).padStart(2, '0')}:00`)}: اشغال ${formatPct(b.occupancy)} — ${toPersianDigits(b.bookings)} رزرو از ${toPersianDigits(b.slots)} سانس${b.avg_paid != null ? `، میانگین پرداخت ${formatRial(b.avg_paid)}` : ''}`}
                                sx={{
                                  borderRadius: '8px',
                                  px: 0.75,
                                  py: 0.5,
                                  minWidth: 58,
                                  bgcolor: tone.bg,
                                  color: tone.fg,
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                  {formatPct(b.occupancy)}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.1 }}>
                                  {toPersianDigits(b.bookings)}/{toPersianDigits(b.slots)}
                                </Typography>
                              </Box>
                            ) : (
                              <Box data-testid={`insight-empty-${d.value}-${h}`} sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>
                                —
                              </Box>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </SectionCard>

      <SectionCard title="پیشنهاد قیمت بر پایهٔ تاریخچه" icon="mdi:lightbulb-on-outline" color="#059669">
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          پیشنهاد همیشه کنارِ قیمت موتور محاسبه می‌شود و هرگز خودش را جای قیمت نمی‌گذارد؛
          تا قانون نسازید، هیچ رزرویی با این عدد فروش نمی‌رود.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ flex: '1 1 180px', minWidth: 170 }}>
            <PersianDatePicker label="تاریخ" value={date} onChange={setDate} size="small" clearable={false} />
          </Box>
          <TextField
            label="ساعت شروع"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            size="small"
            dir="ltr"
            data-testid="insight-time"
            sx={{ flex: '0 1 120px', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Box sx={{ flex: '0 1 130px' }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="pi-duration-label">مدت (دقیقه)</InputLabel>
              <Select labelId="pi-duration-label" label="مدت (دقیقه)" value={duration} onChange={(e) => setDuration(e.target.value)} sx={{ borderRadius: '10px', width: '100%' }}>
                {[60, 75, 90, 120].map((d) => (
                  <MenuItem key={d} value={String(d)}>{toPersianDigits(d)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="contained"
            onClick={runSuggestion}
            disabled={suggest.isPending}
            data-testid="insight-run"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, alignSelf: 'flex-end', height: 40, background: 'linear-gradient(135deg, #059669, #10b981)' }}
            startIcon={<Icon icon={suggest.isPending ? 'mdi:loading' : 'mdi:sparkles'} className="h-4 w-4" />}
          >
            {suggest.isPending ? '...' : 'محاسبهٔ پیشنهاد'}
          </Button>
        </Box>

        {suggestion && (
          <Box sx={{ mt: 2.5 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              <Chip size="small" data-testid="suggestion-confidence" color={suggestion.confidence === 'low' ? 'default' : 'success'} label={CONFIDENCE_LABELS[suggestion.confidence]} sx={{ borderRadius: '8px', fontWeight: 700 }} />
              <Chip size="small" label={`${WEEKDAYS_PY_ORDER.find((d) => d.value === suggestion.weekday)?.label ?? ''} — ${faTime(suggestion.start_time)}`} sx={{ borderRadius: '8px' }} />
              <Chip size="small" variant="outlined" label={`پنجرهٔ ${toPersianDigits(suggestion.days)} روز`} sx={{ borderRadius: '8px' }} />
              {suggestion.bucket ? (
                <Chip size="small" variant="outlined" data-testid="suggestion-occupancy" label={`اشغال این دسته: ${formatPct(suggestion.bucket.occupancy)} — ${toPersianDigits(suggestion.bucket.bookings)}/${toPersianDigits(suggestion.bucket.slots)}`} sx={{ borderRadius: '8px' }} />
              ) : (
                <Chip size="small" variant="outlined" data-testid="suggestion-occupancy" label="اشغال این دسته: بدون داده" sx={{ borderRadius: '8px' }} />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'stretch' }}>
              <Box sx={{ flex: '1 1 160px', p: 1.5, borderRadius: '12px', bgcolor: 'rgba(37,99,235,0.06)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>قیمت موتور (لنگر)</Typography>
                <Typography variant="body1" data-testid="suggestion-engine" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatRial(suggestion.engine_price)}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 160px', p: 1.5, borderRadius: '12px', bgcolor: suggestion.applies ? 'rgba(5,150,105,0.10)' : 'rgba(0,0,0,0.04)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>پیشنهاد</Typography>
                <Typography variant="body1" data-testid="suggestion-recommended" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: suggestion.applies ? '#065f46' : 'text.secondary' }}>{formatRial(suggestion.recommended_price)}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 160px', p: 1.5, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.03)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>بازهٔ ایمن</Typography>
                <Typography variant="body2" data-testid="suggestion-band" sx={{ fontWeight: 700 }}>
                  {formatRial(suggestion.floor_price, false)} تا {formatRial(suggestion.ceiling_price)}
                </Typography>
              </Box>
              <Box sx={{ flex: '0 1 120px', p: 1.5, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.03)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>تغییر</Typography>
                <Typography
                  variant="body1"
                  data-testid="suggestion-delta"
                  sx={{ fontWeight: 800, color: suggestion.delta_percent > 0 ? '#b91c1c' : suggestion.delta_percent < 0 ? '#047857' : 'text.secondary' }}
                >
                  {suggestion.delta_percent > 0 ? '+' : suggestion.delta_percent < 0 ? '−' : ''}
                  {faNum(Math.abs(suggestion.delta_percent))}٪
                </Typography>
              </Box>
            </Box>

            <Box component="ul" sx={{ mt: 2, pl: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {suggestion.reasons.map((r, i) => (
                <Box component="li" key={`${i}-${r.slice(0, 12)}`} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                  <Icon icon="mdi:information-outline" style={{ width: 15, height: 15, color: '#6b7280', marginTop: 3, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{r}</Typography>
                </Box>
              ))}
            </Box>

            {suggestion.applies ? (
              <Button
                variant="outlined"
                onClick={() => setRuleDraftOpen(true)}
                data-testid="suggestion-apply"
                sx={{ mt: 2, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                startIcon={<Icon icon="mdi:tag-plus-outline" className="h-4 w-4" />}
              >
                اعمال به‌عنوان قانون قیمت
              </Button>
            ) : (
              <Typography variant="body2" data-testid="suggestion-no-action" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
                برای این سانس تغییری توصیه نمی‌شود — یا داده کافی نیست یا پیشنهاد با قیمت موتور برابر شد.
              </Typography>
            )}
          </Box>
        )}
      </SectionCard>

      <PricingRuleDialog
        open={ruleDraftOpen}
        venueId={venueId}
        rule={null}
        draft={
          suggestion
            ? {
                day_of_week: suggestion.weekday,
                start_time: `${String(suggestion.hour).padStart(2, '0')}:00`,
                end_time: suggestion.hour >= 23 ? null : `${String(suggestion.hour + 1).padStart(2, '0')}:00`,
                modifier_type: 'absolute',
                value: suggestion.recommended_price,
                label: `پیشنهاد تقاضا — ${WEEKDAYS_PY_ORDER.find((d) => d.value === suggestion.weekday)?.label ?? ''} ${faTime(suggestion.start_time)}`,
              }
            : null
        }
        saving={createRule.isPending}
        onClose={() => setRuleDraftOpen(false)}
        onSubmit={(payload) => {
          createRule.mutate(payload, {
            onSuccess: () => {
              toast.success('قانون ساخته شد؛ قیمت موتور از این پس همین مسیر را می‌رود ✅')
              setRuleDraftOpen(false)
              occupancyQuery.refetch()
            },
            onError: (err) => toast.error(extractError(err, 'خطا در ذخیره قانون')),
          })
        }}
      />
    </Box>
  )
}

export default PricingInsightsTab
