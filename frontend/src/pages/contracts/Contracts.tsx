import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ContractList from '@/components/contract/ContractList'

const Contracts: React.FC = () => {
  const [tab, setTab] = useState(0)

  const contracts = [
    {
      id: 1,
      venue: 'سالن آبی',
      startDate: '۱۴۰۲/۰۱/۰۱',
      endDate: '۱۴۰۲/۱۲/۲۹',
      sessionsCount: 52,
      pricePerSession: 250000,
      totalAmount: 13000000,
      status: 'active' as const,
    },
    {
      id: 2,
      venue: 'سالن سبز',
      startDate: '۱۴۰۱/۰۶/۰۱',
      endDate: '۱۴۰۲/۰۵/۳۰',
      sessionsCount: 48,
      pricePerSession: 220000,
      totalAmount: 10560000,
      status: 'expired' as const,
    },
    {
      id: 3,
      venue: 'سالن قرمز',
      startDate: '۱۴۰۲/۰۷/۰۱',
      endDate: '۱۴۰۲/۱۰/۰۱',
      sessionsCount: 12,
      pricePerSession: 300000,
      totalAmount: 3600000,
      status: 'cancelled' as const,
    },
  ]

  return (
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="h4" fontWeight={700}>
              قراردادهای بلندمدت
            </Typography>
            <Button
              variant="contained"
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
          onChange={(_, newValue) => setTab(newValue)}
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
          <Tab label="همه" />
          <Tab label="فعال" />
          <Tab label="منقضی" />
          <Tab label="لغو شده" />
        </Tabs>

        <ContractList
          contracts={contracts}
          onView={(id) => console.log('View contract:', id)}
        />
      </Box>
    </Layout>
  )
}

export default Contracts