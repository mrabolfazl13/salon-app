import { create } from 'zustand'
import { venueService } from '@/services/venue'
import toast from 'react-hot-toast'

interface Venue {
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

interface VenueStore {
  venues: Venue[]
  myVenues: Venue[]
  selectedVenue: Venue | null
  isLoading: boolean
  total: number
  fetchVenues: (params?: any) => Promise<void>
  fetchMyVenues: () => Promise<void>
  fetchVenueById: (id: number) => Promise<void>
  createVenue: (data: any) => Promise<void>
  updateVenue: (id: number, data: any) => Promise<void>
  deleteVenue: (id: number) => Promise<void>
  verifyVenue: (id: number) => Promise<void>
  clearSelectedVenue: () => void
}

export const useVenueStore = create<VenueStore>((set) => ({
  venues: [],
  myVenues: [],
  selectedVenue: null,
  isLoading: false,
  total: 0,

  fetchVenues: async (params?: any) => {
    set({ isLoading: true })
    try {
      const response = await venueService.getAll(params)
      set({
        venues: response.items || [],
        total: response.total || 0,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت سالن‌ها')
    }
  },

  fetchMyVenues: async () => {
    set({ isLoading: true })
    try {
      const venues = await venueService.getMyVenues()
      set({ myVenues: venues, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت سالن‌های شما')
    }
  },

  fetchVenueById: async (id: number) => {
    set({ isLoading: true })
    try {
      const venue = await venueService.getById(id)
      set({ selectedVenue: venue, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت اطلاعات سالن')
    }
  },

  createVenue: async (data: any) => {
    try {
      const venue = await venueService.create(data)
      set((state) => ({
        venues: [venue, ...state.venues],
        myVenues: [venue, ...state.myVenues],
      }))
      toast.success('سالن با موفقیت ایجاد شد!')
    } catch (error) {
      toast.error('خطا در ایجاد سالن')
      throw error
    }
  },

  updateVenue: async (id: number, data: any) => {
    try {
      const venue = await venueService.update(id, data)
      set((state) => ({
        venues: state.venues.map((v) => (v.id === id ? venue : v)),
        myVenues: state.myVenues.map((v) => (v.id === id ? venue : v)),
        selectedVenue: state.selectedVenue?.id === id ? venue : state.selectedVenue,
      }))
      toast.success('سالن با موفقیت به‌روزرسانی شد!')
    } catch (error) {
      toast.error('خطا در به‌روزرسانی سالن')
      throw error
    }
  },

  deleteVenue: async (id: number) => {
    try {
      await venueService.delete(id)
      set((state) => ({
        venues: state.venues.filter((v) => v.id !== id),
        myVenues: state.myVenues.filter((v) => v.id !== id),
        selectedVenue: state.selectedVenue?.id === id ? null : state.selectedVenue,
      }))
      toast.success('سالن با موفقیت حذف شد!')
    } catch (error) {
      toast.error('خطا در حذف سالن')
      throw error
    }
  },

  verifyVenue: async (id: number) => {
    try {
      await venueService.verify(id)
      set((state) => ({
        venues: state.venues.map((v) =>
          v.id === id ? { ...v, isVerified: true } : v
        ),
        myVenues: state.myVenues.map((v) =>
          v.id === id ? { ...v, isVerified: true } : v
        ),
        selectedVenue: state.selectedVenue?.id === id
          ? { ...state.selectedVenue, isVerified: true }
          : state.selectedVenue,
      }))
      toast.success('سالن با موفقیت تایید شد!')
    } catch (error) {
      toast.error('خطا در تایید سالن')
      throw error
    }
  },

  clearSelectedVenue: () => {
    set({ selectedVenue: null })
  },
}))