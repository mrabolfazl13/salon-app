// frontend/src/pages/manager/contracts/ManagerContractDetail.tsx
// نمای مدیر از یک قرارداد: همان پنل‌های مشترک (اقتصاد/اقساط/سانس/ممیزی) + اقدامات مدیر:
// تأیید با تغییرات، رد، استثنا/جابه‌جایی تک‌سانس، جابه‌جایی کل قرارداد (pre-check تداخل)،
// ابطال قسط و لغو سیاست‌محور.
// دریافت نقدی قسط: POST /contracts/{cid}/payments/{pid}/mark-paid (بدنه ندارد؛
// مالک/branch_manager/cashier با finance.record_payment) — دکمه «دریافت نقدی» در
// جدول اقساط این نما. پرداخت درگاهی (/pay) همان‌طور که هست فقط برای مالک می‌ماند.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import {
  useCancelContract,
  useContractDetail,
  useRejectContract,
  useExcludeSession,
  useVoidInstallment,
  useMarkInstallmentPaid,
} from '@/hooks/useContracts'
import {
  contractStatusMeta,
  extractError,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  ReasonDialog,
  RECURRENCE_LABELS,
  SectionCard,
  StatusChip,
  toPersianDigits,
} from '@/components/contract/shared'
import { EmptyState, ErrorState } from '@/components/mobile'
import ContractEconomics from '@/components/contract/ContractEconomics'
import ContractPaymentsTable from '@/components/contract/ContractPaymentsTable'
import ContractSessionsTable from '@/components/contract/ContractSessionsTable'
import ContractAuditTimeline from '@/components/contract/ContractAuditTimeline'
import ContractApproveDialog, { type ApproveTarget } from '@/components/contract/manager/ContractApproveDialog'
import SessionRescheduleDialog from '@/components/contract/manager/SessionRescheduleDialog'
import MoveContractDialog from '@/components/contract/manager/MoveContractDialog'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'
import type { ContractPaymentData, ContractSessionData } from '@/services/contract'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { cn } from '@/lib/utils'

const ManagerContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const navigate = useNavigate()

  const detailQuery = useContractDetail(Number.isFinite(contractId) ? contractId : null)
  const excludeMutation = useExcludeSession(contractId)
  const voidMutation = useVoidInstallment(contractId)
  const markPaidMutation = useMarkInstallmentPaid(contractId)
  const cancelMutation = useCancelContract(contractId)
  const rejectMutation = useRejectContract()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [excludeTarget, setExcludeTarget] = useState<ContractSessionData | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<ContractSessionData | null>(null)
  const [voidTarget, setVoidTarget] = useState<ContractPaymentData | null>(null)
  const [markBusyId, setMarkBusyId] = useState<number | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const contract = detailQuery.data

  const approveTarget: ApproveTarget | null = useMemo(() => {
    if (!contract) return null
    return {
      contractId: contract.id,
      venueName: contract.venue_name || `سالن #${faNum(contract.venue_id)}`,
      userName: contract.user_full_name,
      pricePerSession: contract.discounted_price,
      originalPrice: contract.original_price,
      totalSessions: contract.economics?.total_sessions ?? contract.sessions.length,
      currentPolicy: contract.cancellation_policy,
    }
  }, [contract])

  const cancelable = useMemo(() => {
    if (!contract) return false
    return ['pending', 'active', 'suspended'].includes(String(contract.status)) &&
      contract.end_date >= getTodayISO()
  }, [contract])

  const backLink = (
    <button
      type="button"
      onClick={() => navigate('/manager/contracts')}
      className="mb-4 inline-flex min-h-11 items-center gap-2 text-[0.68rem] font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon icon="mdi:arrow-right" className="h-5 w-5" aria-hidden="true" />
      بازگشت به مدیریت قراردادها
    </button>
  )

  if (detailQuery.isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton aria-hidden="true" className="mb-4 h-12 rounded-lg" />
          <Skeleton aria-hidden="true" className="mb-4 h-[140px] rounded-lg" />
          <Skeleton aria-hidden="true" className="h-[320px] rounded-lg" />
        </div>
      </Layout>
    )
  }

  if (detailQuery.isError || !contract) {
    const status = (detailQuery.error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return (
        <Layout>
          <EmptyState
            asPageHeading
            icon="mdi:file-document-remove-outline"
            title="قرارداد یافت نشد"
            description="این قرارداد حذف شده یا سالن آن زیر مدیریت شما نیست."
            actionLabel="بازگشت به مدیریت قراردادها"
            onAction={() => navigate('/manager/contracts')}
          />
        </Layout>
      )
    }
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-8">
          {backLink}
          <ErrorState asPageHeading title="بارگذاری قرارداد ممکن نشد" description="اتصال خود را بررسی کنید و دوباره تلاش کنید." onRetry={() => detailQuery.refetch()} />
        </div>
      </Layout>
    )
  }

  const meta = contractStatusMeta(contract.status)
  const payMeta = paymentStatusMeta(contract.payment_status)
  const upcoming = contract.sessions.filter((s) =>
    (s.status === 'scheduled' || s.status === 'rescheduled') &&
    (s.rescheduled_date || s.session_date) >= getTodayISO()).length

  const infoItems = [
    { icon: 'mdi:account-outline', label: 'متقاضی', value: contract.user_full_name || `کاربر #${faNum(contract.user_id)}` },
    { icon: 'mdi:calendar-range', label: 'بازه قرارداد', value: `${formatJalaliDate(contract.start_date)} تا ${formatJalaliDate(contract.end_date)}` },
    {
      icon: 'mdi:calendar-clock',
      label: 'برنامه هفتگی',
      value: `${(contract.days?.length ? contract.days : [contract.day_of_week]).map((d) => pyDayNames[d] ?? '—').join('، ')} — ${toPersianDigits((contract.start_time || '').slice(0, 5))} (${faNum(contract.duration)} دقیقه)`,
    },
    { icon: 'mdi:repeat', label: 'نوع تکرار', value: RECURRENCE_LABELS[contract.recurrence] || contract.recurrence },
    { icon: 'mdi:tag-outline', label: 'قیمت پایه سانس', value: formatRial(contract.original_price) },
    { icon: 'mdi:sale', label: 'قیمت توافق‌شده', value: formatRial(contract.discounted_price) },
    { icon: 'mdi:cash-multiple', label: 'مبلغ کل', value: formatRial(contract.total_amount) },
    ...(contract.down_payment_amount ? [{ icon: 'mdi:bank-outline', label: 'پیش‌پرداخت درخواستی', value: formatRial(contract.down_payment_amount) }] : []),
  ]

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
        {backLink}

        <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                <Icon icon="mdi:file-document-check-outline" className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold">
                  {contract.venue_name || `سالن #${faNum(contract.venue_id)}`}
                </h1>
                <p className="text-[0.68rem] text-muted-foreground">
                  {`قرارداد #${faNum(contract.id)} — ${contract.user_full_name || '—'}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip label={payMeta.label} color={payMeta.color} />
              <span
                className="inline-flex items-center rounded-lg px-2 py-0.5 text-[0.68rem] font-bold"
                style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </div>

          {contract.status === 'pending' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-emerald-700 to-emerald-800 px-3 text-[0.68rem] font-bold text-white transition-opacity hover:opacity-90"
              >
                <Icon icon="mdi:check-decagram" className="h-4 w-4" aria-hidden="true" />
                تأیید با تغییرات
              </button>
              <button
                type="button"
                onClick={() => { setRejectOpen(true); setDialogError(null) }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-destructive/50 px-3 text-[0.68rem] font-bold text-destructive transition-colors hover:bg-destructive/10"
              >
                <Icon icon="mdi:close-octagon-outline" className="h-4 w-4" aria-hidden="true" />
                رد درخواست
              </button>
            </div>
          )}
        </div>

        {contract.status === 'rejected' && contract.reject_reason && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {`این درخواست رد شده است. دلیل: ${contract.reject_reason}`}
            </AlertDescription>
          </Alert>
        )}
        {contract.status === 'cancelled' && contract.cancel_reason && (
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {`قرارداد لغو شده است. دلیل: ${contract.cancel_reason}`}
            </AlertDescription>
          </Alert>
        )}
        {contract.economics?.overdue && contract.status === 'active' && (
          <Alert variant="warning" className="mb-4">
            <Icon icon="mdi:alarm-light-outline" className="h-5 w-5" aria-hidden="true" />
            <AlertDescription>
              این قرارداد اقساط معوق دارد — می‌توانید برای پیگیری از بخش امور مالی استفاده کنید.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <SectionCard title="وضعیت مالی و سانس‌ها" icon="mdi:chart-line">
              <ContractEconomics economics={contract.economics} totalAmount={contract.total_amount} />
            </SectionCard>

            <div className="mt-6">
              <SectionCard
                title="تقویم اقساط"
                icon="mdi:calendar-text-outline"
                action={
                  <span
                    className="text-[0.68rem] text-muted-foreground/70"
                    title="تسویه نقدی در محل توسط صندوقدار/مدیر شعبه — در دفتر کل با روش نقدی و idempotent ثبت می‌شود"
                  >
                    دریافت نقدی توسط کارکنان سالن
                  </span>
                }
              >
                <ContractPaymentsTable
                  payments={contract.payments}
                  canVoid
                  canMarkPaid
                  busyPaymentId={voidMutation.isPending ? (voidTarget?.id ?? null) : null}
                  busyMarkPaidId={markBusyId}
                  onVoid={(p) => { setVoidTarget(p); setDialogError(null) }}
                  onMarkPaid={(p) => {
                    setMarkBusyId(p.id)
                    markPaidMutation.mutate(p.id, {
                      onSuccess: () => toast.success(`«${p.label || 'قسط'}» به‌صورت نقدی دریافت شد`),
                      onError: (err) => toast.error(extractError(err, 'دریافت نقدی ناموفق بود')),
                      onSettled: () => setMarkBusyId(null),
                    })
                  }}
                />
              </SectionCard>
            </div>

            <div className="mt-6">
              <SectionCard
                title="سانس‌های قرارداد"
                icon="mdi:calendar-multiple"
                action={
                  contract.status === 'active' && upcoming > 0 ? (
                    <button
                      type="button"
                      onClick={() => { setMoveOpen(true); setDialogError(null) }}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-border px-3 text-[0.68rem] font-bold transition-colors hover:bg-muted"
                    >
                      <Icon icon="mdi:calendar-move" className="h-4 w-4" aria-hidden="true" />
                      جابه‌جایی کل قرارداد
                    </button>
                  ) : undefined
                }
              >
                <ContractSessionsTable
                  sessions={contract.sessions}
                  mode="manager"
                  busySessionId={excludeMutation.isPending ? (excludeTarget?.id ?? null) : null}
                  onExclude={(cs) => { setExcludeTarget(cs); setDialogError(null) }}
                  onReschedule={(cs) => setRescheduleTarget(cs)}
                />
              </SectionCard>
            </div>

            <div className="mt-6">
              <SectionCard title="تاریخچه و ممیزی" icon="mdi:history">
                <ContractAuditTimeline contractId={contract.id} />
              </SectionCard>
            </div>
          </div>

          <div>
            <SectionCard title="اطلاعات قرارداد" icon="mdi:information-outline">
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
                  <p className="mb-1 text-[0.68rem] font-semibold">یادداشت درخواست کاربر</p>
                  <p className="text-[0.85rem] leading-7 text-muted-foreground">{contract.description}</p>
                </>
              )}
              {contract.cancellation_policy && (
                <>
                  <hr className="my-4 border-border" />
                  <p className="mb-1 text-[0.68rem] font-semibold">شرایط لغو</p>
                  <p className="text-[0.82rem] leading-7 text-muted-foreground">{contract.cancellation_policy}</p>
                </>
              )}
            </SectionCard>

            <div className="mt-6">
              <SectionCard title="اقدامات مدیر" icon="mdi:shield-account-outline" dense>
                <button
                  type="button"
                  disabled={!cancelable}
                  onClick={() => { setCancelOpen(true); setDialogError(null) }}
                  className={cn(
                    'inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[0.68rem] font-bold transition-colors',
                    'border-destructive/50 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
                  )}
                >
                  <Icon icon="mdi:cancel" className="h-4 w-4" aria-hidden="true" />
                  لغو قرارداد
                </button>
                {!cancelable && (
                  <span className="mt-2 block text-[0.68rem] text-muted-foreground/70">
                    قرارداد در وضعیت یا بازه قابل لغو نیست
                  </span>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      <ContractApproveDialog
        open={approveOpen && contract.status === 'pending'}
        onClose={() => setApproveOpen(false)}
        target={approveTarget}
      />

      <MoveContractDialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        contract={contract}
      />

      <SessionRescheduleDialog
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        contractId={contract.id}
        session={rescheduleTarget}
      />

      {/* رد درخواست */}
      <ReasonDialog
        open={rejectOpen}
        title="رد درخواست قرارداد"
        description={
          contract.status === 'pending'
            ? `با رد، ${toPersianDigits(upcoming)} سانس آینده در تقویم آزاد می‌شود و دلیل به متقاضی اعلام می‌گردد.`
            : ''
        }
        reasonLabel="دلیل رد"
        confirmText="رد درخواست"
        loading={rejectMutation.isPending}
        errorText={dialogError}
        onClose={() => setRejectOpen(false)}
        onSubmit={async (reason) => {
          try {
            await rejectMutation.mutateAsync({ contractId: contract.id, reason })
            toast.success('درخواست رد و سانس‌های آینده آزاد شدند')
            setRejectOpen(false)
            detailQuery.refetch()
          } catch (err) {
            setDialogError(extractError(err, 'رد درخواست ناموفق بود'))
          }
        }}
      />

      {/* استثنا/لغو تک‌سانس */}
      <ReasonDialog
        open={Boolean(excludeTarget)}
        title="استثنای سانس قرارداد"
        description={
          excludeTarget
            ? `سانس ${formatJalaliDate(excludeTarget.rescheduled_date || excludeTarget.session_date)} از ید قرارداد خارج و در دسترس سایر رزروها قرار می‌گیرد. اقساط تغییر نمی‌کند (اعتباری را جداگانه لحاظ کنید).`
            : ''
        }
        reasonLabel="دلیل استثنا"
        confirmText="استثنای سانس"
        loading={excludeMutation.isPending}
        errorText={dialogError}
        onClose={() => setExcludeTarget(null)}
        onSubmit={async (reason) => {
          if (!excludeTarget) return
          try {
            await excludeMutation.mutateAsync({ csId: excludeTarget.id, reason })
            toast.success('سانس استثنا شد')
            setExcludeTarget(null)
          } catch (err) {
            setDialogError(extractError(err, 'استثنا ناموفق بود'))
          }
        }}
      />

      {/* ابطال قسط */}
      <ReasonDialog
        open={Boolean(voidTarget)}
        title="ابطال قسط"
        description={
          voidTarget
            ? `«${voidTarget.label || 'قسط'}» (${formatRial(voidTarget.amount)}) باطل می‌شود؛ اگر پرداخت شده باشد ردیف دفتر کل آن باطل (void) می‌گردد — حذف فیزیکی رخ نمی‌دهد.`
            : ''
        }
        reasonLabel="دلیل ابطال"
        confirmText="ابطال قسط"
        loading={voidMutation.isPending}
        errorText={dialogError}
        onClose={() => setVoidTarget(null)}
        onSubmit={async (reason) => {
          if (!voidTarget) return
          try {
            await voidMutation.mutateAsync({ paymentId: voidTarget.id, reason })
            toast.success('قسط باطل شد')
            setVoidTarget(null)
          } catch (err) {
            setDialogError(extractError(err, 'ابطال ناموفق بود'))
          }
        }}
      />

      {/* لغو قرارداد (سیاست‌محور) */}
      <ReasonDialog
        open={cancelOpen}
        title="لغو قرارداد"
        description={
          `با لغو، تمام ${toPersianDigits(upcoming)} سانس آینده آزاد می‌شوند؛ سانس‌های برگزارشده دست‌نخورده‌اند.` +
          (contract.cancellation_policy ? ` شرایط لغو قرارداد: «${contract.cancellation_policy}»` : '')
        }
        reasonLabel="دلیل لغو"
        confirmText="لغو قطعی"
        loading={cancelMutation.isPending}
        errorText={dialogError}
        onClose={() => setCancelOpen(false)}
        onSubmit={async (reason) => {
          try {
            await cancelMutation.mutateAsync(reason)
            toast.success('قرارداد لغو شد')
            setCancelOpen(false)
            detailQuery.refetch()
          } catch (err) {
            setDialogError(extractError(err, 'لغو قرارداد ناموفق بود'))
          }
        }}
      />
    </Layout>
  )
}

export default ManagerContractDetail
