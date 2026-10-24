// frontend/src/components/split-payment/SplitPaymentDialog.tsx
// دیالوگ ایجاد پرداخت اشتراکی تیم — EQUAL/CUSTOM/PERCENTAGE

import React, { useState, useEffect } from 'react'

import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useToast } from '@/hooks/useToast'
import { faNum } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
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
        setError(`جمع سهم‌ها (${faNum(total)}) با مبلغ کل (${faNum(expectedTotal)}) مطابقت ندارد.`)
        return
      }
    }

    if (method === 'PERCENTAGE') {
      const total = getTotalPercentage()
      if (Math.abs(total - 100) > 0.01) {
        setError(`جمع درصدها (${toPersianDigits(total)}٪) باید دقیقاً ۱۰۰٪ باشد.`)
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
      <div className="flex flex-col gap-6">
        {/* Method Selection */}
        <RadioGroup
          aria-label="روش تقسیم مبلغ"
          value={method}
          onValueChange={(v) => setMethod(v as typeof method)}
          className="flex flex-wrap gap-4"
        >
          {METHOD_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-start gap-2">
              <RadioGroupItem
                value={opt.value}
                id={`split-method-${opt.value}`}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <Label htmlFor={`split-method-${opt.value}`} className="cursor-pointer font-normal">
                <span className="block text-[0.68rem] font-semibold text-foreground">
                  {opt.label}
                </span>
                <span className="block text-[0.68rem] text-muted-foreground">
                  {opt.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <Label htmlFor="split-amount">مبلغ کل (تومان)</Label>
          <Input
            id="split-amount"
            type="number"
            required
            min={0}
            dir="ltr"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || '')}
            className="h-9"
          />
        </div>

        {/* Custom Shares Editor */}
        {method === 'CUSTOM' && customShares.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-[0.68rem] font-semibold text-foreground">
              سهم هر عضو:
            </p>
            {customShares.map((share) => {
              const member = members.find((m) => m.user_id === share.user_id)
              return (
                <div key={share.user_id} className="flex items-center gap-4">
                  <p className="flex-1 text-[0.68rem] text-foreground">{member?.full_name || `کاربر ${toPersianDigits(share.user_id)}`}</p>
                  <Input
                    aria-label={`سهم ${member?.full_name || `کاربر ${toPersianDigits(share.user_id)}`}`}
                    type="number"
                    dir="ltr"
                    value={share.amount}
                    onChange={(e) => handleUpdateCustomShare(share.user_id, Number(e.target.value) || 0)}
                    className="h-9 w-[150px]"
                  />
                  <span className="text-[0.68rem] text-muted-foreground">تومان</span>
                </div>
              )
            })}
            <Alert variant={getTotalCustomAmount() === (typeof amount === 'number' ? amount : 0) ? 'success' : 'destructive'}>
              <AlertDescription>
                جمع: {faNum(getTotalCustomAmount())} تومان
                {typeof amount === 'number' && amount > 0 && (
                  <> از {faNum(amount)} تومان</>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Percentage Shares Editor */}
        {method === 'PERCENTAGE' && percentageShares.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-[0.68rem] font-semibold text-foreground">
              درصد سهم هر عضو:
            </p>
            {percentageShares.map((share) => {
              const member = members.find((m) => m.user_id === share.user_id)
              return (
                <div key={share.user_id} className="flex items-center gap-4">
                  <p className="flex-1 text-[0.68rem] text-foreground">{member?.full_name || `کاربر ${toPersianDigits(share.user_id)}`}</p>
                  <Input
                    aria-label={`درصد ${member?.full_name || `کاربر ${toPersianDigits(share.user_id)}`}`}
                    type="number"
                    dir="ltr"
                    min={0}
                    max={100}
                    value={share.percentage}
                    onChange={(e) => handleUpdatePercentageShare(share.user_id, Number(e.target.value) || 0)}
                    className="h-9 w-[100px]"
                  />
                  <span className="text-[0.68rem] text-muted-foreground">٪</span>
                </div>
              )
            })}
            <Alert variant={getTotalPercentage() === 100 ? 'success' : 'destructive'}>
              <AlertDescription>
                جمع: {toPersianDigits(getTotalPercentage())}٪
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="split-note">یادداشت (اختیاری)</Label>
          <Textarea
            id="split-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: هزینه اجاره زمین برای بازی پنجشنبه"
            className="min-h-[72px]"
          />
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="split-deadline">مهلت پرداخت</Label>
          <Input
            id="split-deadline"
            type="datetime-local"
            dir="ltr"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
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
        </div>
      </div>
    </Dialog>
  )
}

export default SplitPaymentDialog
