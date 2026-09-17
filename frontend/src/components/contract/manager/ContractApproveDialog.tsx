// frontend/src/components/contract/manager/ContractApproveDialog.tsx
// «تأیید با تغییرات» — POST /contracts/{id}/approve (ContractApprove):
// قیمت اصلاحی (< قیمت پایه)، سقف سانس ۱..۲۰۰، پلن اقساط {count 1..24, فاصله 7..90}،
// سیاست لغو. خطاهای ۴۰۰ فارسی بک‌اند اینلاین نمایش داده می‌شود.

import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { useApproveContract } from '@/hooks/useContracts'
import {
  extractError,
  faNum,
  formatRial,
  parseAmountInput,
  SectionCard,
} from '@/components/contract/shared'
import type { ContractApprovePayload } from '@/services/contract'

interface ApproveTarget {
  contractId: number
  venueName: string
  userName: string | null
  pricePerSession: number
  originalPrice: number
  totalSessions: number
  currentPolicy: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  target: ApproveTarget | null
}

const ContractApproveDialog: React.FC<Props> = ({ open, onClose, target }) => {
  const mutation = useApproveContract()
  const [price, setPrice] = useState('')
  const [maxSessions, setMaxSessions] = useState('')
  const [installCount, setInstallCount] = useState('')
  const [dueSpacing, setDueSpacing] = useState('')
  const [policy, setPolicy] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (open && target) {
      setPrice(String(target.pricePerSession))
      setMaxSessions(String(target.totalSessions || ''))
      setInstallCount('')
      setDueSpacing('')
      setPolicy(target.currentPolicy || '')
      setErrors({})
      setServerError(null)
    }
  }, [open, target])

  const parsedPrice = parseAmountInput(price)
  const parsedMax = maxSessions.trim() === '' ? null : parseAmountInput(maxSessions)
  const parsedCount = installCount.trim() === '' ? null : parseAmountInput(installCount)
  const parsedSpacing = dueSpacing.trim() === '' ? null : parseAmountInput(dueSpacing)

  const previewTotal = useMemo(() => {
    const count = parsedMax && Number.isFinite(parsedMax) ? parsedMax : target?.totalSessions ?? 0
    const p = Number.isFinite(parsedPrice) ? parsedPrice : 0
    return count * p
  }, [parsedMax, parsedPrice, target])

  if (!target) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) errs.price = 'قیمت هر سانس را وارد کنید'
    else if (parsedPrice >= target.originalPrice) errs.price = 'قیمت اصلاحی باید کمتر از قیمت پایه سانس باشد'
    if (parsedMax !== null && (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 200)) {
      errs.max = 'سقف سانس باید عددی بین ۱ تا ۲۰۰ باشد'
    }
    if (parsedCount !== null && (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 24)) {
      errs.count = 'تعداد اقساط بین ۱ تا ۲۴'
    }
    if (parsedSpacing !== null && parsedCount === null) {
      errs.spacing = 'برای فاصله سررسید، تعداد اقساط را نیز مشخص کنید'
    }
    if (parsedSpacing !== null && (!Number.isInteger(parsedSpacing) || parsedSpacing < 7 || parsedSpacing > 90)) {
      errs.spacing = 'فاصله سررسید بین ۷ تا ۹۰ روز'
    }
    if (policy.length > 1000) errs.policy = 'سیاست لغو حداکثر ۱۰۰۰ کاراکتر'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async () => {
    setServerError(null)
    if (!validate()) return
    const payload: ContractApprovePayload = {}
    if (parsedPrice !== target.pricePerSession) payload.adjusted_price_per_session = parsedPrice
    if (parsedMax !== null && parsedMax !== target.totalSessions) payload.max_sessions = parsedMax
    if (parsedCount !== null) {
      payload.installments = { count: parsedCount, due_in_days_between: parsedSpacing ?? null }
    }
    const policyTrim = policy.trim()
    if (policyTrim && policyTrim !== (target.currentPolicy || '')) payload.cancellation_policy = policyTrim
    try {
      await mutation.mutateAsync({ contractId: target.contractId, data: payload })
      toast.success('قرارداد تأیید و فعال شد')
      onClose()
    } catch (err) {
      setServerError(extractError(err, 'تأیید قرارداد ناموفق بود'))
    }
  }

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '18px', maxHeight: '92vh' } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.02rem', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:check-decagram" style={{ color: '#059669' }} />
          {'تأیید قرارداد با تغییرات'}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {(target.userName || 'کاربر') + ' — ' + target.venueName + ' | قیمت پیشنهادی: ' + formatRial(target.pricePerSession) + ' در ' + faNum(target.totalSessions) + ' سانس'}
        </Typography>
        {serverError && <Alert severity="error" sx={{ borderRadius: '12px' }}>{serverError}</Alert>}

        <TextField
          label="قیمت هر سانس (ریال)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          size="small"
          error={Boolean(errors.price)}
          helperText={errors.price || ('قیمت پایه سانس: ' + formatRial(target.originalPrice))}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            label="سقف تعداد سانس (اختیاری)"
            value={maxSessions}
            onChange={(e) => setMaxSessions(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 180 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            error={Boolean(errors.max)}
            helperText={errors.max || 'سانس‌های اضافیِ آینده آزاد می‌شوند'}
          />
          <TextField
            label="تعداد اقساط (اختیاری ۱ تا ۲۴)"
            value={installCount}
            onChange={(e) => setInstallCount(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 180 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            error={Boolean(errors.count)}
            helperText={errors.count || 'خالی = پیش‌فرض ماهانه بر اساس روز سررسید'}
          />
          <TextField
            label="فاصله سررسید اقساط (روز)"
            value={dueSpacing}
            onChange={(e) => setDueSpacing(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 180 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            error={Boolean(errors.spacing)}
            helperText={errors.spacing || 'بین ۷ تا ۹۰ روز — فقط با تعداد اقساط'}
          />
        </Box>
        <TextField
          label="شرایط لغو قرارداد (اختیاری)"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
          error={Boolean(errors.policy)}
          helperText={errors.policy || 'این متن در جزئیات قرارداد برای کاربر نمایش داده می‌شود'}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />

        <SectionCard title="پیش‌نمایش پس از تأیید" icon="mdi:eye-outline" dense>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">مبلغ کل جدید</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatRial(previewTotal)}</Typography>
          </Box>
        </SectionCard>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={mutation.isPending} sx={{ textTransform: 'none', borderRadius: '10px' }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={mutation.isPending}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #059669, #047857)',
          }}
        >
          {mutation.isPending ? 'در حال تأیید...' : 'تأیید و فعال‌سازی'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export type { ApproveTarget }
export default ContractApproveDialog