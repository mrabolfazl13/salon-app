// frontend/src/components/game/InviteLinkDialog.tsx
// مدیریت لینک دعوت بازی — ساخت، کپی، غیرفعال‌سازی و بازتولید توکن

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

import type { InviteLink } from '@/types/game'
import {
  useCreateInviteLink,
  useDisableInviteLink,
  useInviteLinks,
  useRegenerateInviteLink,
} from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { formatPersianDateTime } from '@/utils/helpers'
import { getGameError } from './shared'

interface Props {
  gameId: number
  open: boolean
  onClose: () => void
}

const EXPIRY_OPTIONS = [
  { value: 1, label: '۱ روز' },
  { value: 3, label: '۳ روز' },
  { value: 7, label: '۷ روز' },
  { value: 30, label: '۳۰ روز' },
]

const iconButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const InviteLinkDialog: React.FC<Props> = ({ gameId, open, onClose }) => {
  const toast = useToast()
  const { data: links = [], isLoading } = useInviteLinks(gameId, open)
  const createLink = useCreateInviteLink(gameId)
  const disableLink = useDisableInviteLink(gameId)
  const regenerateLink = useRegenerateInviteLink(gameId)

  const [expiresInDays, setExpiresInDays] = useState<number | ''>(7)
  const [maxUses, setMaxUses] = useState<number | ''>('')
  const expiryFieldId = useId()
  const maxUsesFieldId = useId()

  const fullUrl = (link: InviteLink) => `${window.location.origin}${link.join_path}`

  const copy = async (link: InviteLink) => {
    try {
      await navigator.clipboard.writeText(fullUrl(link))
      toast.success('لینک دعوت کپی شد')
    } catch {
      toast.info(fullUrl(link))
    }
  }

  const handleCreate = () => {
    createLink.mutate(
      {
        expires_in_days: expiresInDays === '' ? undefined : expiresInDays,
        max_uses: maxUses === '' ? undefined : maxUses,
      },
      {
        onSuccess: (link) => {
          toast.success('لینک دعوت ساخته شد')
          copy(link)
        },
        onError: (err) => toast.error(getGameError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title="لینک دعوت به بازی" maxWidth="sm">
      <div className="flex flex-col gap-4 pt-1">
        {/* ساخت لینک جدید */}
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-[120px] flex-col gap-1.5">
            <Label id={expiryFieldId}>اعتبار</Label>
            <Select
              value={String(expiresInDays === '' ? 7 : expiresInDays)}
              onValueChange={(v) => setExpiresInDays(Number(v))}
            >
              <SelectTrigger aria-labelledby={expiryFieldId} className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-[170px] flex-col gap-1.5">
            <Label htmlFor={maxUsesFieldId}>حداکثر استفاده (اختیاری)</Label>
            <Input
              id={maxUsesFieldId}
              type="number"
              inputMode="numeric"
              min={1}
              className="h-11"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
            />
          </div>
          <Button
            variant="gradient"
            className="mt-6"
            onClick={handleCreate}
            loading={createLink.isPending}
            icon="mdi:link-variant-plus"
          >
            ساخت لینک
          </Button>
        </div>

        {/* لیست لینک‌های فعال */}
        {isLoading ? (
          <p className="text-[0.85rem] text-muted-foreground">در حال بارگذاری...</p>
        ) : links.length === 0 ? (
          <p className="text-[0.85rem] text-muted-foreground">هنوز لینک دعوتی ساخته نشده است.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 rounded-[14px] border border-border bg-slate-900/[0.015] px-3 py-2.5 dark:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p
                    dir="ltr"
                    className="truncate text-start text-[0.78rem] font-semibold text-blue-700 dark:text-blue-400"
                  >
                    {fullUrl(link)}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                    {`انقضا: ${link.expires_at ? formatPersianDateTime(link.expires_at) : 'بدون انقضا'} - استفاده: ${link.uses_count.toLocaleString('fa-IR')}${link.max_uses ? `/${link.max_uses.toLocaleString('fa-IR')}` : ''}`}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => copy(link)}
                      aria-label="کپی لینک دعوت"
                      className={cn(iconButtonClass, 'text-blue-700 hover:bg-blue-600/10 dark:text-blue-400')}
                    >
                      <Icon icon="mdi:content-copy" style={{ width: 17, height: 17 }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>کپی لینک</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={regenerateLink.isPending}
                      onClick={() =>
                        regenerateLink.mutate(link.id, {
                          onSuccess: () => toast.success('توکن جدید ساخته شد'),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                      aria-label={`بازتولید توکن لینک #${link.id}`}
                      className={cn(iconButtonClass, 'text-violet-700 hover:bg-violet-600/10 dark:text-violet-400')}
                    >
                      <Icon icon="mdi:sync" style={{ width: 17, height: 17 }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>بازتولید توکن (لینک قبلی از کار می‌افتد)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={disableLink.isPending}
                      onClick={() =>
                        disableLink.mutate(link.id, {
                          onSuccess: () => toast.success('لینک غیرفعال شد'),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                      aria-label={`غیرفعال کردن لینک دعوت #${link.id}`}
                      className={cn(iconButtonClass, 'text-red-600 hover:bg-red-600/10 dark:text-red-400')}
                    >
                      <Icon icon="mdi:link-off" style={{ width: 17, height: 17 }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>غیرفعال کردن</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default InviteLinkDialog
