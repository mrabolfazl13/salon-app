// علاقه‌مندی‌ها — بک‌اند endpoint ندارد؛ ذخیره کلاینت‌ساید (localStorage)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FavoriteVenue {
  id: number
  name: string
  savedAt: number
}

interface FavoritesStore {
  favorites: FavoriteVenue[]
  isFavorite: (id: number) => boolean
  toggle: (venue: { id: number; name: string }) => boolean // true → اضافه شد
  remove: (id: number) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
      toggle: (venue) => {
        const exists = get().favorites.some((f) => f.id === venue.id)
        if (exists) {
          set({ favorites: get().favorites.filter((f) => f.id !== venue.id) })
          return false
        }
        set({ favorites: [{ id: venue.id, name: venue.name, savedAt: Date.now() }, ...get().favorites] })
        return true
      },
      remove: (id) => set({ favorites: get().favorites.filter((f) => f.id !== id) }),
      clear: () => set({ favorites: [] }),
    }),
    { name: 'futsal-favorites' },
  ),
)
