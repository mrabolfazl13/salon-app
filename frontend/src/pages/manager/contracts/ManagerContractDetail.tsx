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
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
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
  ErrorBox,
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
import ContractEconomics from '@/components/contract/ContractEconomics'
import ContractPaymentsTable from '@/components/contract/ContractPaymentsTable'
import ContractSessionsTable from '@/components/contract/ContractSessionsTable'
import ContractAuditTimeline from '@/components/contract/ContractAuditTimeline'
import ContractApproveDialog, { type ApproveTarget } from '@/components/contract/manager/ContractApproveDialog'
import SessionRescheduleDialog from '@/components/contract/manager/SessionRescheduleDialog'
import MoveContractDialog from '@/components/contract/manager/MoveContractDialog'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'
import type { ContractPaymentData, ContractSessionData } from '@/services/contract'

const ManagerContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const navigate = useNavigate()
  const theme = useTheme()

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

  if (detailQuery.isLoading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
        </Container>
      </Layout>
    )
  }

  if (detailQuery.isError || !contract) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Button
            variant="text"
            onClick={() => navigate('/manager/contracts')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            startIcon={<Icon icon="mdi:arrow-right" />}
          >
            بازگشت به مدیریت قراردادها
          </Button>
          <ErrorBox message="قرارداد یافت نشد یا سالن آن زیر مدیریت شما نیست." onRetry={() => detailQuery.refetch()} />
        </Container>
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
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Button
          variant="text"
          onClick={() => navigate('/manager/contracts')}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          startIcon={<Icon icon="mdi:arrow-right" />}
        >
          بازگشت به مدیریت قراردادها
        </Button>

        <Paper sx={{ borderRadius: '16px', p: { xs: 2, md: 3 }, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: `${theme.palette.primary.main}08`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="mdi:file-document-check-outline" className="h-5 w-5" style={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography component="h1" variant="h6" sx={{ fontWeight: 700 }}>
                  {contract.venue_name || `سالن #${faNum(contract.venue_id)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`قرارداد #${faNum(contract.id)} — ${contract.user_full_name || '—'}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <StatusChip label={payMeta.label} color={payMeta.color} />
              <Chip
                label={meta.label}
                size="small"
                sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: `${meta.color}18`, color: meta.color }}
              />
            </Box>
          </Box>

          {contract.status === 'pending' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => setApproveOpen(true)}
                sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg, #059669, #047857)' }}
                startIcon={<Icon icon="mdi:check-decagram" className="h-4 w-4" />}
              >
                تأیید با تغییرات
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => { setRejectOpen(true); setDialogError(null) }}
                sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                startIcon={<Icon icon="mdi:close-octagon-outline" className="h-4 w-4" />}
              >
                رد درخواست
              </Button>
            </Box>
          )}
        </Paper>

        {contract.status === 'rejected' && contract.reject_reason && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>
            {`این درخواست رد شده است. دلیل: ${contract.reject_reason}`}
          </Alert>
        )}
        {contract.status === 'cancelled' && contract.cancel_reason && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }}>
            {`قرارداد لغو شده است. دلیل: ${contract.cancel_reason}`}
          </Alert>
        )}
        {contract.economics?.overdue && contract.status === 'active' && (
          <Alert severity="warning" icon={<Icon icon="mdi:alarm-light-outline" />} sx={{ mb: 2, borderRadius: '14px' }}>
            این قرارداد اقساط معوق دارد — می‌توانید برای پیگیری از بخش امور مالی استفاده کنید.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <SectionCard title="وضعیت مالی و سانس‌ها" icon="mdi:chart-line">
              <ContractEconomics economics={contract.economics} totalAmount={contract.total_amount} />
            </SectionCard>

            <Box sx={{ mt: 3 }}>
              <SectionCard
                title="تقویم اقساط"
                icon="mdi:calendar-text-outline"
                action={
                  <Tooltip title="تسویه نقدی در محل توسط صندوقدار/مدیر شعبه — در دفتر کل با روش نقدی و idempotent ثبت می‌شود">
                    <Typography variant="caption" color="text.disabled">
                      دریافت نقدی توسط کارکنان سالن
                    </Typography>
                  </Tooltip>
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
            </Box>

            <Box sx={{ mt: 3 }}>
              <SectionCard
                title="سانس‌های قرارداد"
                icon="mdi:calendar-multiple"
                action={
                  contract.status === 'active' && upcoming > 0 ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => { setMoveOpen(true); setDialogError(null) }}
                      sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem' }}
                      startIcon={<Icon icon="mdi:calendar-move" className="h-4 w-4" />}
                    >
                      جابه‌جایی کل قرارداد
                    </Button>
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
            </Box>

            <Box sx={{ mt: 3 }}>
              <SectionCard title="تاریخچه و ممیزی" icon="mdi:history">
                <ContractAuditTimeline contractId={contract.id} />
              </SectionCard>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard title="اطلاعات قرارداد" icon="mdi:information-outline">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                {infoItems.map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Icon icon={item.icon} className="h-4 w-4" style={{ color: theme.palette.text.secondary }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {contract.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>یادداشت درخواست کاربر</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {contract.description}
                  </Typography>
                </>
              )}
              {contract.cancellation_policy && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>شرایط لغو</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
                    {contract.cancellation_policy}
                  </Typography>
                </>
              )}
            </SectionCard>

            <Box sx={{ mt: 3 }}>
              <SectionCard title="اقدامات مدیر" icon="mdi:shield-account-outline" dense>
                <Button
                  fullWidth
                  color="error"
                  variant="outlined"
                  disabled={!cancelable}
                  onClick={() => { setCancelOpen(true); setDialogError(null) }}
                  sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                  startIcon={<Icon icon="mdi:cancel" className="h-4 w-4" />}
                >
                  لغو قرارداد
                </Button>
                {!cancelable && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    قرارداد در وضعیت یا بازه قابل لغو نیست
                  </Typography>
                )}
              </SectionCard>
            </Box>
          </Grid>
        </Grid>
      </Container>

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