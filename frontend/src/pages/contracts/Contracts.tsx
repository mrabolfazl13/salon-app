// frontend/src/pages/contracts/Contracts.tsx
// «قراردادهای من» — تب‌های وضعیت بر پایه نگارخانه مرکزی (شامل pending و rejected
// با بنر «در انتظار تأیید مدیر» و نمایش دلیل رد)، دیالوگ درخواست جدید.

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Dialog,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ContractList from '@/components/contract/ContractList'
import ContractForm from '@/components/contract/ContractForm'
import { EmptyBox, ErrorBox } from '@/components/contract/shared'
import { CONTRACT_TAB_STATUSES } from '@/components/contract/shared'
import { useMyContracts } from '@/hooks/useContracts'
import { venueService } from '@/services/venue'
import { toPersianDigits } from '@/lib/jalali'
import toast from 'react-hot-toast'

const PAGE_TABS = ['all', ...CONTRACT_TAB_STATUSES] as const
type ContractTab = (typeof PAGE_TABS)[number]

const TAB_LABELS: Record<ContractTab, string> = {
  all: 'همه',
  pending: 'در انتظار تأیید',
  active: 'فعال',
  rejected: 'رد شده',
  expired: 'منقضی',
  cancelled: 'لغو شده',
}

const Contracts: React.FC = () => {
  const [tab, setTab] = useState<ContractTab>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [venues, setVenues] = useState<Array<{ id: number; name: string }>>([])
  const navigate = useNavigate()
  const contractsQuery = useMyContracts()

  const contracts = useMemo(() => contractsQuery.data ?? [], [contractsQuery.data])

  const venueNames = useMemo(() => {
    const map: Record<number, string> = {}
    venues.forEach((v) => { map[v.id] = v.name })
    contracts.forEach((c) => {
      if (!map[c.venue_id]) map[c.venue_id] = `سالن #${toPersianDigits(c.venue_id)}`
    })
    return map
  }, [venues, contracts])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contracts.length }
    for (const s of CONTRACT_TAB_STATUSES) c[s] = contracts.filter((x) => x.status === s).length
    return c
  }, [contracts])

  const filtered = tab === 'all' ? contracts : contracts.filter((c) => c.status === tab)

  const openCreate = async () => {
    try {
      const data = await venueService.getAll()
      setVenues(Array.isArray(data) ? data.map((v: { id: number; name: string }) => ({ id: v.id, name: v.name })) : [])
    } catch {
      setVenues([])
    }
    setCreateOpen(true)
  }

  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }} component="h1" variant="h4">قراردادهای من</Typography>
            <Button
              variant="contained"
              onClick={openCreate}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <Icon icon="mdi:plus" className="h-5 w-5 ml-2" />
              قرارداد جدید
            </Button>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            درخواست قرارداد بلندمدت ثبت و اقساط آن را پیگیری کنید
          </Typography>
        </motion.div>

        <Tabs
          value={tab}
          onChange={(_, newValue: ContractTab) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            '& .MuiTab-root': { borderRadius: '8px', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { bgcolor: 'primary.main', color: 'white !important', borderRadius: '8px' },
          }}
        >
          {PAGE_TABS.map((t) => (
            <Tab
              key={t}
              value={t}
              label={`${TAB_LABELS[t]}${counts && counts[t] !== undefined ? ` (${toPersianDigits(counts[t])})` : ''}`}
            />
          ))}
        </Tabs>

        {contractsQuery.isError ? (
          <ErrorBox
            message="در دریافت قراردادها خطایی رخ داد."
            onRetry={() => contractsQuery.refetch()}
          />
        ) : contractsQuery.isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
            ))}
          </Box>
        ) : filtered.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: '16px',
            }}
          >
            <EmptyBox
              icon="mdi:file-document-remove-outline"
              title="قراردادی یافت نشد"
              text={tab === 'pending'
                ? 'درخواست در انتظار تأییدی ندارید'
                : 'هنوز قراردادی در این وضعیت ندارید'}
            />
            <Button
              variant="contained"
              onClick={openCreate}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <Icon icon="mdi:plus" className="h-5 w-5 ml-2" />
              ایجاد قرارداد جدید
            </Button>
          </Box>
        ) : (
          <ContractList
            contracts={filtered}
            venueNames={venueNames}
            onView={(id) => navigate(`/contracts/${id}`)}
          />
        )}

        {tab === 'pending' && !contractsQuery.isLoading && (counts.pending ?? 0) > 0 && (
          <Alert
            severity="info"
            icon={<Icon icon="mdi:account-clock-outline" />}
            sx={{ mt: 3, borderRadius: '12px' }}
          >
            درخواست‌های «در انتظار تأیید» برای مدیر سالن ارسال شده‌اند؛ سانس‌های درخواستی تا بررسی نهایی در دست شما رزرو می‌مانند.
          </Alert>
        )}
      </Box>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '20px', maxHeight: '90vh' } }}
      >
        <ContractForm
          venues={venues}
          onSuccess={() => {
            setCreateOpen(false)
            contractsQuery.refetch()
          }}
          onError={(msg) => toast.error(msg)}
        />
      </Dialog>
    </Layout>
  )
}

export default Contracts