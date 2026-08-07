import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import CompetitionCard from '@/components/competition/CompetitionCard'

const Competitions: React.FC = () => {
  const competitions = [
    {
      id: 1,
      venue: 'سالن آبی',
      date: '۱۴۰۲/۱۰/۱۵',
      time: '۱۷:۰۰',
      currentPrice: 300000,
      bestPrice: 250000,
      bidsCount: 5,
      timeLeft: '۲ ساعت',
      status: 'active' as const,
    },
    {
      id: 2,
      venue: 'سالن سبز',
      date: '۱۴۰۲/۱۰/۱۶',
      time: '۱۹:۳۰',
      currentPrice: 280000,
      bestPrice: 220000,
      bidsCount: 8,
      timeLeft: '۵ ساعت',
      status: 'active' as const,
    },
    {
      id: 3,
      venue: 'سالن قرمز',
      date: '۱۴۰۲/۱۰/۱۰',
      time: '۲۱:۰۰',
      currentPrice: 350000,
      bestPrice: 300000,
      bidsCount: 3,
      timeLeft: 'پایان یافته',
      status: 'ended' as const,
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
              رقابت‌های قیمت
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
              رقابت جدید
            </Button>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            در رقابت‌ها شرکت کنید و بهترین قیمت را بدست آورید
          </Typography>
        </motion.div>

        <Grid container spacing={3}>
          {competitions.map((competition) => (
            <Grid item xs={12} key={competition.id}>
              <CompetitionCard
                competition={competition}
                onBid={(id) => console.log('Bid on competition:', id)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  )
}

export default Competitions