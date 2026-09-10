import React, { useCallback, useEffect, useState } from 'react'
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
  CircularProgress,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ContractList from '@/components/contract/ContractList'
import ContractForm from '@/components/contract/ContractForm'
import { contractService } from '@/services/contract'
import type { ContractData } from '@/services/contract'
import { venueService } from '@/services/venue'
import { countContractSessions } from '@/lib/utils'
import toast from 'react-hot-toast'

type ContractTab = 'all' | 'active' | 'expired' | 'cancelled'

const Contracts: React.FC = () => {
  const [tab, setTab] = useState<ContractTab>('all')
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [venueNames, setVenueNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [venues, setVenues] = useState<Array<{ id: number; name: string }>>([])
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [contractsData, venuesData] = await Promise.all([
        contractService.getAll(),
        venueService.getAll().catch(() => [] as any[]),
      ])
      const list = Array.isArray(contractsData) ? contractsData : []
      const names: Record<number, string> = {}
      if (Array.isArray(venuesData)) {
        venuesData.forEach((v: any) => {
          if (v?.id) names[v.id] = v.name
        })
      }
      setContracts(list)
      setVenueNames(names)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = async () => {
    try {
      const data = await venueService.getAll()
      setVenues(
        Array.isArray(data)
          ? data.map((v: any) => ({ id: v.id, name: v.name }))
          : []
      )
    } catch {
      setVenues([])
    }
    setCreateOpen(true)
  }

  const handleCreateSuccess = async () => {
    setCreateOpen(false)
    setCreating(false)
    await fetchData()
  }

  const handleCreateError = (msg: string) => {
    toast.error(msg)
  }

  const filtered =
    tab === 'all' ? contracts : contracts.filter((c) => c.status === tab)

  const mapped = filtered.map((c) => ({
    id: c.id,
    venue: venueNames[c.venue_id] || `سالن #${c.venue_id}`,
    startDate: c.start_date,
    endDate: c.end_date,
    sessionsCount: countContractSessions(c.start_date, c.end_date, c.day_of_week, c.recurrence),
    pricePerSession: c.discounted_price,
    totalAmount: c.total_amount,
    status: (['active', 'expired', 'cancelled'].includes(c.status)
      ? c.status
      : 'active') as 'active' | 'expired' | 'cancelled',
  }))

  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="h4">
              قراردادهای بلندمدت
            </Typography>
            <Button
              variant="contained"
              onClick={openCreate}
              disabled={creating}
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
            قراردادهای بلندمدت خود را مدیریت کنید
          </Typography>
        </motion.div>

        <Tabs
          value={tab}
          onChange={(_, newValue: ContractTab) => setTab(newValue)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white !important',
              borderRadius: '8px',
            },
          }}
        >
          <Tab value="all" label="همه" />
          <Tab value="active" label="فعال" />
          <Tab value="expired" label="منقضی" />
          <Tab value="cancelled" label="لغو شده" />
        </Tabs>

        {error ? (
          <Alert
            severity="error"
            sx={{ borderRadius: '16px' }}
            action={
              <Button color="inherit" size="small" onClick={fetchData}>
                تلاش دوباره
              </Button>
            }
          >
            در دریافت قراردادها خطایی رخ داد. لطفاً دوباره تلاش کنید.
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
            ))}
          </Box>
        ) : mapped.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: '16px',
            }}
          >
            <Icon
              icon="mdi:file-document-remove-outline"
              className="h-12 w-12"
              style={{ color: 'rgba(0,0,0,0.2)' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              قراردادی یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              هنوز قراردادی در این بخش ندارید
            </Typography>
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
            contracts={mapped}
            onView={(id) => navigate(`/contracts/${id}`)}
          />
        )}
      </Box>

      {/* Create Contract Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '20px', maxHeight: '90vh' } }}
      >
        {creating ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ContractForm
            venues={venues}
            onSuccess={handleCreateSuccess}
            onError={handleCreateError}
          />
        )}
      </Dialog>
    </Layout>
  )
}

export default Contracts