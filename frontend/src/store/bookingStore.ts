import { create } from 'zustand'
import { bookingService } from '@/services/booking'
import toast from 'react-hot-toast'

interface Booking {
  id: number
  venueId: number
  venueName: string
  slotId: number
  date: string
  time: string
  price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  userId: number
  createdAt: string
}

interface BookingStore {
  bookings: Booking[]
  isLoading: boolean
  total: number
  fetchBookings: (params?: any) => Promise<void>
  fetchUpcoming: (daysAhead?: number) => Promise<void>
  fetchPast: (limit?: number) => Promise<void>
  createBooking: (data: { venueId: number; slotId: number; date: string }) => Promise<void>
  cancelBooking: (id: number) => Promise<void>
  getBookingById: (id: number) => Booking | undefined
  clearBookings: () => void
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  isLoading: false,
  total: 0,

  fetchBookings: async (params?: any) => {
    set({ isLoading: true })
    try {
      const response = await bookingService.getAll(params)
      set({
        bookings: response.items || [],
        total: response.total || 0,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت رزروها')
    }
  },

  fetchUpcoming: async (daysAhead: number = 7) => {
    set({ isLoading: true })
    try {
      const bookings = await bookingService.getUpcoming(daysAhead)
      set({ bookings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت رزروهای آینده')
    }
  },

  fetchPast: async (limit: number = 20) => {
    set({ isLoading: true })
    try {
      const bookings = await bookingService.getPast(limit)
      set({ bookings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت رزروهای گذشته')
    }
  },

  createBooking: async (data: { venueId: number; slotId: number; date: string }) => {
    try {
      const booking = await bookingService.create(data)
      set((state) => ({
        bookings: [booking, ...state.bookings],
      }))
      toast.success('رزرو با موفقیت انجام شد!')
    } catch (error) {
      toast.error('خطا در رزرو')
      throw error
    }
  },

  cancelBooking: async (id: number) => {
    try {
      await bookingService.cancel(id)
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
      }))
      toast.success('رزرو لغو شد!')
    } catch (error) {
      toast.error('خطا در لغو رزرو')
      throw error
    }
  },

  getBookingById: (id: number) => {
    return get().bookings.find((b) => b.id === id)
  },

  clearBookings: () => {
    set({ bookings: [], total: 0 })
  },
}))