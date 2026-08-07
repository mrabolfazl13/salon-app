import { useState } from 'react'
import { create } from 'zustand'
import toast from 'react-hot-toast'

interface Venue {
  id: number
  name: string
  address: string
  image: string
  price: number
  rating: number
  amenities: string[]
  status: 'available' | 'busy'
  latitude: number
  longitude: number
}

interface VenueState {
  venues: Venue[]
  isLoading: boolean
  fetchVenues: () => Promise<void>
  getVenueById: (id: number) => Venue | undefined
  searchVenues: (query: string) => Venue[]
}

export const useVenue = create<VenueState>((set, get) => ({
  venues: [],
  isLoading: false,

  fetchVenues: async () => {
    set({ isLoading: true })
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockVenues: Venue[] = [
        {
          id: 1,
          name: 'سالن آبی',
          address: 'تهران، خیابان آزادی',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
          price: 300000,
          rating: 4.5,
          amenities: ['پارکینگ', 'کافه', 'دوش'],
          status: 'available',
          latitude: 35.6892,
          longitude: 51.3890,
        },
        {
          id: 2,
          name: 'سالن سبز',
          address: 'تهران، خیابان ولیعصر',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
          price: 250000,
          rating: 4.2,
          amenities: ['پارکینگ', 'کافه'],
          status: 'available',
          latitude: 35.6992,
          longitude: 51.3990,
        },
      ]
      
      set({ venues: mockVenues, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت سالن‌ها')
    }
  },

  getVenueById: (id: number) => {
    return get().venues.find((v) => v.id === id)
  },

  searchVenues: (query: string) => {
    const { venues } = get()
    if (!query) return venues
    return venues.filter(
      (v) =>
        v.name.includes(query) ||
        v.address.includes(query)
    )
  },
}))