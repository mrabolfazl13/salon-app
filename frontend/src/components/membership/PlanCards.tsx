// frontend/src/components/membership/PlanCards.tsx
// کارت‌های پلن اشتراک باشگاه (جلسه‌ای / پک / ماهانه) با دکمه خرید
import React from 'react'
import { Box, Button, Chip, Paper, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import type { MembershipPlan } from '@/types/membership'
import { PLAN_TYPE_LABEL } from '@/types/membership'
import { formatPrice } from '@/lib/utils'

const PLAN_ICONS: Record<string, string> = {
  session: 'mdi:flash-outline',
  sessions_pack: 'mdi:stack-overflow',
  monthly: 'mdi:calendar-month-outline',
}

const PLAN_COLORS: Record<string, { bg: string; fg: string }> = {
  session: { bg: 'rgba(37,99,235,0.07)', fg: '#2563eb' },
  sessions_pack: { bg: 'rgba(245,158,11,0.10)', fg: '#b45309' },
  monthly: { bg: 'rgba(124,58,237,0.08)', fg: '#7c3aed' },
}

interface Props {
  plans: MembershipPlan[]
  onBuy: (plan: MembershipPlan) => void
  compact?: boolean
}

const PlanCards: React.FC<Props> = ({ plans, onBuy, compact = false }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: compact ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))' },
        gap: 1.5,
      }}
    >
      {plans.map((plan, idx) => {
        const color = PLAN_COLORS[plan.plan_type] ?? PLAN_COLORS.session
        const isBest = idx === 0 && plans.length > 1
        return (
          <Paper
            key={plan.id}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              border: isBest ? '1.5px solid rgba(124,58,237,0.4)' : '1px solid rgba(15,23,42,0.08)',
              bgcolor: 'background.paper',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {isBest && (
              <Chip
                label="بهترین مقدار"
                size="small"
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: 12,
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: 'white',
                }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: color.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={PLAN_ICONS[plan.plan_type] ?? 'mdi:card-account-details'} style={{ width: 18, height: 18, color: color.fg }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{plan.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {PLAN_TYPE_LABEL[plan.plan_type]}
                </Typography>
              </Box>
            </Box>
            {plan.description && (
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                {plan.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 0.5 }}>
              <Typography sx={{ fontWeight: 800, color: color.fg, fontSize: '1.05rem' }}>
                {formatPrice(plan.price)}
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => onBuy(plan)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                  background: `linear-gradient(135deg, ${color.fg}, #7c3aed)`,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: '0 4px 12px rgba(37,99,235,0.25)' },
                }}
              >
                خرید
              </Button>
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}

export default PlanCards
