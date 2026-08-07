import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Slider,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CompetitionBidProps {
  competitionId: number
  currentPrice: number
  bestPrice: number
  minBid?: number
  onBid?: (price: number) => void
}

const CompetitionBid: React.FC<CompetitionBidProps> = ({
  competitionId,
  currentPrice,
  bestPrice,
  minBid = 10000,
  onBid,
}) => {
  const [loading, setLoading] = useState(false)
  const [bidPrice, setBidPrice] = useState(bestPrice - minBid)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (bidPrice >= bestPrice) {
      setError('قیمت پیشنهادی باید کمتر از بهترین پیشنهاد باشد')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('پیشنهاد شما با موفقیت ثبت شد!')
      onBid?.(bidPrice)
    } catch (error) {
      setError('خطا در ثبت پیشنهاد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: '16px',
        }}
      >
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          ثبت پیشنهاد
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          بهترین پیشنهاد فعلی: {formatPrice(bestPrice)}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            قیمت پیشنهادی: {formatPrice(bidPrice)}
          </Typography>
          <Slider
            value={bidPrice}
            onChange={(_, newValue) => setBidPrice(newValue as number)}
            min={minBid}
            max={bestPrice - minBid}
            step={10000}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => formatPrice(value)}
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                borderRadius: '8px',
              },
            }}
          />
        </Box>

        <TextField
          type="number"
          value={bidPrice}
          onChange={(e) => setBidPrice(Number(e.target.value))}
          fullWidth
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:currency-usd" className="h-5 w-5 text-muted-foreground" />
              </InputAdornment>
            ),
          }}
        />

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={handleSubmit}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              py: 1.5,
            }}
          >
            {loading ? (
              <CircularProgress size={24} className="text-white" />
            ) : (
              <>
                <Icon icon="mdi:gavel" className="h-5 w-5 ml-2" />
                ثبت پیشنهاد
              </>
            )}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  )
}

export default CompetitionBid