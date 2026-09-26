import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { checkinService } from '@/services/checkin'
import toast from 'react-hot-toast'

const ManagerCheckin: React.FC = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    booking_id?: number
    venue_name?: string
    user_name?: string
  } | null>(null)

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('لطفاً کد را وارد کنید')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const data = await checkinService.verifyCheckIn(code.trim().toUpperCase())
      setResult({
        success: true,
        message: data.message,
        booking_id: data.booking_id,
        venue_name: data.venue_name,
        user_name: data.user_name,
      })
      toast.success(data.message)
      setCode('')
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.detail || 'کد نامعتبر است یا قبلاً استفاده شده',
      })
      toast.error(err.response?.data?.detail || 'کد نامعتبر است')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon="mdi:qrcode-scan" width={40} height={40} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ثبت ورود با کد QR
              </Typography>
              <Typography variant="body2" color="text.secondary">
                کد ارائه‌شده توسط کاربر را وارد کنید
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Input Section */}
        <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="کد Check-in"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="مثال: A3F9K2L7M1X5"
              fullWidth
              disabled={loading}
              autoComplete="off"
              inputProps={{
                style: {
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: '1.25rem',
                  textAlign: 'center',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={loading || !code.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Icon icon="mdi:check-circle" />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              {loading ? 'در حال بررسی...' : 'ثبت ورود'}
            </Button>
          </Box>
        </Paper>

        {/* Result Section */}
        {result && (
          <Alert
            severity={result.success ? 'success' : 'error'}
            sx={{ borderRadius: 2, mb: 3 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {result.message}
            </Typography>
            {result.success && result.venue_name && (
              <Typography variant="body2">
                سالن: {result.venue_name}
              </Typography>
            )}
            {result.success && result.user_name && (
              <Typography variant="body2">
                کاربر: {result.user_name}
              </Typography>
            )}
            {result.success && result.booking_id && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/bookings/${result.booking_id}`)}
                sx={{ mt: 1, borderRadius: 1, textTransform: 'none' }}
                startIcon={<Icon icon="mdi:eye" />}
              >
                مشاهده رزرو
              </Button>
            )}
          </Alert>
        )}

        {/* Instructions */}
        <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            راهنما
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              • کاربران کد ۱۲ رقمی را از صفحه جزئیات رزرو خود دریافت می‌کنند
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • هر کد فقط یک بار قابل استفاده است
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • پس از ثبت موفق، زمان ورود در سیستم ذخیره می‌شود
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • کد به صورت حروف بزرگ و بدون فاصله وارد شود
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Layout>
  )
}

export default ManagerCheckin
