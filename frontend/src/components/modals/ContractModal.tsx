import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'
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
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="md">
      <div className="text-center py-2">
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
        <h2 className="text-lg font-semibold">ثبت قرارداد بلندمدت</h2>
        <p className="text-sm text-muted-foreground mt-1">
          اطلاعات قرارداد را وارد کنید
        </p>
      </div>

      <ContractForm
        venues={venues}
        onSuccess={() => {
          onSuccess?.()
          onOpenChange(false)
        }}
      />
    </Dialog>
  )
}

export default ContractModal