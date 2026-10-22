// Recent Transactions Table - Modern & Clean Design
import React from 'react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card'
import { Button } from '@/components/ui/shadcn/button'
import { Badge } from '@/components/ui/shadcn/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { toPersianDigits, formatToman } from '@/utils/l10n'
import { cn } from '@/lib/utils'

interface Transaction {
  id: number
  type: string
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'cancelled'
  venue?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  onViewAll?: () => void
}

export function RecentTransactions({ transactions, onViewAll }: RecentTransactionsProps) {
  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      completed: { variant: 'default' as const, label: 'تکمیل شده', icon: 'mdi:check-circle' },
      pending: { variant: 'secondary' as const, label: 'در انتظار', icon: 'mdi:clock-outline' },
      cancelled: { variant: 'destructive' as const, label: 'لغو شده', icon: 'mdi:cancel' },
    }
    const config = variants[status]
    return (
      <Badge variant={config.variant} className="gap-1 text-[0.6rem] px-1.5 py-0">
        <Icon icon={config.icon} className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      payment: { icon: 'mdi:cash-plus', color: 'text-green-600' },
      expense: { icon: 'mdi:cash-minus', color: 'text-red-600' },
      refund: { icon: 'mdi:cash-refund', color: 'text-blue-600' },
    }
    const config = icons[type as keyof typeof icons] || icons.payment
    return <Icon icon={config.icon} className={cn('h-4 w-4', config.color)} />
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Icon icon="mdi:receipt-text-outline" className="mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-xs font-medium text-muted-foreground">تراکنشی یافت نشد</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 px-3 py-2">
        <CardTitle className="text-[0.7rem] font-semibold">تراکنش‌های اخیر</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1 h-6 px-1.5 text-[0.6rem]">
            مشاهده همه
            <Icon icon="mdi:chevron-left" className="h-2.5 w-2.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32px]"></TableHead>
                <TableHead className="text-[0.65rem]">نوع</TableHead>
                <TableHead className="text-[0.65rem]">مبلغ</TableHead>
                <TableHead className="hidden md:table-cell text-[0.65rem]">توضیحات</TableHead>
                <TableHead className="hidden sm:table-cell text-[0.65rem]">تاریخ</TableHead>
                <TableHead className="text-[0.65rem]">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((txn) => (
                <TableRow key={txn.id} className="group hover:bg-muted/30">
                  <TableCell>{getTypeIcon(txn.type)}</TableCell>
                  <TableCell className="font-medium capitalize text-[0.68rem]">{txn.type}</TableCell>
                  <TableCell className="font-bold text-[0.68rem]">{formatToman(txn.amount)}</TableCell>
                  <TableCell className="hidden max-w-[120px] truncate text-[0.6rem] text-muted-foreground md:table-cell">
                    {txn.description}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-[0.6rem] text-muted-foreground sm:table-cell">
                    {toPersianDigits(txn.date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(txn.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
