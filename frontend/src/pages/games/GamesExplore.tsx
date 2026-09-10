// frontend/src/pages/games/GamesExplore.tsx
// صفحه کشف بازی‌ها — فیلترها (ورزش/سطح/ظرفیت/مرتب‌سازی) + تب‌های «بازی‌های من» و «دعوت‌نامه‌ها»

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer, SPORTS } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
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

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.6rem' }, color: '#0f172a' }}>
            🎮 بازی‌های گروهی
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>
            به بازی‌های باز دیگران بپیوند یا روی رزرو خودت بازی بساز.
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button variant="gradient" icon="mdi:plus" onClick={() => navigate('/games/new')}>
            ساخت بازی
          </Button>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2.5, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}
      >
        <Tab label="کشف بازی‌ها" />
        <Tab label="بازی‌های من" />
        <Tab label={`دعوت‌نامه‌ها${myInvitations.data?.length ? ` (${myInvitations.data.length})` : ''}`} />
      </Tabs>

      {/* ─────────── تب کشف ─────────── */}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={sport}
              onChange={(_, v) => { if (v !== null) { setSport(v); setLimit(PAGE_SIZE) } }}
              sx={{
                borderRadius: '999px',
                '& .MuiToggleButton-root': {
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: '999px !important',
                  px: 1.5,
                  py: 0.6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#475569',
                  textTransform: 'none',
                  gap: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(37,99,235,0.08)',
                    color: '#2563eb',
                    borderColor: 'rgba(37,99,235,0.35)',
                    '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
                  },
                },
              }}
            >
              <ToggleButton value="">همه</ToggleButton>
              {SPORTS.map((s) => (
                <ToggleButton key={s.key} value={s.key}>
                  <Box component="span" sx={{ ml: 0.5 }}>{s.emoji}</Box>
                  {s.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            <TextField
              select
              size="small"
              label="مرتب‌سازی"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as GameSort)}
              sx={{ minWidth: 160 }}
            >
              {(Object.keys(GAME_SORT_LABELS) as GameSort[]).map((s) => (
                <MenuItem key={s} value={s}>{GAME_SORT_LABELS[s]}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="سطح بازی"
              value={skill}
              onChange={(e) => { setSkill(e.target.value as SkillLevel | ''); setLimit(PAGE_SIZE) }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">همه</MenuItem>
              {(Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[]).map((s) => (
                <MenuItem key={s} value={s}>{SKILL_LEVEL_LABELS[s]}</MenuItem>
              ))}
            </TextField>
            <Chip
              icon={<Icon icon={availabilityOnly ? 'mdi:check-circle' : 'mdi:circle-outline'} style={{ width: 16, height: 16 }} />}
              label="فقط جای خالی دارد"
              onClick={() => { setAvailabilityOnly((v) => !v); setLimit(PAGE_SIZE) }}
              color={availabilityOnly ? 'primary' : 'default'}
              variant={availabilityOnly ? 'filled' : 'outlined'}
              sx={{ borderRadius: '999px', fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          {isLoading ? (
            <Grid container spacing={2.5}>
              {[1, 2, 3, 4].map((i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Shimmer variant="rounded" sx={{ height: 210 }} />
                </Grid>
              ))}
            </Grid>
          ) : isError ? (
            <ErrorState description="دریافت بازی‌ها ممکن نشد." onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              emoji="🏟️"
              title="بازی‌ای پیدا نشد"
              description="با فیلترهای دیگر جستجو کنید یا اولین بازی را بسازید."
            />
          ) : (
            <>
              <Grid container spacing={2.5}>
                {items.map((game) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={game.id}>
                    <GameCard game={game} />
                  </Grid>
                ))}
              </Grid>
              {items.length < total && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                    نمایش بیشتر
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* ─────────── تب بازی‌های من ─────────── */}
      {tab === 1 && (
        !isAuthenticated ? (
          <EmptyState
            emoji="🔐"
            title="وارد شوید"
            description="برای دیدن بازی‌های خود وارد حساب کاربری شوید."
            actionLabel="ورود"
            onAction={() => navigate('/login')}
          />
        ) : myGames.isLoading ? (
          <Grid container spacing={2.5}>
            {[1, 2].map((i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                <Shimmer variant="rounded" sx={{ height: 210 }} />
              </Grid>
            ))}
          </Grid>
        ) : (myGames.data?.length ?? 0) === 0 ? (
          <EmptyState
            emoji="📭"
            title="هنوز بازی‌ای ندارید"
            description="روی رزروهای تأییدشده خود بازی گروهی بسازید."
            actionLabel="ساخت بازی"
            onAction={() => navigate('/games/new')}
          />
        ) : (
          <Grid container spacing={2.5}>
            {myGames.data!.map((game) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={game.id}>
                <GameCard game={game} />
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* ─────────── تب دعوت‌نامه‌ها ─────────── */}
      {tab === 2 && (
        !isAuthenticated ? (
          <EmptyState
            emoji="🔐"
            title="وارد شوید"
            description="برای دیدن دعوت‌نامه‌های خود وارد حساب کاربری شوید."
            actionLabel="ورود"
            onAction={() => navigate('/login')}
          />
        ) : myInvitations.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2].map((i) => <Shimmer key={i} variant="rounded" sx={{ height: 74 }} />)}
          </Box>
        ) : (myInvitations.data?.length ?? 0) === 0 ? (
          <EmptyState emoji="✉️" title="دعوت‌نامه‌ای ندارید" description="وقتی کسی شما را به بازی دعوت کند، اینجا نمایش داده می‌شود." />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {myInvitations.data!.map((inv) => (
              <Box
                key={inv.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.75,
                  borderRadius: '18px',
                  border: '1px solid rgba(15,23,42,0.07)',
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  flexWrap: 'wrap',
                }}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                  <Icon icon="mdi:email-outline" style={{ width: 20, height: 20 }} />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    onClick={() => navigate(`/games/${inv.game_id}`)}
                    sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', '&:hover': { color: '#2563eb' } }}
                    noWrap
                  >
                    {inv.game_name || `بازی #${inv.game_id.toLocaleString('fa-IR')}`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.25 }}>
                    {`دعوت در: ${formatPersianDateTime(inv.created_at)}${inv.expires_at ? ` - اعتبار تا: ${formatPersianDateTime(inv.expires_at)}` : ''}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                  >
                    رد
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )
      )}
    </Layout>
  )
}

export default GamesExplore
