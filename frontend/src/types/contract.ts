export type ContractStatus = 'active' | 'expired' | 'cancelled'
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly'

export interface Contract {
  id: number
  venueId: number
  venueName: string
  startDate: string
  endDate: string
  recurrence: RecurrenceType
  dayOfWeek: number
  startTime: string
  duration: number
  sessionsCount: number
  pricePerSession: number
  totalAmount: number
  status: ContractStatus
  description?: string
  createdAt: string
}

export interface ContractCreate {
  venueId: number
  startDate: string
  endDate: string
  recurrence: RecurrenceType
  dayOfWeek: number
  startTime: string
  pricePerSession: number
  description?: string
}

export interface ContractUpdate extends Partial<ContractCreate> {
  status?: ContractStatus
}

export interface ContractSession {
  date: string
  isAttended: boolean
  isCancelled: boolean
  cancellationReason?: string
}