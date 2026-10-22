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
      <Badge variant={config.variant} className="gap-1.5">
        <Icon icon={config.icon} className="h-3.5 w-3.5" />
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
    return <Icon icon={config.icon} className={cn('h-5 w-5', config.color)} />
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon icon="mdi:receipt-text-outline" className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">تراکنشی یافت نشد</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3">
        <CardTitle className="text-sm font-semibold">تراکنش‌های اخیر</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1.5 h-7 px-2 text-[10px]">
            مشاهده همه
            <Icon icon="mdi:chevron-left" className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-xs">نوع</TableHead>
                <TableHead className="text-xs">مبلغ</TableHead>
                <TableHead className="hidden md:table-cell text-xs">توضیحات</TableHead>
                <TableHead className="hidden sm:table-cell text-xs">تاریخ</TableHead>
                <TableHead className="text-xs">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((txn) => (
                <TableRow key={txn.id} className="group hover:bg-muted/30">
                  <TableCell>{getTypeIcon(txn.type)}</TableCell>
                  <TableCell className="font-medium capitalize text-xs">{txn.type}</TableCell>
                  <TableCell className="font-bold text-xs">{formatToman(txn.amount)}</TableCell>
                  <TableCell className="hidden max-w-[150px] truncate text-[11px] text-muted-foreground md:table-cell">
                    {txn.description}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-[11px] text-muted-foreground sm:table-cell">
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
