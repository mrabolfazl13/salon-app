import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    email: string
    phone: string
  }
  onSuccess?: () => void
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onOpenChange,
  user,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(user)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('اطلاعات با موفقیت به‌روزرسانی شد!')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error('خطا در به‌روزرسانی')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm">
      <div className="text-center py-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="mx-auto"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Icon icon="mdi:account-edit" className="h-7 w-7 text-primary" />
          </div>
        </motion.div>
        <h2 className="text-lg font-semibold">ویرایش پروفایل</h2>
        <p className="text-sm text-muted-foreground mt-1">
          اطلاعات خود را به‌روزرسانی کنید
        </p>
      </div>

      <div className="space-y-4 py-4">
        <Input
          label="نام کامل"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="ایمیل"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="شماره موبایل"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="flex gap-2 pt-2">
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
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default EditProfileModal