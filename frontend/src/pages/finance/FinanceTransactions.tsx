// src/pages/finance/FinanceTransactions.tsx
// «دفتر کل» — صفحهٔ مستقل تراکنش‌ها (فیلتر، خروجی CSV، ثبت ردیف، ابطال)
// + مدیریت دسته‌بندی هزینه در یک دیالوگ، نه پنل انباشته زیر جدول.

import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import Dialog from '@/components/ui/Dialog'
import TransactionsPanel from '@/components/finance/TransactionsPanel'
import ExpenseCategoriesPanel from '@/components/finance/ExpenseCategoriesPanel'
import FinanceHeader from './FinanceHeader'
import type { FinanceOutletContext } from './context'

const FinanceTransactions: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="دفتر کل"
        subtitle="همهٔ دریافت‌ها و هزینه‌ها با فیلتر و خروجی"
        backTo="/finance"
        backLabel="بازگشت به امور مالی"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCategoriesOpen(true)}
            className="h-11 gap-1.5 px-2.5 text-[0.72rem]"
          >
            <Icon icon="mdi:tag-multiple-outline" className="h-3.5 w-3.5" aria-hidden="true" />
            دسته‌بندی هزینه‌ها
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        <TransactionsPanel venues={venues} />
      </main>

      <Dialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="مدیریت دسته‌بندی هزینه‌ها"
        maxWidth="md"
      >
        <ExpenseCategoriesPanel venues={venues} embedded />
      </Dialog>
    </div>
  )
}

export default FinanceTransactions
