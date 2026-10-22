// Account Summaries with Progress Bars
import React from 'react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card'
import { Progress } from '@/components/ui/shadcn/progress'
import { toPersianDigits, formatToman } from '@/utils/l10n'

interface Account {
  id: number
  name: string
  balance: number
  limit?: number
  type: 'bank' | 'cash' | 'credit'
  icon: string
}

interface AccountSummariesProps {
  accounts: Account[]
}

export function AccountSummaries({ accounts }: AccountSummariesProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon icon="mdi:account-multiple-outline" className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">حسابی یافت نشد</p>
        </CardContent>
      </Card>
    )
  }

  const getAccountColor = (type: Account['type']) => {
    const colors = {
      bank: 'from-blue-500 to-cyan-500',
      cash: 'from-green-500 to-emerald-500',
      credit: 'from-purple-500 to-pink-500',
    }
    return colors[type]
  }

  const getProgressValue = (account: Account) => {
    if (!account.limit) return 100
    return Math.min((Math.abs(account.balance) / account.limit) * 100, 100)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id} className="overflow-hidden">
          <CardHeader className="pb-2 px-3 py-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${getAccountColor(account.type)}`}
                >
                  <Icon icon={account.icon} className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xs font-semibold">{account.name}</CardTitle>
                  <p className="text-[10px] text-muted-foreground capitalize">{account.type}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground">موجودی فعلی</p>
                <p className="text-base font-bold">{formatToman(account.balance)}</p>
              </div>
              
              {account.limit && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">استفاده شده</span>
                    <span className="font-medium">
                      {toPersianDigits(Math.round(getProgressValue(account)))}%
                    </span>
                  </div>
                  <Progress value={getProgressValue(account)} className="h-1.5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
