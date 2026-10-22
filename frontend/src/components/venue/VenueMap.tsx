// src/components/venue/VenueMap.tsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// آیکون‌های مارکر از بستهٔ محلی leaflet (بدون وابستگی به CDN)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Button } from '@/components/ui/shadcn/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface VenueDialogProps {
  venue: Venue | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VenueDialog: React.FC<VenueDialogProps> = ({ venue, open, onOpenChange }) => {
  const navigate = useNavigate()
  
  if (!venue) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-right">{venue.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 p-4 pt-2">
          {venue.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon icon="mdi:map-marker" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{venue.address}</span>
            </div>
          )}
          {venue.price != null && venue.price > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
              <span className="text-sm text-muted-foreground">قیمت هر سانس:</span>
              <span className="font-bold tabular-nums">
                {new Intl.NumberFormat('fa-IR').format(venue.price)} ریال
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                venue.isVerified
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
              )}
            >
              {venue.isVerified ? 'تایید شده' : 'در انتظار تایید'}
            </span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                navigate(`/venues/${venue.id}`)
              }}
              className="flex-1"
            >
              مشاهده جزئیات
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                navigate(`/venues/${venue.id}/booking`)
              }}
              className="flex-1"
            >
              رزرو کنید
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Fix Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface Venue {
  id: number
  name: string
  lat: number
  lng: number
  isVerified?: boolean
  address?: string
  price?: number
}

interface VenueMapProps {
  venues: Venue[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: number | string
}

// Component to handle map center updates
const MapCenterUpdater: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom)
  }, [center, zoom, map])

  return null
}

// Custom marker icon based on verification status
const getMarkerIcon = (isVerified: boolean) => {
  const color = isVerified ? '#22c55e' : '#f59e0b'

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
  center = { lat: 34.6427, lng: 50.8814 },
  zoom = 13,
  height = 400,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [, setMapReady] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
      )) / 10))
    : zoom

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
        style={{ height }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span
              className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"
              role="status"
              aria-label="در حال بارگذاری"
            />
          </div>
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
                  icon={getMarkerIcon(Boolean(venue.isVerified))}
                  eventHandlers={{
                    click: () => {
                      setSelectedVenue(venue)
                      setDialogOpen(true)
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-[220px] p-2" style={{ direction: 'rtl' }}>
                      <p className="text-base font-semibold">
                        {venue.name}
                      </p>
                      {venue.address && (
                        <p className="my-1 flex items-start gap-1 text-xs text-muted-foreground">
                          <Icon icon="mdi:map-marker" className="mt-0.5 h-3 w-3 shrink-0" />
                          {venue.address}
                        </p>
                      )}
                      {venue.price != null && venue.price > 0 && (
                        <p className="mt-1 text-sm font-medium">
                          {new Intl.NumberFormat('fa-IR').format(venue.price)} ریال
                        </p>
                      )}
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          venue.isVerified
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
                        )}
                      >
                        {venue.isVerified ? 'تایید شده' : 'در انتظار تایید'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend — مطابق رنگ مارکرها (وضعیت تأیید سالن) */}
            <div className="absolute bottom-4 start-4 z-[1000] flex flex-col gap-1 rounded-xl bg-card p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white bg-[#22c55e] shadow-[0_2px_6px_rgba(34,197,94,0.4)]" />
                <span className="text-xs">
                  تأیید شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white bg-[#f59e0b] shadow-[0_2px_6px_rgba(245,158,11,0.4)]" />
                <span className="text-xs">
                  در انتظار تایید
                </span>
              </div>
            </div>

            {/* Venue count badge */}
            <div className="absolute top-4 start-4 z-[1000] flex items-center gap-2 rounded-xl bg-card px-4 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <Icon icon="mdi:map-marker" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold">
                {venues.length} سالن
              </span>
            </div>
          </>
        )}
      </div>

      {/* Venue Details Dialog */}
      <VenueDialog
        venue={selectedVenue}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </motion.div>
  )
}

export default VenueMap
