// frontend/src/components/game/PaymentSection.tsx
// بخش پرداخت بازی — خلاصه سهم‌ها (split)، پرداخت سهم کاربر جاری (mock)، یا توضیح organizer_pays/free

import React from 'react'
import { Box, Typography, Chip, LinearProgress, Divider } from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import type { Game, GamePayment, Participant } from '@/types/game'
import { usePayShare, usePaymentSummary } from '@/hooks/useGames'
import { formatPrice } from '@/utils/helpers'
import { Button } from '@/components/ui/Button'
import { Shimmer } from '@/components/mobile'
import { getGameError } from './shared'

interface Props {
  gameId: number
  game: Game
  participants: Participant[]
  currentUserId?: number | null
}

const nameOf = (participants: Participant[], userId: number): string => {
  const p = participants.find((x) => x.user_id === userId)
  return p?.full_name || `کاربر ${userId.toLocaleString('fa-IR')}`
}

const PaymentRow: React.FC<{ payment: GamePayment; participants: Participant[] }> = ({ payment, participants }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.75 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: payment.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.14)',
        color: payment.status === 'paid' ? '#16a34a' : '#b45309',
      }}
    >
      <Icon icon={payment.status === 'paid' ? 'mdi:check-bold' : 'mdi:clock-outline'} style={{ width: 16, height: 16 }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }} noWrap>
        {nameOf(participants, payment.user_id)}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
      {formatPrice(payment.amount)}
    </Typography>
    <Chip
      label={payment.status === 'paid' ? 'پرداخت‌شده' : 'در انتظار'}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.68rem',
        fontWeight: 700,
        bgcolor: payment.status === 'paid' ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.12)',
        color: payment.status === 'paid' ? '#15803d' : '#b45309',
      }}
    />
  </Box>
)

const PaymentSection: React.FC<Props> = ({ gameId, game, participants, currentUserId }) => {
  const enabled = game.payment_mode !== 'free'
  const summaryQ = usePaymentSummary(gameId, enabled)
  const payShare = usePayShare(gameId)

  // حالت رایگان
  if (game.payment_mode === 'free') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#059669' }}>
        <Icon icon="mdi:gift-outline" style={{ width: 18, height: 18 }} />
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>این بازی رایگان است.</Typography>
      </Box>
    )
  }

  // برگزارکننده پرداخت می‌کند — فقط اطلاع‌رسانی
  if (game.payment_mode === 'organizer_pays') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
        <Icon icon="mdi:account-cash-outline" style={{ width: 18, height: 18 }} />
        <Typography sx={{ fontSize: '0.85rem' }}>
          هزینه زمین ({formatPrice(game.total_price ?? 0)}) بر عهده برگزارکننده است و بازیکنان سهمی پرداخت نمی‌کنند.
        </Typography>
      </Box>
    )
  }

  const summary = summaryQ.data
  const total = summary?.payments.length ?? 0
  const paidCount = summary?.paid_count ?? 0
  const progress = total > 0 ? (paidCount / total) * 100 : 0

  const myParticipant = currentUserId
    ? participants.find((p) => p.user_id === currentUserId && p.status === 'accepted')
    : undefined
  const myPayment = currentUserId ? summary?.payments.find((p) => p.user_id === currentUserId) : undefined
  const canPay = !!myParticipant && myPayment?.status !== 'paid'

  const handlePay = () => {
    if (!myParticipant) return
    payShare.mutate(myParticipant.id, {
      onSuccess: () => toast.success('سهم شما با موفقیت پرداخت شد'),
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {summaryQ.isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2].map((i) => (
            <Shimmer key={i} variant="rounded" sx={{ height: 40 }} />
          ))}
        </Box>
      ) : summaryQ.isError ? (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>نمایش وضعیت پرداخت ممکن نیست.</Typography>
      ) : summary ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`سهم هر نفر: ${formatPrice(summary.price_per_player ?? game.price_per_player ?? 0)}`}
                size="small"
                sx={{ height: 24, fontSize: '0.72rem', fontWeight: 800, bgcolor: 'rgba(37,99,235,0.08)', color: '#1d4ed8' }}
              />
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                {`${paidCount.toLocaleString('fa-IR')} پرداخت‌شده از ${total.toLocaleString('fa-IR')}`}
              </Typography>
            </Box>
            {canPay && (
              <Button size="sm" variant="gradient" icon="mdi:credit-card-outline" loading={payShare.isPending} onClick={handlePay}>
                پرداخت سهم من
              </Button>
            )}
            {!canPay && myPayment?.status === 'paid' && (
              <Chip
                label="سهم شما پرداخت شده ✓"
                size="small"
                sx={{ height: 24, fontSize: '0.72rem', fontWeight: 800, bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d' }}
              />
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(245,158,11,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 3 } }}
          />
          {summary.payments.length > 0 ? (
            <>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {summary.payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} participants={participants} />
                ))}
              </Box>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              هنوز سهمی ثبت نشده است — با پیوستن بازیکنان، سهم‌ها ساخته می‌شوند.
            </Typography>
          )}
        </>
      ) : null}
    </Box>
  )
}

export default PaymentSection
