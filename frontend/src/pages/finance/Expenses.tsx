// src/pages/finance/Expenses.tsx
// مرکز هزینه: جمع و میانگین، تفکیک دسته‌بندی، فهرست هزینه‌های بازه و
// مدیریت دسته‌ها — همه از دفتر کل واقعی (بدون دادهٔ ساختگی).

import React, { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import Dialog from '@/components/ui/Dialog'
import ExpenseCategoriesPanel from '@/components/finance/ExpenseCategoriesPanel'
import TransactionEntryDialog from '@/components/finance/TransactionEntryDialog'
import {
  EmptyBox,
  ErrorBox,
  LoadingBox,
  Pager,
  SectionCard,
  ShareBar,
  StatusChip,
  TX_METHOD_LABELS,
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
  extractError,
  faNum,
  formatPct,
  formatRial,
  formatRialCompact,
  labelOf,
} from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useScopeLedger } from '@/hooks/useFinance'
import FinanceHeader from './FinanceHeader'
import FinanceScopeBar, { useFinanceScope } from './FinanceScopeBar'
import { expenseBreakdown, isLive } from './analytics'
import type { FinanceOutletContext } from './context'

const PAGE_SIZE = 20
const EXPENSE_COLOR = '#b45309'

const Expenses: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const scopeState = useFinanceScope()
  const { scope } = scopeState
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [page, setPage] = useState(1)

  const ledger = useScopeLedger({ ...scope, direction: 'expense' })
  const items = ledger.data?.items ?? []
  const live = useMemo(() => items.filter(isLive), [items])
  const breakdown = useMemo(() => expenseBreakdown(items), [items])
  const total = live.reduce((s, t) => s + t.amount, 0)
  const average = live.length > 0 ? Math.round(total / live.length) : 0

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="هزینه‌ها"
        subtitle="کنترل هزینه‌ها، دسته‌بندی و بزرگ‌ترین سرفصل‌ها"
        backTo="/finance"
        backLabel="بازگشت به امور مالی"
        actions={
          <div className="flex items-center gap-1.5 print:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCategoriesOpen(true)}
              className="min-h-11 gap-1.5 px-2.5 text-[0.72rem]"
            >
              <Icon icon="mdi:tag-multiple-outline" className="h-3.5 w-3.5" aria-hidden="true" />
              دسته‌ها
            </Button>
            <Button size="sm" onClick={() => setEntryOpen(true)} className="min-h-11 gap-1.5 px-2.5 text-[0.72rem]">
              <Icon icon="mdi:plus" className="h-3.5 w-3.5" aria-hidden="true" />
              ثبت هزینه
            </Button>
          </div>
        }
      />

      <main className="mx-auto max-w-5xl space-y-3 px-3 py-3 sm:px-6 sm:py-4">
        <div className="print:hidden">
          <FinanceScopeBar
            venues={venues}
            venueSel={scopeState.venueSel}
            onVenueChange={scopeState.setVenueSel}
            from={scopeState.from}
            to={scopeState.to}
            onFromChange={scopeState.setFrom}
            onToChange={scopeState.setTo}
          />
        </div>

        {ledger.isError ? (
          <SectionCard title="خطا" icon="mdi:alert-circle-outline" color="#b91c1c">
            <ErrorBox
              message={extractError(ledger.error, 'خطا در دریافت هزینه‌ها')}
              onRetry={() => ledger.refetch()}
            />
          </SectionCard>
        ) : ledger.isPending ? (
          <SectionCard title="هزینه‌ها" icon="mdi:receipt-text-outline" color={EXPENSE_COLOR}>
            <LoadingBox text="در حال دریافت هزینه‌ها..." />
          </SectionCard>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">جمع هزینه</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-amber-700 dark:text-amber-500">
                    {formatRialCompact(total)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">تعداد ردیف</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-foreground">{faNum(live.length)}</p>
                </div>
                <div className="border-t border-border pt-2 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">میانگین هر هزینه</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-foreground">
                    {formatRialCompact(average)}
                  </p>
                </div>
                <div className="border-t border-border pt-2 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">بزرگ‌ترین سرفصل</p>
                  <p className="mt-1 truncate text-[0.85rem] font-extrabold text-foreground">
                    {breakdown[0]?.label ?? '—'}
                  </p>
                  {breakdown[0] && (
                    <p className="text-[0.62rem] text-muted-foreground">
                      {formatPct(breakdown[0].share)} از کل
                    </p>
                  )}
                </div>
              </div>
            </section>

            <SectionCard title="تفکیک دسته‌بندی" icon="mdi:shape-outline" color={EXPENSE_COLOR}>
              {breakdown.length === 0 ? (
                <EmptyBox icon="mdi:receipt-text-remove" title="هزینه‌ای در این بازه ثبت نشده" text="با «ثبت هزینه» اولین ردیف را اضافه کنید." />
              ) : (
                <ul className="space-y-2.5">
                  {breakdown.map((row) => (
                    <li key={row.key}>
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-[0.75rem] font-semibold text-foreground">{row.label}</span>
                        <span className="shrink-0 text-[0.72rem] font-bold tabular-nums text-foreground">
                          {formatRial(row.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShareBar pct={row.share} color={EXPENSE_COLOR} />
                        <span className="w-12 shrink-0 text-end text-[0.62rem] tabular-nums text-muted-foreground">
                          {formatPct(row.share)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{faNum(row.count)} ردیف</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="فهرست هزینه‌ها" icon="mdi:format-list-bulleted" color="#2563eb">
              {items.length === 0 ? (
                <EmptyBox icon="mdi:receipt-text-outline" title="هنوز هزینه‌ای ثبت نشده" />
              ) : (
                <>
                  <ul className="-mx-1">
                    {pageItems.map((tx) => {
                      const voided = tx.status === 'voided'
                      return (
                        <li key={tx.id} className="flex items-start gap-2 rounded-lg px-1 py-2 hover:bg-muted/40">
                          <span
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"
                            aria-hidden="true"
                          >
                            <Icon icon="mdi:cash-minus" className="h-4 w-4" style={{ color: EXPENSE_COLOR }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={voided ? 'truncate text-[0.75rem] font-semibold text-muted-foreground line-through' : 'truncate text-[0.75rem] font-semibold text-foreground'}>
                              {toPersianDigits(tx.expense_category_name || 'بدون دسته‌بندی')}
                              {tx.description ? ` — ${toPersianDigits(tx.description)}` : ''}
                            </p>
                            <p className="truncate text-[0.62rem] text-muted-foreground">
                              {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })} • {labelOf(TX_METHOD_LABELS, tx.method)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <p className="whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-foreground">
                              {formatRial(tx.amount, false)}
                            </p>
                            {tx.status !== 'cleared' && (
                              <StatusChip
                                label={labelOf(TX_STATUS_LABELS, tx.status)}
                                color={TX_STATUS_COLORS[tx.status] ?? '#6b7280'}
                              />
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <Pager count={totalPages} page={current} onChange={setPage} className="mt-3" />
                </>
              )}
              {ledger.data?.truncated && (
                <p className="mt-3 text-[0.68rem] text-amber-700 dark:text-amber-500">
                  این بازه بیش از {faNum(items.length)} ردیف هزینه دارد؛ تجمیع روی همان تعداد انجام شده است.
                </p>
              )}
            </SectionCard>
          </>
        )}
      </main>

      <Dialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="مدیریت دسته‌بندی هزینه‌ها"
        maxWidth="md"
      >
        <ExpenseCategoriesPanel venues={venues} embedded />
      </Dialog>

      <TransactionEntryDialog
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        venues={venues}
        initialMode="expense"
      />
    </div>
  )
}

export default Expenses
