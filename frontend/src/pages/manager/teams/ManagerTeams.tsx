// frontend/src/pages/manager/teams/ManagerTeams.tsx
// «تیم‌های همکار» — دید شریک مدیر سالن (GET /teams/manager/partners): تیم‌هایی که اعضا/رزرو
// منتسب‌شان در سالن(های) این مدیر رزرو داشته‌اند. جدول فقط‌خواندنی با انتخاب سالن و ستون‌های مرتب‌شدنی.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box,
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, Shimmer } from '@/components/mobile'
import { useMyVenues } from '@/hooks/useFinance'
import { useManagerTeamPartners } from '@/hooks/useTeams'
import type { TeamPartner } from '@/types/team'
import { ErrorBox, formatRial } from '@/components/finance/shared'
import { SPORT_EMOJI, TeamOfficialBadge } from '@/components/team/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { radii, shadows } from '@/theme'

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:handshake-outline" style={{ width: 30, height: 30, color: '#2563eb' }} />
            تیم‌های همکار
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            تیم‌هایی که اعضا یا رزروهای منتسب‌شان در سالن(های) شما رزرو داشته‌اند — فقط‌خواندنی.
          </Typography>
        </Box>
        <TextField
          select
          label="سالن"
          size="small"
          sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          value={venueSel === 'all' ? 'all' : venueSel}
          onChange={(e) => setVenueSel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <MenuItem value="all">همه سالن‌های من</MenuItem>
          {(venuesQ.data ?? []).map((v) => (
            <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
          ))}
        </TextField>
      </Box>

      {partnersQ.isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 64, borderRadius: '12px' }} />)}
        </Box>
      ) : partnersQ.isError ? (
        <ErrorBox message="دریافت تیم‌های همکار ممکن نشد (دسترسی فقط برای مدیران سالن)." onRetry={() => partnersQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState emoji="🤝" title="تیم همکاری ثبت نشده" description="وقتی اعضای یک تیم در سالن(های) شما رزرو کنند، اینجا نمایش داده می‌شوند." />
      ) : (
        <Box
          sx={{
            borderRadius: `${radii.card}px`,
            boxShadow: shadows.card,
            border: '1px solid rgba(15,23,42,0.05)',
            bgcolor: 'rgba(255,255,255,0.92)',
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {HEADERS.map((h) => (
                  <TableCell
                    key={h.key}
                    onClick={() => toggleSort(h.key)}
                    align={h.numeric ? 'left' : 'right'}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      color: sortKey === h.key ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      display: h.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined,
                    }}
                  >
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      {h.label}
                      {sortKey === h.key && <Icon icon={sortDir === -1 ? 'mdi:sort-descending' : 'mdi:sort-ascending'} style={{ width: 14, height: 14 }} />}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p: TeamPartner) => (
                <TableRow key={p.team_id} hover>
                  <TableCell sx={{ display: { xs: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{SPORT_EMOJI[p.sport] ?? '🏅'}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }} noWrap>{p.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                          <Chip label={`تیم #${toPersianDigits(p.team_id)}`} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                          {p.is_official ? (
                            <TeamOfficialBadge size="small" />
                          ) : (
                            <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>
                              {p.quota > 0 ? `${toPersianDigits(p.member_count)} از ${toPersianDigits(p.quota)} عضو` : `${toPersianDigits(p.member_count)} عضو`}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }} noWrap>{p.captain_name ?? '—'}</Typography>
                    {p.captain_phone && (
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }} dir="ltr" noWrap>{p.captain_phone}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="left" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(p.members_count)}</Typography>
                  </TableCell>
                  <TableCell align="left">
                    <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{toPersianDigits(p.total_bookings_at_my_venues)}</Typography>
                  </TableCell>
                  <TableCell align="left">
                    <Typography sx={{ fontWeight: 700, color: p.upcoming_bookings_at_my_venues ? '#059669' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                      {toPersianDigits(p.upcoming_bookings_at_my_venues)}
                    </Typography>
                  </TableCell>
                  <TableCell align="left">
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }} dir="rtl">
                      {formatRial(p.spent_at_my_venues)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#475569' }} noWrap>
                      {p.last_booking_date ? formatJalaliDate(p.last_booking_date, { format: 'numeric' }) : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Layout>
  )
}

export default ManagerTeams
