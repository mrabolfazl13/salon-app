// frontend/src/components/crm/CampaignsTab.tsx
// «کمپین» — ساخت کمپین پیامکی (segment یا انتخاب دستی مشتری) با پیش‌نمایش دامنه
// از /crm/stats + جعبه هشدار قاعده‌ی فقط-رضایت + تاریخچه کمپین‌ها.
// /crm/stats شمارش دارایانِ رضایت (consent_count / consent_by_segment) را هم
// می‌دهد؛ پس «قابل‌ارسال» پیش از ارسال دیده می‌شود. فیلتر نهایی همچنان سمت
// سرور است و در پاسخ sent_count/skipped_no_consent برمی‌گردد.

import React, { useEffect, useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useCrmCampaigns, useCrmStats, useCreateCampaign } from '@/hooks/useCrm'
import { crmService, type CrmCustomerRow } from '@/services/crm'
import { ForbiddenPanel, SEGMENT_LABELS, SEGMENT_ORDER, crmErrorMessage, isForbidden } from './shared'
import { Alert } from '@/components/ui/shadcn/alert'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'

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

  const titleId = useId()
  const messageId = useId()
  const discountId = useId()
  const searchId = useId()

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

  /** چند نفر از این دامنه رضایت دارند — تخمین «قابل‌ارسال» (فیلتر نهایی سمت سرور) */
  const consentReach = useMemo(() => {
    if (targetMode === 'customers') return selected.filter((s) => s.marketing_consent).length
    if (!statsQuery.data) return null
    return statsQuery.data.consent_by_segment?.[segment] ?? null
  }, [targetMode, segment, selected, statsQuery.data])

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
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.15fr_1fr]">
      {/* فرم ساخت */}
      <SectionCard title="کمپین جدید" icon="mdi:message-alert-outline" color="#d97706">
        <div className="flex flex-col gap-4">
          <RadioGroup
            aria-label="روش انتخاب مخاطبان کمپین"
            value={targetMode}
            onValueChange={(v) => setTargetMode(v as 'segment' | 'customers')}
            className="grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <RadioGroupItem value="segment" id="campaign-mode-segment" />
              <span className="text-[0.68rem] font-bold text-foreground">بر اساس گروه مشتریان</span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <RadioGroupItem value="customers" id="campaign-mode-customers" />
              <span className="text-[0.68rem] font-bold text-foreground">انتخاب دستی مشتریان</span>
            </label>
          </RadioGroup>

          {targetMode === 'segment' ? (
            <div>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger aria-label="گروه مشتریان" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{SEGMENT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={searchId}>جست‌وجوی مشتری</Label>
                <Input
                  id={searchId}
                  placeholder="جست‌وجوی نام یا موبایل مشتری..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              {candidates.length > 0 && (
                <div className="mt-2 max-h-[200px] overflow-auto rounded-xl border border-border">
                  {candidates.map((c) => {
                    const picked = selected.some((p) => p.user_id === c.user_id)
                    return (
                      <button
                        key={c.user_id}
                        type="button"
                        aria-pressed={picked}
                        onClick={() => toggle(c)}
                        className={
                          picked
                            ? 'flex w-full cursor-pointer appearance-none items-center justify-between gap-2 border-b border-border/60 bg-blue-600/[0.06] px-3 py-2 text-start font-[inherit] text-inherit transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            : 'flex w-full cursor-pointer appearance-none items-center justify-between gap-2 border-b border-border/60 bg-transparent px-3 py-2 text-start font-[inherit] text-inherit transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        }
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {picked && <Icon icon="mdi:checkbox-marked" className="h-4 w-4" style={{ color: '#2563eb' }} aria-hidden="true" />}
                          <span className="text-[0.68rem] font-semibold text-foreground">{c.full_name ?? '—'}</span>
                          <span className="text-[0.68rem] text-muted-foreground tabular-nums" dir="ltr">{c.phone}</span>
                        </span>
                        {!c.marketing_consent && (
                          <span className="inline-flex h-[18px] shrink-0 items-center rounded-md bg-red-500/10 px-1.5 text-[0.6rem] font-bold text-red-700 dark:text-red-400">
                            بدون رضایت
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {selected.map((s) => (
                  <span
                    key={s.user_id}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600/[0.08] py-0.5 pe-1 ps-2 text-[0.68rem] font-semibold text-blue-700 dark:text-blue-300"
                  >
                    {s.full_name ?? String(s.user_id)}
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      aria-label={`حذف ${s.full_name ?? String(s.user_id)}`}
                      className="inline-flex h-11 w-11 -m-2.5 items-center justify-center rounded-md text-blue-700/70 transition-colors hover:bg-blue-600/10 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-300/70"
                    >
                      <Icon icon="mdi:close" className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* پیش‌نمایش دامنه */}
          <div className="rounded-xl border border-blue-600/[0.12] bg-blue-600/[0.05] p-3">
            <p className="text-[0.68rem] font-bold text-foreground">
              <Icon icon="mdi:account-multiple-outline" className="inline h-4 w-4 me-1" aria-hidden="true" />
              دامنه پیش‌بینی‌شده: {reachCount === null ? '…' : `${toPersianDigits(reachCount)} مشتری`}
              {targetMode === 'segment' && ` در گروه «${SEGMENT_LABELS[segment]}»`}
            </p>
            <p
              className={
                (consentReach ?? 0) > 0
                  ? 'mt-1 text-[0.68rem] font-bold text-emerald-700 dark:text-emerald-400'
                  : 'mt-1 text-[0.68rem] font-bold text-amber-700 dark:text-amber-400'
              }
            >
              <Icon icon="mdi:email-check-outline" className="inline h-4 w-4 me-1" aria-hidden="true" />
              {'قابل‌ارسال (دارای رضایت): '}
              {consentReach === null ? '…' : `${toPersianDigits(consentReach)} نفر`}
              {consentReach === 0 && ' — به هیچ‌کس پیام ارسال نمی‌شود'}
            </p>
            <p className="text-[0.68rem] text-muted-foreground">
              شمارش نهاییِ دارایانِ رضایت هنگام ارسال سمت سرور اعمال می‌شود؛ سقف روزانه کمپین هر سالن هم اعمال می‌گردد.
            </p>
          </div>

          <Alert variant="warning" className="rounded-xl text-[0.78rem] font-semibold">
            <Icon icon="mdi:shield-lock-outline" className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>فقط به مشتریان با رضایت پیام ارسال می‌شود — مشتریان بدون «رضایت بازاریابی» خودکار رد شده و در گزارش تاریخچه ثبت می‌گردد.</span>
          </Alert>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={titleId}>عنوان پیام</Label>
            <Input id={titleId} value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={messageId}>متن پیام</Label>
            <Textarea
              id={messageId}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1500))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={discountId}>کد تخفیف (اختیاری)</Label>
            <Input id={discountId} value={discount} onChange={(e) => setDiscount(e.target.value.slice(0, 40))} />
            <p className="text-[0.68rem] text-muted-foreground">در ابتدای پیام به صورت «| کد تخفیف: ...» افزوده می‌شود</p>
          </div>
          <Button
            onClick={submit}
            disabled={createCampaign.isPending}
            className="self-start rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 px-6 font-extrabold text-stone-900 hover:from-amber-700 hover:to-amber-600"
          >
            {createCampaign.isPending ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                role="status"
                aria-label="در حال بارگذاری"
              />
            ) : (
              <Icon icon="mdi:send" className="h-4 w-4" aria-hidden="true" />
            )}
            ارسال کمپین
          </Button>
        </div>
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
          <div className="flex max-h-[560px] flex-col gap-3 overflow-auto pe-1">
            {items.map((c) => (
              <div key={c.id} className="rounded-[14px] border border-border/60 bg-slate-50/60 p-3.5 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.68rem] font-extrabold text-foreground">{c.title}</p>
                  <p className="text-[0.68rem] text-muted-foreground tabular-nums">
                    {c.created_at ? formatJalaliDateTime(c.created_at, { format: 'numeric' }) : '—'} · {c.created_by_name ?? '—'}
                  </p>
                </div>
                <p className="mt-1 block whitespace-pre-wrap text-[0.68rem] text-muted-foreground">
                  {c.message.length > 110 ? `${c.message.slice(0, 110)}…` : c.message}
                  {c.discount_code ? ` | کد: ${c.discount_code}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.segment && (
                    <span className="inline-flex h-5 items-center rounded-md bg-violet-600/[0.08] px-1.5 text-[0.68rem] font-bold text-violet-700 dark:text-violet-300">
                      {SEGMENT_LABELS[c.segment] ?? c.segment}
                    </span>
                  )}
                  <span className="inline-flex h-5 items-center gap-1 rounded-md bg-emerald-600/10 px-1.5 text-[0.68rem] font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                    <Icon icon="mdi:email-check" className="h-3.5 w-3.5" aria-hidden="true" />
                    {`${toPersianDigits(c.sent_count)} ارسال`}
                  </span>
                  {c.skipped_no_consent > 0 && (
                    <span className="inline-flex h-5 items-center gap-1 rounded-md bg-red-500/10 px-1.5 text-[0.68rem] font-bold text-red-700 tabular-nums dark:text-red-400">
                      <Icon icon="mdi:email-off" className="h-3.5 w-3.5" aria-hidden="true" />
                      {`${toPersianDigits(c.skipped_no_consent)} بدون رضایت`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default CampaignsTab
