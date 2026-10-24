// frontend/src/components/pricing/PricingInsightsTab.tsx
// C5 — «تقاضا و پیشنهاد»: نقشهٔ اشغال از رزروهای واقعی + پیشنهاد قیمت چسبیده به موتور.

import React, { useId, useMemo, useState } from 'react'
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
import { CHIP_INK, chipStyle } from '@/utils/contrast'
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
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

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
  if (pct === null) return { bg: 'rgba(0,0,0,0.02)', fg: '#64748b' }
  if (pct >= 80) return { bg: 'rgba(220,38,38,0.14)', fg: '#991b1b' }
  if (pct >= 60) return { bg: 'rgba(217,119,6,0.14)', fg: '#92400e' }
  if (pct >= 40) return { bg: 'rgba(5,150,105,0.12)', fg: '#065f46' }
  if (pct >= 20) return { bg: 'rgba(37,99,235,0.10)', fg: '#1d4ed8' }
  return { bg: 'rgba(0,0,0,0.04)', fg: '#374151' }
}

const META_CHIP = 'inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] text-foreground tabular-nums'
const META_CHIP_OUTLINE = 'inline-flex items-center rounded-lg border border-border bg-card px-2 py-0.5 text-[0.68rem] text-foreground tabular-nums'

const PricingInsightsTab: React.FC<Props> = ({ venues, venueId }) => {
  const [days, setDays] = useState<number>(90)
  const [date, setDate] = useState(getTodayISO())
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState('90')
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [ruleDraftOpen, setRuleDraftOpen] = useState(false)

  const timeId = useId()

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
    <div className="flex flex-col gap-6">
      <SectionCard
        title={`نقشهٔ اشغال ${venueName}`}
        icon="mdi:chart-bubble"
        color="#7c3aed"
        action={
          <div className="flex min-w-[150px] flex-col gap-1.5">
            <Label id="pi-window-label" htmlFor="pi-window-select" className="text-[0.68rem]">پنجرهٔ تاریخچه</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger id="pi-window-select" aria-labelledby="pi-window-label" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_INSIGHT_WINDOWS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{`${toPersianDigits(d)} روز اخیر`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <p className="mb-3 text-[0.68rem] text-muted-foreground">
          نرخ اشغال از رزروهای تأییدشدهٔ گذشته شمرده می‌شود (رزرو لغوشده شمار نمی‌شود)؛
          «—» یعنی سانسِ فعالی برای آن روز و ساعت در این بازه ثبت نشده، نه اینکه اشغال صفر باشد.
        </p>

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
            <div className="mb-4 flex flex-wrap gap-2">
              <span data-testid="insight-overall" className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-bold text-foreground tabular-nums">
                {`میانگین اشغال: ${formatPct(report.overall_occupancy)}`}
              </span>
              <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] text-foreground tabular-nums">
                {`${toPersianDigits(report.total_bookings)} رزرو از ${toPersianDigits(report.total_slots)} سانس`}
              </span>
              <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] text-foreground tabular-nums">
                {`میانگین پرداخت: ${formatRial(report.overall_avg_paid)}`}
              </span>
              <span className={META_CHIP_OUTLINE}>
                {`${toPersianDigits(report.start_date)} تا ${toPersianDigits(report.end_date)}`}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table aria-label="نقشه اشغال به تفکیک روز هفته و ساعت">
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="whitespace-nowrap font-bold">روز</TableHead>
                    {hours.map((h) => (
                      <TableHead key={h} scope="col" className="whitespace-nowrap text-center text-[0.75rem] font-bold">
                        {faTime(`${String(h).padStart(2, '0')}:00`)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEKDAYS_PY_ORDER.map((d) => (
                    <TableRow key={d.value}>
                      <TableCell className="whitespace-nowrap font-semibold text-foreground">{d.label}</TableCell>
                      {hours.map((h) => {
                        const b = byKey.get(`${d.value}-${h}`)
                        const tone = occTone(b?.occupancy ?? null)
                        return (
                          <TableCell key={h} className="p-1 text-center">
                            {b ? (
                              <div
                                data-testid={`insight-cell-${d.value}-${h}`}
                                aria-label={`${d.label} ساعت ${faTime(`${String(h).padStart(2, '0')}:00`)}: اشغال ${formatPct(b.occupancy)} — ${toPersianDigits(b.bookings)} رزرو از ${toPersianDigits(b.slots)} سانس${b.avg_paid != null ? `، میانگین پرداخت ${formatRial(b.avg_paid)}` : ''}`}
                                className={`min-w-[58px] rounded-lg px-1.5 py-1 ${CHIP_INK}`}
                                style={chipStyle(tone.fg, tone.bg)}
                              >
                                <p className="text-[0.68rem] font-extrabold leading-tight tabular-nums">
                                  {formatPct(b.occupancy)}
                                </p>
                                <p className="block text-[0.68rem] leading-tight tabular-nums">
                                  {toPersianDigits(b.bookings)}/{toPersianDigits(b.slots)}
                                </p>
                              </div>
                            ) : (
                              <div data-testid={`insight-empty-${d.value}-${h}`} className="text-[0.68rem] text-muted-foreground/60">
                                —
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="پیشنهاد قیمت بر پایهٔ تاریخچه" icon="mdi:lightbulb-on-outline" color="#059669">
        <p className="mb-3 text-[0.68rem] text-muted-foreground">
          پیشنهاد همیشه کنارِ قیمت موتور محاسبه می‌شود و هرگز خودش را جای قیمت نمی‌گذارد؛
          تا قانون نسازید، هیچ رزرویی با این عدد فروش نمی‌رود.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-[170px] flex-[1_1_180px]">
            <PersianDatePicker label="تاریخ" value={date} onChange={setDate} size="small" clearable={false} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={timeId}>ساعت شروع</Label>
            <Input
              id={timeId}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              dir="ltr"
              data-testid="insight-time"
              className="w-[120px] tabular-nums"
            />
          </div>
          <div className="flex min-w-[130px] flex-col gap-1.5">
            <Label id="pi-duration-label" htmlFor="pi-duration-select">مدت (دقیقه)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="pi-duration-select" aria-labelledby="pi-duration-label" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[60, 75, 90, 120].map((d) => (
                  <SelectItem key={d} value={String(d)}>{toPersianDigits(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={runSuggestion}
            disabled={suggest.isPending}
            data-testid="insight-run"
            className="self-end bg-gradient-to-br from-emerald-700 to-emerald-800 font-bold text-white hover:from-emerald-800 hover:to-emerald-900"
          >
            <Icon icon={suggest.isPending ? 'mdi:loading' : 'mdi:sparkles'} className={suggest.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
            {suggest.isPending ? '...' : 'محاسبهٔ پیشنهاد'}
          </Button>
        </div>

        {suggestion && (
          <div className="mt-5">
            <Separator className="mb-4" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                data-testid="suggestion-confidence"
                className={
                  suggestion.confidence === 'low'
                    ? 'inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-bold text-foreground'
                    : 'inline-flex items-center rounded-lg bg-emerald-600/15 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300'
                }
              >
                {CONFIDENCE_LABELS[suggestion.confidence]}
              </span>
              <span className={META_CHIP}>
                {`${WEEKDAYS_PY_ORDER.find((d) => d.value === suggestion.weekday)?.label ?? ''} — ${faTime(suggestion.start_time)}`}
              </span>
              <span className={META_CHIP_OUTLINE}>
                {`پنجرهٔ ${toPersianDigits(suggestion.days)} روز`}
              </span>
              {suggestion.bucket ? (
                <span data-testid="suggestion-occupancy" className={META_CHIP_OUTLINE}>
                  {`اشغال این دسته: ${formatPct(suggestion.bucket.occupancy)} — ${toPersianDigits(suggestion.bucket.bookings)}/${toPersianDigits(suggestion.bucket.slots)}`}
                </span>
              ) : (
                <span data-testid="suggestion-occupancy" className={META_CHIP_OUTLINE}>
                  اشغال این دسته: بدون داده
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-stretch gap-3">
              <div className="flex-[1_1_160px] rounded-xl bg-blue-600/[0.06] p-3">
                <span className="text-[0.68rem] font-bold text-muted-foreground">قیمت موتور (لنگر)</span>
                <p data-testid="suggestion-engine" className="text-sm font-extrabold text-foreground tabular-nums">{formatRial(suggestion.engine_price)}</p>
              </div>
              <div
                className={
                  suggestion.applies
                    ? 'flex-[1_1_160px] rounded-xl bg-emerald-600/[0.10] p-3'
                    : 'flex-[1_1_160px] rounded-xl bg-black/[0.04] p-3 dark:bg-white/[0.04]'
                }
              >
                <span className="text-[0.68rem] font-bold text-muted-foreground">پیشنهاد</span>
                <p
                  data-testid="suggestion-recommended"
                  className={
                    suggestion.applies
                      ? 'text-sm font-black text-emerald-800 tabular-nums dark:text-emerald-300'
                      : 'text-sm font-black text-muted-foreground tabular-nums'
                  }
                >
                  {formatRial(suggestion.recommended_price)}
                </p>
              </div>
              <div className="flex-[1_1_160px] rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.03]">
                <span className="text-[0.68rem] font-bold text-muted-foreground">بازهٔ ایمن</span>
                <p data-testid="suggestion-band" className="text-[0.68rem] font-bold text-foreground tabular-nums">
                  {formatRial(suggestion.floor_price, false)} تا {formatRial(suggestion.ceiling_price)}
                </p>
              </div>
              <div className="flex-[0_1_120px] rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.03]">
                <span className="text-[0.68rem] font-bold text-muted-foreground">تغییر</span>
                <p
                  data-testid="suggestion-delta"
                  className={
                    suggestion.delta_percent > 0
                      ? 'text-sm font-extrabold text-red-700 tabular-nums dark:text-red-400'
                      : suggestion.delta_percent < 0
                        ? 'text-sm font-extrabold text-emerald-700 tabular-nums dark:text-emerald-400'
                        : 'text-sm font-extrabold text-muted-foreground tabular-nums'
                  }
                >
                  {suggestion.delta_percent > 0 ? '+' : suggestion.delta_percent < 0 ? '−' : ''}
                  {faNum(Math.abs(suggestion.delta_percent))}٪
                </p>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-1 ps-4">
              {suggestion.reasons.map((r, i) => (
                <li key={`${i}-${r.slice(0, 12)}`} className="flex list-none items-start gap-1.5">
                  <Icon icon="mdi:information-outline" className="mt-0.5 h-[15px] w-[15px] shrink-0" style={{ color: '#6b7280' }} aria-hidden="true" />
                  <span className="text-[0.68rem] text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>

            {suggestion.applies ? (
              <Button
                variant="outline"
                onClick={() => setRuleDraftOpen(true)}
                data-testid="suggestion-apply"
                className="mt-4 font-bold"
              >
                <Icon icon="mdi:tag-plus-outline" className="h-4 w-4" aria-hidden="true" />
                اعمال به‌عنوان قانون قیمت
              </Button>
            ) : (
              <p data-testid="suggestion-no-action" className="mt-4 text-[0.68rem] font-semibold text-muted-foreground">
                برای این سانس تغییری توصیه نمی‌شود — یا داده کافی نیست یا پیشنهاد با قیمت موتور برابر شد.
              </p>
            )}
          </div>
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
    </div>
  )
}

export default PricingInsightsTab
