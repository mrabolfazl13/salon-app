// frontend/src/pages/games/JoinByToken.tsx
// صفحه پیوستن از طریق لینک دعوت — /join/g/:token (پیش‌نمایش بازی + پیوستن با توکن)

import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Paper, Alert } from '@mui/material'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/Button'
import { GameCard, getGameError } from '@/components/game'
import { useJoinByToken, useTokenPreview } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'
import { radii, shadows } from '@/theme'

const JoinByToken: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const previewQ = useTokenPreview(token ?? null)
  const joinByToken = useJoinByToken(token ?? '')

  const handleJoin = () => {
    joinByToken.mutate(undefined, {
      onSuccess: ({ game, message }) => {
        toast.success(message)
        navigate(`/games/${game.id}`, { replace: true })
      },
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  return (
    <Layout>
      <Box sx={{ py: 4, maxWidth: 560, mx: 'auto' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', mb: 0.5, textAlign: 'center' }}>
          دعوت به بازی
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#64748b', mb: 3, textAlign: 'center' }}>
          با لینک دعوت وارد شدید — جزئیات بازی را بررسی کنید و بپیوندید.
        </Typography>

        {previewQ.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Shimmer variant="rectangular" height={120} sx={{ borderRadius: `${radii.card}px` }} />
            <Shimmer variant="rectangular" height={60} sx={{ borderRadius: `${radii.card}px` }} />
          </Box>
        ) : previewQ.isError ? (
          <ErrorState
            title="بررسی لینک ممکن نشد"
            description="لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید."
            onRetry={() => previewQ.refetch()}
          />
        ) : !previewQ.data?.valid || !previewQ.data.game ? (
          <EmptyState
            emoji="🔗"
            title="لینک دعوت معتبر نیست"
            description={previewQ.data?.reason || 'این لینک منقضی، غیرفعال یا استفاده‌شده است.'}
            actionLabel="کشف بازی‌ها"
            onAction={() => navigate('/games')}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper elevation={0} sx={{ boxShadow: shadows.card, borderRadius: `${radii.card}px`, overflow: 'hidden' }}>
              <GameCard game={previewQ.data.game} />
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              با کلیک روی «پیوستن به بازی» از طریق این لینک، مستقیماً در بازی ثبت می‌شوید.
            </Alert>
            <Button
              variant="gradient"
              size="lg"
              icon="mdi:account-group"
              loading={joinByToken.isPending}
              onClick={handleJoin}
              className="w-full"
            >
              پیوستن به بازی
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/games/${previewQ.data!.game!.id}`)}>
              مشاهده صفحه بازی
            </Button>
          </Box>
        )}
      </Box>
    </Layout>
  )
}

export default JoinByToken
