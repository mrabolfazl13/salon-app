// frontend/src/components/team/TeamChatPanel.tsx
// چت تیم — فقط اعضای فعال؛ تازه‌ترین‌اول از API + «بارگذاری قدیمی‌ترها» با before_id؛
// polling هر ۱۵ ثانیه، اسکرول خودکار به جدیدترین، علامت‌گذاری خوانده‌شده هنگام باز شدن/ارسال.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import type { TeamMessage } from '@/types/team'
import { useMarkTeamMessagesRead, usePostTeamMessage, useTeamMessages } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-900/[0.06] bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex h-[380px] flex-col gap-2 overflow-y-auto p-2.5 md:h-[460px] md:p-3.5">
        {messagesQ.isPending ? (
          <div className="m-auto text-center">
            <span
              className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground"
              role="status"
              aria-label="در حال بارگذاری"
            />
            <p className="mt-2 text-[0.78rem] text-muted-foreground">در حال دریافت پیام‌ها...</p>
          </div>
        ) : messagesQ.isError ? (
          <div className="m-auto max-w-[320px] text-center">
            <Icon icon="mdi:message-alert-outline" style={{ width: 30, height: 30, color: '#dc2626' }} />
            <p className="mt-1.5 text-[0.82rem] text-slate-600 dark:text-slate-300">
              دریافت پیام‌ها ممکن نشد (فقط اعضای فعال تیم دسترسی دارند).
            </p>
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => messagesQ.refetch()}>تلاش دوباره</Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto max-w-[320px] text-center">
            <Icon icon="mdi:message-text-outline" style={{ width: 32, height: 32, color: '#64748b' }} />
            <p className="mt-1.5 text-[0.85rem] font-bold text-muted-foreground">هنوز پیامی در چت تیم نیست</p>
            <p className="mt-0.5 text-[0.68rem] text-muted-foreground">اولین پیام را بنویسید و هم‌تیمی‌ها را هماهنگ کنید.</p>
          </div>
        ) : (
          <>
            {messagesQ.hasNextPage && (
              <div className="pb-1 text-center">
                <Button size="sm" variant="outline" loading={messagesQ.isFetchingNextPage} onClick={() => messagesQ.fetchNextPage()}>
                  بارگذاری پیام‌های قدیمی‌تر
                </Button>
              </div>
            )}
            {messages.map((m) => {
              const mine = me?.id === m.user_id
              return (
                <div key={m.id} className={cn('max-w-[88%] md:max-w-[72%]', mine ? 'self-end' : 'self-start')}>
                  <div
                    className={cn(
                      'rounded-[14px] border px-3 py-2',
                      mine
                        ? 'border-blue-600/20 bg-blue-600/10'
                        : 'border-slate-900/[0.06] bg-card/95 dark:border-white/10 dark:bg-white/5',
                    )}
                  >
                    <p className={cn('mb-0.5 text-[0.68rem] font-extrabold', mine ? 'text-blue-700 dark:text-blue-400' : 'text-violet-700 dark:text-violet-300')}>
                      {mine ? 'شما' : (m.full_name ?? `کاربر ${toPersianDigits(m.user_id)}`)}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-[0.85rem] leading-[1.85] text-slate-900 dark:text-slate-100">
                      {m.content}
                    </p>
                    <p className={cn('mt-1 text-[0.6rem] text-muted-foreground', mine ? 'text-end' : 'text-start')}>
                      {formatJalaliDateTime(m.created_at, { format: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-slate-900/[0.06] bg-card p-2.5 md:p-3 dark:border-white/10">
        <Textarea
          aria-label="پیام"
          rows={1}
          maxLength={2000}
          placeholder="پیام خود را بنویسید..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          className="max-h-32 min-h-11 resize-none rounded-xl"
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
      </div>
    </div>
  )
}

export default TeamChatPanel
