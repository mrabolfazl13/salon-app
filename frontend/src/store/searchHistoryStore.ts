// تاریخچه جستجو — برای صفحه Search (Recent Searches)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchHistoryStore {
  queries: string[]
  add: (q: string) => void
  remove: (q: string) => void
  clear: () => void
}

const MAX_ITEMS = 8

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set, get) => ({
      queries: [],
      add: (q) => {
        const trimmed = q.trim()
        if (!trimmed) return
        const rest = get().queries.filter((x) => x !== trimmed)
        set({ queries: [trimmed, ...rest].slice(0, MAX_ITEMS) })
      },
      remove: (q) => set({ queries: get().queries.filter((x) => x !== q) }),
      clear: () => set({ queries: [] }),
    }),
    { name: 'futsal-search-history' },
  ),
)
