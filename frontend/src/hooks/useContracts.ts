// frontend/src/hooks/useContracts.ts
// هوک‌های TanStack Query برای چرخه‌ی عمر قرارداد (الگوی useGames/useFinance).
// استراتژی: هر mutation موفق → ابطال دامنه‌ی ['contracts'] به‌علاوه‌ی جزئیات و ممیزی
// همان قرارداد تا لیست کاربر/صف مدیر/دیتیل هم‌زمان با سرور بمانند.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  contractService,
  type ContractApprovePayload,
  type ContractCreatePayload,
  type ManagerAllParams,
} from '@/services/contract'

// ─────────────────────────── Query Keys ───────────────────────────

export const contractKeys = {
  all: ['contracts'] as const,
  my: (status?: string) => ['contracts', 'my', { status: status ?? 'all' }] as const,
  detail: (id: number) => ['contracts', 'detail', id] as const,
  audit: (id: number) => ['contracts', 'audit', id] as const,
  managerAll: (params: ManagerAllParams) => ['contracts', 'manager', 'all', params] as const,
  managerPending: ['contracts', 'manager', 'pending'] as const,
}

/** ابطال دامنه‌ی یک قرارداد: دیتیل + ممیزی + همه‌ی لیست‌های قرارداد */
function invalidateContractScope(
  qc: ReturnType<typeof useQueryClient>,
  contractId?: number,
) {
  qc.invalidateQueries({ queryKey: contractKeys.all })
  if (contractId) {
    qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) })
    qc.invalidateQueries({ queryKey: contractKeys.audit(contractId) })
  }
}

// ─────────────────────────── Queries ───────────────────────────

export function useMyContracts(status?: string) {
  return useQuery({
    queryKey: contractKeys.my(status),
    queryFn: () => contractService.getAll(status),
  })
}

export function useContractDetail(id: number | null) {
  return useQuery({
    queryKey: contractKeys.detail(id ?? 0),
    queryFn: () => contractService.getDetail(id as number),
    enabled: id !== null && id > 0,
  })
}

export function useContractAudit(id: number | null) {
  return useQuery({
    queryKey: contractKeys.audit(id ?? 0),
    queryFn: () => contractService.getAudit(id as number),
    enabled: id !== null && id > 0,
  })
}

export function useManagerPendingContracts(enabled = true) {
  return useQuery({
    queryKey: contractKeys.managerPending,
    queryFn: () => contractService.managerPending(),
    enabled,
  })
}

export function useManagerAllContracts(params: ManagerAllParams, enabled = true) {
  return useQuery({
    queryKey: contractKeys.managerAll(params),
    queryFn: () => contractService.managerAll(params),
    enabled,
  })
}

// ─────────────────────────── Mutations (کاربر) ───────────────────────────

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContractCreatePayload) => contractService.create(data),
    onSuccess: (contract) => invalidateContractScope(qc, contract.id),
  })
}

export function useCancelContract(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => contractService.cancel(contractId, reason),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

export function useRequestSessionCancel(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ csId, reason }: { csId: number; reason: string }) =>
      contractService.requestSessionCancel(contractId, csId, reason),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

export function usePayInstallment(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, cardNumber }: { paymentId: number; cardNumber: string | null }) =>
      contractService.payInstallment(contractId, paymentId, cardNumber),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

// ─────────────────────────── Mutations (مدیر) ───────────────────────────

export function useApproveContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, data }: { contractId: number; data?: ContractApprovePayload }) =>
      contractService.approve(contractId, data),
    onSuccess: (_contract, variables) => invalidateContractScope(qc, variables.contractId),
  })
}

export function useRejectContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, reason }: { contractId: number; reason: string }) =>
      contractService.reject(contractId, reason),
    onSuccess: (_contract, variables) => invalidateContractScope(qc, variables.contractId),
  })
}

export function useExcludeSession(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ csId, reason }: { csId: number; reason: string }) =>
      contractService.excludeSession(contractId, csId, reason),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

export function useRescheduleSession(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ csId, new_date, new_time }: { csId: number; new_date: string; new_time: string }) =>
      contractService.rescheduleSession(contractId, csId, { new_date, new_time }),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

export function useMoveContract(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { day_of_week: number; start_time: string; end_time?: string | null }) =>
      contractService.moveContract(contractId, data),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

/** دریافت نقدی قسط توسط کارکنان/مالک — ابطال دیتیل (اقساط + اقتصاد) همان قرارداد */
export function useMarkInstallmentPaid(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: number) => contractService.markInstallmentPaid(contractId, paymentId),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}

export function useVoidInstallment(contractId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) =>
      contractService.voidInstallment(contractId, paymentId, reason),
    onSuccess: () => invalidateContractScope(qc, contractId),
  })
}