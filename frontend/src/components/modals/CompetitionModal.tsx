import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CompetitionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: number
  currentPrice: number
  bestPrice: number
  onSuccess?: () => void
}

const CompetitionModal: React.FC<CompetitionModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  currentPrice,
  bestPrice,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [bidPrice, setBidPrice] = useState(bestPrice - 10000)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (bidPrice >= bestPrice) {
      setError('قیمت پیشنهادی باید کمتر از بهترین پیشنهاد باشد')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('پیشنهاد شما با موفقیت ثبت شد!')
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError('خطا در ثبت پیشنهاد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="mx-auto"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center mx-auto mb-3">
              <Icon icon="mdi:gavel" className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <DialogTitle className="text-center">ثبت پیشنهاد</DialogTitle>
          <DialogDescription className="text-center">
            بهترین پیشنهاد فعلی: {formatPrice(bestPrice)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="text-sm font-medium">قیمت پیشنهادی (تومان)</label>
            <Input
              type="number"
              value={bidPrice}
              onChange={(e) => setBidPrice(Number(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              قیمت فعلی: {formatPrice(currentPrice)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              لغو
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
            >
              ثبت پیشنهاد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompetitionModal