// frontend/src/components/contract/ContractSessionsTable.tsx
// جدول سانس‌های قرارداد — چیپ وضعیت (SCHEDULED/COMPLETED/EXCLUDED/RESCHEDULED)،
// نمایش تاریخ/ساعت اصلی + جدید در صورت جابه‌جایی؛ گیت‌های کلاینتی قواعد بک‌اند:
// - کاربر: «درخواست حذف سانس» فقط برای سانس آینده با وضعیت scheduled/rescheduled
// - مدیر: «جابه‌جایی» و «استثنا/لغو» فقط برای سانس آینده‌ی قابل‌تغییر

import React from 'react'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import {
  effectiveSession,
  isSessionFuture,
  isSessionMutable,
  SessionStatusChip,
  StatusChip,
} from '@/components/contract/shared'
import type { ContractSessionData } from '@/services/contract'

interface ContractSessionsTableProps {
  sessions: ContractSessionData[]
  /** پنل کاربر: دکمه درخواست حذف سانس */
  mode: 'user' | 'manager'
  busySessionId?: number | null
  onRequestCancel?: (session: ContractSessionData) => void
  onExclude?: (session: ContractSessionData) => void
  onReschedule?: (session: ContractSessionData) => void
}

const cellHead = { fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap' as const }
const cellBody = { fontSize: '0.82rem' }

const ContractSessionsTable: React.FC<ContractSessionsTableProps> = ({
  sessions,
  mode,
  busySessionId = null,
  onRequestCancel,
  onExclude,
  onReschedule,
}) => {
  if (sessions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        هنوز سانسی برای این قرارداد ثبت نشده است.
      </Typography>
    )
  }

  const sorted = [...sessions].sort((a, b) =>
    effectiveSession(a).date < effectiveSession(b).date ? -1 : 1)

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 620 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={cellHead}>تاریخ سانس</TableCell>
            <TableCell sx={cellHead}>ساعت</TableCell>
            <TableCell sx={cellHead}>مدت</TableCell>
            <TableCell sx={cellHead}>وضعیت</TableCell>
            <TableCell sx={cellHead}>یادداشت</TableCell>
            {mode === 'manager' && <TableCell align="left" sx={cellHead}>عملکرد</TableCell>}
            {mode === 'user' && <TableCell align="left" sx={cellHead}>درخواست</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((cs) => {
            const eff = effectiveSession(cs)
            const moved = !!cs.rescheduled_date
            const mutable = isSessionMutable(cs)
            const future = isSessionFuture(cs)
            return (
              <TableRow key={cs.id} sx={{ opacity: cs.status === 'excluded' ? 0.55 : 1 }}>
                <TableCell sx={{ ...cellBody, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {formatJalaliDate(cs.session_date)}
                      {moved && <Typography component="span" variant="caption" color="text.disabled"> (اصلی)</Typography>}
                    </Typography>
                    {moved && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon icon="mdi:arrow-conditional-right" className="h-3.5 w-3.5" style={{ color: '#d97706' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706' }}>
                          جدید: {formatJalaliDate(eff.date)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ ...cellBody, whiteSpace: 'nowrap' }} dir="ltr">
                  {moved ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                        {cs.start_time?.slice(0, 5)}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#d97706', fontSize: '0.82rem' }}>
                        {(cs.rescheduled_time || '').slice(0, 5)}
                      </Typography>
                    </Box>
                  ) : (
                    toPersianDigits((cs.start_time || '').slice(0, 5))
                  )}
                </TableCell>
                <TableCell sx={{ ...cellBody, whiteSpace: 'nowrap' }}>
                  {toPersianDigits(cs.duration)} دقیقه
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                    <SessionStatusChip status={cs.status} />
                    {future && !mutable && cs.status !== 'completed' && <StatusChip label="گذشته" color="#64748b" />}
                  </Box>
                </TableCell>
                <TableCell sx={{ ...cellBody, maxWidth: 220 }}>
                  {cs.exclusion_reason ? (
                    <Tooltip title={cs.exclusion_reason}>
                      <Typography variant="caption" color="error.main">استثنا: {cs.exclusion_reason}</Typography>
                    </Tooltip>
                  ) : cs.cancel_requested ? (
                    <StatusChip label="درخواست لغو ثبت شده" color="#d97706" />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                  {mode === 'manager' && (
                    <>
                      {mutable && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={busySessionId === cs.id}
                            onClick={() => onReschedule?.(cs)}
                            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            جابه‌جایی
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            disabled={busySessionId === cs.id}
                            onClick={() => onExclude?.(cs)}
                            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', mr: 0.5 }}
                          >
                            استثنا/لغو
                          </Button>
                        </>
                      )}
                      {!mutable && <Typography variant="caption" color="text.disabled">—</Typography>}
                    </>
                  )}
                  {mode === 'user' && (
                    <>
                      {mutable && !cs.cancel_requested && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          disabled={busySessionId === cs.id}
                          onClick={() => onRequestCancel?.(cs)}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          درخواست حذف سانس
                        </Button>
                      )}
                      {(!mutable || cs.cancel_requested) && (
                        <Typography variant="caption" color="text.disabled">
                          {cs.cancel_requested ? 'در انتظار اقدام مدیر' : '—'}
                        </Typography>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ContractSessionsTable