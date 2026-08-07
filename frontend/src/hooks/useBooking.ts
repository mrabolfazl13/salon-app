import { useState } from 'react'
import { create } from 'zustand'
import toast from 'react-hot-toast'

interface Booking {
  id: number
  venueId: number
  venueName: string
  date: string
  time: string
  price: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
}

interface BookingState {
  bookings: Booking[]
  isLoading: boolean
  fetchBookings: () => Promise<void>
  createBooking: (data: any) => Promise<void>
  cancelBooking: (id: number) => Promise<void>
  getBookingById: (id: number) => Booking | undefined
}

export const useBooking = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: false,

  fetchBookings: async () => {
    set({ isLoading: true })
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockBookings: Booking[] = [
        {
          id: 1,
          venueId: 1,
          venueName: 'سالن آبی',
          date: '۱۴۰۲/۱۰/۱۵',
          time: '۱۷:۰۰ - ۱۸:۳۰',
          price: 300000,
          status: 'confirmed',
        },
        {
          id: 2,
          venueId: 2,
          venueName: 'سالن سبز',
          date: '۱۴۰۲/۱۰/۱۶',
          time: '۱۹:۳۰ - ۲۱:۰۰',
          price: 250000,
          status: 'pending',
        },
      ]
      
      set({ bookings: mockBookings, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت رزروها')
    }
  },

  createBooking: async (data: any) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('رزرو با موفقیت انجام شد!')
    } catch (error) {
      toast.error('خطا در رزرو')
    }
  },

  cancelBooking: async (id: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const { bookings } = get()
      set({
        bookings: bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
      })
      toast.success('رزرو لغو شد!')
    } catch (error) {
      toast.error('خطا در لغو رزرو')
    }
  },

  getBookingById: (id: number) => {
    return get().bookings.find((b) => b.id === id)
  },
}))