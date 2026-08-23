import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box, Typography, Grid, Button, Pagination,
  ToggleButton, ToggleButtonGroup, Container, Paper,
  InputBase, IconButton, Select, MenuItem, FormControl,
  Skeleton, useTheme,
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
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const navigate = useNavigate()
  const theme = useTheme()

  const getVenues = async () => {
    setLoading(true)
    try {
      const items = await venueService.getAll()
      if (items) setVenues(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { getVenues() }, [])

  const filteredVenues = venues
    .filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.address?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>سالن‌های فوتسال</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            بهترین سالن‌ها را پیدا و رزرو کنید
          </Typography>
        </Box>

        <Paper sx={{ borderRadius: 2, p: 2, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 0.75, flex: 1, minWidth: 200,
              bgcolor: 'grey.50',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              '&:focus-within': { border: `1px solid ${theme.palette.primary.main}` },
            }}>
              <Icon icon="mdi:magnify" className="h-4 w-4" style={{ color: theme.palette.text.secondary }} />
              <InputBase
                sx={{ flex: 1, fontSize: '0.875rem', direction: 'rtl' }}
                placeholder="جستجوی نام یا آدرس سالن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')}>
                  <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                </IconButton>
              )}
            </Box>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: 1, fontSize: '0.85rem' }}
              >
                <MenuItem value="default">مرتب‌سازی: پیش‌فرض</MenuItem>
                <MenuItem value="price-asc">قیمت: کم به زیاد</MenuItem>
                <MenuItem value="price-desc">قیمت: زیاد به کم</MenuItem>
                <MenuItem value="rating">محبوب‌ترین</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant={filterOpen ? 'contained' : 'outlined'}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 2 }}
              startIcon={<Icon icon="mdi:filter-variant" />}
            >
              فیلتر
            </Button>

            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: 1,
                  px: 2,
                  py: 0.75,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: `1px solid ${theme.palette.divider}`,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                  },
                },
              }}
            >
              <ToggleButton value="list">
                <Icon icon="mdi:view-list" className="h-4 w-4" />
                لیست
              </ToggleButton>
              <ToggleButton value="map">
                <Icon icon="mdi:map" className="h-4 w-4" />
                نقشه
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {filterOpen && (
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <VenueFilter />
          </Paper>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredVenues.length} سالن پیدا شد
        </Typography>

        {view === 'list' ? (
          <>
            {loading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredVenues.length === 0 ? (
              <Paper sx={{ borderRadius: 2, py: 8, textAlign: 'center' }}>
                <Icon icon="mdi:stadium-outline" className="h-10 w-10" style={{ color: theme.palette.text.disabled }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>سالنی یافت نشد</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                  با تغییر فیلترها یا جستجو می‌توانید سالن مورد نظر خود را پیدا کنید
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => { setSearch(''); setSortBy('default') }}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
                >
                  پاک کردن فیلترها
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2}>
                  {filteredVenues.map((venue) => (
                    <Grid key={venue.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <VenueCard
                        venue={venue}
                        onBook={(id) => navigate(`/venues/${id}`)}
                      />
                    </Grid>
                  ))}
                </Grid>
                {filteredVenues.length > 9 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={Math.ceil(filteredVenues.length / 9)}
                      color="primary"
                      shape="rounded"
                      sx={{ '& .MuiPaginationItem-root': { borderRadius: 1, fontWeight: 600 } }}
                    />
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
            <VenueMap
              venues={filteredVenues.map(v => ({
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
              height={600}
              onVenueClick={(venue) => navigate(`/venues/${venue.id}`)}
            />
          </Paper>
        )}
      </Container>
    </Layout>
  )
}

export default Venues