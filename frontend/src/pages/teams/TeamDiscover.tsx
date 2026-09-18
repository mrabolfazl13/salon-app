// frontend/src/pages/teams/TeamDiscover.tsx
// کاوش تیم‌ها — جستجوی تیم‌های عمومی (public) با فیلتر ورزش و صفحه‌بندی؛
// درخواست عضویت با پیام (تأیید توسط کاپیتان/مدیر). وضعیت عضویت از «تیم‌های من» +
// دعوت‌های بازِ من مکاتبه می‌شود ( آیتم‌های discover پرچم viewer ندارند — شکاف بک‌اند).

import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { Box, Button as MuiButton, Card, Chip, Grid, TextField, Typography } from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer, SPORTS } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { useMyTeamInvitations, useMyTeams, useRequestJoinTeam, useTeamsDiscover } from '@/hooks/useTeams'
import { useToast } from '@/hooks/useToast'
import { SPORT_EMOJI, TeamQuotaProgress, TeamVisibilityChip, getTeamError } from '@/components/team/shared'
import type { Team } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'
import { radii, shadows } from '@/theme'

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          این تیم عمومی است؛ درخواست شما برای کاپیتان و مدیران ارسال می‌شود و پس از تأیید، عضو تیم خواهید شد.
        </Typography>
        <TextField
          label="پیام همراه درخواست (اختیاری)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="مثلاً: بازیکن شمال، روزهای پنجشنبه در دسترس..."
        />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={requestJoin.isPending}>انصراف</Button>
          <Button variant="gradient" loading={requestJoin.isPending} onClick={submit} icon="mdi:hand-back-right">
            ثبت درخواست
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

const DiscoverCard: React.FC<{ team: Team; mine: boolean; invited: boolean; onRequest: (t: Team) => void }> = ({
  team,
  mine,
  invited,
  onRequest,
}) => (
  <Link to={`/teams/${team.id}`} style={{ textDecoration: "none", display: "block" }}>
    <Card sx={{ borderRadius: `${radii.card}px`, boxShadow: shadows.card, border: '1px solid rgba(15,23,42,0.06)', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box sx={{ fontSize: '1.7rem', lineHeight: 1 }}>{SPORT_EMOJI[team.sport] ?? '🏅'}</Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', color: '#0f172a' }} noWrap>
              {team.name}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.25 }} noWrap>
              {`کاپیتان: ${team.captain_name ?? '—'}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
            <Icon icon="mdi:account-group-outline" style={{ width: 15, height: 15 }} />
            {toPersianDigits(team.member_count)}
          </Box>
        </Box>
        {team.description && (
          <Typography sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.8 }} noWrap>
            {team.description}
          </Typography>
        )}
        <TeamQuotaProgress
          memberCount={team.member_count}
          quota={team.quota}
          isOfficial={team.is_official}
          compact
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
          <TeamVisibilityChip visibility={team.visibility} />
          {team.visibility === 'public' && !mine && !invited && (
            <Button size="sm" variant="gradient" icon="mdi:hand-back-right" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequest(team) }}>
              درخواست عضویت
            </Button>
          )}
          {invited && !mine && (
            <Chip label="دعوت باز دارید" size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(124,58,237,0.10)', color: '#7c3aed' }} />
          )}
          {mine && (
            <Chip label="عضو هستید" size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.10)', color: '#059669' }} />
          )}
        </Box>
      </Box>
    </Card>
  </Link>
)

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
  const myTeamsQ = useMyTeams()
  const myInvitesQ = useMyTeamInvitations()

  const items = discoverQ.data?.items ?? []
  const total = discoverQ.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const myTeamIds = useMemo(() => new Set((myTeamsQ.data ?? []).map((t) => t.id)), [myTeamsQ.data])
  const invitedIds = useMemo(
    () => new Set((myInvitesQ.data ?? []).filter((i) => i.status === 'pending').map((i) => i.team_id)),
    [myInvitesQ.data],
  )

  return (
    <Layout>
      <Box sx={{ mb: 1 }}>
        <MuiButton
          size="small"
          onClick={() => navigate('/teams')}
          sx={{ textTransform: 'none', fontWeight: 700, color: '#2563eb', pr: 0 }}
          startIcon={<Icon icon="mdi:arrow-right" style={{ width: 16, height: 16 }} />}
        >
          بازگشت به تیم‌های من
        </MuiButton>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>کاوش تیم‌ها</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <TextField
          placeholder="جستجوی نام تیم..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          slotProps={{ input: { startAdornment: <Icon icon="mdi:magnify" style={{ width: 18, height: 18, color: '#94a3b8', marginLeft: 8 }} /> } }}
          sx={{ maxWidth: 420, '& .MuiOutlinedInput-root': { borderRadius: '999px' } }}
        />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label="همه رشته‌ها"
            size="small"
            onClick={() => { setSport(undefined); setPage(1) }}
            sx={{ fontWeight: 700, bgcolor: sport ? 'rgba(15,23,42,0.04)' : 'rgba(37,99,235,0.10)', color: sport ? '#64748b' : '#2563eb' }}
          />
          {SPORTS.map((s) => (
            <Chip
              key={s.key}
              label={`${s.emoji} ${s.label}`}
              size="small"
              onClick={() => { setSport(s.key); setPage(1) }}
              sx={{ fontWeight: 700, bgcolor: sport === s.key ? 'rgba(37,99,235,0.10)' : 'rgba(15,23,42,0.04)', color: sport === s.key ? '#2563eb' : '#64748b' }}
            />
          ))}
        </Box>
      </Box>

      {discoverQ.isPending ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Shimmer variant="rounded" sx={{ height: 140, borderRadius: `${radii.card}px` }} />
            </Grid>
          ))}
        </Grid>
      ) : discoverQ.isError ? (
        <ErrorState description="جستجوی تیم‌ها ممکن نشد." onRetry={() => discoverQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState emoji="🔎" title="تیم عمومی‌ای پیدا نشد" description="عبارت دیگری امتحان کنید یا رشته‌ی ورزشی را تغییر دهید." />
      ) : (
        <>
          <Grid container spacing={2}>
            {items.map((t) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
                <DiscoverCard team={t} mine={myTeamIds.has(t.id)} invited={invitedIds.has(t.id)} onRequest={setJoinTarget} />
              </Grid>
            ))}
          </Grid>
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 3 }}>
              <MuiButton size="small" disabled={page <= 1 || discoverQ.isFetching} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>قبلی</MuiButton>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                {`${toPersianDigits(page)} / ${toPersianDigits(pageCount)}`}
              </Typography>
              <MuiButton size="small" disabled={page >= pageCount || discoverQ.isFetching} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: 'none', fontWeight: 700 }}>بعدی</MuiButton>
            </Box>
          )}
        </>
      )}

      <JoinRequestDialog team={joinTarget} onClose={() => setJoinTarget(null)} />
    </Layout>
  )
}

export default TeamDiscover
