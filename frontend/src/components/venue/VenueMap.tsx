// src/components/venue/VenueMap.tsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  useTheme,
  CircularProgress,
} from '@mui/material'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Venue {
  id: number
  name: string
  lat: number
  lng: number
  status: string
  address?: string
  price?: number
}

interface VenueMapProps {
  venues: Venue[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: number | string
  onVenueClick?: (venue: Venue) => void
}

// Component to handle map center updates
const MapCenterUpdater: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom)
  }, [center, zoom, map])
  
  return null
}

// Custom marker icon based on status
const getMarkerIcon = (status: string) => {
  const color = status === 'available' ? '#22c55e' : '#ef4444'
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px ${color}66;
        border: 3px solid white;
        transition: all 0.3s ease;
        cursor: pointer;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

const VenueMap: React.FC<VenueMapProps> = ({
  venues,
  center = {lat: 34.6427, lng: 50.8814 },
  zoom = 13,
  height = 400,
  onVenueClick,
}) => {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      setMapReady(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Calculate bounds for better view
  const getBounds = () => {
    if (venues.length === 0) return null
    
    const lats = venues.map(v => v.lat)
    const lngs = venues.map(v => v.lng)
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    }
  }

  const bounds = getBounds()
  const mapCenter = bounds
    ? {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2,
      }
    : center

  const mapZoom = bounds
    ? Math.max(12, Math.min(16, 12 - Math.log(Math.max(
        (bounds.maxLat - bounds.minLat) * 111,
        (bounds.maxLng - bounds.minLng) * 85
      ) / 10)))
    : zoom

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <Paper
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: height,
          position: 'relative',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {isLoading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%' }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              whenReady={() => setMapReady(true)}
            >
              <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
              
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Venue markers */}
              {venues.map((venue) => (
                <Marker
                  key={venue.id}
                  position={[venue.lat, venue.lng]}
                  icon={getMarkerIcon(venue.status)}
                  eventHandlers={{
                    click: () => onVenueClick?.(venue),
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200, p: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {venue.name}
                      </Typography>
                      {venue.address && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          <Icon icon="mdi:map-marker" className="h-3 w-3 inline" />
                          {venue.address}
                        </Typography>
                      )}
                      {venue.price && (
                        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                          {new Intl.NumberFormat('fa-IR').format(venue.price)} تومان
                        </Typography>
                      )}
                      <Chip
                        label={venue.status === 'available' ? 'آزاد' : 'پر'}
                        color={venue.status === 'available' ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: 'background.paper',
                borderRadius: '12px',
                p: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                zIndex: 1000,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#22c55e',
                    border: '2px solid white',
                    boxShadow: '0 2px 6px rgba(34,197,94,0.4)',
                  }}
                />
                <Typography variant="caption" fontSize="0.7rem">
                  آزاد
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#ef4444',
                    border: '2px solid white',
                    boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                  }}
                />
                <Typography variant="caption" fontSize="0.7rem">
                  پر
                </Typography>
              </Box>
            </Box>

            {/* Venue count badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'background.paper',
                borderRadius: '12px',
                px: 2,
                py: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Icon icon="mdi:map-marker" className="h-4 w-4 text-primary" />
              <Typography variant="caption" fontWeight={600}>
                {venues.length} سالن
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </motion.div>
  )
}

export default VenueMap