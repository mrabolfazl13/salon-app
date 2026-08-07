import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'

interface TimeSlot {
  id: number
  startTime: string
  endTime: string
  price: number
  available: boolean
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  onSelect?: (slot: TimeSlot) => void
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, onSelect }) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (slot: TimeSlot) => {
    setSelected(slot.id)
    onSelect?.(slot)
  }

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
        انتخاب سانس
      </Typography>
      <Grid container spacing={2}>
        {slots.map((slot, index) => (
          <Grid item xs={6} sm={4} md={3} key={slot.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Paper
                elevation={selected === slot.id ? 4 : 1}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: '12px',
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                  opacity: slot.available ? 1 : 0.5,
                  border: selected === slot.id ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: slot.available ? 'translateY(-4px)' : 'none',
                    boxShadow: slot.available ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                  },
                }}
                onClick={() => slot.available && handleSelect(slot)}
              >
                <Typography variant="body2" fontWeight={600}>
                  {slot.startTime} - {slot.endTime}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(slot.price)}
                </Typography>
                {!slot.available && (
                  <Chip
                    label="پر"
                    size="small"
                    color="error"
                    sx={{ mt: 1, borderRadius: '6px' }}
                  />
                )}
                {selected === slot.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Icon icon="mdi:check-circle" className="h-5 w-5 text-primary mx-auto mt-1" />
                  </motion.div>
                )}
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default TimeSlotPicker