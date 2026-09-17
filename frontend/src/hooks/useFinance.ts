// frontend/src/hooks/useFinance.ts
// هوک‌های TanStack Query برای کنسول مالی مدیر (state سمت سرور — الگوی useGames).
// استراتژی: هر mutation موفق → ابطال کل دامنه‌ی ['finance'] تا داشبورد/لیست‌ها/حساب‌ها
// با ارقام جدید سرور همگام شوند.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
  venues: ['finance', 'venues'] as const,
  dashboard: (p: FinanceScopeParams) => ['finance', 'dashboard', p] as const,
  series: (p: SeriesParams) => ['finance', 'series', p] as const,
  bySource: (p: FinanceScopeParams) => ['finance', 'by-source', p] as const,
  occupancy: (p: FinanceScopeParams) => ['finance', 'occupancy', p] as const,
  lowDemand: (p: LowDemandParams) => ['finance', 'low-demand', p] as const,
  transactions: (p: TransactionListParams) => ['finance', 'transactions', p] as const,
  categories: (includeInactive: boolean) => ['finance', 'categories', { includeInactive }] as const,
  accounts: (p: AccountListParams) => ['finance', 'accounts', p] as const,
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
  return useQuery({
    queryKey: financeKeys.venues,
    queryFn: async (): Promise<FinanceVenue[]> => {
      const data = await venueService.getMyVenues()
      return (Array.isArray(data) ? data : []).map((v: { id: number; name: string }) => ({
        id: v.id,
        name: v.name,
      }))
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  })
}

export function useFinanceDashboard(params: FinanceScopeParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.dashboard(params),
    queryFn: () => financeService.getDashboard(params),
    enabled,
  })
}

export function useRevenueSeries(params: SeriesParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.series(params),
    queryFn: () => financeService.getRevenueSeries(params),
    enabled,
  })
}

export function useRevenueBySource(params: FinanceScopeParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.bySource(params),
    queryFn: () => financeService.getRevenueBySource(params),
    enabled,
  })
}

export function useOccupancy(params: FinanceScopeParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.occupancy(params),
    queryFn: () => financeService.getOccupancy(params),
    enabled,
  })
}

export function useLowDemandSlots(params: LowDemandParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.lowDemand(params),
    queryFn: () => financeService.getLowDemandSlots(params),
    enabled,
  })
}

export function useTransactions(params: TransactionListParams, enabled = true) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => financeService.listTransactions(params),
    enabled,
    placeholderData: keepPreviousData,
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
  return useQuery({
    queryKey: financeKeys.accounts(params),
    queryFn: () => financeService.listAccounts(params),
    enabled,
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