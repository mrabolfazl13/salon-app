// اخیراً دیده‌شده — برای بخش Recently Viewed در Home
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ViewedVenue {
  id: number
  name: string
  viewedAt: number
}

interface RecentlyViewedStore {
  viewed: ViewedVenue[]
  track: (venue: { id: number; name: string }) => void
  clear: () => void
}

const MAX_ITEMS = 12

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      viewed: [],
      track: (venue) => {
        const rest = get().viewed.filter((v) => v.id !== venue.id)
        set({ viewed: [{ id: venue.id, name: venue.name, viewedAt: Date.now() }, ...rest].slice(0, MAX_ITEMS) })
      },
      clear: () => set({ viewed: [] }),
    }),
    { name: 'futsal-recently-viewed' },
  ),
)
