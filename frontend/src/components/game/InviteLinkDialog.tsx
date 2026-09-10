// frontend/src/components/game/InviteLinkDialog.tsx
// مدیریت لینک دعوت بازی — ساخت، کپی، غیرفعال‌سازی و بازتولید توکن

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Box, Typography, TextField, MenuItem, IconButton, Tooltip } from '@mui/material'

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

const InviteLinkDialog: React.FC<Props> = ({ gameId, open, onClose }) => {
  const toast = useToast()
  const { data: links = [], isLoading } = useInviteLinks(gameId, open)
  const createLink = useCreateInviteLink(gameId)
  const disableLink = useDisableInviteLink(gameId)
  const regenerateLink = useRegenerateInviteLink(gameId)

  const [expiresInDays, setExpiresInDays] = useState<number | ''>(7)
  const [maxUses, setMaxUses] = useState<number | ''>('')

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        {/* ساخت لینک جدید */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            select
            label="اعتبار"
            size="small"
            value={expiresInDays === '' ? 7 : expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            sx={{ minWidth: 120 }}
          >
            {EXPIRY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="حداکثر استفاده (اختیاری)"
            size="small"
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
            sx={{ minWidth: 170 }}
          />
          <Button
            variant="gradient"
            onClick={handleCreate}
            loading={createLink.isPending}
            icon="mdi:link-variant-plus"
          >
            ساخت لینک
          </Button>
        </Box>

        {/* لیست لینک‌های فعال */}
        {isLoading ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>در حال بارگذاری...</Typography>
        ) : links.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            هنوز لینک دعوتی ساخته نشده است.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {links.map((link) => (
              <Box
                key={link.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: '14px',
                  border: '1px solid rgba(15,23,42,0.07)',
                  bgcolor: 'rgba(15,23,42,0.015)',
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    dir="ltr"
                    sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {fullUrl(link)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.25 }}>
                    {`انقضا: ${link.expires_at ? formatPersianDateTime(link.expires_at) : 'بدون انقضا'} - استفاده: ${link.uses_count.toLocaleString('fa-IR')}${link.max_uses ? `/${link.max_uses.toLocaleString('fa-IR')}` : ''}`}
                  </Typography>
                </Box>
                <Tooltip title="کپی لینک">
                  <IconButton size="small" onClick={() => copy(link)} sx={{ color: '#2563eb' }}>
                    <Icon icon="mdi:content-copy" style={{ width: 17, height: 17 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="بازتولید توکن (لینک قبلی از کار می‌افتد)">
                  <IconButton
                    size="small"
                    disabled={regenerateLink.isPending}
                    onClick={() =>
                      regenerateLink.mutate(link.id, {
                        onSuccess: () => toast.success('توکن جدید ساخته شد'),
                        onError: (err) => toast.error(getGameError(err)),
                      })
                    }
                    sx={{ color: '#7c3aed' }}
                  >
                    <Icon icon="mdi:sync" style={{ width: 17, height: 17 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="غیرفعال کردن">
                  <IconButton
                    size="small"
                    disabled={disableLink.isPending}
                    onClick={() =>
                      disableLink.mutate(link.id, {
                        onSuccess: () => toast.success('لینک غیرفعال شد'),
                        onError: (err) => toast.error(getGameError(err)),
                      })
                    }
                    sx={{ color: '#dc2626' }}
                  >
                    <Icon icon="mdi:link-off" style={{ width: 17, height: 17 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Dialog>
  )
}

export default InviteLinkDialog
