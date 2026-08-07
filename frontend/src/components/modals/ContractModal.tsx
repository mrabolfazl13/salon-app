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
import ContractForm from '@/components/contract/ContractForm'

interface ContractModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venues: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

const ContractModal: React.FC<ContractModalProps> = ({
  open,
  onOpenChange,
  venues,
  onSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="mx-auto"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Icon icon="mdi:file-document-plus" className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <DialogTitle className="text-center">ثبت قرارداد بلندمدت</DialogTitle>
          <DialogDescription className="text-center">
            اطلاعات قرارداد را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <ContractForm
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

export default ContractModal