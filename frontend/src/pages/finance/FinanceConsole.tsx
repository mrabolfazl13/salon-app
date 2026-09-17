// frontend/src/pages/finance/FinanceConsole.tsx
// کنسول مالی مدیر — صفحه/مسیر /finance (خارج از ManagerDashboard تا فایل ۲۲۰۰
// خطی منفجر نشود) با سه تب: داشبورد مالی، هزینه‌ها و تراکنش‌ها، حساب‌ها.
// نقش: venue_manager + club_admin + super_admin (گیت ProtectedRoute در App.tsx).

import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import type { FinanceVenue } from '@/hooks/useFinance'
import FinanceDashboardTab from '@/components/finance/FinanceDashboardTab'
import TransactionsPanel from '@/components/finance/TransactionsPanel'
import AccountsPanel from '@/components/finance/AccountsPanel'

const TAB_KEYS = ['dashboard', 'transactions', 'accounts'] as const
type TabKey = (typeof TAB_KEYS)[number]

const FinanceConsole: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && TAB_KEYS.includes(t) ? t : 'dashboard'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده: سالن‌های مدیر + انتصاب‌های کارکنان (/staff/me)
  const venuesQuery = useManagedVenues()
  const venues: FinanceVenue[] = venuesQuery.data ?? []

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'dashboard' ? {} : { tab: value }, { replace: true })
  }

  return (
    <Layout userRole="venue_manager">
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
        {/* هدر */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #0891b2 100%)',
            pt: { xs: 4, md: 5 },
            pb: { xs: 7, md: 8 },
            position: 'relative',
            overflow: 'hidden',
            mx: { xs: -2, sm: -3, md: -4 },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                    امور مالی
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    داشبورد درآمد و هزینه، دفتر کل و حساب‌های اشخاص
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/manager-dashboard"
                  variant="contained"
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { background: 'rgba(255,255,255,0.25)' },
                  }}
                  startIcon={<Icon icon="mdi:store-outline" className="h-4 w-4" />}
                >
                  پنل مدیریت
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, mt: -5, position: 'relative', zIndex: 2, pb: 6 }}>
          {venuesQuery.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#2563eb' }} />
            </Box>
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <ForbiddenPanel detail="حساب شما هیچ سالنی تحت مدیریت ندارد و در هیچ سالنی با دسترسی مالی انتصاب نشده است؛ از مدیر سالن بخواهید شما را در بخش «پرسنل» ثبت کند." />
            ) : (
              <ErrorBox message="خطا در دریافت سالن‌های شما" onRetry={() => venuesQuery.refetch()} />
            )
          ) : (
            <>
              {venues.length === 0 && (
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.94)', borderRadius: '18px', p: 2, mb: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید و در هیچ سالنی انتصاب کارمندی فعال ندارید." />
                </Box>
              )}

              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.92)',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
                  px: { xs: 1, md: 2 },
                  mb: 3,
                }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => changeTab(v)}
                  variant="scrollable"
                  scrollButtons={false}
                  sx={{
                    '& .MuiTabs-indicator': { borderRadius: '4px 4px 0 0' },
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      minHeight: 52,
                    },
                  }}
                >
                  <Tab
                    value="dashboard"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:chart-box" className="h-4 w-4" /> داشبورد مالی
                      </Box>
                    }
                  />
                  <Tab
                    value="transactions"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:book-ledger" className="h-4 w-4" /> هزینه‌ها و تراکنش‌ها
                      </Box>
                    }
                  />
                  <Tab
                    value="accounts"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="mdi:account-group" className="h-4 w-4" /> حساب‌ها
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {tab === 'dashboard' && <FinanceDashboardTab venues={venues} />}
                {tab === 'transactions' && <TransactionsPanel venues={venues} />}
                {tab === 'accounts' && <AccountsPanel venues={venues} />}
              </motion.div>
            </>
          )}
        </Box>
      </Box>
    </Layout>
  )
}

export default FinanceConsole