// frontend/src/components/split-payment/SplitPaymentDialog.tsx
// دیالوگ ایجاد پرداخت اشتراکی تیم — EQUAL/CUSTOM/PERCENTAGE

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
} from '@mui/material'

import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { splitPaymentService, type CreateSplitPaymentPayload } from '@/services/splitPayment'
import type { TeamMember } from '@/types/team'

interface Props {
  open: boolean
  onClose: () => void
  teamId: number
  members: TeamMember[]
  onSuccess?: (paymentId: number) => void
}

const METHOD_OPTIONS = [
  { value: 'EQUAL', label: 'تساوی', description: 'مبلغ به‌طور مساوی تقسیم می‌شود' },
  { value: 'CUSTOM', label: 'سفارشی', description: 'هر عضو مبلغ دلخواه پرداخت می‌کند' },
  { value: 'PERCENTAGE', label: 'درصدی', description: 'سهم هر نفر بر اساس درصد مشخص' },
]

const SplitPaymentDialog: React.FC<Props> = ({ open, onClose, teamId, members, onSuccess }) => {
  const toast = useToast()

  const [method, setMethod] = useState<'EQUAL' | 'CUSTOM' | 'PERCENTAGE'>('EQUAL')
  const [amount, setAmount] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [deadline, setDeadline] = useState('')
  const [customShares, setCustomShares] = useState<Array<{ user_id: number; amount: number }>>([])
  const [percentageShares, setPercentageShares] = useState<Array<{ user_id: number; percentage: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize shares when method changes
  useEffect(() => {
    if (!open || members.length === 0) return

    if (method === 'EQUAL') {
      // Reset custom/percentage shares
      setCustomShares([])
      setPercentageShares([])
    } else if (method === 'CUSTOM') {
      const totalAmount = typeof amount === 'number' ? amount : 0
      const equalShare = Math.floor(totalAmount / members.length)
      const remainder = totalAmount - equalShare * members.length
      
      setCustomShares(
        members.map((m, i) => ({
          user_id: m.user_id,
          amount: i === members.length - 1 ? equalShare + remainder : equalShare,
        }))
      )
      setPercentageShares([])
    } else if (method === 'PERCENTAGE') {
      const equalPct = Math.floor(100 / members.length)
      const remainder = 100 - equalPct * members.length
      
      setPercentageShares(
        members.map((m, i) => ({
          user_id: m.user_id,
          percentage: i === members.length - 1 ? equalPct + remainder : equalPct,
        }))
      )
      setCustomShares([])
    }
  }, [method, members, open, amount])

  const handleUpdateCustomShare = (userId: number, newAmount: number) => {
    setCustomShares((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, amount: newAmount } : s))
    )
  }

  const handleUpdatePercentageShare = (userId: number, newPercentage: number) => {
    setPercentageShares((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, percentage: newPercentage } : s))
    )
  }

  const getTotalCustomAmount = () => customShares.reduce((sum, s) => sum + s.amount, 0)
  const getTotalPercentage = () => percentageShares.reduce((sum, s) => sum + s.percentage, 0)

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!amount || amount <= 0) {
      setError('لطفاً مبلغ معتبر وارد کنید.')
      return
    }

    if (method === 'CUSTOM') {
      const total = getTotalCustomAmount()
      const expectedTotal = typeof amount === 'number' ? amount : 0
      if (Math.abs(total - expectedTotal) > 0.01) {
        setError(`جمع سهم‌ها (${total.toLocaleString()}) با مبلغ کل (${expectedTotal.toLocaleString()}) مطابقت ندارد.`)
        return
      }
    }

    if (method === 'PERCENTAGE') {
      const total = getTotalPercentage()
      if (Math.abs(total - 100) > 0.01) {
        setError(`جمع درصدها (${total}%) باید دقیقاً ۱۰۰% باشد.`)
        return
      }
    }

    setLoading(true)

    try {
      const payload: CreateSplitPaymentPayload = {
        team_id: teamId,
        amount: typeof amount === 'number' ? amount : 0,
        currency: 'IRR',
        method,
        note: note.trim() || undefined,
        deadline: deadline || undefined,
      }

      if (method === 'CUSTOM') {
        payload.custom_shares = customShares
      } else if (method === 'PERCENTAGE') {
        payload.percentage_shares = percentageShares
      }

      const result = await splitPaymentService.create(payload)
      
      toast.success('پرداخت اشتراکی با موفقیت ایجاد شد.')
      onSuccess?.(result.id)
      onClose()
    } catch (err: any) {
      const message = err.response?.data?.detail || 'خطا در ایجاد پرداخت اشتراکی.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setNote('')
    setDeadline('')
    setCustomShares([])
    setPercentageShares([])
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="ایجاد پرداخت اشتراکی" maxWidth="md">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Method Selection */}
        <RadioGroup
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          row
        >
          {METHOD_OPTIONS.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {opt.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {opt.description}
                  </Typography>
                </Box>
              }
            />
          ))}
        </RadioGroup>

        {/* Amount Input */}
        <TextField
          label="مبلغ کل (ریال)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || '')}
          fullWidth
          required
          slotProps={{ htmlInput: { min: 0 } }}
        />

        {/* Custom Shares Editor */}
        {method === 'CUSTOM' && customShares.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              سهم هر عضو:
            </Typography>
            {customShares.map((share) => {
              const member = members.find((m) => m.user_id === share.user_id)
              return (
                <Box key={share.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ flex: 1 }}>{member?.full_name || `کاربر ${share.user_id}`}</Typography>
                  <TextField
                    type="number"
                    value={share.amount}
                    onChange={(e) => handleUpdateCustomShare(share.user_id, Number(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 150 }}
                  />
                  <Typography variant="caption" color="text.secondary">ریال</Typography>
                </Box>
              )
            })}
            <Alert severity={getTotalCustomAmount() === (typeof amount === 'number' ? amount : 0) ? 'success' : 'error'}>
              جمع: {getTotalCustomAmount().toLocaleString()} ریال
              {typeof amount === 'number' && amount > 0 && (
                <> از {amount.toLocaleString()} ریال</>
              )}
            </Alert>
          </Box>
        )}

        {/* Percentage Shares Editor */}
        {method === 'PERCENTAGE' && percentageShares.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              درصد سهم هر عضو:
            </Typography>
            {percentageShares.map((share) => {
              const member = members.find((m) => m.user_id === share.user_id)
              return (
                <Box key={share.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ flex: 1 }}>{member?.full_name || `کاربر ${share.user_id}`}</Typography>
                  <TextField
                    type="number"
                    value={share.percentage}
                    onChange={(e) => handleUpdatePercentageShare(share.user_id, Number(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 100 }}
                    slotProps={{ htmlInput: { min: 0, max: 100 } }}
                  />
                  <Typography variant="caption" color="text.secondary">٪</Typography>
                </Box>
              )
            })}
            <Alert severity={getTotalPercentage() === 100 ? 'success' : 'error'}>
              جمع: {getTotalPercentage()}٪
            </Alert>
          </Box>
        )}

        {/* Note */}
        <TextField
          label="یادداشت (اختیاری)"
          multiline
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          placeholder="مثلاً: هزینه اجاره زمین برای بازی پنجشنبه"
        />

        {/* Deadline */}
        <TextField
          label="مهلت پرداخت"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {/* Error Display */}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outline" onClick={handleClose}>
            انصراف
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={loading || !amount || amount <= 0}
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد پرداخت'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default SplitPaymentDialog
