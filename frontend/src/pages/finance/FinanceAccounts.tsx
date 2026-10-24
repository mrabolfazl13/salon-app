// src/pages/finance/FinanceAccounts.tsx
// «حساب‌ها» — صفحهٔ مستقل بدهکاران/اعتبارها با صورت‌حساب و ثبت پرداخت.

import React from 'react'
import { useOutletContext } from 'react-router-dom'
import AccountsPanel from '@/components/finance/AccountsPanel'
import FinanceHeader from './FinanceHeader'
import type { FinanceOutletContext } from './context'

const FinanceAccounts: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="حساب‌ها"
        subtitle="بدهکاران، اعتبارها و صورت‌حساب اشخاص"
        backTo="/finance"
        backLabel="بازگشت به امور مالی"
      />

      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        <AccountsPanel venues={venues} />
      </main>
    </div>
  )
}

export default FinanceAccounts
