// frontend/src/components/team/TeamChatPanel.tsx
// چت تیم — فقط اعضای فعال؛ تازه‌ترین‌اول از API + «بارگذاری قدیمی‌ترها» با before_id؛
// polling هر ۱۵ ثانیه، اسکرول خودکار به جدیدترین، علامت‌گذاری خوانده‌شده هنگام باز شدن/ارسال.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, CircularProgress, TextField, Typography } from '@mui/material'
import { Icon } from '@iconify/react'

import type { TeamMessage } from '@/types/team'
import { useMarkTeamMessagesRead, usePostTeamMessage, useTeamMessages } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { getTeamError } from './shared'

const POLL_MS = 15000

const TeamChatPanel: React.FC<{ teamId: number }> = ({ teamId }) => {
  const toast = useToast()
  const me = useAuthStore((s) => s.user)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const messagesQ = useTeamMessages(teamId, true, POLL_MS)
  const post = usePostTeamMessage(teamId)
  const markRead = useMarkTeamMessagesRead(teamId)

  const messages = useMemo<TeamMessage[]>(() => {
    const pages = messagesQ.data?.pages ?? []
    return [...pages.flatMap((p) => p.items)].reverse()
  }, [messagesQ.data])

  // ورود به تب = خواندن پیام‌ها
  useEffect(() => {
    markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  // هر بار پیام تازه‌ای رسید (polling) هم خوانده‌شده علامت می‌خورد
  useEffect(() => {
    if (messages.length > 0) markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  // اسکرول به جدیدترین پیام در بازشدن/ارسال
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const send = () => {
    const content = draft.trim()
    if (!content || post.isPending) return
    post.mutate(content, {
      onSuccess: () => {
        setDraft('')
        markRead.mutate()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(15,23,42,0.06)',
        bgcolor: 'rgba(248,250,252,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ height: { xs: 380, md: 460 }, overflowY: 'auto', p: { xs: 1.25, md: 1.75 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messagesQ.isPending ? (
          <Box sx={{ m: 'auto', textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 1 }}>در حال دریافت پیام‌ها...</Typography>
          </Box>
        ) : messagesQ.isError ? (
          <Box sx={{ m: 'auto', textAlign: 'center', maxWidth: 320 }}>
            <Icon icon="mdi:message-alert-outline" style={{ width: 30, height: 30, color: '#dc2626' }} />
            <Typography sx={{ fontSize: '0.82rem', color: '#475569', mt: 0.75 }}>
              دریافت پیام‌ها ممکن نشد (فقط اعضای فعال تیم دسترسی دارند).
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button size="sm" variant="outline" onClick={() => messagesQ.refetch()}>تلاش دوباره</Button>
            </Box>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ m: 'auto', textAlign: 'center', maxWidth: 320 }}>
            <Icon icon="mdi:message-text-outline" style={{ width: 32, height: 32, color: '#64748b' }} />
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.75, fontWeight: 700 }}>هنوز پیامی در چت تیم نیست</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>اولین پیام را بنویسید و هم‌تیمی‌ها را هماهنگ کنید.</Typography>
          </Box>
        ) : (
          <>
            {messagesQ.hasNextPage && (
              <Box sx={{ textAlign: 'center', pb: 0.5 }}>
                <Button size="sm" variant="outline" loading={messagesQ.isFetchingNextPage} onClick={() => messagesQ.fetchNextPage()}>
                  بارگذاری پیام‌های قدیمی‌تر
                </Button>
              </Box>
            )}
            {messages.map((m) => {
              const mine = me?.id === m.user_id
              return (
                <Box key={m.id} sx={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: { xs: '88%', md: '72%' } }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: '14px',
                      bgcolor: mine ? 'rgba(37,99,235,0.10)' : 'rgba(255,255,255,0.95)',
                      border: '1px solid',
                      borderColor: mine ? 'rgba(37,99,235,0.2)' : 'rgba(15,23,42,0.06)',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: mine ? '#2563eb' : '#7c3aed', mb: 0.25 }}>
                      {mine ? 'شما' : (m.full_name ?? `کاربر ${toPersianDigits(m.user_id)}`)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.85 }}>
                      {m.content}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mt: 0.4, textAlign: mine ? 'left' : 'right' }}>
                      {formatJalaliDateTime(m.created_at, { format: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: { xs: 1.25, md: 1.5 }, borderTop: '1px solid rgba(15,23,42,0.06)', bgcolor: '#fff' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder="پیام خود را بنویسید..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        <Button
          variant="gradient"
          icon="mdi:send"
          loading={post.isPending}
          disabled={!draft.trim()}
          onClick={send}
        >
          ارسال
        </Button>
      </Box>
    </Box>
  )
}

export default TeamChatPanel