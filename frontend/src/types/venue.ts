// مطابق با VenueResponse بک‌اند (snake_case)
export interface Venue {
  id: number
  name: string
  category: 'futsal' | 'gym'
  address: string
  latitude: number
  longitude: number
  phone: string | null
  description?: string | null
  amenities: string[]
  images: string[]
  price: number
  is_verified: boolean
  manager_id: number
  club_id?: number | null
  created_at: string
  manager_name?: string
  average_rating?: number
  total_reviews?: number
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
  price?: number
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