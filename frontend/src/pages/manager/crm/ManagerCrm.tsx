// frontend/src/pages/manager/crm/ManagerCrm.tsx
// کنسول «مشتریان» + «پرسنل» مدیر — مسیر /manager/crm با چهار تب.
// گیت: لاگین (ProtectedRoute ساده) — نقش کارمند (role=user با انتصاب) مجاز به
// باز کردن مسیر است؛ بک‌اند per-permission پاسخ ۴۰۳ می‌دهد و پنل دوستانه
// ForbiddenPanel نمایش داده می‌شود (مسیر پنهان نمی‌شود).

import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import Layout from '@/components/layout/Layout'
import { ErrorBox } from '@/components/finance/shared'
import { useManagedVenues } from '@/hooks/useStaffMe'
import CustomersTab from '@/components/crm/CustomersTab'
import CrmStatsTab from '@/components/crm/CrmStatsTab'
import CampaignsTab from '@/components/crm/CampaignsTab'
import StaffTab from '@/components/crm/StaffTab'
import { ForbiddenPanel } from '@/components/crm/shared'
import { isForbidden } from '@/components/crm/shared'

const TAB_KEYS = ['customers', 'stats', 'campaigns', 'staff'] as const
type TabKey = (typeof TAB_KEYS)[number]

const ManagerCrm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = useMemo<TabKey>(() => {
    const t = searchParams.get('tab') as TabKey | null
    return t && TAB_KEYS.includes(t) ? t : 'customers'
  }, [searchParams])
  const [tab, setTab] = useState<TabKey>(initialTab)

  // دامنه ادغام‌شده: سالن‌های مدیر + انتصاب کارمند (crm.view/customer.view_basic)
  const venuesQuery = useManagedVenues()
  const venues = venuesQuery.data ?? []
  const [venueId, setVenueId] = useState<number | null>(null)

  useEffect(() => {
    if (venuesQuery.data) {
      setVenueId((prev) => prev ?? venuesQuery.data[0]?.id ?? null)
      if (venuesQuery.data.length === 0) setVenueId(null)
    }
  }, [venuesQuery.data])

  const changeTab = (value: TabKey) => {
    setTab(value)
    setSearchParams(value === 'customers' ? {} : { tab: value }, { replace: true })
  }

  const renderTab = () => {
    if (venueId === null) {
      return (
        <ErrorBox message={'برای این سالن رکورد مدیریتی‌ای در دسترس نیست'} />
      )
    }
    if (tab === 'customers') return <CustomersTab venueId={venueId} />
    if (tab === 'stats') return <CrmStatsTab venueId={venueId} />
    if (tab === 'campaigns') return <CampaignsTab venueId={venueId} />
    return <StaffTab venueId={venueId} />
  }

  return (
    <Layout userRole="venue_manager">
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
        {/* هدر */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0f172a 0%, #312e5f 45%, #7c3aed 100%)',
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
                    مشتریان و پرسنل
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    CRM سالن — گروه‌بندی مشتریان، کمپین پیامکی بازاریابی و مدیریت کارکنان
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/manager-dashboard"
                  variant="contained"
                  sx={{
                    borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1, fontWeight: 700, fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white',
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
              <CircularProgress sx={{ color: '#7c3aed' }} />
            </Box>
          ) : venuesQuery.isError ? (
            // کارمندِ بدون انتساب/مدیریت — پنل دوستانه (هر دو منبع دامنه خطا دادند)
            isForbidden(venuesQuery.error) ? (
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.94)', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 28px rgba(15,23,42,0.08)' }}>
                <ForbiddenPanel detail="پنل مشتریان برای حساب کاربری شما باز است، اما بک‌اند هنوز دسترسی لازم (crm.view یا customer.view_basic) را برای شما ثبت نکرده است؛ از مدیر سالن بخواهید شما را در بخش «پرسنل» با دسترسی مناسب انتصاب کند." />
              </Box>
            ) : (
              <ErrorBox message="خطا در دریافت سالن‌ها" onRetry={() => venuesQuery.refetch()} />
            )
          ) : (
            <>
              {venues.length === 0 && (
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.94)', borderRadius: '18px', p: 2, mb: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <ForbiddenPanel detail="شما سالنی تحت مدیریت ندارید و در هیچ سالنی با دسترسی CRM انتصاب نشده‌اید." />
                </Box>
              )}

              {/* انتخاب سالن */}
              {venues.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                  {venues.map((v) => (
                    <Button
                      key={v.id}
                      size="small"
                      variant={venueId === v.id ? 'contained' : 'outlined'}
                      onClick={() => setVenueId(v.id)}
                      sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                        ...(venueId === v.id ? { background: 'linear-gradient(135deg,#2563eb,#7c3aed)' } : {}),
                      }}
                    >
                      {v.name}
                    </Button>
                  ))}
                </Box>
              )}

              {venues.length > 0 && (
                <>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.92)', borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
                      px: { xs: 1, md: 2 }, mb: 3,
                    }}
                  >
                    <Tabs
                      value={tab}
                      onChange={(_, v) => changeTab(v)}
                      variant="scrollable"
                      scrollButtons={false}
                      sx={{
                        '& .MuiTabs-indicator': { borderRadius: '4px 4px 0 0', bgcolor: '#7c3aed' },
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', minHeight: 52 },
                        '& .Mui-selected': { color: '#7c3aed !important' },
                      }}
                    >
                      <Tab value="customers" label={<TabLabel icon="mdi:account-group" text="مشتریان" />} />
                      <Tab value="stats" label={<TabLabel icon="mdi:chart-box" text="آمار" />} />
                      <Tab value="campaigns" label={<TabLabel icon="mdi:message-flash-outline" text="کمپین" />} />
                      <Tab value="staff" label={<TabLabel icon="mdi:badge-account-outline" text="پرسنل" />} />
                    </Tabs>
                  </Box>

                  <motion.div key={tab + (venueId ?? 0)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {renderTab()}
                  </motion.div>
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </Layout>
  )
}

const TabLabel: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Icon icon={icon} className="h-4 w-4" /> {text}
  </Box>
)

export default ManagerCrm