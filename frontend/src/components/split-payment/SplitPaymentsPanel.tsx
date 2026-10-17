// frontend/src/components/split-payment/SplitPaymentsPanel.tsx
// پنل مدیریت پرداخت‌های اشتراکی تیم — لیست، وضعیت و جزئیات

import React, { useState } from 'react'
import { Box, Typography, Paper, Chip, IconButton, Tooltip, Alert, LinearProgress } from '@mui/material'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ConfirmModal from '@/components/modals/ConfirmModal'
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header with Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
          پرداخت‌های اشتراکی
        </Typography>
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
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Icon icon="mdi:loading" style={{ width: 32, height: 32, color: '#3b82f6' }} />
        </Box>
      ) : payments.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '14px',
            bgcolor: '#f8fafc',
            border: '1px dashed #cbd5e1',
          }}
        >
          <Icon icon="mdi:wallet-outline" style={{ width: 48, height: 48, color: '#64748b' }} />
          <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#64748b' }}>
            هنوز پرداخت اشتراکی ایجاد نشده است.
          </Typography>
          {isManager && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowCreateDialog(true)}
            >
              اولین پرداخت را ایجاد کنید
            </Button>
          )}
        </Paper>
      ) : (
        /* Payment List */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {payments.map((payment) => (
            <Paper
              key={payment.id}
              sx={{
                p: 2,
                borderRadius: '14px',
                border: '1px solid rgba(15,23,42,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                      پرداخت #{payment.id}
                    </Typography>
                    <Chip
                      label={STATUS_LABELS[payment.status as keyof typeof STATUS_LABELS]}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: `${STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]}15`,
                        color: STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS],
                      }}
                    />
                    <Chip
                      label={METHOD_LABELS[payment.method as keyof typeof METHOD_LABELS]}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', fontSize: '0.8rem', color: '#475569' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon="mdi:currency-irr" style={{ width: 16, height: 16 }} />
                      <Typography>{Number(payment.amount).toLocaleString()} ریال</Typography>
                    </Box>
                    {payment.deadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:clock-outline" style={{ width: 16, height: 16 }} />
                        <Typography>مهلت: {new Date(payment.deadline).toLocaleDateString('fa-IR')}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon="mdi:calendar-outline" style={{ width: 16, height: 16 }} />
                      <Typography>{new Date(payment.created_at).toLocaleDateString('fa-IR')}</Typography>
                    </Box>
                  </Box>
                  {payment.note && (
                    <Typography sx={{ mt: 0.75, fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                      {payment.note}
                    </Typography>
                  )}
                </Box>
                <Tooltip title="مشاهده جزئیات">
                  <IconButton onClick={() => handleViewDetails(payment.id)} size="small" aria-label={`مشاهده جزئیات پرداخت #${payment.id}`}>
                    <Icon icon="mdi:eye-outline" style={{ width: 20, height: 20, color: '#3b82f6' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Payment Detail Dialog */}
      {selectedPayment && (
        <Dialog
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`جزئیات پرداخت #${selectedPayment.id}`}
          maxWidth="md"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary */}
            <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>مبلغ کل:</Typography>
                <Typography sx={{ fontWeight: 700 }}>{Number(selectedPayment.amount).toLocaleString()} ریال</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>روش تقسیم:</Typography>
                <Typography sx={{ fontWeight: 600 }}>{METHOD_LABELS[selectedPayment.method as keyof typeof METHOD_LABELS]}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>وضعیت:</Typography>
                <Chip
                  label={STATUS_LABELS[selectedPayment.status as keyof typeof STATUS_LABELS]}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    bgcolor: `${STATUS_COLORS[selectedPayment.status as keyof typeof STATUS_COLORS]}15`,
                    color: STATUS_COLORS[selectedPayment.status as keyof typeof STATUS_COLORS],
                  }}
                />
              </Box>
            </Paper>

            {/* Progress — سرور total_paid/remaining را می‌فرستد؛ قبلاً هیچ‌جا نشان داده نمی‌شد */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                {`${Number(selectedPayment.total_paid ?? 0).toLocaleString('fa-IR')} پرداخت‌شده از ${Number(selectedPayment.amount).toLocaleString('fa-IR')} ریال`}
              </Typography>
              {Number(selectedPayment.remaining ?? 0) > 0 && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309' }}>
                  {`باقی‌مانده: ${Number(selectedPayment.remaining).toLocaleString('fa-IR')} ریال`}
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={selectedPayment.amount
                ? Math.min(100, (Number(selectedPayment.total_paid ?? 0) / Number(selectedPayment.amount)) * 100)
                : 0}
              sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }}
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
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mt: 1 }}>سهم اعضا:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedPayment.shares?.map((share: any) => (
                <Paper
                  key={share.id}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '10px',
                    border: share.status === 'PAID' ? '1px solid #10b981' : '1px solid #e2e8f0',
                    bgcolor: share.status === 'PAID' ? '#f0fdf4' : '#fff',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {getUserName(share.user_id)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>
                      {share.percentage ? `${share.percentage}%` : ''}
                      {share.amount > 0 && ` · ${Number(share.amount).toLocaleString()} ریال`}
                    </Typography>
                  </Box>
                  <Chip
                    label={SHARE_LABELS[share.status] ?? 'در انتظار'}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: SHARE_COLORS[share.status] ?? '#f59e0b',
                      color: '#fff',
                    }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
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
    </Box>
  )
}

export default SplitPaymentsPanel
