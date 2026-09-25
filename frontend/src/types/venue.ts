// مطابق با VenueResponse بک‌اند (snake_case)

// روش‌های پرداخت سالن — مطابق VenuePaymentMode بک‌اند
export type VenuePaymentMode = 'gateway' | 'bank_receipt' | 'pay_in_place'

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
  /** روش پرداخت سالن — پیش‌فرض بک‌اند: bank_receipt */
  payment_mode?: VenuePaymentMode | null
  default_slot_price?: number | null
}

export interface VenueCreate {
  name: string
  category?: 'futsal' | 'gym'
  address: string
  latitude: number
  longitude: number
  phone?: string | null
  description?: string
  amenities: string[]
  images: string[]
  price?: number
  default_slot_price?: number | null
  payment_mode?: VenuePaymentMode
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