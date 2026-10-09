// frontend/src/pages/contracts/ContractDetail.tsx
// جزئیات کامل قرارداد (نمای کاربر): خلاصه اقتصادی + بنر معوق، تقویم اقساط با پرداخت
// درگاه‌شبیه‌سازی، جدول سانس‌ها با «درخواست حذف سانس» (گیت کلاینتی: فقط سانس آینده)،
// ممیزی جمع‌شونده و لغو سیاست‌محور قرارداد.

import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
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

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const navigate = useNavigate()
  const theme = useTheme()
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

  if (detailQuery.isLoading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
        </Container>
      </Layout>
    )
  }

  if (detailQuery.isError || !contract) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Button
            variant="text"
            onClick={() => navigate('/contracts')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            startIcon={<Icon icon="mdi:arrow-right" />}
          >
            بازگشت به لیست قراردادها
          </Button>
          <ErrorBox message="قرارداد مورد نظر یافت نشد یا دسترسی شما به آن محدود است." onRetry={() => detailQuery.refetch()} />
        </Container>
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
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Button
          variant="text"
          onClick={() => navigate('/contracts')}
          sx={{ mb: 3, borderRadius: 1, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          startIcon={<Icon icon="mdi:arrow-right" />}
        >
          بازگشت به لیست قراردادها
        </Button>

        {/* هدر */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Paper sx={{ borderRadius: '16px', p: { xs: 2, md: 3 }, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                  <Icon icon="mdi:file-document-multiple" className="h-5 w-5" style={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography component="h1" variant="h6" sx={{ fontWeight: 700 }}>
                    {contract.venue_name || `سالن #${faNum(contract.venue_id)}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`قرارداد #${faNum(contract.id)}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusChip label={payMeta.label} color={payMeta.color} />
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 700,
                    bgcolor: `${meta.color}18`,
                    color: meta.color,
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* بنرهای وضعیت */}
        {contract.status === 'pending' && (
          <Alert
            severity="warning"
            icon={<Icon icon="mdi:account-clock-outline" />}
            sx={{ mb: 2, borderRadius: '14px', fontWeight: 600 }}
          >
            در انتظار تأیید مدیر سالن — پس از تأیید، تقویم اقساط صادر و قرارداد فعال می‌شود. سانس‌ها تا آن زمان برای شما رزرو است.
          </Alert>
        )}
        {contract.status === 'rejected' && contract.reject_reason && (
          <Alert severity="error" icon={<Icon icon="mdi:close-octagon-outline" />} sx={{ mb: 2, borderRadius: '14px' }}>
            {`درخواست شما رد شد. دلیل مدیر: ${contract.reject_reason}`}
          </Alert>
        )}
        {contract.status === 'cancelled' && contract.cancel_reason && (
          <Alert severity="warning" icon={<Icon icon="mdi:cancel" />} sx={{ mb: 2, borderRadius: '14px' }}>
            {`قرارداد لغو شده است. دلیل: ${contract.cancel_reason}` +
              ' — سانس‌های آینده آزاد شدند و سانس‌های برگزارشده دست‌نخورده می‌مانند.'}
          </Alert>
        )}

        {/* اقتصاد */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <SectionCard title="وضعیت مالی و سانس‌ها" icon="mdi:chart-line" dense={false}>
              <ContractEconomics economics={contract.economics} totalAmount={contract.total_amount} />
            </SectionCard>

            <Box sx={{ mt: 3 }}>
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
            </Box>

            <Box sx={{ mt: 3 }}>
              <SectionCard title="سانس‌های قرارداد" icon="mdi:calendar-multiple">
                <ContractSessionsTable
                  sessions={contract.sessions}
                  mode="user"
                  busySessionId={requestCancelMutation.isPending ? (cancelSession?.id ?? null) : null}
                  onRequestCancel={(cs) => { setCancelSession(cs); setDialogError(null) }}
                />
              </SectionCard>
            </Box>

            <Box sx={{ mt: 3 }}>
              <SectionCard title="تاریخچه" icon="mdi:history">
                <ContractAuditTimeline contractId={contract.id} />
              </SectionCard>
            </Box>
          </Grid>

          {/* خلاصه و اقدامات */}
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard title="جزئیات قرارداد" icon="mdi:information-outline">
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
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>توضیحات</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {contract.description}
                  </Typography>
                </>
              )}

              {contract.cancellation_policy && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>شرایط لغو (تعیین‌شده توسط مدیر)</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
                    {contract.cancellation_policy}
                  </Typography>
                </>
              )}
            </SectionCard>

            <Box sx={{ mt: 3 }}>
              <SectionCard title="اعمال قرارداد" icon="mdi:lightning-bolt" dense>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => window.print()}
                    sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                    startIcon={<Icon icon="mdi:printer" className="h-4 w-4" />}
                  >
                    چاپ قرارداد
                  </Button>
                  {isOwner && contract.status === 'pending' && (
                    <Typography variant="caption" color="text.disabled">
                      امکان ویرایش وجود ندارد — برای انصراف قرارداد را لغو کنید.
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    color="error"
                    variant="outlined"
                    disabled={!cancelable}
                    onClick={() => { setCancelContractOpen(true); setDialogError(null) }}
                    sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                    startIcon={<Icon icon="mdi:cancel" className="h-4 w-4" />}
                  >
                    لغو قرارداد
                  </Button>
                  {!cancelable && contract.status !== 'rejected' && contract.status !== 'cancelled' && (
                    <Typography variant="caption" color="text.disabled">
                      {contract.end_date < getTodayISO()
                        ? 'قرارداد گذشته یا تمام‌شده قابل لغو نیست'
                        : 'این قرارداد در وضعیت قابل لغو نیست'}
                    </Typography>
                  )}
                </Box>
              </SectionCard>
            </Box>
          </Grid>
        </Grid>

        {/* بخش چاپ‌پسند — فقط در چاپ دیده می‌شود (الگوی چاپ فاکتور رزرو + CSS محلی) */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .contract-print-root, .contract-print-root * { visibility: visible !important; }
            .contract-print-root { position: absolute !important; top: 0; left: 0; width: 100%; display: block !important; background: white; }
          }
        `}</style>
        <Box className="contract-print-root" sx={{ display: { xs: 'none' }, p: 3 }} dir="rtl">
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {`قرارداد سالن ${contract.venue_name || `#${faNum(contract.venue_id)}`} — شماره ${faNum(contract.id)}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`تاریخ چاپ: ${formatJalaliDate(getTodayISO(), { format: 'full' })}`}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>طرفین</Typography>
          {infoItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', gap: 1.5, mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 160 }}>{item.label}:</Typography>
              <Typography variant="body2">{item.value}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 1 }}>
            {(contract.days?.length ? contract.days : [contract.day_of_week]).map((d) => (
              <Chip key={d} label={pyDayNames[d] ?? d} size="small" variant="outlined" sx={{ borderRadius: '6px' }} />
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 1 }}>خلاصه جلسات</Typography>
          <Typography variant="body2">
            {`کل سانس‌ها: ${faNum(contract.economics?.total_sessions ?? contract.sessions.length)} — برگزارشده: ${faNum(contract.economics?.completed_sessions ?? 0)} — برنامه‌ریزی‌شده: ${faNum(contract.economics?.scheduled_sessions ?? 0)} — مستثنا: ${faNum(contract.economics?.excluded_sessions ?? 0)}`}
          </Typography>
          {contract.payments.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 1 }}>اقساط</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>عنوان</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>سررسید</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>مبلغ</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>وضعیت</TableCell>
                  </TableRow>
                </TableHead>
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
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {`مبلغ کل: ${formatRial(contract.total_amount)} — پرداختی: ${formatRial(contract.economics?.paid_amount ?? 0)} — مانده: ${formatRial(contract.economics?.remaining_amount ?? contract.total_amount - (contract.economics?.paid_amount ?? 0))}`}
          </Typography>
          {contract.cancellation_policy && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {`شرایط لغو: ${contract.cancellation_policy}`}
            </Typography>
          )}
        </Box>
      </Container>

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
            setDialogError(err instanceof Error ? 'ثبت درخواست ناموفق بود' : 'ثبت درخواست ناموفق بود')
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