// frontend/src/pages/teams/TeamDiscover.tsx
// کاوش تیم‌ها — جستجوی تیم‌های عمومی (public) با فیلتر ورزش و صفحه‌بندی؛
// درخواست عضویت با پیام (تأیید توسط کاپیتان/مدیر).
// وضعیت «نسبت به من» (عضویت/دعوت باز/درخواست باز) مستقیم از آیتم discover خوانده
// می‌شود؛ سرور این پرچم‌ها را برای کاربر جاری می‌دهد.

import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer, SPORTS } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import Dialog from '@/components/ui/Dialog'
import { useRequestJoinTeam, useTeamsDiscover } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { SPORT_EMOJI, SPORT_NAME_FA, TeamQuotaProgress, TeamVisibilityChip, getTeamError } from '@/components/team/shared'
import type { Team } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

const JoinRequestDialog: React.FC<{ team: Team | null; onClose: () => void }> = ({ team, onClose }) => {
  const toast = useToast()
  const requestJoin = useRequestJoinTeam(team?.id ?? 0)
  const [message, setMessage] = useState('')

  const submit = () => {
    if (!team) return
    requestJoin.mutate(message.trim() || undefined, {
      onSuccess: ({ message: msg }) => {
        toast.success(msg)
        setMessage('')
        onClose()
      },
      onError: (err) => toast.error(getTeamError(err)),
    })
  }

  return (
    <Dialog open={!!team} onClose={onClose} title={team ? `درخواست پیوستن به «${team.name}»` : ''} maxWidth="xs">
      <div className="flex flex-col gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          این تیم عمومی است؛ درخواست شما برای کاپیتان و مدیران ارسال می‌شود و پس از تأیید، عضو تیم خواهید شد.
        </p>
        <Textarea
          aria-label="پیام همراه درخواست (اختیاری)"
          rows={2}
          maxLength={300}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="مثلاً: بازیکن شمال، روزهای پنجشنبه در دسترس..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={requestJoin.isPending}>انصراف</Button>
          <Button variant="gradient" loading={requestJoin.isPending} onClick={submit} icon="mdi:hand-back-right">
            ثبت درخواست
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

const DiscoverCard: React.FC<{ team: Team; onRequest: (t: Team) => void }> = ({
  team,
  onRequest,
}) => {
  const mine = team.my_status === 'active'
  const invited = team.has_pending_invitation && !mine
  const requested = team.has_open_join_request
  return (
    <Link to={`/teams/${team.id}`} className="block h-full text-inherit no-underline">
      <div className="h-full rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-start gap-2.5">
            <span role="img" aria-label={SPORT_NAME_FA[team.sport] ?? team.sport} className="text-[1.7rem] leading-none">{SPORT_EMOJI[team.sport] ?? '🏅'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.98rem] font-black text-foreground">
                {team.name}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {`کاپیتان: ${team.captain_name ?? '—'}`}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/80">
              <Icon icon="mdi:account-group-outline" aria-hidden="true" className="h-[15px] w-[15px]" />
              {toPersianDigits(team.member_count)}
            </span>
          </div>
          {team.description && (
            <p className="truncate text-xs leading-[1.8] text-muted-foreground">
              {team.description}
            </p>
          )}
          <TeamQuotaProgress
            memberCount={team.member_count}
            quota={team.quota}
            isOfficial={team.is_official}
            compact
          />
          <div className="mt-auto flex flex-wrap items-center gap-1.5">
            <TeamVisibilityChip visibility={team.visibility} />
            {team.visibility === 'public' && !mine && !invited && !requested && (
              <Button size="sm" variant="gradient" icon="mdi:hand-back-right" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequest(team) }}>
                درخواست عضویت
              </Button>
            )}
            {requested && !mine && (
              <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-amber-500/10 px-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Icon icon="mdi:clock-outline" aria-hidden="true" className="h-3.5 w-3.5" />
                درخواستتان در بررسی است
              </span>
            )}
            {invited && (
              <span className="inline-flex h-[22px] items-center rounded-full bg-violet-500/10 px-2 text-xs font-bold text-violet-600 dark:text-violet-400">دعوت باز دارید</span>
            )}
            {mine && (
              <span className="inline-flex h-[22px] items-center rounded-full bg-emerald-500/10 px-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">عضو هستید</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

const TeamDiscover: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [joinTarget, setJoinTarget] = useState<Team | null>(null)

  const params = useMemo(
    () => ({ search: search.trim() || undefined, sport, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [search, sport, page],
  )
  const discoverQ = useTeamsDiscover(params)

  const items = discoverQ.data?.items ?? []
  const total = discoverQ.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Layout>
      <div className="mb-1">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl ps-0 pe-2 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <Icon icon="mdi:arrow-right" aria-hidden="true" className="h-4 w-4" />
          بازگشت به تیم‌های من
        </button>
      </div>
      <h1 className="mb-4 text-2xl font-extrabold text-foreground">کاوش تیم‌ها</h1>

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative max-w-[420px]">
          <Icon icon="mdi:magnify" aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="جستجوی نام تیم"
            placeholder="جستجوی نام تیم..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-12 rounded-full pe-11"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => { setSport(undefined); setPage(1) }}
            aria-pressed={!sport}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold transition-colors',
              !sport ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
            )}
          >
            همه رشته‌ها
          </button>
          {SPORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => { setSport(s.key); setPage(1) }}
              aria-pressed={sport === s.key}
              className={cn(
                'inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold transition-colors',
                sport === s.key ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
              )}
            >
              {`${s.emoji} ${s.label}`}
            </button>
          ))}
        </div>
      </div>

      {discoverQ.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Shimmer key={i} variant="rounded" className="h-[140px] rounded-2xl" />
          ))}
        </div>
      ) : discoverQ.isError ? (
        <ErrorState description="جستجوی تیم‌ها ممکن نشد." onRetry={() => discoverQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="mdi:magnify" title="تیم عمومی‌ای پیدا نشد" description="عبارت دیگری امتحان کنید یا رشته‌ی ورزشی را تغییر دهید." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {items.map((t) => (
              <DiscoverCard key={t.id} team={t} onRequest={setJoinTarget} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <Button size="sm" variant="ghost" disabled={page <= 1 || discoverQ.isFetching} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
              <span className="text-[0.78rem] font-bold text-muted-foreground">
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= pageCount || discoverQ.isFetching} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
            </div>
          )}
        </>
      )}

      <JoinRequestDialog team={joinTarget} onClose={() => setJoinTarget(null)} />
    </Layout>
  )
}

export default TeamDiscover
