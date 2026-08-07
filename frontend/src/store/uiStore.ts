import { create } from 'zustand'

interface UIStore {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  loading: boolean
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'light',
  sidebarOpen: false,
  loading: false,

  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }))
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },
}))