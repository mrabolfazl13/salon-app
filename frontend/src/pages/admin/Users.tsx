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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import Layout from '@/components/layout/Layout'

const Users: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  const users = [
    { id: 1, name: 'علی محمدی', email: 'ali@example.com', phone: '09123456789', role: 'کاربر عادی', status: 'فعال', date: '۱۴۰۲/۱۰/۱۵' },
    { id: 2, name: 'سارا حسینی', email: 'sara@example.com', phone: '09123456788', role: 'مدیر سالن', status: 'فعال', date: '۱۴۰۲/۱۰/۱۴' },
    { id: 3, name: 'رضا کریمی', email: 'reza@example.com', phone: '09123456787', role: 'ادمین', status: 'غیرفعال', date: '۱۴۰۲/۱۰/۱۳' },
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
                مدیریت کاربران
              </Typography>
              <Typography color="text.secondary">
                مدیریت تمام کاربران سیستم
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
              کاربر جدید
            </Button>
          </Box>
        </motion.div>

        <Card sx={{ borderRadius: '16px' }}>
          <CardContent>
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                placeholder="جستجوی کاربر..."
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
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>نقش</InputLabel>
                <Select label="نقش" sx={{ borderRadius: '10px' }}>
                  <MenuItem value="all">همه</MenuItem>
                  <MenuItem value="user">کاربر عادی</MenuItem>
                  <MenuItem value="manager">مدیر سالن</MenuItem>
                  <MenuItem value="admin">ادمین</MenuItem>
                </Select>
              </FormControl>
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
                    <TableCell>کاربر</TableCell>
                    <TableCell>ایمیل</TableCell>
                    <TableCell>شماره</TableCell>
                    <TableCell>نقش</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell>عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
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
                            {user.name.slice(0, 2)}
                          </Avatar>
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            bgcolor: user.role === 'ادمین' ? 'primary.main' : 'grey.200',
                            color: user.role === 'ادمین' ? 'white' : 'inherit',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={user.status === 'فعال' ? 'success' : 'default'}
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
                            onClick={() => {
                              setSelectedUser(user.id)
                              setOpenDialog(true)
                            }}
                          >
                            ویرایش
                          </Button>
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
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>ویرایش کاربر</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="نام کامل" fullWidth />
              <TextField label="ایمیل" type="email" fullWidth />
              <TextField label="شماره موبایل" fullWidth />
              <FormControl fullWidth>
                <InputLabel>نقش</InputLabel>
                <Select label="نقش">
                  <MenuItem value="user">کاربر عادی</MenuItem>
                  <MenuItem value="manager">مدیر سالن</MenuItem>
                  <MenuItem value="admin">ادمین</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>وضعیت</InputLabel>
                <Select label="وضعیت">
                  <MenuItem value="active">فعال</MenuItem>
                  <MenuItem value="inactive">غیرفعال</MenuItem>
                </Select>
              </FormControl>
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

export default Users