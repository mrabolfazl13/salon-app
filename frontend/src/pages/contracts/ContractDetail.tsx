// frontend/src/pages/contracts/ContractDetail.tsx
// جزئیات کامل قرارداد (نمای کاربر): خلاصه اقتصادی + بنر معوق، تقویم اقساط با پرداخت
// درگاه‌شبیه‌سازی، جدول سانس‌ها با «درخواست حذف سانس» (گیت کلاینتی: فقط سانس آینده)،
// ممیزی جمع‌شونده و لغو سیاست‌محور قرارداد.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useContractDetail, useCancelContract, useRequestSessionCancel } from '@/hooks/useContracts'
import {
  contractStatusMeta,
  extractError,
  ErrorBox,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  RECURRENCE_LABELS,
  ReasonDialog,
  SectionCard,
  StatusChip,
  toPersianDigits,
} from '@/components/contract/shared'
import ContractEconomics from '@/components/contract/ContractEconomics'
import ContractPaymentsTable from '@/components/contract/ContractPaymentsTable'
import ContractSessionsTable from '@/components/contract/ContractSessionsTable'
import ContractAuditTimeline from '@/components/contract/ContractAuditTimeline'
import ContractInstallmentPayDialog from '@/components/contract/ContractInstallmentPayDialog'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'
import type { ContractPaymentData, ContractSessionData } from '@/services/contract'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/shadcn/table'
import { cn } from '@/lib/utils'

const actionBtn =
  'inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[0.68rem] font-bold transition-colors'

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const detailQuery = useContractDetail(Number.isFinite(contractId) ? contractId : null)
  const cancelMutation = useCancelContract(contractId)
  const requestCancelMutation = useRequestSessionCancel(contractId)

  const [payTarget, setPayTarget] = useState<ContractPaymentData | null>(null)
  const [cancelSession, setCancelSession] = useState<ContractSessionData | null>(null)
  const [cancelContractOpen, setCancelContractOpen] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const contract = detailQuery.data
  const isOwner = !!contract && !!user && contract.user_id === user.id

  const cancelable = useMemo(() => {
    if (!contract) return false
    const cancellableStatus = ['pending', 'active', 'suspended'].includes(String(contract.status))
    return cancellableStatus && contract.end_date >= getTodayISO()
  }, [contract])

  const backLink = (
    <button
      type="button"
      onClick={() => navigate('/contracts')}
      className="mb-4 inline-flex min-h-9 items-center gap-2 text-[0.68rem] font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon icon="mdi:arrow-right" className="h-5 w-5" aria-hidden="true" />
      بازگشت به لیست قراردادها
    </button>
  )

  if (detailQuery.isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
          <Skeleton aria-hidden="true" className="mb-4 h-12 rounded-lg" />
          <Skeleton aria-hidden="true" className="mb-4 h-[140px] rounded-lg" />
          <Skeleton aria-hidden="true" className="h-[300px] rounded-lg" />
        </div>
      </Layout>
    )
  }

  if (detailQuery.isError || !contract) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
          {backLink}
          <ErrorBox message="قرارداد مورد نظر یافت نشد یا دسترسی شما به آن محدود است." onRetry={() => detailQuery.refetch()} />
        </div>
      </Layout>
    )
  }

  const meta = contractStatusMeta(contract.status)
  const payMeta = paymentStatusMeta(contract.payment_status)
  const infoItems = [
    { icon: 'mdi:calendar-range', label: 'بازه قرارداد', value: `${formatJalaliDate(contract.start_date)} تا ${formatJalaliDate(contract.end_date)}` },
    { icon: 'mdi:calendar-clock', label: 'روز و ساعت', value: `${(contract.days?.length ? contract.days : [contract.day_of_week]).map((d) => pyDayNames[d] ?? '—').join('، ')} — ${toPersianDigits((contract.start_time || '').slice(0, 5))} (${faNum(contract.duration)} دقیقه)` },
    { icon: 'mdi:repeat', label: 'نوع تکرار', value: RECURRENCE_LABELS[contract.recurrence] || contract.recurrence },
    { icon: 'mdi:tag-outline', label: 'قیمت پایه سانس', value: formatRial(contract.original_price) },
    { icon: 'mdi:sale', label: 'قیمت هر جلسه (توافق‌شده)', value: formatRial(contract.discounted_price) },
    { icon: 'mdi:cash-multiple', label: 'مبلغ کل قرارداد', value: formatRial(contract.total_amount) },
    ...(contract.down_payment_amount ? [{ icon: 'mdi:bank-outline', label: 'پیش‌پرداخت درخواستی', value: formatRial(contract.down_payment_amount) }] : []),
    ...(contract.auto_renew ? [{ icon: 'mdi:autorenew', label: 'تمدید خودکار', value: 'فعال' }] : []),
  ]

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
        {backLink}

        {/* هدر */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-11 items-center justify-center rounded-xl bg-primary/5">
                  <Icon icon="mdi:file-document-multiple" className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-lg font-bold">
                    {contract.venue_name || `سالن #${faNum(contract.venue_id)}`}
                  </h1>
                  <p className="text-[0.68rem] text-muted-foreground">{`قرارداد #${faNum(contract.id)}`}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={payMeta.label} color={payMeta.color} />
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-[0.68rem] font-bold"
                  style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* بنرهای وضعیت */}
        {contract.status === 'pending' && (
          <Alert variant="warning" className="mb-4 font-semibold">
            <Icon icon="mdi:account-clock-outline" className="h-5 w-5" aria-hidden="true" />
            <AlertDescription>
              در انتظار تأیید مدیر سالن — پس از تأیید، تقویم اقساط صادر و قرارداد فعال می‌شود. سانس‌ها تا آن زمان برای شما رزرو است.
            </AlertDescription>
          </Alert>
        )}
        {contract.status === 'rejected' && contract.reject_reason && (
          <Alert variant="destructive" className="mb-4">
            <Icon icon="mdi:close-octagon-outline" className="h-5 w-5" aria-hidden="true" />
            <AlertDescription>
              {`درخواست شما رد شد. دلیل مدیر: ${contract.reject_reason}`}
            </AlertDescription>
          </Alert>
        )}
        {contract.status === 'cancelled' && contract.cancel_reason && (
          <Alert variant="warning" className="mb-4">
            <Icon icon="mdi:cancel" className="h-5 w-5" aria-hidden="true" />
            <AlertDescription>
              {`قرارداد لغو شده است. دلیل: ${contract.cancel_reason}` +
                ' — سانس‌های آینده آزاد شدند و سانس‌های برگزارشده دست‌نخورده می‌مانند.'}
            </AlertDescription>
          </Alert>
        )}

        {/* اقتصاد */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <SectionCard title="وضعیت مالی و سانس‌ها" icon="mdi:chart-line">
              <ContractEconomics economics={contract.economics} totalAmount={contract.total_amount} />
            </SectionCard>

            <div className="mt-6">
              <SectionCard
                title="اقساط و پرداخت"
                icon="mdi:calendar-text-outline"
                action={
                  contract.economics && contract.economics.remaining_amount > 0 ? (
                    <StatusChip label={`مانده: ${formatRial(contract.economics.remaining_amount)}`} color="#d97706" />
                  ) : (
                    <StatusChip label="تسویه" color="#059669" />
                  )
                }
              >
                <ContractPaymentsTable
                  payments={contract.payments}
                  canPay={isOwner && (contract.status === 'active' || contract.status === 'expired')}
                  busyPaymentId={null}
                  onPay={(p) => setPayTarget(p)}
                />
              </SectionCard>
            </div>

            <div className="mt-6">
              <SectionCard title="سانس‌های قرارداد" icon="mdi:calendar-multiple">
                <ContractSessionsTable
                  sessions={contract.sessions}
                  mode="user"
                  busySessionId={requestCancelMutation.isPending ? (cancelSession?.id ?? null) : null}
                  onRequestCancel={(cs) => { setCancelSession(cs); setDialogError(null) }}
                />
              </SectionCard>
            </div>

            <div className="mt-6">
              <SectionCard title="تاریخچه" icon="mdi:history">
                <ContractAuditTimeline contractId={contract.id} />
              </SectionCard>
            </div>
          </div>

          {/* خلاصه و اقدامات */}
          <div>
            <SectionCard title="جزئیات قرارداد" icon="mdi:information-outline">
              <div className="flex flex-col gap-3.5">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <Icon icon={item.icon} className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1">
                      <span className="block text-[0.68rem] text-muted-foreground/70">{item.label}</span>
                      <p className="text-[0.85rem] font-semibold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {contract.description && (
                <>
                  <hr className="my-4 border-border" />
                  <p className="mb-1 text-[0.68rem] font-semibold">توضیحات</p>
                  <p className="text-[0.85rem] leading-7 text-muted-foreground">{contract.description}</p>
                </>
              )}

              {contract.cancellation_policy && (
                <>
                  <hr className="my-4 border-border" />
                  <p className="mb-1 text-[0.68rem] font-semibold">شرایط لغو (تعیین‌شده توسط مدیر)</p>
                  <p className="text-[0.82rem] leading-7 text-muted-foreground">{contract.cancellation_policy}</p>
                </>
              )}
            </SectionCard>

            <div className="mt-6">
              <SectionCard title="اعمال قرارداد" icon="mdi:lightning-bolt" dense>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={cn(actionBtn, 'border-border hover:bg-muted')}
                  >
                    <Icon icon="mdi:printer" className="h-4 w-4" aria-hidden="true" />
                    چاپ قرارداد
                  </button>
                  {isOwner && contract.status === 'pending' && (
                    <span className="text-[0.68rem] text-muted-foreground/70">
                      امکان ویرایش وجود ندارد — برای انصراف قرارداد را لغو کنید.
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!cancelable}
                    onClick={() => { setCancelContractOpen(true); setDialogError(null) }}
                    className={cn(
                      actionBtn,
                      'border-destructive/50 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
                    )}
                  >
                    <Icon icon="mdi:cancel" className="h-4 w-4" aria-hidden="true" />
                    لغو قرارداد
                  </button>
                  {!cancelable && contract.status !== 'rejected' && contract.status !== 'cancelled' && (
                    <span className="text-[0.68rem] text-muted-foreground/70">
                      {contract.end_date < getTodayISO()
                        ? 'قرارداد گذشته یا تمام‌شده قابل لغو نیست'
                        : 'این قرارداد در وضعیت قابل لغو نیست'}
                    </span>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>

        {/* بخش چاپ‌پسند — فقط در چاپ دیده می‌شود (الگوی چاپ فاکتور رزرو + CSS محلی) */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .contract-print-root, .contract-print-root * { visibility: visible !important; }
            .contract-print-root { position: absolute !important; top: 0; left: 0; width: 100%; display: block !important; background: white; }
          }
        `}</style>
        <div className="contract-print-root hidden p-6" dir="rtl">
          <h2 className="mb-1 text-xl font-extrabold">
            {`قرارداد سالن ${contract.venue_name || `#${faNum(contract.venue_id)}`} — شماره ${faNum(contract.id)}`}
          </h2>
          <span className="text-[0.68rem] text-muted-foreground">
            {`تاریخ چاپ: ${formatJalaliDate(getTodayISO(), { format: 'full' })}`}
          </span>
          <hr className="my-4 border-border" />
          <h3 className="mb-1 text-[0.68rem] font-extrabold">طرفین</h3>
          {infoItems.map((item) => (
            <div key={item.label} className="mb-1 flex gap-3">
              <span className="min-w-[160px] text-[0.68rem] font-bold">{item.label}:</span>
              <span className="text-[0.68rem]">{item.value}</span>
            </div>
          ))}
          <div className="my-2 flex flex-wrap gap-1">
            {(contract.days?.length ? contract.days : [contract.day_of_week]).map((d) => (
              <span key={d} className="rounded-md border border-border px-2 py-0.5 text-[0.68rem]">
                {pyDayNames[d] ?? d}
              </span>
            ))}
          </div>
          <h3 className="mb-1 mt-4 text-[0.68rem] font-extrabold">خلاصه جلسات</h3>
          <p className="text-[0.68rem]">
            {`کل سانس‌ها: ${faNum(contract.economics?.total_sessions ?? contract.sessions.length)} — برگزارشده: ${faNum(contract.economics?.completed_sessions ?? 0)} — برنامه‌ریزی‌شده: ${faNum(contract.economics?.scheduled_sessions ?? 0)} — مستثنا: ${faNum(contract.economics?.excluded_sessions ?? 0)}`}
          </p>
          {contract.payments.length > 0 && (
            <>
              <h3 className="mb-1 mt-4 text-[0.68rem] font-extrabold">اقساط</h3>
              <Table aria-label="اقساط قرارداد">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="font-extrabold">عنوان</TableHead>
                    <TableHead scope="col" className="font-extrabold">سررسید</TableHead>
                    <TableHead scope="col" className="font-extrabold">مبلغ</TableHead>
                    <TableHead scope="col" className="font-extrabold">وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...contract.payments].sort((a, b) => (a.due_date < b.due_date ? -1 : 1)).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.label || (p.record_type === 'down_payment' ? 'پیش‌پرداخت' : `قسط ${toPersianDigits(p.installment_no ?? 0)}`)}</TableCell>
                      <TableCell>{formatJalaliDate(p.due_date)}</TableCell>
                      <TableCell>{formatRial(p.amount)}</TableCell>
                      <TableCell>{p.is_voided ? 'باطل' : p.is_paid ? 'پرداخت‌شده' : 'پرداخت نشده'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          <hr className="my-4 border-border" />
          <p className="text-[0.68rem] font-extrabold">
            {`مبلغ کل: ${formatRial(contract.total_amount)} — پرداختی: ${formatRial(contract.economics?.paid_amount ?? 0)} — مانده: ${formatRial(contract.economics?.remaining_amount ?? contract.total_amount - (contract.economics?.paid_amount ?? 0))}`}
          </p>
          {contract.cancellation_policy && (
            <span className="mt-2 block text-[0.68rem]">
              {`شرایط لغو: ${contract.cancellation_policy}`}
            </span>
          )}
        </div>
      </div>

      {/* دیالوگ پرداخت قسط (درگاه شبیه‌سازی‌شده) */}
      <ContractInstallmentPayDialog
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        contractId={contract.id}
        venueName={contract.venue_name}
        payment={payTarget}
      />

      {/* درخواست حذف سانس — فقط سانس آینده (گیت کلاینتی)؛ اجرا با مدیر است */}
      <ReasonDialog
        open={Boolean(cancelSession)}
        title="درخواست حذف سانس"
        description={
          cancelSession
            ? `سانس ${formatJalaliDate(cancelSession.rescheduled_date || cancelSession.session_date)} — درخواست برای مدیر ارسال و در ممیزی ثبت می‌شود؛ تصمیم اجرا (استثنا یا جابه‌جایی) با مدیر است.`
            : ''
        }
        reasonLabel="دلیل درخواست"
        confirmText="ارسال درخواست"
        danger={false}
        loading={requestCancelMutation.isPending}
        errorText={dialogError}
        onClose={() => setCancelSession(null)}
        onSubmit={async (reason) => {
          if (!cancelSession) return
          try {
            await requestCancelMutation.mutateAsync({ csId: cancelSession.id, reason })
            toast.success('درخواست حذف سانس برای مدیر ارسال شد')
            setCancelSession(null)
          } catch (err) {
            setDialogError(extractError(err, 'ثبت درخواست ناموفق بود'))
          }
        }}
      />

      {/* لغو قرارداد — تأیید سیاست‌محور با ذكر سانس‌های آزادشونده */}
      <ReasonDialog
        open={cancelContractOpen}
        title="لغو قرارداد"
        description={
          `با لغو، تمام سانس‌های آینده (${faNum(contract.economics?.scheduled_sessions ?? contract.sessions.filter((s) => !s.is_past).length)}) آزاد و در دسترس سایر رزروها قرار می‌گیرند. ` +
          'سانس‌های برگزارشده تغییر نمی‌کنند و اقساط پرداختی به‌صورت خودکار عودت داده نمی‌شود.' +
          (contract.cancellation_policy ? ` | شرایط لغو این قرارداد: «${contract.cancellation_policy}»` : '') +
          (contract.status === 'pending' ? ' | قرارداد هنوز تأیید نشده — فقط درخواست رد/آزاد می‌شود.' : '')
        }
        reasonLabel="دلیل لغو"
        confirmText="لغو قطعی قرارداد"
        loading={cancelMutation.isPending}
        errorText={dialogError}
        onClose={() => setCancelContractOpen(false)}
        onSubmit={async (reason) => {
          try {
            await cancelMutation.mutateAsync(reason)
            toast.success('قرارداد لغو شد')
            setCancelContractOpen(false)
            detailQuery.refetch()
          } catch (err) {
            setDialogError(extractError(err, 'لغو قرارداد ناموفق بود'))
          }
        }}
      />
    </Layout>
  )
}

export default ContractDetail
