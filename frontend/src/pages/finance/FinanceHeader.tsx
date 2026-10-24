// src/pages/finance/FinanceHeader.tsx
// سربرگ مشترک صفحات مالی — عنوان، زیرعنوان و بازگشت به سطح بالاتر.
// صفحات مالی عمداً بدون نوار تب‌اند؛ پیمایش با کارت‌های هاب و همین بازگشت انجام می‌شود.

import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

interface Props {
  title: string
  subtitle?: string
  backTo: string
  backLabel?: string
  actions?: React.ReactNode
}

const FinanceHeader: React.FC<Props> = ({ title, subtitle, backTo, backLabel = 'بازگشت', actions }) => (
  <header className="border-b bg-card/60 backdrop-blur">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={backTo}
          aria-label={backLabel}
          title={backLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon icon="mdi:arrow-right" className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">{title}</h1>
          {subtitle && (
            <p className="truncate text-[0.7rem] text-muted-foreground sm:text-xs">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  </header>
)

export default FinanceHeader
