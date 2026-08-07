import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { formatDate } from '@/lib/utils'

const Profile: React.FC = () => {
  const [tab, setTab] = useState(0)

  const user = {
    name: 'علی محمدی',
    email: 'ali@example.com',
    phone: '09123456789',
    joinDate: '۱۴۰۲/۰۱/۰۱',
    role: 'کاربر عادی',
  }

  return (
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
            پروفایل کاربری
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {user.name.slice(0, 2)}
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.role}
                </Typography>
                <Chip
                  label="تایید شده"
                  color="success"
                  size="small"
                  sx={{ mt: 1, borderRadius: '8px' }}
                />
                <Divider sx={{ my: 2 }} />
                <Box textAlign="right" sx={{ spaceY: 1 }}>
                  <Typography variant="body2">
                    <Icon icon="mdi:email" className="h-4 w-4 inline ml-2" />
                    {user.email}
                  </Typography>
                  <Typography variant="body2">
                    <Icon icon="mdi:phone" className="h-4 w-4 inline ml-2" />
                    {user.phone}
                  </Typography>
                  <Typography variant="body2">
                    <Icon icon="mdi:calendar" className="h-4 w-4 inline ml-2" />
                    عضویت: {user.joinDate}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 2,
                    borderRadius: '10px',
                    textTransform: 'none',
                    color: 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      bgcolor: 'error.light',
                    },
                  }}
                >
                  <Icon icon="mdi:logout" className="h-4 w-4 ml-2" />
                  خروج از حساب
                </Button>
              </Card>
            </motion.div>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
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
                    <Tab label="اطلاعات شخصی" />
                    <Tab label="تغییر رمز عبور" />
                  </Tabs>

                  {tab === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box component="form" sx={{ spaceY: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="نام کامل"
                              defaultValue={user.name}
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="ایمیل"
                              defaultValue={user.email}
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="شماره موبایل"
                              defaultValue={user.phone}
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                        <Button
                          variant="contained"
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            mt: 2,
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          }}
                        >
                          ذخیره تغییرات
                        </Button>
                      </Box>
                    </motion.div>
                  )}

                  {tab === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box component="form" sx={{ spaceY: 3 }}>
                        <TextField
                          label="رمز عبور فعلی"
                          type="password"
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                            },
                          }}
                        />
                        <TextField
                          label="رمز عبور جدید"
                          type="password"
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                            },
                          }}
                        />
                        <TextField
                          label="تکرار رمز عبور جدید"
                          type="password"
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            mt: 2,
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          }}
                        >
                          تغییر رمز عبور
                        </Button>
                      </Box>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default Profile