// frontend/src/components/finance/ExpenseCategoriesPanel.tsx
// مدیریت دسته‌بندی هزینه — فهرست/ایجاد/غیرفعال‌سازی (حذف نرم).
// DELETE بک‌اند روی دسته‌بندیِ استفاده‌شده ۴۰۰ می‌دهد؛ پیام سرور نمایش داده می‌شود.

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
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

  const nameId = useId()
  const venueSelectId = useId()

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
        <button
          type="button"
          onClick={() => setIncludeInactive((v) => !v)}
          aria-pressed={includeInactive}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon icon={includeInactive ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} className="h-3.5 w-3.5" aria-hidden="true" />
          {includeInactive ? 'نمایش: همه' : 'نمایش: فعال‌ها'}
        </button>
      }
    >
      {/* فرم ایجاد */}
      <div className="mb-4 grid grid-cols-12 items-end gap-3">
        <div className="col-span-12 flex flex-col gap-1.5 sm:col-span-5">
          <Label htmlFor={nameId}>نام دسته‌بندی جدید</Label>
          <Input
            id={nameId}
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
        <div className="col-span-7 flex flex-col gap-1.5 sm:col-span-4">
          <Label htmlFor={venueSelectId}>سالن دسته‌بندی</Label>
          <Select
            value={venueId === '' ? '' : String(venueId)}
            onValueChange={(v) => setVenueId(v === 'global' ? '' : Number(v))}
          >
            <SelectTrigger id={venueSelectId}>
              <SelectValue placeholder={isSuper ? 'سراسری (همه سالن‌ها)' : 'انتخاب سالن'} />
            </SelectTrigger>
            <SelectContent>
              {isSuper && <SelectItem value="global">سراسری (همه سالن‌ها)</SelectItem>}
              {venues.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-5 sm:col-span-3">
          <Button
            onClick={submit}
            disabled={createCategory.isPending}
            className="w-full font-bold"
          >
            <Icon icon="mdi:plus" className="h-4 w-4" />
            {createCategory.isPending ? '...' : 'ایجاد'}
          </Button>
        </div>
      </div>

      {/* فهرست */}
      {list.isPending ? (
        <LoadingBox text="در حال دریافت دسته‌بندی‌ها..." />
      ) : list.isError ? (
        <ErrorBox message={extractError(list.error, 'خطا در دریافت دسته‌بندی‌ها')} onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            هنوز دسته‌بندی هزینه‌ای ساخته نشده است
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.data!.map((cat) => (
            <div
              key={cat.id}
              className={
                cat.is_active
                  ? 'flex items-center gap-3 rounded-xl border border-border bg-card p-3 pe-2.5'
                  : 'flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 pe-2.5 opacity-70'
              }
            >
              <span
                className={
                  cat.venue_id === null
                    ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-600/[0.08]'
                    : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-600/[0.08]'
                }
              >
                <Icon
                  icon={cat.venue_id === null ? 'mdi:earth' : 'mdi:store-outline'}
                  className="h-5 w-5"
                  style={{ color: cat.venue_id === null ? '#7c3aed' : '#2563eb' }}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{venueName(cat)}</p>
              </div>
              <StatusChip label={cat.is_active ? 'فعال' : 'غیرفعال'} color={cat.is_active ? '#059669' : '#6b7280'} />
              {cat.is_active && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeactivating(cat)}
                  disabled={deleteCategory.isPending}
                  className="text-xs font-bold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                >
                  غیرفعال‌سازی
                </Button>
              )}
            </div>
          ))}
        </div>
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
