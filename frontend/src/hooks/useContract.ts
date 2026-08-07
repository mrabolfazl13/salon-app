import { create } from 'zustand'
import toast from 'react-hot-toast'

interface Contract {
  id: number
  venueId: number
  venueName: string
  startDate: string
  endDate: string
  sessionsCount: number
  pricePerSession: number
  totalAmount: number
  status: 'active' | 'expired' | 'cancelled'
}

interface ContractState {
  contracts: Contract[]
  isLoading: boolean
  fetchContracts: () => Promise<void>
  createContract: (data: any) => Promise<void>
  cancelContract: (id: number) => Promise<void>
  getContractById: (id: number) => Contract | undefined
}

export const useContract = create<ContractState>((set, get) => ({
  contracts: [],
  isLoading: false,

  fetchContracts: async () => {
    set({ isLoading: true })
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockContracts: Contract[] = [
        {
          id: 1,
          venueId: 1,
          venueName: 'سالن آبی',
          startDate: '۱۴۰۲/۰۱/۰۱',
          endDate: '۱۴۰۲/۱۲/۲۹',
          sessionsCount: 52,
          pricePerSession: 250000,
          totalAmount: 13000000,
          status: 'active',
        },
        {
          id: 2,
          venueId: 2,
          venueName: 'سالن سبز',
          startDate: '۱۴۰۱/۰۶/۰۱',
          endDate: '۱۴۰۲/۰۵/۳۰',
          sessionsCount: 48,
          pricePerSession: 220000,
          totalAmount: 10560000,
          status: 'expired',
        },
      ]
      
      set({ contracts: mockContracts, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      toast.error('خطا در دریافت قراردادها')
    }
  },

  createContract: async (data: any) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('قرارداد با موفقیت ثبت شد!')
    } catch (error) {
      toast.error('خطا در ثبت قرارداد')
    }
  },

  cancelContract: async (id: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const { contracts } = get()
      set({
        contracts: contracts.map((c) =>
          c.id === id ? { ...c, status: 'cancelled' as const } : c
        ),
      })
      toast.success('قرارداد لغو شد!')
    } catch (error) {
      toast.error('خطا در لغو قرارداد')
    }
  },

  getContractById: (id: number) => {
    return get().contracts.find((c) => c.id === id)
  },
}))