// frontend/src/pages/games/GamesExplore.tsx
// صفحه کشف بازی‌ها — فیلترها (ورزش/سطح/ظرفیت/مرتب‌سازی) + تب‌های «بازی‌های من» و «دعوت‌نامه‌ها»

import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer, SPORTS } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { GameCard, getGameError } from '@/components/game'
import {
  useAcceptInvitation,
  useGames,
  useMyGames,
  useMyInvitations,
  useRejectInvitation,
} from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import type { ExploreParams, GameSort, SkillLevel } from '@/types/game'
import { GAME_SORT_LABELS, SKILL_LEVEL_LABELS } from '@/types/game'
import { formatPersianDateTime } from '@/utils/helpers'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

const GamesExplore: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [tab, setTab] = useState(0)
  const [sport, setSport] = useState<string>('')
  const [skill, setSkill] = useState<SkillLevel | ''>('')
  const [sort, setSort] = useState<GameSort>('soonest')
  const [availabilityOnly, setAvailabilityOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const params: ExploreParams = useMemo(() => {
    const p: ExploreParams = { sort, limit }
    if (sport) p.sport = sport
    if (skill) p.skillLevel = skill
    if (availabilityOnly) p.availabilityOnly = true
    if (sort === 'nearest' && coords) {
      p.latitude = coords.lat
      p.longitude = coords.lng
    }
    return p
  }, [sport, skill, sort, availabilityOnly, limit, coords])

  const { data, isLoading, isError, refetch } = useGames(params, tab === 0)
  const myGames = useMyGames(isAuthenticated && tab === 1)
  const myInvitations = useMyInvitations(isAuthenticated && tab === 2)
  const acceptInv = useAcceptInvitation()
  const rejectInv = useRejectInvitation()

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error('موقعیت مکانی در دسترس نیست؛ مرتب‌سازی بر اساس فاصله غیرفعال می‌شود.'),
    )
  }

  const handleSortChange = (next: GameSort) => {
    setSort(next)
    if (next === 'nearest' && !coords) requestLocation()
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 text-[0.85rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      active
        ? 'border-blue-600/35 bg-blue-600/10 text-blue-700 dark:text-blue-400'
        : 'border-border text-slate-600 hover:bg-muted dark:text-slate-300',
    )

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[1.35rem] font-black text-foreground md:text-[1.6rem]">
            <Icon icon="mdi:soccer" className="h-6 w-6 text-amber-800 dark:text-amber-400" aria-hidden="true" />
            بازی‌های گروهی
          </h1>
          <p className="mt-1 text-[0.85rem] text-muted-foreground">
            به بازی‌های باز دیگران بپیوند یا روی رزرو خودت بازی بساز.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="gradient"
            icon="mdi:plus"
            onClick={() => navigate('/games/new')}
          >
            ساخت بازی
          </Button>
        )}
      </div>

      <Tabs value={String(tab)} onValueChange={(v) => setTab(Number(v))} className="mb-5">
        <TabsList className="min-h-[52px] w-full justify-start overflow-x-auto">
          <TabsTrigger value="0" aria-label="تب کشف بازی‌ها" className="min-h-11 px-4 text-[0.9rem]">کشف بازی‌ها</TabsTrigger>
          <TabsTrigger value="1" aria-label="تب بازی‌های من" className="min-h-11 px-4 text-[0.9rem]">بازی‌های من</TabsTrigger>
          <TabsTrigger value="2" aria-label="تب دعوت‌نامه‌ها" className="min-h-11 px-4 text-[0.9rem]">
            {`دعوت‌نامه‌ها${myInvitations.data?.length ? ` (${myInvitations.data.length})` : ''}`}
          </TabsTrigger>
        </TabsList>

        {/* ─────────── تب کشف ─────────── */}
        <TabsContent value="0">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="نمایش همه ورزش‌ها"
              aria-pressed={sport === ''}
              onClick={() => { setSport(''); setLimit(PAGE_SIZE) }}
              className={chipClass(sport === '')}
            >
              همه
            </button>
            {SPORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-label={`فیلتر ${s.label}`}
                aria-pressed={sport === s.key}
                onClick={() => { setSport(s.key); setLimit(PAGE_SIZE) }}
                className={chipClass(sport === s.key)}
              >
                <span className="me-1" aria-hidden="true">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-semibold text-muted-foreground">مرتب‌سازی</span>
              <Select value={sort} onValueChange={(v) => handleSortChange(v as GameSort)}>
                <SelectTrigger aria-label="مرتب‌سازی" className="min-h-11 min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(GAME_SORT_LABELS) as GameSort[]).map((s) => (
                    <SelectItem key={s} value={s} className="min-h-11">{GAME_SORT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-semibold text-muted-foreground">سطح بازی</span>
              <Select
                value={skill || 'all'}
                onValueChange={(v) => { setSkill(v === 'all' ? '' : (v as SkillLevel)); setLimit(PAGE_SIZE) }}
              >
                <SelectTrigger aria-label="سطح بازی" className="min-h-11 min-w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="min-h-11">همه</SelectItem>
                  {(Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[]).map((s) => (
                    <SelectItem key={s} value={s} className="min-h-11">{SKILL_LEVEL_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* خودِ دکمه کنترل است (کلیک + کیبورد) — wrapper با role=button قبلاً دو بار toggle می‌کرد */}
            <button
              type="button"
              aria-pressed={availabilityOnly}
              aria-label={availabilityOnly ? 'نمایش همه بازی‌ها' : 'فیلتر بازی‌های دارای ظرفیت'}
              onClick={() => { setAvailabilityOnly((v) => !v); setLimit(PAGE_SIZE) }}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.8rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                availabilityOnly
                  ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300'
                  : 'border border-border text-slate-600 hover:bg-muted dark:text-slate-300',
              )}
            >
              <Icon icon={availabilityOnly ? 'mdi:check-circle' : 'mdi:circle-outline'} className="h-[18px] w-[18px]" aria-hidden="true" />
              فقط جای خالی دارد
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} height={210} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState description="دریافت بازی‌ها ممکن نشد." onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon="mdi:soccer-field"
              title="بازی‌ای پیدا نشد"
              description="با فیلترهای دیگر جستجو کنید یا اولین بازی را بسازید."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((game) => (
                  <div key={game.id}>
                    <GameCard game={game} />
                  </div>
                ))}
              </div>
              {items.length < total && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                  >
                    نمایش بیشتر
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─────────── تب بازی‌های من ─────────── */}
        <TabsContent value="1">
          {!isAuthenticated ? (
            <EmptyState
              icon="mdi:login-variant"
              title="وارد شوید"
              description="برای دیدن بازی‌های خود وارد حساب کاربری شوید."
              actionLabel="ورود"
              onAction={() => navigate('/login')}
            />
          ) : myGames.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Shimmer key={i} height={210} />
              ))}
            </div>
          ) : (myGames.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="mdi:calendar-plus"
              title="هنوز بازی‌ای ندارید"
              description="روی رزروهای تأییدشده خود بازی گروهی بسازید."
              actionLabel="ساخت بازی"
              onAction={() => navigate('/games/new')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myGames.data!.map((game) => (
                <div key={game.id}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─────────── تب دعوت‌نامه‌ها ─────────── */}
        <TabsContent value="2">
          {!isAuthenticated ? (
            <EmptyState
              icon="mdi:login-variant"
              title="وارد شوید"
              description="برای دیدن دعوت‌نامه‌های خود وارد حساب کاربری شوید."
              actionLabel="ورود"
              onAction={() => navigate('/login')}
            />
          ) : myInvitations.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => <Shimmer key={i} height={74} />)}
            </div>
          ) : (myInvitations.data?.length ?? 0) === 0 ? (
            <EmptyState icon="mdi:email-outline" title="دعوت‌نامه‌ای ندارید" description="وقتی کسی شما را به بازی دعوت کند، اینجا نمایش داده می‌شود." />
          ) : (
            <div className="flex flex-col gap-3">
              {myInvitations.data!.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-3.5 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400" aria-hidden="true">
                    <Icon icon="mdi:email-outline" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/games/${inv.game_id}`}
                      className="block truncate text-[0.9rem] font-bold text-foreground transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-blue-400"
                    >
                      {inv.game_name || `بازی #${inv.game_id.toLocaleString('fa-IR')}`}
                    </Link>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                      {`دعوت در: ${formatPersianDateTime(inv.created_at)}${inv.expires_at ? ` - اعتبار تا: ${formatPersianDateTime(inv.expires_at)}` : ''}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="gradient"
                      loading={acceptInv.isPending}
                      onClick={() =>
                        acceptInv.mutate(inv.id, {
                          onSuccess: ({ message }) => toast.success(message),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                      className="min-h-[44px] px-4"
                    >
                      پذیرفتن
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rejectInv.isPending}
                      onClick={() =>
                        rejectInv.mutate(inv.id, {
                          onSuccess: () => toast.info('دعوت رد شد'),
                          onError: (err) => toast.error(getGameError(err)),
                        })
                      }
                      className="min-h-[44px] px-4"
                    >
                      رد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  )
}

export default GamesExplore
