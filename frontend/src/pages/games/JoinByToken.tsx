// frontend/src/pages/games/JoinByToken.tsx
// صفحه پیوستن از طریق لینک دعوت — /join/g/:token (پیش‌نمایش بازی + پیوستن با توکن)

import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { AlertCircle } from 'lucide-react'

import Layout from '@/components/layout/Layout'
import { EmptyState, ErrorState, Shimmer } from '@/components/mobile'
import { Button } from '@/components/ui/shadcn/button'
import { Card } from '@/components/ui/shadcn/card'
import { GameCard, getGameError } from '@/components/game'
import { useJoinByToken, useTokenPreview } from '@/hooks/useGames'
import { useToast } from '@/hooks/useToast'

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
      <div className="mx-auto max-w-[560px] py-4">
        <h1 className="mb-1 text-center text-xl font-extrabold text-foreground">
          دعوت به بازی
        </h1>
        <p className="mb-4 text-center text-[0.82rem] text-muted-foreground">
          با لینک دعوت وارد شدید — جزئیات بازی را بررسی کنید و بپیوندید.
        </p>

        {previewQ.isLoading ? (
          <div className="flex flex-col gap-4">
            <Shimmer variant="rectangular" height={120} className="rounded-lg" />
            <Shimmer variant="rectangular" height={60} className="rounded-lg" />
          </div>
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
          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden">
              <GameCard game={previewQ.data.game} />
            </Card>
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-[0.68rem] text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              <span>
                با کلیک روی «پیوستن به بازی» از طریق این لینک، مستقیماً در بازی ثبت می‌شوید.
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={joinByToken.isPending}
              onClick={handleJoin}
              className="w-full"
            >
              {joinByToken.isPending ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              ) : (
                <Icon icon="mdi:account-group" className="h-5 w-5" aria-hidden="true" />
              )}
              پیوستن به بازی
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/games/${previewQ.data!.game!.id}`)}>
              مشاهده صفحه بازی
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default JoinByToken
