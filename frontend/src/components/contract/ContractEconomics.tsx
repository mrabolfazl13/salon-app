// frontend/src/components/contract/ContractEconomics.tsx
// خلاصه‌ی اقتصادی قرارداد — سانس مؤثر (کل منهای مستثنا)، پرداختی/مانده، بنر معوق.

import React from 'react'
import { Alert, Box, LinearProgress, Typography } from '@mui/material'
import { KpiCard } from '@/components/finance/shared'
import { formatRial, toPersianDigits } from '@/components/contract/shared'
import type { ContractEconomicsData } from '@/services/contract'

const ContractEconomics: React.FC<{
  economics: ContractEconomicsData | null
  totalAmount: number
}> = ({ economics, totalAmount }) => {
  if (!economics) return null
  const paidPct = totalAmount > 0 ? Math.min(100, Math.round((economics.paid_amount / totalAmount) * 100)) : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {economics.overdue && (
        <Alert
          severity="warning"
          sx={{ borderRadius: '12px', fontWeight: 600 }}
        >
          هشدار: حداقل یک قسط از سررسید گذشته است — هرچه زودتر برای پرداخت اقدام کنید.
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        }}
      >
        <KpiCard
          label="سانس‌های قرارداد"
          sub={economics.excluded_sessions > 0
            ? `${toPersianDigits(economics.excluded_sessions)} سانس مستثنا شده`
            : undefined}
          value={`${toPersianDigits(economics.total_sessions)} سانس`}
          icon="mdi:calendar-multiple"
          color="#2563eb"
        />
        <KpiCard
          label="برگزار شده"
          sub={`نسبت بازی ${toPersianDigits(Math.round(economics.played_ratio))}٪`}
          value={`${toPersianDigits(economics.completed_sessions)} / ${toPersianDigits(economics.total_sessions)}`}
          icon="mdi:check-decagram"
          color="#059669"
        />
        <KpiCard
          label="پرداخت شده"
          value={formatRial(economics.paid_amount)}
          icon="mdi:cash-check"
          color="#0891b2"
        />
        <KpiCard
          label="مانده قرارداد"
          value={formatRial(economics.remaining_amount)}
          icon="mdi:book-alert-outline"
          color={economics.remaining_amount > 0 ? '#d97706' : '#059669'}
        />
      </Box>
      <Box sx={{ px: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">پیشرفت مالی</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{toPersianDigits(paidPct)}٪</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={paidPct}
          sx={{
            height: 8,
            borderRadius: '8px',
            bgcolor: 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: '8px',
              background: paidPct >= 100
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : 'linear-gradient(90deg, #2563eb, #7c3aed)',
            },
          }}
        />
      </Box>
    </Box>
  )
}

export default ContractEconomics