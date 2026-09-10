// src/pages/auth/VerifyEmail.tsx
import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Container, Box, Paper, Typography, Button, TextField, Alert, CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import { authService } from '@/services/auth'
import Layout from '@/components/layout/Layout'

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams()
  const prefillPhone = params.get('phone') || ''

  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState(prefillPhone)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^09[0-9]{9}$/.test(phone)) {
      toast.error('شماره موبایل معتبر وارد کنید')
      return
    }
    if (!email) {
      toast.error('ایمیل خود را وارد کنید')
      return
    }
    setLoading(true)
    try {
      const res = await authService.requestEmailVerify({ phone, email })
      if (res.dev_code) setDevCode(res.dev_code)
      toast.success('کد تایید ارسال شد')
      setStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ارسال کد')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[0-9]{6}$/.test(code)) {
      toast.error('کد ۶ رقمی را وارد کنید')
      return
    }
    setLoading(true)
    try {
      const res = await authService.confirmEmailVerify({ phone, code })
      toast.success(res.message)
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در تایید کد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
        <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '24px',
                border: `1px solid rgba(0,0,0,0.08)`,
                boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 64, height: 64, mx: 'auto', mb: 2,
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon icon="mdi:email-check-outline" style={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>تایید شماره و ایمیل</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  برای انجام رزرو، باید ایمیل یا شماره موبایل خود را تایید کنید
                </Typography>
              </Box>

              {success ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    ایمیل شما با موفقیت تایید شد. حالا می‌توانید رزرو کنید. 🎉
                  </Alert>
                  <Button component={Link} to="/venues" variant="contained" size="large"
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 4 }}>
                    مشاهده سالن‌ها
                  </Button>
                </Box>
              ) : step === 1 ? (
                <form onSubmit={handleRequestCode}>
                  <TextField
                    fullWidth label="شماره موبایل" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                    placeholder="09xxxxxxxxx"
                    sx={{ mb: 2, direction: 'ltr', '& input': { textAlign: 'right' } }}
                  />
                  <TextField
                    fullWidth label="ایمیل" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    sx={{ mb: 3, direction: 'ltr', '& input': { textAlign: 'right' } }}
                  />
                  <Button
                    type="submit" fullWidth variant="contained" size="large" disabled={loading}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, py: 1.4 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ارسال کد تایید'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleConfirm}>
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    کد ۶ رقمی را که به ایمیل <b>{email}</b> ارسال شد وارد کنید
                    {devCode && (
                      <Box sx={{ mt: 1, fontWeight: 700, direction: 'ltr' }}>
                        (حالت توسعه — کد: {devCode})
                      </Box>
                    )}
                  </Alert>
                  <TextField
                    fullWidth label="کد تایید" value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    sx={{ mb: 3, direction: 'ltr', '& input': { textAlign: 'center', letterSpacing: 8 } }}
                  />
                  <Button
                    type="submit" fullWidth variant="contained" size="large" disabled={loading}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, py: 1.4 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'تایید کد'}
                  </Button>
                  <Button
                    fullWidth color="inherit" sx={{ mt: 1, textTransform: 'none' }}
                    onClick={() => { setStep(1); setCode('') }}
                  >
                    ← تغییر ایمیل یا شماره
                  </Button>
                </form>
              )}
            </Paper>
          </motion.div>
        </Container>
      </Layout>
  )
}

export default VerifyEmail
