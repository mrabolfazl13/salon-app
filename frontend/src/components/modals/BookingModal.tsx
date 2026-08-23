import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'
import BookingForm from '@/components/forms/BookingForm'

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venues: Array<{ id: string; name: string; price: number }>
  onSuccess?: () => void
}

const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onOpenChange,
  venues,
  onSuccess,
}) => {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="md">
      <div className="text-center py-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="mx-auto"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Icon icon="mdi:calendar-plus" className="h-7 w-7 text-primary" />
          </div>
        </motion.div>
        <h2 className="text-lg font-semibold">رزرو سالن</h2>
        <p className="text-sm text-muted-foreground mt-1">
          اطلاعات مورد نیاز را وارد کنید
        </p>
      </div>

      <BookingForm
        venues={venues}
        onSuccess={() => {
          onSuccess?.()
          onOpenChange(false)
        }}
      />
    </Dialog>
  )
}

export default BookingModal