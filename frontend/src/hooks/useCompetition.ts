import { create } from 'zustand'
import toast from 'react-hot-toast'

interface Competition {
  id: number
  venueId: number
  venueName: string
  date: string
  time: string
  currentPrice: number
  bestPrice: number
  bidsCount: number
  timeLeft: string
  status: 'active' | 'ended'
}

interface CompetitionState {
  competitions: Competition[]
  isLoading: boolean
  fetchCompetitions: () => Promise<void>
  placeBid: (competitionId: number, price: number) => Promise<void>
  getCompetitionById: (id: number) => Competition | undefined
}

export const useCompetition = create<CompetitionState>((set, get) => ({
  competitions: [],
  isLoading: false,

  fetchCompetitions: async () => {
    set({ isLoading: true })
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockCompetitions: Competition[] = [
        {
          id: 1,
          venueId: 1,
          venueName: 'سالن آبی',
          date: '۱۴۰۲/۱۰/۱۵',
          time: '۱۷:۰۰',
          currentPrice: 300000,
          bestPrice: 250000,
          bidsCount: 5,
          timeLeft: '۲ ساعت',
          status: 'active',
        },
        {
          id: 2,
          venueId: 2,
          venueName: 'سالن سبز',
          date: '۱۴۰۲/۱۰/۱۶',
          time: '۱۹:۳۰',
          currentPrice: 280000,
          bestPrice: 220000,
          bidsCount: 8,
          timeLeft: '۵ ساعت',
          status: 'active',
        },
      ]
      
      set({ competitions: mockCompetitions, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت رقابت‌ها')
    }
  },

  placeBid: async (competitionId: number, price: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('پیشنهاد با موفقیت ثبت شد!')
    } catch (error) {
      toast.error('خطا در ثبت پیشنهاد')
    }
  },

  getCompetitionById: (id: number) => {
    return get().competitions.find((c) => c.id === id)
  },
}))