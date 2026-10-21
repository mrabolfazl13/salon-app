// src/pages/manager/teams/ManagerTeams.tsx
// «تیم‌های همکار» — دید شریک مدیر سالن (GET /teams/manager/partners): تیم‌هایی که اعضا/رزرو
// منتسب‌شان در سالن(های) مدیر رزرو داشته‌اند. جدول فقط‌خواندنی با انتخاب سالن و ستون‌های مرتب‌شدنی.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { EmptyState, Shimmer } from '@/components/mobile'
import { useMyVenues } from '@/hooks/useFinance'
import { useManagerTeamPartners } from '@/hooks/useTeams'
import type { TeamPartner } from '@/types/team'
import { ErrorBox, formatRial } from '@/components/finance/shared'
import { SPORT_EMOJI, SPORT_NAME_FA, TeamOfficialBadge } from '@/components/team/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
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
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'captain_name' | 'members_count' | 'total_bookings_at_my_venues' | 'upcoming_bookings_at_my_venues' | 'spent_at_my_venues' | 'last_booking_date'

const HEADERS: { key: SortKey; label: string; numeric?: boolean; hideOnMobile?: boolean }[] = [
  { key: 'name', label: 'تیم' },
  { key: 'captain_name', label: 'کاپیتان' },
  { key: 'members_count', label: 'اعضا', numeric: true, hideOnMobile: true },
  { key: 'total_bookings_at_my_venues', label: 'کل رزرو', numeric: true },
  { key: 'upcoming_bookings_at_my_venues', label: 'پیش‌رو', numeric: true },
  { key: 'spent_at_my_venues', label: 'مجموع مصرف (ریال)', numeric: true },
  { key: 'last_booking_date', label: 'آخرین رزرو', hideOnMobile: true },
]

const ManagerTeams: React.FC = () => {
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('spent_at_my_venues')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  const venuesQ = useMyVenues()
  const partnersQ = useManagerTeamPartners(venueSel === 'all' ? undefined : venueSel)

  const items = useMemo(() => {
    const list = partnersQ.data?.items ?? []
    return [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir
      return String(av).localeCompare(String(bv), 'fa') * sortDir
    })
  }, [partnersQ.data, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(key)
      setSortDir(-1)
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
            <Icon icon="mdi:handshake-outline" aria-hidden="true" className="h-[30px] w-[30px] text-blue-600 dark:text-blue-400" />
            تیم‌های همکار
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تیم‌هایی که اعضا یا رزروهای منتسب‌شان در سالن(های) شما رزرو داشته‌اند — فقط‌خواندنی.
          </p>
        </div>
        <Select
          value={String(venueSel)}
          onValueChange={(v) => setVenueSel(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger aria-label="سالن" className="min-w-[200px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سالن‌های من</SelectItem>
            {(venuesQ.data ?? []).map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {partnersQ.isPending ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" className="h-16 rounded-xl" />)}
        </div>
      ) : partnersQ.isError ? (
        <ErrorBox message="دریافت تیم‌های همکار ممکن نشد (دسترسی فقط برای مدیران سالن)." onRetry={() => partnersQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="mdi:handshake-outline" title="تیم همکاری ثبت نشده" description="وقتی اعضای یک تیم در سالن(های) شما رزرو کنند، اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table aria-label="لیست تیم‌های همکار" className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                {HEADERS.map((h) => (
                  <TableHead
                    scope="col"
                    key={h.key}
                    aria-sort={sortKey === h.key ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                    className={cn(
                      'whitespace-nowrap text-[0.75rem] font-extrabold',
                      sortKey === h.key ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
                      h.numeric && 'text-end',
                      h.hideOnMobile && 'hidden md:table-cell'
                    )}
                  >
                    {/* مرتب‌سازی روی <th> کلیک‌پذیر کیبورد را نمی‌خواند: دکمهٔ واقعی داخل سرستون */}
                    <button
                      type="button"
                      onClick={() => toggleSort(h.key)}
                      className={cn(
                        'inline-flex min-h-11 min-w-11 items-center gap-2 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                        h.numeric ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {h.label}
                      {sortKey === h.key && (
                        <Icon
                          icon={sortDir === -1 ? 'mdi:sort-descending' : 'mdi:sort-ascending'}
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p: TeamPartner) => (
                <TableRow key={p.team_id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span role="img" aria-label={SPORT_NAME_FA[p.sport] ?? p.sport} className="text-[1.1rem] leading-none">{SPORT_EMOJI[p.sport] ?? '🏅'}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.85rem] font-extrabold text-foreground">{p.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="inline-flex h-[18px] items-center rounded-full bg-foreground/5 px-1.5 text-[0.6rem] text-muted-foreground">تیم #{toPersianDigits(p.team_id)}</span>
                          {p.is_official ? (
                            <TeamOfficialBadge size="small" />
                          ) : (
                            <span className="text-[0.6rem] font-bold text-muted-foreground">
                              {p.quota > 0 ? `${toPersianDigits(p.member_count)} از ${toPersianDigits(p.quota)} عضو` : `${toPersianDigits(p.member_count)} عضو`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-[0.8rem] font-bold text-foreground">{p.captain_name ?? '—'}</p>
                    {p.captain_phone && (
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">{p.captain_phone}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-end md:table-cell">
                    <p className="font-extrabold tabular-nums text-foreground">{toPersianDigits(p.members_count)}</p>
                  </TableCell>
                  <TableCell className="text-end">
                    <p className="font-extrabold tabular-nums text-foreground">{toPersianDigits(p.total_bookings_at_my_venues)}</p>
                  </TableCell>
                  <TableCell className="text-end">
                    <p className={cn('font-bold tabular-nums', p.upcoming_bookings_at_my_venues ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                      {toPersianDigits(p.upcoming_bookings_at_my_venues)}
                    </p>
                  </TableCell>
                  <TableCell className="text-end">
                    <p className="font-extrabold tabular-nums text-foreground" dir="rtl">
                      {formatRial(p.spent_at_my_venues)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="truncate text-[0.78rem] text-muted-foreground">
                      {p.last_booking_date ? formatJalaliDate(p.last_booking_date, { format: 'numeric' }) : '—'}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Layout>
  )
}

export default ManagerTeams
