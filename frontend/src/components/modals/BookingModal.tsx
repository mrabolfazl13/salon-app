import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
          <DialogTitle className="text-center">رزرو سالن</DialogTitle>
          <DialogDescription className="text-center">
            اطلاعات مورد نیاز را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <BookingForm
          venues={venues}
          onSuccess={() => {
            onSuccess?.()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default BookingModal