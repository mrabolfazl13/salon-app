// frontend/src/pages/manager/pricing/ManagerPricing.tsx
// بخش «قیمت‌گذاری» مدیر — مسیر /manager/pricing (گیت venue_manager مثل /finance).
// سه تب: قوانین قیمت (شامل مبنای سالن و پیش‌نمایش موتور قیمت)، تعطیلات، کدهای تخفیف.

import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'

import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues, isForbiddenError } from '@/hooks/useStaffMe'
import { ForbiddenPanel } from '@/components/crm/shared'
import PricingRulesTab from '@/components/pricing/PricingRulesTab'
import HolidaysTab from '@/components/pricing/HolidaysTab'
import CouponsTab from '@/components/pricing/CouponsTab'

const TAB_KEYS = ['rules', 'holidays', 'coupons'] as const
type TabKey = (typeof TAB_KEYS)[number]

const ManagerPricing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && (TAB_KEYS as readonly string[]).includes(t) ? t : 'rules'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده مدیر + کارمند (/staff/me) — مثل کنسول مالی
  const venuesQuery = useManagedVenues()
  const venues = venuesQuery.data ?? []
  const [venueId, setVenueId] = useState<number | null>(null)
  const selectedVenue = venueId ?? venues[0]?.id ?? null

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'rules' ? {} : { tab: value }, { replace: true })
  }

  return (
    <Layout userRole="venue_manager">
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 55%, #d97706 100%)',
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
                  <Typography component="h1" variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                    قیمت‌گذاری
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    قوانین داینامیک قیمت، تقویم تعطیلات و کدهای تخفیف — قیمت فقط سمت سرور محاسبه می‌شود
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
              <ForbiddenPanel detail="برای قیمت‌گذاری باید مدیر سالن باشید یا در یک سالن با دسترسی pricing.manage/holiday.manage/coupon.manage انتصاب شوید." />
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
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.92)',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
                  px: { xs: 2, md: 2.5 },
                  py: 1.5,
                  mb: 3,
                }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => changeTab(v)}
                  variant="scrollable"
                  scrollButtons={false}
                  sx={{
                    flex: 1,
                    minWidth: 260,
                    '& .MuiTabs-indicator': { borderRadius: '4px 4px 0 0' },
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', minHeight: 52 },
                  }}
                >
                  <Tab value="rules" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:tag-percent-outline" className="h-4 w-4" />قوانین قیمت</Box>} />
                  <Tab value="holidays" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:calendar-multiple" className="h-4 w-4" />تعطیلات</Box>} />
                  <Tab value="coupons" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:ticket-percent-outline" className="h-4 w-4" />کدهای تخفیف</Box>} />
                </Tabs>

                {venues.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="mp-venue-label">سالن</InputLabel>
                    <Select
                      labelId="mp-venue-label"
                      label="سالن"
                      value={selectedVenue ?? ''}
                      onChange={(e) => setVenueId(Number(e.target.value))}
                      sx={{ borderRadius: '10px' }}
                    >
                      {venues.map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {venues.length > 0 && (
                <>
                  {tab === 'rules' && <PricingRulesTab venues={venues} venueId={selectedVenue} />}
                  {tab === 'holidays' && <HolidaysTab venues={venues} venueId={selectedVenue} />}
                  {tab === 'coupons' && <CouponsTab venues={venues} venueId={selectedVenue} />}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </Layout>
  )
}

export default ManagerPricing