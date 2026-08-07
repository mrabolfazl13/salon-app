import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Rating,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'

interface VenueCardProps {
  venue: {
    id: number
    name: string
    address: string
    images: string[]
    price: number
    rating: number
    amenities: string[]
    status: 'available' | 'busy'
  }
  onBook?: (id: number) => void
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, onBook }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img
            src={venue.images[0]}
            alt={venue.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
          <Chip
            label={venue.status === 'available' ? 'آزاد' : 'پر'}
            color={venue.status === 'available' ? 'success' : 'error'}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              borderRadius: '8px',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: 'white', fontWeight: 600 }}
            >
              {venue.name}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon icon="mdi:map-marker" className="h-4 w-4 text-muted-foreground" />
            <Typography variant="body2" color="text.secondary">
              {venue.address}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <Rating value={venue.rating} precision={0.5} size="small" readOnly />
            <Typography variant="caption" color="text.secondary">
              ({venue.rating})
            </Typography>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {venue.amenities.slice(0, 3).map((amenity) => (
              <Chip
                key={amenity}
                label={amenity}
                size="small"
                variant="outlined"
                sx={{ borderRadius: '6px' }}
              />
            ))}
            {venue.amenities.length > 3 && (
              <Chip
                label={`+${venue.amenities.length - 3}`}
                size="small"
                sx={{ borderRadius: '6px' }}
              />
            )}
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 'auto' }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                قیمت هر جلسه
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatPrice(venue.price)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => onBook?.(venue.id)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              رزرو
              <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-1" />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default VenueCard