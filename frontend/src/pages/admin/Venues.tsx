import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { formatPrice } from '@/lib/utils'

const AdminVenues: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false)

  const venues = [
    { id: 1, name: 'سالن آبی', address: 'تهران، خیابان آزادی', manager: 'علی محمدی', price: 300000, status: 'تایید شده' },
    { id: 2, name: 'سالن سبز', address: 'تهران، خیابان ولیعصر', manager: 'سارا حسینی', price: 250000, status: 'در انتظار' },
    { id: 3, name: 'سالن قرمز', address: 'تهران، خیابان انقلاب', manager: 'رضا کریمی', price: 350000, status: 'تایید شده' },
  ]

  return (
    <Layout isAuthenticated userRole="admin" showSidebar>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                مدیریت سالن‌ها
              </Typography>
              <Typography color="text.secondary">
                مدیریت تمام سالن‌های فوتسال
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <Icon icon="mdi:plus" className="h-5 w-5 ml-2" />
              سالن جدید
            </Button>
          </Box>
        </motion.div>

        <Card sx={{ borderRadius: '16px' }}>
          <CardContent>
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                placeholder="جستجوی سالن..."
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:search" className="h-5 w-5 text-muted-foreground" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' },
                }}
              />
              <Button
                variant="contained"
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                }}
              >
                فیلتر
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>سالن</TableCell>
                    <TableCell>آدرس</TableCell>
                    <TableCell>مدیر</TableCell>
                    <TableCell>قیمت</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell>عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {venues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'primary.main',
                              fontSize: '0.75rem',
                            }}
                          >
                            {venue.name.slice(0, 2)}
                          </Avatar>
                          {venue.name}
                        </Box>
                      </TableCell>
                      <TableCell>{venue.address}</TableCell>
                      <TableCell>{venue.manager}</TableCell>
                      <TableCell>{formatPrice(venue.price)}</TableCell>
                      <TableCell>
                        <Chip
                          label={venue.status}
                          color={venue.status === 'تایید شده' ? 'success' : 'warning'}
                          size="small"
                          sx={{ borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                            onClick={() => setOpenDialog(true)}
                          >
                            ویرایش
                          </Button>
                          {venue.status === 'در انتظار' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              sx={{ borderRadius: '8px', textTransform: 'none' }}
                            >
                              تایید
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                          >
                            حذف
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
              <Pagination count={5} color="primary" shape="rounded" />
            </Box>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>ویرایش سالن</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="نام سالن" fullWidth />
              <TextField label="آدرس" fullWidth />
              <TextField label="مدیر سالن" fullWidth />
              <TextField label="قیمت هر جلسه" type="number" fullWidth />
              <FormControlLabel control={<Switch defaultChecked />} label="فعال" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>لغو</Button>
            <Button variant="contained" onClick={() => setOpenDialog(false)}>
              ذخیره تغییرات
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default AdminVenues