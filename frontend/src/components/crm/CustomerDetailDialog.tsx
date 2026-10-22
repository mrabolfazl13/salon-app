// frontend/src/components/crm/CustomerDetailDialog.tsx
// پنل جزئیات مشتری — پروفایل + ویرایش VIP/برچسب/یادداشت (PUT /crm/customers) +
// اخیر رزروها/پرداخت‌ها و خلاصه صورتحساب از پاسخ GET /crm/customers/{user_id}.

import React, { useEffect, useId, useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Switch } from '@/components/ui/shadcn/switch'
import { Textarea } from '@/components/ui/shadcn/textarea'

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

  const vipId = useId()
  const notesId = useId()

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
        <div className="flex flex-col gap-3">
          {/* هدر پروفایل */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-blue-600/[0.08]">
              <Icon icon="mdi:account" className="h-6 w-6" style={{ color: '#2563eb' }} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground">
                {detail.customer.full_name ?? '—'}
              </p>
              <p className="text-[0.68rem] text-muted-foreground tabular-nums" dir="ltr">
                {detail.customer.phone ?? '—'}
              </p>
            </div>
            <div className="ms-auto flex items-center gap-1.5">
              {detail.customer.is_vip && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700 dark:text-amber-400">
                  <Icon icon="mdi:star" className="h-3.5 w-3.5" aria-hidden="true" />
                  VIP
                </span>
              )}
              <SegmentChip segment={detail.customer.segment} small />
            </div>
          </div>

          {/* آمار مشتری */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'رزروها', value: `${toPersianDigits(detail.customer.bookings_count)}`, icon: 'mdi:calendar-check' },
              { label: 'مجموع پرداختی', value: formatRial(detail.customer.total_spend), icon: 'mdi:cash' },
              { label: 'مانده حساب', value: formatRial(detail.customer.balance_due), icon: 'mdi:book-alert' },
              { label: 'امتیاز وفاداری', value: toPersianDigits(detail.customer.loyalty_balance ?? 0), icon: 'mdi:star-four-points' },
              { label: 'آخرین بازدید', value: detail.customer.last_booking_date ? formatJalaliDate(detail.customer.last_booking_date, { format: 'numeric' }) : '—', icon: 'mdi:eye' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-slate-50/60 p-3 dark:bg-slate-900/40">
                <span className="block text-[0.68rem] text-muted-foreground">{s.label}</span>
                <span className="mt-0.5 block text-[0.68rem] font-extrabold text-foreground tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>

          {/* ویرایش */}
          <SectionCard title="ویرایش اطلاعات (ویژه / برچسب / یادداشت)" icon="mdi:account-edit" color="#7c3aed" dense>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <Switch id={vipId} checked={isVip} onCheckedChange={setIsVip} />
                <Label htmlFor={vipId} className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-[0.68rem] font-bold text-foreground">
                    <Icon icon="mdi:star" className="h-4 w-4" style={{ color: '#d97706' }} aria-hidden="true" />
                    مشتری ویژه (VIP)
                  </span>
                </Label>
              </div>
              <div>
                <span className="text-[0.68rem] font-semibold text-muted-foreground">
                  برچسب‌ها (حداکثر ۱۰)
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600/[0.08] py-0.5 pe-1 ps-2 text-[0.68rem] font-semibold text-blue-700 dark:text-blue-300"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        aria-label={`حذف برچسب ${t}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-blue-700/70 transition-colors hover:bg-blue-600/10 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-300/70"
                      >
                        <Icon icon="mdi:close" className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-[0.68rem] text-muted-foreground">بدون برچسب</span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="افزودن برچسب..."
                    aria-label="افزودن برچسب جدید"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={addTag} className="font-bold">
                    افزودن
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={notesId}>یادداشت</Label>
                <Textarea
                  id={notesId}
                  value={notes}
                  rows={2}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={!dirty || updateCustomer.isPending}
                  onClick={save}
                  className="bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white hover:from-blue-700 hover:to-violet-700"
                >
                  {updateCustomer.isPending ? (
                    <span
                      className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent"
                      role="status"
                      aria-label="در حال بارگذاری"
                    />
                  ) : 'ذخیره تغییرات'}
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* فعالیت اخیر */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard title={`رزروهای اخیر (${detail.recent_bookings.length})`} icon="mdi:calendar-month" dense>
              {detail.recent_bookings.length === 0 ? (
                <p className="text-[0.68rem] text-muted-foreground">رزروی ثبت نشده است.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.recent_bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-semibold text-foreground">
                          {formatJalaliDate(b.slot_date, { format: 'numeric' })} — {b.start_time}
                        </p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          ثبت: {formatJalaliDateTime(b.booked_at, { format: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {b.payment_amount !== null && (
                          <span className="text-[0.68rem] font-bold text-foreground tabular-nums">
                            {formatRial(b.payment_amount)}
                          </span>
                        )}
                        <BookingStatusChip status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            <SectionCard title={`پرداخت‌های اخیر (${detail.recent_payments.length})`} icon="mdi:cash-sync" color="#059669" dense>
              {detail.recent_payments.length === 0 ? (
                <p className="text-[0.68rem] text-muted-foreground">تراکنشی ثبت نشده است.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detail.recent_payments.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-semibold text-foreground">
                          {labelOf(TX_TYPE_LABELS, t.type)}
                        </p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          {formatJalaliDate(t.occurred_at, { format: 'numeric' })}
                          {t.status === 'voided' ? ' — باطل' : ''}
                        </p>
                      </div>
                      <span
                        dir="rtl"
                        className={
                          t.direction === 'income'
                            ? 'text-[0.68rem] font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400'
                            : 'text-[0.68rem] font-extrabold text-red-600 tabular-nums dark:text-red-400'
                        }
                      >
                        {t.direction === 'income' ? '＋' : '−'}{formatRial(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-[0.68rem] text-muted-foreground">
                  خلاصه صورتحساب · {toPersianDigits(detail.statement.entries.length)} ردیف
                </span>
                <span className="text-[0.68rem] font-bold text-foreground tabular-nums">
                  موجودی: {formatRial(detail.statement.closing_balance)}
                </span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </Dialog>
  )
}

export default CustomerDetailDialog
