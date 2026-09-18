import type { VenuePaymentMode } from './venue'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// وضعیت فیش واریزی — مطابق ReceiptStatus بک‌اند
export type ReceiptStatus = 'none' | 'submitted' | 'approved' | 'rejected'

// روش‌های دریافت در محل — مطابق TransactionMethod بک‌اند
export type PayInPersonMethod = 'cash' | 'card_to_card' | 'pos' | 'gateway' | 'credit' | 'other'

export interface Booking {
  id: number
  venueId: number
  venueName: string
  slotId: number
  date: string
  time: string
  price: number
  status: BookingStatus
  userId: number
  createdAt: string

  // روش پرداخت + وضعیت فیش (خروجی لیست رزرو)
  payment_mode?: VenuePaymentMode | null
  needs_receipt?: boolean
  receipt_status?: ReceiptStatus

  // فیلدهای کامل فیش — فقط در اندپوینت جزئیات رزرو
  receipt_amount?: number | null
  receipt_reference?: string | null
  receipt_bank?: string | null
  receipt_image?: string | null
  receipt_submitted_at?: string | null
  receipt_reviewed_at?: string | null
  receipt_review_note?: string | null
}

export interface BookingCreate {
  venueId: number
  slotId: number
  date: string
}

export interface BookingUpdate {
  status?: BookingStatus
}

// بدنه ارسال فیش واریزی — POST /bookings/{id}/receipt
export interface ReceiptSubmitBody {
  amount: number
  image_url: string
  reference_number?: string | null
  bank_name?: string | null
}

// بدنه ثبت دریافت در محل — POST /bookings/{id}/collect-in-person
export interface CollectInPersonBody {
  amount?: number
  method?: PayInPersonMethod
}