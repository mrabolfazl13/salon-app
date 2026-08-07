import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import VenueCard from '@/components/venue/VenueCard'
import VenueFilter from '@/components/venue/VenueFilter'
import VenueMap from '@/components/venue/VenueMap'
import { venueService } from '@/services/venue'
import { Venue } from '@/types'
import { useNavigate } from 'react-router-dom'

const Venues: React.FC = () => {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const navigate = useNavigate()

  const getVenues = async () => {
    const items = await venueService.getAll()
    if(items) setVenues(items)
  }
  useEffect(
    () => {
      getVenues();
    }, [])
  

  return (
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              سالن‌های فوتسال
            </Typography>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, newView) => newView && setView(newView)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '8px',
                  px: 2,
                  py: 0.75,
                  border: 'none',
                },
                '& .Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <ToggleButton value="list">
                <Icon icon="mdi:view-list" className="h-5 w-5" />
              </ToggleButton>
              <ToggleButton value="map">
                <Icon icon="mdi:map" className="h-5 w-5" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            بهترین سالن‌های فوتسال را پیدا کنید
          </Typography>
        </motion.div>

        {/* Search & Filter */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 4,
          }}
        >
          <TextField
            placeholder="جستجوی سالن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:search" className="h-5 w-5 text-muted-foreground" />
                </InputAdornment>
              ),
              sx: { borderRadius: '12px' },
            }}
          />

          <Button
            variant="outlined"
            onClick={() => setFilterOpen(!filterOpen)}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
            }}
          >
            <Icon icon="mdi:filter" className="h-5 w-5 ml-2" />
            فیلتر
          </Button>

          <Button
            variant="contained"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 4,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            }}
          >
            <Icon icon="mdi:plus" className="h-5 w-5 ml-2" />
            سالن جدید
          </Button>
        </Box>

        {/* Filter Panel */}
        {filterOpen && <VenueFilter />}

        {/* View */}
        {view === 'list' ? (
          <>
            <Grid container spacing={3}>
              {venues.map((venue, index) => (
                <Grid item xs={12} sm={6} md={4} key={venue.id}>
                  <VenueCard
                    venue={venue}
                    onBook={(id) => console.log('Book venue:', id)}
                  />
                </Grid>
              ))}
            </Grid>

            <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
              <Pagination count={5} color="primary" shape="rounded" />
            </Box>
          </>
        ) : (
          <VenueMap
            venues={venues.map(v => ({
              id: v.id,
              name: v.name,
              lat: v.latitude,
              lng: v.longitude,
              status: v.status,
              address: v.address,
              price: v.price,
            }))}
            center={{ lat: 34.6427, lng: 50.8814 }}
            zoom={12}
            height={500}
            onVenueClick={(venue) => {
              navigate(`/venues/${venue.id}`)
            }}
          />
        )}
      </Box>
    </Layout>
  )
}

export default Venues