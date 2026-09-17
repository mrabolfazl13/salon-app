// frontend/src/services/contract.ts
// لایه‌ی سرویس قراردادها — آینه‌ی کامل backend/app/api/v1/contracts.py و
// backend/app/schemas/contract.py (فیلدهای snake_case بدون تغییر).

import apiClient from './api'

// ─────────────────────────── enum‌ها (verbatim از بک‌اند) ───────────────────────────

export type ContractStatusValue =
  | 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled' | 'suspended'
export type ContractPaymentStatusValue = 'pending' | 'paid' | 'partial' | 'overdue'
export type ContractSlotStatusValue = 'scheduled' | 'completed' | 'excluded' | 'rescheduled'
export type RecurrenceValue = 'weekly' | 'biweekly' | 'monthly'

// ─────────────────────────── پاسخ‌ها ───────────────────────────

export interface ContractData {
  id: number
  user_id: number
  venue_id: number
  start_date: string
  end_date: string
  day_of_week: number
  start_time: string
  duration: number
  recurrence: RecurrenceValue | string
  original_price: number
  discounted_price: number
  total_amount: number
  /** مجموع روزهای هفته (اصلی + اضافی، مرتب) — آینه ContractResponse.days */
  days?: number[]
  status: ContractStatusValue | string
  payment_status: ContractPaymentStatusValue | string
  description: string | null
  auto_renew: boolean
  down_payment_amount: number | null
  cancellation_policy: string | null
  reject_reason: string | null
  cancel_reason: string | null
  approved_at: string | null
  created_at: string | null
}

export interface ContractSessionData {
  id: number
  slot_id: number
  session_date: string
  start_time: string
  duration: number
  status: ContractSlotStatusValue | string
  slot_status: string | null
  is_past: boolean
  cancel_requested: boolean
  cancel_requested_at: string | null
  cancellation_reason: string | null
  rescheduled_date: string | null
  rescheduled_time: string | null
  exclusion_reason: string | null
}

export interface ContractPaymentData {
  id: number
  amount: number
  due_date: string
  label: string | null
  record_type: 'down_payment' | 'installment' | string | null
  installment_no: number | null
  is_paid: boolean
  paid_at: string | null
  is_overdue: boolean
  is_voided: boolean
  void_reason: string | null
  transaction_id: string | null
}

export interface ContractEconomicsData {
  total_sessions: number
  scheduled_sessions: number
  completed_sessions: number
  excluded_sessions: number
  paid_amount: number
  remaining_amount: number
  overdue: boolean
  played_ratio: number
}

export interface ContractDetailData extends ContractData {
  venue_name: string | null
  user_full_name: string | null
  sessions: ContractSessionData[]
  payments: ContractPaymentData[]
  economics: ContractEconomicsData | null
}

export interface ContractManagerRow {
  contract: ContractData
  venue_name: string
  user_full_name: string | null
  /** اطلاعات متقاضی (موج اصلاحی بک‌اند §8b) */
  user_phone?: string | null
  /** total − paid (اقساط باطل‌شده خارج) */
  outstanding_amount?: number
  sessions_upcoming: number
  total_sessions: number
}

export interface ContractAuditEvent {
  id: number
  action: string
  actor_id: number | null
  data: Record<string, unknown>
  created_at: string
}

export interface ContractMoveResult {
  moved_sessions: number
  day_of_week: number
  start_time: string
}

/** بدنه‌ی ۴۰۰ جابه‌جایی کل قرارداد — {code, message, collisions[]} */
export interface ContractMoveCollision {
  contract_slot_id: number
  to_date: string
  to_time: string
  collides_with_slot_id: number
  collides_at: string
}

// ─────────────────────────── درخواست‌ها ───────────────────────────

export interface ContractCreatePayload {
  venue_id: number
  start_date: string
  end_date: string
  day_of_week: number
  /** روزهای هفته اضافی — حداکثر ۲ (مجموعاً ≤۳)؛ بدون تکرار و متفاوت از روز اصلی */
  additional_days?: number[]
  start_time: string
  end_time?: string | null
  recurrence: RecurrenceValue
  discounted_price: number
  suggested_price?: number | null
  description?: string | null
  auto_renew?: boolean
  down_payment_amount?: number | null
  payment_due_day_of_month?: number | null
  desired_installments?: number | null
  /** یادداشت آزاد فارسی برای مدیر (صف تأیید) */
  note?: string | null
}

export interface InstallmentPlanPayload {
  count: number
  due_in_days_between?: number | null
}

export interface ContractApprovePayload {
  adjusted_price_per_session?: number | null
  max_sessions?: number | null
  installments?: InstallmentPlanPayload | null
  cancellation_policy?: string | null
}

export interface ManagerAllParams {
  status?: ContractStatusValue | ''
  venue_id?: number | ''
}

// ─────────────────────────── سرویس ───────────────────────────

export const contractService = {
  // کاربر
  getAll: async (status?: string): Promise<ContractData[]> => {
    const response = await apiClient.get('/contracts', {
      params: status ? { status, limit: 200 } : { limit: 200 },
    })
    return response.data
  },

  create: async (data: ContractCreatePayload): Promise<ContractData> => {
    const response = await apiClient.post('/contracts', data)
    return response.data
  },

  // GET /contracts/{id} → جزئیات کامل (sessions/payments/economics)
  getDetail: async (id: number): Promise<ContractDetailData> => {
    const response = await apiClient.get('/contracts/' + id)
    return response.data
  },

  getById: async (id: number): Promise<ContractData> => contractService.getDetail(id),

  // لغو توسط مالک یا مدیر
  cancel: async (id: number, reason: string): Promise<ContractData> => {
    const response = await apiClient.post('/contracts/' + id + '/cancel', { reason })
    return response.data
  },

  // مدیر
  managerPending: async (): Promise<ContractManagerRow[]> => {
    const response = await apiClient.get('/contracts/manager/pending')
    return response.data
  },

  managerAll: async (params: ManagerAllParams = {}): Promise<ContractManagerRow[]> => {
    const clean: Record<string, string | number> = {}
    if (params.status) clean.status = params.status
    if (params.venue_id !== '' && params.venue_id != null) clean.venue_id = params.venue_id
    const response = await apiClient.get('/contracts/manager/all', { params: clean })
    return response.data
  },

  approve: async (id: number, data?: ContractApprovePayload): Promise<ContractData> => {
    const response = await apiClient.post('/contracts/' + id + '/approve', data ?? null)
    return response.data
  },

  reject: async (id: number, reason: string): Promise<ContractData> => {
    const response = await apiClient.post('/contracts/' + id + '/reject', { reason })
    return response.data
  },

  // قواعد تک‌سانس
  excludeSession: async (contractId: number, csId: number, reason: string): Promise<ContractSessionData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/sessions/' + csId + '/exclude', { reason })
    return response.data
  },

  rescheduleSession: async (
    contractId: number,
    csId: number,
    data: { new_date: string; new_time: string },
  ): Promise<ContractSessionData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/sessions/' + csId + '/reschedule', data)
    return response.data
  },

  requestSessionCancel: async (contractId: number, csId: number, reason: string): Promise<ContractSessionData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/sessions/' + csId + '/cancel-request', { reason })
    return response.data
  },

  moveContract: async (
    contractId: number,
    data: { day_of_week: number; start_time: string; end_time?: string | null },
  ): Promise<ContractMoveResult> => {
    const response = await apiClient.post('/contracts/' + contractId + '/move', data)
    return response.data
  },

  // اقساط
  listPayments: async (contractId: number): Promise<ContractPaymentData[]> => {
    const response = await apiClient.get('/contracts/' + contractId + '/payments')
    return response.data
  },

  payInstallment: async (
    contractId: number,
    paymentId: number,
    cardNumber: string | null,
  ): Promise<ContractPaymentData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/payments/' + paymentId + '/pay',
      { card_number: cardNumber })
    return response.data
  },

  /** دریافت نقدی قسط سمت سالن —_cashier/branch/owner (finance.record_payment)؛ idempotent */
  markInstallmentPaid: async (contractId: number, paymentId: number): Promise<ContractPaymentData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/payments/' + paymentId + '/mark-paid')
    return response.data
  },

  voidInstallment: async (contractId: number, paymentId: number, reason: string): Promise<ContractPaymentData> => {
    const response = await apiClient.post(
      '/contracts/' + contractId + '/payments/' + paymentId + '/void', { reason })
    return response.data
  },

  // ممیزی
  getAudit: async (contractId: number): Promise<ContractAuditEvent[]> => {
    const response = await apiClient.get('/contracts/' + contractId + '/audit')
    return response.data
  },
}