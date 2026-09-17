// frontend/src/components/contract/ContractAuditTimeline.tsx
// روند ممیزی قرارداد — RTL، جدیدترین در بالا؛ جمع‌شونده با خلاصه‌ی diff داده‌ها.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Collapse,
  Skeleton,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { formatJalaliDateTime } from '@/lib/jalali'
import { useContractAudit } from '@/hooks/useContracts'
import {
  auditActionIcon,
  AUDIT_ACTION_LABELS,
  ErrorBox,
  faNum,
  summarizeAuditData,
} from '@/components/contract/shared'

const ContractAuditTimeline: React.FC<{ contractId: number }> = ({ contractId }) => {
  const [expanded, setExpanded] = useState(false)
  const query = useContractAudit(expanded ? contractId : null)

  const events = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [query.data],
  )

  return (
    <Box>
      <Button
        size="small"
        onClick={() => setExpanded((v) => !v)}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          gap: 0.75,
          '& .MuiButton-endIcon': { mr: 0.5 },
        }}
        startIcon={<Icon icon="mdi:file-document-edit-outline" className="h-4 w-4" style={{ color: '#7c3aed' }} />}
        endIcon={<Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="h-4 w-4" />}
      >
        {`روند تغییرات (ممیزی)${query.data ? ` — ${faNum(query.data.length)} رویداد` : ''}`}
      </Button>

      <Collapse in={expanded}>
        <Box sx={{ pt: 1.5 }}>
          {query.isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: '12px' }} />)}
            </Box>
          ) : query.isError ? (
            <ErrorBox message="روند ممیزی بارگذاری نشد." onRetry={() => query.refetch()} />
          ) : events.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              رویدادی ثبت نشده است.
            </Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 6, bottom: 6, right: 17, width: '2px', bgcolor: 'divider' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {events.map((ev) => {
                  const rows = summarizeAuditData(ev.data)
                  return (
                    <Box key={ev.id} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: 'rgba(124,58,237,0.08)',
                          border: '2px solid',
                          borderColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                        }}
                      >
                        <Icon icon={auditActionIcon(ev.action)} className="h-4 w-4" style={{ color: '#7c3aed' }} />
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          bgcolor: 'rgba(0,0,0,0.02)',
                          borderRadius: '12px',
                          px: 1.5,
                          py: 1.25,
                        }}
                      >
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {AUDIT_ACTION_LABELS[ev.action] || ev.action}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatJalaliDateTime(ev.created_at)}
                          </Typography>
                          {ev.actor_id != null && (
                            <Typography variant="caption" color="text.disabled">
                              {`عامل: کاربر #${faNum(ev.actor_id)}`}
                            </Typography>
                          )}
                        </Box>
                        {rows.length > 0 && (
                          <Box>
                            {rows.map((r, i) => (
                              <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 96 }}>
                                  {`${r.key}:`}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{r.value}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ContractAuditTimeline