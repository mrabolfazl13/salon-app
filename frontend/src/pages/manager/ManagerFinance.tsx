import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

interface FinanceSummary {
  total_income: number
  total_expense: number
  net_profit: number
  transaction_count: number
}

interface ExpenseCategory {
  id: number
  name: string
  is_fixed: boolean
}

interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  description: string
  category_id?: number
  category_name?: string
  date: string
  created_at: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

const ManagerFinance: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Form state
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  
  // TODO: In Phase 1, fetch manager's venues and allow selection
  // For now, use first venue ID if available, otherwise show warning
  const managerVenueId = user?.role === 'venue_manager' ? undefined : undefined // Will be implemented in Phase 1

  useEffect(() => {
    fetchSummary()
    fetchCategories()
    fetchTransactions()
  }, [selectedMonth])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/finance/summary/monthly?month=${selectedMonth}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      const data = await response.json()
      setSummary(data)
    } catch (err: any) {
      toast.error(err.message || 'خطا در دریافت خلاصه مالی')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/finance/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/v1/finance/transactions?from_date=${selectedMonth}-01&to_date=${selectedMonth}-31`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data.items || [])
    } catch (err: any) {
      toast.error(err.message || 'خطا در دریافت تراکنش‌ها')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !description) {
      toast.error('لطفاً مبلغ و توضیحات را وارد کنید')
      return
    }

    if (txType === 'expense' && !categoryId) {
      toast.error('لطفاً دسته‌بندی را انتخاب کنید')
      return
    }

    try {
      setLoading(true)
      
      // Validate venue_id before submission
      if (!managerVenueId && user?.role === 'venue_manager') {
        toast.error('شناسه سالن یافت نشد. لطفاً با پشتیبانی تماس بگیرید.')
        return
      }
      
      const payload = {
        type: txType,
        amount: parseInt(amount),
        description,
        category_id: categoryId ? parseInt(categoryId) : undefined,
        venue_id: managerVenueId, // Will be set from user context in Phase 1
        date: txDate,
      }

      const response = await fetch('/api/v1/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'خطا در ثبت تراکنش')
      }

      toast.success('تراکنش با موفقیت ثبت شد')
      setAmount('')
      setCategoryId('')
      setDescription('')
      fetchSummary()
      fetchTransactions()
    } catch (err: any) {
      toast.error(err.message || 'خطا در ثبت تراکنش')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            مدیریت مالی
          </Typography>
          <Typography variant="body2" color="text.secondary">
            مشاهده خلاصه درآمد و هزینه‌ها و ثبت تراکنش‌های جدید
          </Typography>
        </Box>

        {/* Month Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            label="ماه"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            size="small"
          />
        </Paper>

        {/* Summary Cards */}
        {loading && !summary ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : summary ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon icon="mdi:trending-up" width={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      کل درآمد
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.total_income)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon icon="mdi:trending-down" width={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      کل هزینه
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.total_expense)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  bgcolor: summary.net_profit >= 0 ? 'primary.light' : 'warning.light',
                  color: summary.net_profit >= 0 ? 'primary.contrastText' : 'warning.contrastText',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon icon="mdi:calculator" width={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      سود خالص
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.net_profit)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.100' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon icon="mdi:receipt-text" width={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      تعداد تراکنش
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.transaction_count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}

        {/* Add Transaction Form */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ثبت تراکنش جدید
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع تراکنش</InputLabel>
                  <Select
                    value={txType}
                    label="نوع تراکنش"
                    onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  >
                    <MenuItem value="income">درآمد</MenuItem>
                    <MenuItem value="expense">هزینه</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="مبلغ (ریال)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  size="small"
                  required
                />
              </Grid>

              {txType === 'expense' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>دسته‌بندی</InputLabel>
                    <Select
                      value={categoryId}
                      label="دسته‌بندی"
                      onChange={(e) => setCategoryId(e.target.value)}
                      required={txType === 'expense'}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="تاریخ"
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  size="small"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="توضیحات"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="small"
                  multiline
                  rows={2}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Icon icon="mdi:plus" />}
                >
                  {loading ? 'در حال ثبت...' : 'ثبت تراکنش'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Transactions List */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            لیست تراکنش‌ها
          </Typography>
          {transactions.length === 0 ? (
            <Alert severity="info">هیچ تراکنشی در این ماه ثبت نشده است</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>تاریخ</TableCell>
                  <TableCell>نوع</TableCell>
                  <TableCell>دسته‌بندی</TableCell>
                  <TableCell>مبلغ</TableCell>
                  <TableCell>توضیحات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type === 'income' ? 'درآمد' : 'هزینه'}
                        color={tx.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{tx.category_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Container>
    </Layout>
  )
}

export default ManagerFinance
