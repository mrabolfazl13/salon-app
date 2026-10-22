// frontend/src/components/split-payment/SplitPaymentsPanel.tsx
// پنل مدیریت پرداخت‌های اشتراکی تیم — لیست، وضعیت و جزئیات

import React, { useState } from 'react'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Progress } from '@/components/ui/shadcn/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { splitPaymentService } from '@/services/splitPayment'
import type { Team } from '@/types/team'
import type { TeamMember } from '@/types/team'
import SplitPaymentDialog from './SplitPaymentDialog'

interface Props {
  team: Team
  members: TeamMember[]
  isManager: boolean
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  PARTIAL: '#4f46e5',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  EXPIRED: '#64748b',
}

const STATUS_LABELS = {
  PENDING: 'در انتظار',
  PARTIAL: 'نیمه‌پرداخت',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغوشده',
  EXPIRED: 'مهلت گذشته',
}

const METHOD_LABELS = {
  EQUAL: 'تساوی',
  CUSTOM: 'سفارشی',
  PERCENTAGE: 'درصدی',
}

// OVERDUE را تسکِ بک‌اند (mark-overdue-split-payments) می‌سازد؛ تا راند ۲۶ هرگز
// تولید نمی‌شد و برای همین در این نقشه نبود (گرهٔ C11.6.2).
const SHARE_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  PAID: 'پرداخت‌شده',
  OVERDUE: 'از مهلت گذشته',
  REFUNDED: 'بازگشت داده‌شده',
}

const SHARE_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PAID: '#10b981',
  OVERDUE: '#b45309',
  REFUNDED: '#64748b',
}

// فقط همین حالت‌ها لغو‌شدنی‌اند (با شرط «پولی گرفته نشده» در سرور)
const CANCELLABLE = ['PENDING', 'PARTIAL', 'EXPIRED']

const SplitPaymentsPanel: React.FC<Props> = ({ team, members, isManager }) => {
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await splitPaymentService.listByTeam(team.id)
      setPayments(result.items || [])
    } catch (err: any) {
      const message = err.response?.data?.detail || 'خطا در بارگذاری پرداخت‌ها.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Load payments on mount
  React.useEffect(() => {
    if (team.id) {
      loadPayments()
    }
  }, [team.id])

  const handleViewDetails = async (paymentId: number) => {
    try {
      const detail = await splitPaymentService.getById(paymentId)
      setSelectedPayment(detail)
    } catch (err: any) {
      toast.error('خطا در دریافت جزئیات.')
    }
  }

  const getUserName = (userId: number) => {
    const member = members.find((m) => m.user_id === userId)
    return member?.full_name || `کاربر ${userId}`
  }

  // سهمِ پرداخت‌نشدهٔ خودِ کاربر — تنها کسی که سرور اجازهٔ پرداختش را می‌دهد
  const myShare = selectedPayment?.shares?.find(
    (s: any) => s.user_id === me?.id && s.status !== 'PAID'
  )

  const handlePayShare = async () => {
    if (!selectedPayment || !myShare) return
    setPaying(true)
    try {
      await splitPaymentService.payShare(selectedPayment.id, myShare.id, {})
      toast.success('سهم شما پرداخت شد')
      await handleViewDetails(selectedPayment.id)
      loadPayments()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'پرداخت سهم ناموفق بود.')
    } finally {
      setPaying(false)
    }
  }

  // لغو فقط برای سازنده (یا سرپرست سیستم) و فقط تا وقتی هیچ سهمی پرداخت نشده —
  // سرور همین را نگهبان می‌کند؛ دکمه برای نداشتنِ کلیکِ بی‌نتیجه نمایش داده می‌شود.
  const canCancel =
    !!selectedPayment &&
    CANCELLABLE.includes(selectedPayment.status) &&
    Number(selectedPayment.total_paid ?? 0) === 0 &&
    (selectedPayment.created_by === me?.id || me?.role === 'super_admin')

  const handleCancel = async () => {
    if (!selectedPayment) return
    setCancelling(true)
    try {
      await splitPaymentService.cancel(selectedPayment.id)
      toast.success('پرداخت اشتراکی لغو شد')
      setShowCancelConfirm(false)
      setSelectedPayment(null)
      loadPayments()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'لغو پرداخت ناموفق بود.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">
          پرداخت‌های اشتراکی
        </p>
        {isManager && (
          <Button
            size="sm"
            variant="gradient"
            icon="mdi:plus"
            onClick={() => setShowCreateDialog(true)}
          >
            ایجاد پرداخت جدید
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="بستن"
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-full text-current transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
            >
              <Icon icon="mdi:close" className="h-4 w-4" aria-hidden="true" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Icon
            icon="mdi:loading"
            className="h-8 w-8 animate-spin text-blue-500"
            role="status"
            aria-label="در حال بارگذاری"
          />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-muted/50 p-8 text-center dark:border-slate-600">
          <Icon icon="mdi:wallet-outline" className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-[0.68rem] text-muted-foreground">
            هنوز پرداخت اشتراکی ایجاد نشده است.
          </p>
          {isManager && (
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowCreateDialog(true)}
              >
                اولین پرداخت را ایجاد کنید
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Payment List */
        <div className="flex flex-col gap-4">
          {payments.map((payment) => {
            const statusColor = STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]
            return (
              <div
                key={payment.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <p className="text-[0.95rem] font-bold text-foreground">
                        پرداخت #{payment.id}
                      </p>
                      <span
                        className="inline-flex h-[22px] items-center rounded-lg px-2 text-[0.75rem] font-bold"
                        style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                      >
                        {STATUS_LABELS[payment.status as keyof typeof STATUS_LABELS]}
                      </span>
                      <span className="inline-flex h-[22px] items-center rounded-lg border border-border px-2 text-[0.75rem] text-muted-foreground">
                        {METHOD_LABELS[payment.method as keyof typeof METHOD_LABELS]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-6 text-[0.8rem] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:currency-irr" className="h-4 w-4" aria-hidden="true" />
                        <span>{Number(payment.amount).toLocaleString()} ریال</span>
                      </div>
                      {payment.deadline && (
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:clock-outline" className="h-4 w-4" aria-hidden="true" />
                          <span>مهلت: {new Date(payment.deadline).toLocaleDateString('fa-IR')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:calendar-outline" className="h-4 w-4" aria-hidden="true" />
                        <span>{new Date(payment.created_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    {payment.note && (
                      <p className="mt-2 text-[0.78rem] italic text-muted-foreground">
                        {payment.note}
                      </p>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(payment.id)}
                        aria-label={`مشاهده جزئیات پرداخت #${payment.id}`}
                        className="flex h-9 w-11 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-400 dark:hover:bg-blue-500/10"
                      >
                        <Icon icon="mdi:eye-outline" className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>مشاهده جزئیات</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payment Detail Dialog */}
      {selectedPayment && (
        <Dialog
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`جزئیات پرداخت #${selectedPayment.id}`}
          maxWidth="md"
        >
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="rounded-xl bg-muted p-4">
              <div className="mb-1 flex justify-between">
                <span className="text-[0.8rem] text-muted-foreground">مبلغ کل:</span>
                <span className="font-bold text-foreground">{Number(selectedPayment.amount).toLocaleString()} ریال</span>
              </div>
              <div className="mb-1 flex justify-between">
                <span className="text-[0.8rem] text-muted-foreground">روش تقسیم:</span>
                <span className="font-semibold text-foreground">{METHOD_LABELS[selectedPayment.method as keyof typeof METHOD_LABELS]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[0.8rem] text-muted-foreground">وضعیت:</span>
                <span
                  className="inline-flex h-[22px] items-center rounded-lg px-2 text-[0.75rem] font-bold"
                  style={{
                    backgroundColor: `${STATUS_COLORS[selectedPayment.status as keyof typeof STATUS_COLORS]}15`,
                    color: STATUS_COLORS[selectedPayment.status as keyof typeof STATUS_COLORS],
                  }}
                >
                  {STATUS_LABELS[selectedPayment.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
            </div>

            {/* Progress — سرور total_paid/remaining را می‌فرستد؛ قبلاً هیچ‌جا نشان داده نمی‌شد */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[0.8rem] text-muted-foreground">
                {`${Number(selectedPayment.total_paid ?? 0).toLocaleString('fa-IR')} پرداخت‌شده از ${Number(selectedPayment.amount).toLocaleString('fa-IR')} ریال`}
              </span>
              {Number(selectedPayment.remaining ?? 0) > 0 && (
                <span className="text-[0.8rem] font-bold text-amber-700 dark:text-amber-300">
                  {`باقی‌مانده: ${Number(selectedPayment.remaining).toLocaleString('fa-IR')} ریال`}
                </span>
              )}
            </div>
            <Progress
              value={selectedPayment.amount
                ? Math.min(100, (Number(selectedPayment.total_paid ?? 0) / Number(selectedPayment.amount)) * 100)
                : 0}
              aria-label="پیشرفت پرداخت این سهم"
              className="h-2 rounded bg-slate-200 [&>div]:rounded dark:bg-slate-700"
            />
            {myShare && (
              <Button
                size="sm"
                variant="gradient"
                icon="mdi:credit-card-outline"
                loading={paying}
                onClick={handlePayShare}
              >
                {`پرداخت سهم من (${Number(myShare.amount).toLocaleString('fa-IR')} ریال)`}
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                icon="mdi:close-circle-outline"
                onClick={() => setShowCancelConfirm(true)}
              >
                لغو این پرداخت
              </Button>
            )}

            {/* Shares */}
            <p className="mt-2 text-[0.9rem] font-bold text-foreground">سهم اعضا:</p>
            <div className="flex flex-col gap-3">
              {selectedPayment.shares?.map((share: any) => (
                <div
                  key={share.id}
                  className={
                    share.status === 'PAID'
                      ? 'flex items-center justify-between rounded-xl border border-emerald-500 bg-emerald-50 p-3 dark:bg-emerald-500/10'
                      : 'flex items-center justify-between rounded-xl border border-border bg-card p-3'
                  }
                >
                  <div className="flex-1">
                    <p className="text-[0.85rem] font-semibold text-foreground">
                      {getUserName(share.user_id)}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-muted-foreground">
                      {share.percentage ? `${share.percentage}%` : ''}
                      {share.amount > 0 && ` · ${Number(share.amount).toLocaleString()} ریال`}
                    </p>
                  </div>
                  <span
                    className="inline-flex h-6 items-center rounded-lg px-2 text-[0.75rem] font-bold text-white"
                    style={{ backgroundColor: SHARE_COLORS[share.status] ?? '#f59e0b' }}
                  >
                    {SHARE_LABELS[share.status] ?? 'در انتظار'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}

      {/* تأییدِ لغو — عملِ قابل‌بازگشت نیست (سهم‌ها دیگر پذیرفته نمی‌شوند) */}
      <ConfirmModal
        open={showCancelConfirm}
        onOpenChange={(o) => !o && setShowCancelConfirm(false)}
        title="لغو پرداخت اشتراکی"
        description={
          selectedPayment
            ? `پرداخت #${selectedPayment.id} لغو می‌شود و دیگر سهمی روی آن ثبت نمی‌شود. ` +
              'اگر عضو پولی پرداخته باشد، سرور لغو را رد می‌کند (بازگشت وجه هنوز مسیر ندارد).'
            : ''
        }
        confirmText="لغو پرداخت"
        variant="destructive"
        loading={cancelling}
        onConfirm={handleCancel}
      />

      {/* Create Split Payment Dialog */}
      {members.length > 0 && (
        <SplitPaymentDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          teamId={team.id}
          members={members}
          onSuccess={(paymentId) => {
            toast.success(`پرداخت #${paymentId} ایجاد شد`)
            setShowCreateDialog(false)
            loadPayments()
          }}
        />
      )}
    </div>
  )
}

export default SplitPaymentsPanel
