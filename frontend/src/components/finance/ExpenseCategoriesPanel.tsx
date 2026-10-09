// frontend/src/components/finance/ExpenseCategoriesPanel.tsx
// مدیریت دسته‌بندی هزینه — فهرست/ایجاد/غیرفعال‌سازی (حذف نرم).
// DELETE بک‌اند روی دسته‌بندیِ استفاده‌شده ۴۰۰ می‌دهد؛ پیام سرور نمایش داده می‌شود.

import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/modals/ConfirmModal'
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  type FinanceVenue,
} from '@/hooks/useFinance'
import { useAuthStore } from '@/store/authStore'
import { ErrorBox, LoadingBox, SectionCard, StatusChip, extractError } from './shared'
import type { ExpenseCategory } from '@/services/finance'

const ExpenseCategoriesPanel: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')
  const [includeInactive, setIncludeInactive] = useState(true)
  const [name, setName] = useState('')
  const [venueId, setVenueId] = useState<number | ''>(!isSuper && venues.length === 1 ? venues[0].id : '')
  const [deactivating, setDeactivating] = useState<ExpenseCategory | null>(null)

  const list = useExpenseCategories(includeInactive)
  const createCategory = useCreateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const venueName = (cat: ExpenseCategory) =>
    cat.venue_id === null ? 'سراسری' : venues.find((v) => v.id === cat.venue_id)?.name ?? `سالن #${cat.venue_id}`

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error('نام دسته‌بندی حداقل ۲ نویسه است')
      return
    }
    if (!isSuper && venueId === '') {
      toast.error('برای مدیر، انتخاب سالن الزامی است')
      return
    }
    createCategory.mutate(
      { name: trimmed, venue_id: venueId === '' ? null : venueId },
      {
        onSuccess: () => {
          toast.success('دسته‌بندی ایجاد شد')
          setName('')
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ایجاد دسته‌بندی')),
      },
    )
  }

  const confirmDeactivate = () => {
    if (!deactivating) return
    deleteCategory.mutate(deactivating.id, {
      onSuccess: () => {
        toast.success('دسته‌بندی غیرفعال شد')
        setDeactivating(null)
      },
      onError: (err) => {
        toast.error(extractError(err, 'خطا در غیرفعال‌سازی'))
        setDeactivating(null)
      },
    })
  }

  return (
    <SectionCard
      title="دسته‌بندی‌های هزینه"
      icon="mdi:tag-outline"
      color="#db2777"
      dense
      action={
        <Chip
          size="small"
          label={includeInactive ? 'نمایش: همه' : 'نمایش: فعال‌ها'}
          onClick={() => setIncludeInactive((v) => !v)}
          sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}
          icon={<Icon icon={includeInactive ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} className="h-3.5 w-3.5" />}
        />
      }
    >
      {/* فرم ایجاد */}
      <Grid container spacing={1.5} sx={{ mb: 2, alignItems: 'center' }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            size="small"
            label="نام دسته‌بندی جدید"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid size={{ xs: 7, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>سالن دسته‌بندی</InputLabel>
            <Select
              value={venueId}
              label="سالن دسته‌بندی"
              onChange={(e) => { const sel = e.target.value as number | ''; setVenueId(sel === '' ? '' : sel) }}
              sx={{ borderRadius: '10px' }}
            >
              {isSuper && <MenuItem value="">سراسری (همه سالن‌ها)</MenuItem>}
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 5, sm: 3 }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={submit}
            disabled={createCategory.isPending}
            startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 0.9 }}
          >
            {createCategory.isPending ? '...' : 'ایجاد'}
          </Button>
        </Grid>
      </Grid>

      {/* فهرست */}
      {list.isPending ? (
        <LoadingBox text="در حال دریافت دسته‌بندی‌ها..." />
      ) : list.isError ? (
        <ErrorBox message={extractError(list.error, 'خطا در دریافت دسته‌بندی‌ها')} onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            هنوز دسته‌بندی هزینه‌ای ساخته نشده است
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {list.data!.map((cat) => (
            <Box
              key={cat.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                pl: 1,
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.05)',
                bgcolor: cat.is_active ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.02)',
                opacity: cat.is_active ? 1 : 0.7,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  bgcolor: cat.venue_id === null ? 'rgba(124,58,237,0.08)' : 'rgba(37,99,235,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  icon={cat.venue_id === null ? 'mdi:earth' : 'mdi:store-outline'}
                  className="h-5 w-5"
                  style={{ color: cat.venue_id === null ? '#7c3aed' : '#2563eb' }}
                />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{cat.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{venueName(cat)}</Typography>
              </Box>
              <StatusChip label={cat.is_active ? 'فعال' : 'غیرفعال'} color={cat.is_active ? '#059669' : '#6b7280'} />
              {cat.is_active && (
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={() => setDeactivating(cat)}
                  disabled={deleteCategory.isPending}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  غیرفعال‌سازی
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}

      <ConfirmModal
        open={deactivating !== null}
        onOpenChange={(v) => {
          if (!v) setDeactivating(null)
        }}
        title="غیرفعال‌سازی دسته‌بندی"
        description={deactivating ? `آیا دسته‌بندی «${deactivating.name}» غیرفعال شود؟ در صورت استفاده در تراکنش‌ها، بک‌اند اجازه حذف نمی‌دهد.` : ''}
        confirmText="غیرفعال کردن"
        onConfirm={confirmDeactivate}
        loading={deleteCategory.isPending}
        variant="destructive"
      />
    </SectionCard>
  )
}

export default ExpenseCategoriesPanel