export interface Venue {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  description?: string
  amenities: string[]
  images: string[]
  price: number
  rating: number
  managerId: number
  clubId?: number
  isVerified: boolean
  status: 'available' | 'busy'
  createdAt: string
}

export interface VenueCreate {
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  description?: string
  amenities: string[]
  images: string[]
  price: number
}

export interface VenueUpdate extends Partial<VenueCreate> {}

export interface VenueFilter {
  search?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  isVerified?: boolean
  latitude?: number
  longitude?: number
  radius?: number
}