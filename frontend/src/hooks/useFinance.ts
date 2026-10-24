// frontend/src/hooks/useFinance.ts
// هوک‌های TanStack Query برای کنسول مالی مدیر (state سمت سرور — الگوی useGames).
// استراتژی: هر mutation موفق → ابطال کل دامنه‌ی ['finance'] تا داشبورد/لیست‌ها/حساب‌ها
// با ارقام جدید سرور همگام شوند.
// FIX: اضافه کردن userId به query keys برای auto-refresh هنگام تغییر کاربر

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

import { venueService } from '@/services/venue'
import {
  financeService,
  type AccountListParams,
  type AccountPaymentPayload,
  type ExpenseCategoryCreatePayload,
  type ExpenseCategoryUpdatePayload,
  type FinanceScopeParams,
  type LowDemandParams,
  type SeriesParams,
  type TransactionCreatePayload,
  type TransactionListParams,
} from '@/services/finance'

// ─────────────────────────── Query Keys ───────────────────────────

export const financeKeys = {
  all: ['finance'] as const,
  venues: (userId?: number) => ['finance', 'venues', userId] as const,
  dashboard: (p: FinanceScopeParams, userId?: number) => ['finance', 'dashboard', p, userId] as const,
  series: (p: SeriesParams, userId?: number) => ['finance', 'series', p, userId] as const,
  bySource: (p: FinanceScopeParams, userId?: number) => ['finance', 'by-source', p, userId] as const,
  occupancy: (p: FinanceScopeParams, userId?: number) => ['finance', 'occupancy', p, userId] as const,
  lowDemand: (p: LowDemandParams, userId?: number) => ['finance', 'low-demand', p, userId] as const,
  venueComparison: (p: FinanceScopeParams, userId?: number) => ['finance', 'venue-comparison', p, userId] as const,
  transactions: (p: TransactionListParams, userId?: number) => ['finance', 'transactions', p, userId] as const,
  categories: (includeInactive: boolean) => ['finance', 'categories', { includeInactive }] as const,
  accounts: (p: AccountListParams, userId?: number) => ['finance', 'accounts', p, userId] as const,
  statement: (userId: number, p: FinanceScopeParams) => ['finance', 'statement', userId, p] as const,
}

/** ابطال کل دامنه‌ی مالی (تجمیعی‌ها به‌شدت به هم وابسته‌اند — ساده و درست) */
function invalidateFinanceScope(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: financeKeys.all })
}

// ─────────────────────────── Queries ───────────────────────────

export interface FinanceVenue {
  id: number
  name: string
}

export function useMyVenues(enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.venues(userId),
    queryFn: async (): Promise<FinanceVenue[]> => {
      const data = await venueService.getMyVenues()
      return (Array.isArray(data) ? data : []).map((v: { id: number; name: string }) => ({
        id: v.id,
        name: v.name,
      }))
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // کاهش staleTime برای refresh سریع‌تر
  })
}

export function useFinanceDashboard(params: FinanceScopeParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.dashboard(params, userId),
    queryFn: () => financeService.getDashboard(params),
    enabled: enabled && !!userId,
  })
}

export function useRevenueSeries(params: SeriesParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.series(params, userId),
    queryFn: () => financeService.getRevenueSeries(params),
    enabled: enabled && !!userId,
  })
}

export function useRevenueBySource(params: FinanceScopeParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.bySource(params, userId),
    queryFn: () => financeService.getRevenueBySource(params),
    enabled: enabled && !!userId,
  })
}

export function useOccupancy(params: FinanceScopeParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.occupancy(params, userId),
    queryFn: () => financeService.getOccupancy(params),
    enabled: enabled && !!userId,
  })
}

export function useLowDemandSlots(params: LowDemandParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.lowDemand(params, userId),
    queryFn: () => financeService.getLowDemandSlots(params),
    enabled: enabled && !!userId,
  })
}

export function useVenueComparison(params: FinanceScopeParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.venueComparison(params, userId),
    queryFn: () => financeService.getVenueComparison(params),
    enabled: enabled && !!userId,
  })
}

export function useTransactions(params: TransactionListParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.transactions(params, userId),
    queryFn: () => financeService.listTransactions(params),
    enabled: enabled && !!userId,
    placeholderData: keepPreviousData,
  })
}

/** کل ردیف‌های دفتر کل بازه (صفحه‌به‌صفحه) — مبنای گزارش‌های تجمیعی دقیق */
export function useScopeLedger(params: TransactionListParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['finance', 'ledger', params, userId] as const,
    queryFn: () => financeService.listAllTransactions(params),
    enabled: enabled && !!userId,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export function useExpenseCategories(includeInactive = false, enabled = true) {
  return useQuery({
    queryKey: financeKeys.categories(includeInactive),
    queryFn: () => financeService.listExpenseCategories(includeInactive),
    enabled,
  })
}

export function useAccounts(params: AccountListParams, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  
  return useQuery({
    queryKey: financeKeys.accounts(params, userId),
    queryFn: () => financeService.listAccounts(params),
    enabled: enabled && !!userId,
    placeholderData: keepPreviousData,
  })
}

export function useAccountStatement(userId: number | null, params: FinanceScopeParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.statement(userId ?? 0, params),
    queryFn: () => financeService.getStatement(userId as number, params),
    enabled: enabled && userId !== null && userId > 0,
  })
}

// ─────────────────────────── Mutations ───────────────────────────

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TransactionCreatePayload) => financeService.createTransaction(data),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useVoidTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ txId, reason }: { txId: number; reason: string }) =>
      financeService.voidTransaction(txId, reason),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpenseCategoryCreatePayload) => financeService.createExpenseCategory(data),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: ExpenseCategoryUpdatePayload }) =>
      financeService.updateExpenseCategory(categoryId, data),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => financeService.deleteExpenseCategory(categoryId),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useRecordAccountPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: AccountPaymentPayload }) =>
      financeService.recordPayment(userId, data),
    onSuccess: () => invalidateFinanceScope(queryClient),
  })
}

export function useExportTransactionsCsv() {
  return useMutation({
    mutationFn: (params: Omit<TransactionListParams, 'offset'>) => financeService.exportCsv(params),
  })
}