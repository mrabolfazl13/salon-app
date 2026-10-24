// frontend/src/services/finance.ts
// تایپ‌ها و سرویس ماژول /api/v1/finance — آینه‌ی backend/app/schemas/finance.py
// همه مبالغ INTEGER (ریال)؛ amount همیشه > 0 و جهت با direction مشخص می‌شود.

import apiClient from './api'

// ─────────────── Enum‌ها (مطابق app/models/transaction.py) ───────────────
// (string & {}) یعنی مقدارهای جدیدِ بک‌اند بدون شکست UI (fallback «نامشخص»)

export type TransactionType =
  | 'payment' | 'receivable' | 'refund' | 'discount'
  | 'expense' | 'credit' | 'transfer' | 'adjustment'
  | (string & {})

export type TransactionDirection = 'income' | 'expense' | (string & {})
export type TransactionMethod =
  | 'cash' | 'card_to_card' | 'gateway' | 'pos' | 'credit' | 'other'
  | (string & {})
export type TransactionStatus = 'pending' | 'cleared' | 'voided' | (string & {})
export type CounterpartyType =
  | 'user' | 'team' | 'organization' | 'contract' | 'other'
  | (string & {})
export type TransactionSourceType =
  | 'booking' | 'booking_payment' | 'game_payment' | 'membership_purchase'
  | 'contract' | 'contract_payment' | 'manual'
  | (string & {})

export type SeriesGroupBy = 'day' | 'venue' | 'hour' | 'weekday'
export type AccountKind = 'all' | 'debtors' | 'creditors'

// ─────────────── پاسخ‌ها (مطابق schemas/finance.py) ───────────────

export interface FinanceTransaction {
  id: number
  idempotency_key: string | null
  type: TransactionType
  direction: TransactionDirection
  amount: number
  method: TransactionMethod
  status: TransactionStatus
  counterparty: number | null
  counterparty_name: string | null
  counterparty_type: CounterpartyType | null
  counterparty_ref: number | null
  venue_id: number | null
  expense_category_id: number | null
  expense_category_name: string | null
  source_type: TransactionSourceType
  source_id: number | null
  description: string
  created_by: number | null
  occurred_at: string
  created_at: string
  cleared_at: string | null
  void_reason: string | null
}

export interface TransactionListResponse {
  items: FinanceTransaction[]
  total: number
  limit: number
  offset: number
}

export interface ExpenseCategory {
  id: number
  venue_id: number | null
  name: string
  is_active: boolean
  created_at: string
}

export interface AccountSummary {
  user_id: number
  full_name: string | null
  /** مثبت = بدهکار به مجموعه، منفی = حساب اعتباری */
  balance: number
  kind: string
  last_activity: string | null
}

export interface AccountListResponse {
  items: AccountSummary[]
  total: number
  limit: number
  offset: number
}

export interface StatementEntry {
  id: number
  occurred_at: string
  type: TransactionType
  direction: TransactionDirection
  amount: number
  /** اثر ریالی روی موجودی (مثبت=بدهکارتر، منفی=تسویه) */
  delta: number
  running_balance: number
  status: TransactionStatus
  description: string
  venue_id: number | null
}

export interface AccountStatementResponse {
  user_id: number
  full_name: string | null
  from_date: string | null
  to_date: string | null
  opening_balance: number
  closing_balance: number
  entries: StatementEntry[]
}

export interface SeriesPoint {
  key: string
  label: string
  income: number
  expense: number
  net: number
  count: number
}

export interface SeriesResponse {
  group_by: SeriesGroupBy
  from_date: string | null
  to_date: string | null
  points: SeriesPoint[]
  total_net: number
}

export interface SourceRevenue {
  source: string
  income: number
  count: number
}

export interface RevenueBySourceResponse {
  from_date: string | null
  to_date: string | null
  by_source: SourceRevenue[]
  total: number
}

export interface VenueOccupancy {
  venue_id: number
  venue_name: string | null
  total_active_slots: number
  occupied_slots: number
  occupancy_rate: number
}

export interface OccupancyResponse {
  from_date: string
  to_date: string
  total_active_slots: number
  occupied_slots: number
  occupancy_rate: number
  per_venue: VenueOccupancy[]
}

export interface LowDemandSlot {
  /** ۰=یکشنبه تا ۶=شنبه (مطابق strftime %w / EXTRACT dow) */
  weekday: number
  hour: number
  total_slots: number
  booked_slots: number
  occupancy_rate: number
}

/** یک سالن در مقایسهٔ بین‌سالنه — پول از دفتر کل، رزرو از Booking */
export interface VenueComparisonRow {
  venue_id: number
  venue_name: string | null
  income: number
  expense: number
  net: number
  /** خالص بازهٔ قبلی هم‌طول */
  prev_net: number
  /** net - prev_net؛ بازهٔ قبلی خالی ⇒ همان net */
  net_change: number
  /** سهم از درآمد کل دامنه (درصد) */
  share_pct: number
  transactions: number
  /** رزروهای پرداخت‌شده (confirmed/completed) */
  bookings: number
  cancelled: number
  /** لغو / همهٔ رزروهای بازه (درصد) */
  cancel_rate: number
  booking_revenue: number
  /** null اگر رزروی در بازه نبوده — صفر نه‌انگار میانگین */
  avg_per_booking: number | null
  customers: number
  total_active_slots: number
  occupied_slots: number
  occupancy_rate: number
  /** رتبهٔ ۱-محور بر پایهٔ خالص نزولی */
  rank: number
}

export interface VenueComparisonTotals {
  venues: number
  income: number
  expense: number
  net: number
  transactions: number
  bookings: number
  cancelled: number
  total_active_slots: number
  occupied_slots: number
  occupancy_rate: number
}

export interface VenueComparisonResponse {
  from_date: string
  to_date: string
  prev_from_date: string
  prev_to_date: string
  /** null = کل سامانه (ادمین) */
  venue_ids: number[] | null
  rows: VenueComparisonRow[]
  totals: VenueComparisonTotals
}

export interface FinanceDashboard {
  from_date: string
  to_date: string
  venue_ids: number[] | null
  today_revenue: number
  month_revenue: number
  today_received: number
  open_receivables: number
  active_contracts: number
  contracts_expiring_soon: number
  bookings_today: number
  occupancy_today: number
  cancelled_bookings: number
  pending_payment_bookings: number
  expenses: number
  gross_profit: number
  active_customers: number
  // موج جدید بک‌اند — مقایسه ماهانه + تیم‌های فعال (دامنه سالن‌های کاربر)
  prev_month_revenue?: number
  prev_month_expenses?: number
  active_teams?: number
}

// ─────────────── ورودی‌ها ───────────────

export interface FinanceScopeParams {
  venue_id?: number
  from?: string
  to?: string
}

export interface SeriesParams extends FinanceScopeParams {
  group_by: SeriesGroupBy
}

export interface LowDemandParams extends FinanceScopeParams {
  threshold?: number
}

export interface TransactionListParams extends FinanceScopeParams {
  type?: string
  direction?: string
  status?: string
  source_type?: string
  source_id?: number
  counterparty?: number
  limit?: number
  offset?: number
}

export interface TransactionCreatePayload {
  type: TransactionType
  direction: TransactionDirection
  amount: number
  method?: TransactionMethod
  status?: TransactionStatus
  venue_id?: number | null
  counterparty?: number | null
  counterparty_type?: CounterpartyType | null
  counterparty_ref?: number | null
  expense_category_id?: number | null
  source_type?: TransactionSourceType
  source_id?: number | null
  description?: string
  occurred_at?: string | null
  idempotency_key?: string | null
}

export interface AccountListParams {
  venue_id?: number
  kind?: AccountKind
  limit?: number
  offset?: number
}

export interface AccountPaymentPayload {
  amount: number
  method?: TransactionMethod
  venue_id?: number | null
  description?: string
  idempotency_key?: string | null
}

export interface ExpenseCategoryCreatePayload {
  name: string
  venue_id?: number | null
}

export interface ExpenseCategoryUpdatePayload {
  name?: string
  is_active?: boolean
}

// ─────────────── سرویس ───────────────

/** کش کوتاه‌عمرِ صفحه‌های دفتر کل — جلوگیری از سوزاندن سهمیهٔ نرخ بک‌اند در ناوبری */
const LEDGER_CACHE_TTL = 45_000
const ledgerPageCache = new Map<string, { at: number; page: TransactionListResponse }>()

/** بعد از هر ثبت/ابطال، صفحه‌های کش‌شده دیگر معتبر نیستند */
const clearLedgerCache = () => ledgerPageCache.clear()

export const financeService = {
  // داشبورد / گزارش‌ها
  getDashboard: async (params?: FinanceScopeParams): Promise<FinanceDashboard> => {
    const response = await apiClient.get('/finance/dashboard', { params })
    return response.data
  },

  getRevenueSeries: async (params: SeriesParams): Promise<SeriesResponse> => {
    const response = await apiClient.get('/finance/revenue/series', { params })
    return response.data
  },

  getRevenueBySource: async (params?: FinanceScopeParams): Promise<RevenueBySourceResponse> => {
    const response = await apiClient.get('/finance/revenue/by-source', { params })
    return response.data
  },

  getOccupancy: async (params?: FinanceScopeParams): Promise<OccupancyResponse> => {
    const response = await apiClient.get('/finance/occupancy', { params })
    return response.data
  },

  getLowDemandSlots: async (params?: LowDemandParams): Promise<LowDemandSlot[]> => {
    const response = await apiClient.get('/finance/low-demand-slots', { params })
    return response.data
  },

  getVenueComparison: async (params?: FinanceScopeParams): Promise<VenueComparisonResponse> => {
    const response = await apiClient.get('/finance/venue-comparison', { params })
    return response.data
  },

  // تراکنش‌ها
  listTransactions: async (params?: TransactionListParams): Promise<TransactionListResponse> => {
    const response = await apiClient.get('/finance/transactions', { params })
    return response.data
  },

  /**
   * همهٔ ردیف‌های دفتر کلِ یک بازه (برای تجمیع‌های دقیق سود/زیان، جریان نقدی و مشتریان).
   * بک‌اند حداکثر ۵۰۰ ردیف در هر صفحه می‌دهد؛ تا رسیدن به total صفحه‌به‌صفحه می‌خوانیم.
   * سقف maxRows جلوی رفت‌وبرگشت بی‌پایان روی داده‌های غیرمنتظره را می‌گیرد.
   * صفحه‌ها ۴۵ ثانیه کش می‌شوند تا جابه‌جایی بین صفحات مالی، سهمیهٔ نرخِ سراسری
   * بک‌اند (۶۰ درخواست در دقیقه) را نسوزاند؛ در صورت 429 هم با ردیف‌های همان‌جا
   * متوقف می‌شویم و صفحه به‌جای خطا، دادهٔ ناقص را با هشدار نشان می‌دهد.
   */
  listAllTransactions: async (
    params?: TransactionListParams,
    maxRows = 3000,
  ): Promise<{ items: FinanceTransaction[]; total: number; truncated: boolean }> => {
    const pageSize = 500
    const collected: FinanceTransaction[] = []
    let total = 0
    for (let offset = 0; offset < maxRows; offset += pageSize) {
      const request = { ...params, limit: pageSize, offset }
      const cacheKey = JSON.stringify(request)
      const cached = ledgerPageCache.get(cacheKey)
      let page: TransactionListResponse
      if (cached && Date.now() - cached.at < LEDGER_CACHE_TTL) {
        page = cached.page
      } else {
        try {
          page = await financeService.listTransactions(request)
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status
          if (status === 429 && collected.length > 0) break
          throw err
        }
        ledgerPageCache.set(cacheKey, { at: Date.now(), page })
      }
      total = page.total
      collected.push(...page.items)
      if (collected.length >= total || page.items.length < pageSize) break
    }
    return { items: collected, total, truncated: collected.length < total }
  },

  createTransaction: async (data: TransactionCreatePayload): Promise<FinanceTransaction> => {
    const response = await apiClient.post('/finance/transactions', data)
    clearLedgerCache()
    return response.data
  },

  getTransaction: async (txId: number): Promise<FinanceTransaction> => {
    const response = await apiClient.get(`/finance/transactions/${txId}`)
    return response.data
  },

  voidTransaction: async (txId: number, reason: string): Promise<FinanceTransaction> => {
    const response = await apiClient.post(`/finance/transactions/${txId}/void`, { reason })
    clearLedgerCache()
    return response.data
  },

  // دسته‌بندی هزینه
  listExpenseCategories: async (includeInactive = false): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get('/finance/expense-categories', {
      params: { include_inactive: includeInactive },
    })
    return response.data
  },

  createExpenseCategory: async (data: ExpenseCategoryCreatePayload): Promise<ExpenseCategory> => {
    const response = await apiClient.post('/finance/expense-categories', data)
    return response.data
  },

  updateExpenseCategory: async (
    categoryId: number,
    data: ExpenseCategoryUpdatePayload,
  ): Promise<ExpenseCategory> => {
    const response = await apiClient.put(`/finance/expense-categories/${categoryId}`, data)
    return response.data
  },

  deleteExpenseCategory: async (categoryId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/finance/expense-categories/${categoryId}`)
    return response.data
  },

  // حساب‌های اشخاص
  listAccounts: async (params?: AccountListParams): Promise<AccountListResponse> => {
    const response = await apiClient.get('/finance/accounts', { params })
    return response.data
  },

  getStatement: async (userId: number, params?: FinanceScopeParams): Promise<AccountStatementResponse> => {
    const response = await apiClient.get(`/finance/accounts/${userId}/statement`, { params })
    return response.data
  },

  recordPayment: async (userId: number, data: AccountPaymentPayload): Promise<FinanceTransaction> => {
    const response = await apiClient.post(`/finance/accounts/${userId}/payments`, data)
    clearLedgerCache()
    return response.data
  },

  // خروجی CSV — دانلود از طریق blob (همان فیلترهای لیست تراکنش)
  exportCsv: async (params?: TransactionListParams): Promise<Blob> => {
    const response = await apiClient.get('/finance/export', {
      params: { format: 'csv', ...params },
      responseType: 'blob',
    })
    return response.data
  },
}
