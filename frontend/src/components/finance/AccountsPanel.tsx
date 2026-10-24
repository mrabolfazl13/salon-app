// frontend/src/components/finance/AccountsPanel.tsx
// «حساب‌ها» — لیست بدهکاران/اعتبارها با فیلتر نوع و صفحه‌بندی سمت سرور
// + صورت‌حساب/ثبت پرداخت از طریق StatementDialog.

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useAccounts, type FinanceVenue } from '@/hooks/useFinance'
import { useAuthStore } from '@/store/authStore'
import {
  ErrorBox,
  LoadingBox,
  Pager,
  SectionCard,
  StatusChip,
  extractError,
  formatRial,
} from './shared'
import StatementDialog from './StatementDialog'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import type { AccountKind } from '@/services/finance'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const PAGE_SIZE = 25

const KIND_FILTERS: { value: AccountKind; label: string; icon: string }[] = [
  { value: 'debtors', label: 'بدهکاران', icon: 'mdi:account-arrow-down' },
  { value: 'creditors', label: 'اعتبارها', icon: 'mdi:account-arrow-up' },
  { value: 'all', label: 'همه', icon: 'mdi:accounts-outline' },
]

const AccountsPanel: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')
  const [kind, setKind] = useState<AccountKind>('debtors')
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [statementUser, setStatementUser] = useState<{ id: number; name: string | null } | null>(null)

  const venueSelectId = useId()

  const params = useMemo(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      kind,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [venueSel, kind, page],
  )

  const { data, isPending, isError, error, refetch } = useAccounts(params)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <SectionCard title="حساب‌های اشخاص" icon="mdi:account-group-outline" color="#0891b2">
        <div className="mb-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-12 sm:col-span-5">
            <div className="flex flex-wrap gap-1.5">
              {KIND_FILTERS.map((f) => {
                const active = kind === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setKind(f.value)
                      setPage(1)
                    }}
                    className={
                      active
                        ? 'inline-flex min-h-11 items-center gap-1.5 rounded-md bg-blue-600 px-2 text-[0.68rem] font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        : 'inline-flex min-h-11 items-center gap-1.5 rounded-md bg-muted px-2 text-[0.68rem] font-bold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    }
                  >
                    <Icon icon={f.icon} className="h-3.5 w-3.5" aria-hidden="true" />
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="col-span-12 flex flex-col gap-1 sm:col-span-4">
            <Label htmlFor={venueSelectId} className="text-[0.68rem]">سالن</Label>
            <Select
              value={venueSel === 'all' ? 'all' : String(venueSel)}
              onValueChange={(v) => {
                setVenueSel(v === 'all' ? 'all' : Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger id={venueSelectId} className="min-h-11 text-[0.68rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سالن‌ها</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 sm:col-span-3">
            <p className="text-[0.65rem] text-muted-foreground">
              {data ? `مجموع: ${toPersianDigits(total)} شخص` : ''}
            </p>
          </div>
        </div>

        {isPending && items.length === 0 ? (
          <LoadingBox text="در حال دریافت حساب‌ها..." />
        ) : isError ? (
          <ErrorBox message={extractError(error, 'خطا در دریافت حساب‌ها')} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <div className="py-4 text-center">
            <Icon icon="mdi:shield-check-outline" className="mx-auto h-7 w-7" style={{ color: '#10b981' }} aria-hidden="true" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              شخصی در این دسته موجودی ندارد
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="حساب‌های کاربران، قابل پیمایش با کیبورد"
            tabIndex={0}
            className="max-h-[480px] overflow-auto rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:overflow-visible"
          >
            <Table aria-label="حساب‌های کاربران">
              <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="text-[0.65rem] font-bold">شخص</TableHead>
                  <TableHead scope="col" className="text-[0.65rem] font-bold">نوع</TableHead>
                  <TableHead scope="col" className="text-[0.65rem] font-bold">موجودی</TableHead>
                  <TableHead scope="col" className="text-[0.65rem] font-bold">آخرین فعالیت</TableHead>
                  <TableHead scope="col" className="text-end text-[0.65rem] font-bold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((acc) => {
                  const debtor = acc.balance > 0
                  return (
                    <TableRow
                      key={acc.user_id}
                      tabIndex={0}
                      onClick={() => setStatementUser({ id: acc.user_id, name: acc.full_name })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setStatementUser({ id: acc.user_id, name: acc.full_name })
                        }
                      }}
                      className="cursor-pointer hover:bg-blue-600/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              debtor
                                ? 'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-red-500/10'
                                : 'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-emerald-500/10'
                            }
                          >
                            <Icon
                              icon={debtor ? 'mdi:account-minus-outline' : 'mdi:account-check-outline'}
                              className="h-4 w-4"
                              style={{ color: debtor ? '#ef4444' : '#10b981' }}
                              aria-hidden="true"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.75rem] font-bold text-foreground">
                              {acc.full_name || 'بدون نام'}
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">
                              کاربر #{toPersianDigits(acc.user_id)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          label={debtor ? 'بدهکار' : 'اعتباری'}
                          color={debtor ? '#dc2626' : '#059669'}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          dir="rtl"
                          className={
                            debtor
                              ? 'whitespace-nowrap text-[0.75rem] font-extrabold text-red-600 tabular-nums dark:text-red-400'
                              : 'whitespace-nowrap text-[0.75rem] font-extrabold text-emerald-700 tabular-nums dark:text-emerald-400'
                          }
                        >
                          {formatRial(acc.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-[0.65rem] text-muted-foreground tabular-nums">
                          {acc.last_activity ? formatJalaliDateTime(acc.last_activity, { format: 'numeric' }) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setStatementUser({ id: acc.user_id, name: acc.full_name })
                          }}
                          className="border-blue-600/25 text-[0.68rem] font-semibold text-blue-700 hover:text-blue-700 dark:text-blue-400 h-11 px-2"
                        >
                          <Icon icon="mdi:file-document-outline" className="h-3 w-3" aria-hidden="true" />
                          صورت‌حساب
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="mt-3 flex justify-center">
            <Pager count={totalPages} page={page} onChange={setPage} />
          </div>
        )}
      </SectionCard>

      <StatementDialog
        open={statementUser !== null}
        onClose={() => setStatementUser(null)}
        userId={statementUser?.id ?? null}
        userName={statementUser?.name}
        venues={venues}
        venueRequired={!isSuper}
      />
    </div>
  )
}

export default AccountsPanel
