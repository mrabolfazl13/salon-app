export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Booking {
  id: number
  venueId: number
  venueName: string
  slotId: number
  date: string
  time: string
  price: number
  status: BookingStatus
  userId: number
  createdAt: string
}

export interface BookingCreate {
  venueId: number
  slotId: number
  date: string
}

export interface BookingUpdate {
  status?: BookingStatus
}