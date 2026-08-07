import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'

interface VenueFilterProps {
  onFilter?: (filters: any) => void
}

const VenueFilter: React.FC<VenueFilterProps> = ({ onFilter }) => {
  const [priceRange, setPriceRange] = useState<number[]>([100000, 500000])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const amenities = ['پارکینگ', 'کافه', 'دوش', 'سالن انتظار', 'تلویزیون', 'سیستم صوتی']

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper        sx={{
          p: 3,
          borderRadius: '16px',
          mb: 3,
        }}
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            placeholder="جستجوی سالن..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:search" className="h-5 w-5 text-muted-foreground" />
                </InputAdornment>
              ),
              sx: { borderRadius: '10px' },
            }}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              محدوده قیمت
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, newValue) => setPriceRange(newValue as number[])}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatPrice(value)}
              min={50000}
              max={1000000}
              step={50000}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  borderRadius: '8px',
                },
              }}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {formatPrice(priceRange[0])}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPrice(priceRange[1])}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              امکانات
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {amenities.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  color={selectedAmenities.includes(amenity) ? 'primary' : 'default'}
                  sx={{
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => onFilter?.({ priceRange, amenities: selectedAmenities })}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              اعمال فیلتر
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setPriceRange([100000, 500000])
                setSelectedAmenities([])
              }}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
              }}
            >
              پاک کردن
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  )
}

export default VenueFilter