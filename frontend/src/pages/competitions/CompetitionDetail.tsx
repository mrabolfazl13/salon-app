import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Paper,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import CompetitionBid from '@/components/competition/CompetitionBid'
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils'

const CompetitionDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Mock competition data
  const competition = {
    id: 1,
    venue: 'سالن آبی',
    address: 'تهران، خیابان آزادی',
    date: '۱۴۰۲/۱۰/۱۵',
    time: '۱۷:۰۰ - ۱۸:۳۰',
    currentPrice: 300000,
    bestPrice: 250000,
    bidsCount: 8,
    timeLeft: '۲ ساعت',
    status: 'active' as const,
    createdAt: '۱۴۰۲/۱۰/۰۱ ۱۴:۳۰',
    description: 'رقابت قیمت برای سانس عصر سالن آبی. بهترین قیمت برنده خواهد شد.',
  }

  const bids = [
    { id: 1, manager: 'علی رضایی', price: 250000, time: '۱۴:۳۰' },
    { id: 2, manager: 'سارا حسینی', price: 270000, time: '۱۴:۰۰' },
    { id: 3, manager: 'رضا کریمی', price: 280000, time: '۱۳:۳۰' },
    { id: 4, manager: 'محمد نوروزی', price: 300000, time: '۱۳:۰۰' },
  ]

  const [bidModalOpen, setBidModalOpen] = useState(false)

  return (
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/competitions')}
            className="mb-4"
          >
            <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-2" />
            بازگشت به لیست رقابت‌ها
          </Button>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {competition.venue}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <Icon icon="mdi:map-marker" className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">
                          {competition.address}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={competition.status === 'active' ? 'فعال' : 'پایان یافته'}
                      color={competition.status === 'active' ? 'success' : 'default'}
                      sx={{ borderRadius: '8px' }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        تاریخ
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDate(competition.date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        ساعت
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {competition.time}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        زمان باقی‌مانده
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        {competition.timeLeft}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        تعداد پیشنهادات
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {competition.bidsCount}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box display="flex" gap={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        قیمت فعلی
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatPrice(competition.currentPrice)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        بهترین پیشنهاد
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {formatPrice(competition.bestPrice)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      پیشرفت رقابت
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((competition.bidsCount / 10) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: '4px',
                        mt: 0.5,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                          borderRadius: '4px',
                        },
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    پیشنهادات ثبت شده
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {bids.map((bid, index) => (
                      <Paper
                        key={bid.id}
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          bgcolor: index === 0 ? 'success.light' : 'grey.50',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {bid.manager.slice(0, 2)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {bid.manager}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bid.time}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="primary">
                          {formatPrice(bid.price)}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <CompetitionBid
                competitionId={competition.id}
                currentPrice={competition.currentPrice}
                bestPrice={competition.bestPrice}
                onBid={(price) => {
                  console.log('Bid placed:', price)
                  setBidModalOpen(false)
                }}
              />

              <Card sx={{ borderRadius: '16px', mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    اطلاعات رقابت
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:clock" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary="زمان ثبت" secondary={formatDateTime(competition.createdAt)} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:information" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary="توضیحات" secondary={competition.description} />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                    }}
                  >
                    <Icon icon="mdi:share" className="h-5 w-5 ml-2" />
                    اشتراک‌گذاری
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </Layout>
  )
}

export default CompetitionDetail