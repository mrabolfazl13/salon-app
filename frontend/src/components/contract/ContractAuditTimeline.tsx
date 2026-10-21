// frontend/src/components/contract/ContractAuditTimeline.tsx
// روند ممیزی قرارداد — RTL، جدیدترین در بالا؛ جمع‌شونده با خلاصه‌ی diff داده‌ها.

import React, { useId, useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/shadcn/button'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

const ContractAuditTimeline: React.FC<{ contractId: number }> = ({ contractId }) => {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const query = useContractAudit(expanded ? contractId : null)

  const events = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [query.data],
  )

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="gap-2 text-xs font-bold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
      >
        <Icon icon="mdi:file-document-edit-outline" className="h-4 w-4" style={{ color: '#7c3aed' }} aria-hidden="true" />
        {`روند تغییرات (ممیزی)${query.data ? ` — ${faNum(query.data.length)} رویداد` : ''}`}
        <Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="h-4 w-4" aria-hidden="true" />
      </Button>

      {expanded && (
        <div id={panelId} className="pt-3">
          {query.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} aria-hidden="true" className="h-16 rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <ErrorBox message="روند ممیزی بارگذاری نشد." onRetry={() => query.refetch()} />
          ) : events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              رویدادی ثبت نشده است.
            </p>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-1.5 start-[17px] w-[2px] bg-border" aria-hidden="true" />
              <div className="flex flex-col gap-3">
                {events.map((ev) => {
                  const rows = summarizeAuditData(ev.data)
                  return (
                    <div key={ev.id} className="relative flex gap-3">
                      <div className="z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 border-card bg-violet-500/10">
                        <Icon icon={auditActionIcon(ev.action)} className="h-4 w-4" style={{ color: '#7c3aed' }} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.04]">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-foreground">
                            {AUDIT_ACTION_LABELS[ev.action] || ev.action}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatJalaliDateTime(ev.created_at)}
                          </span>
                          {ev.actor_id != null && (
                            <span className="text-xs text-muted-foreground">
                              {`عامل: کاربر #${faNum(ev.actor_id)}`}
                            </span>
                          )}
                        </div>
                        {rows.length > 0 && (
                          <div>
                            {rows.map((r, i) => (
                              <div key={i} className="flex gap-2 py-[0.1rem]">
                                <span className="min-w-24 text-xs text-muted-foreground">
                                  {`${r.key}:`}
                                </span>
                                <span className="text-xs font-semibold text-foreground">{r.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContractAuditTimeline
