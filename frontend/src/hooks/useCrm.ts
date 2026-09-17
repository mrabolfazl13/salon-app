// frontend/src/hooks/useCrm.ts
// هوک‌های TanStack Query برای کنسول CRM + کارکنان (الگوی useFinance/useDeals).
// استراتژی: mutation موفق → ابطال دامنه‌ی ['crm'] یا ['staff'] تا لیست‌ها/آمار
// با داده‌ی سرور همگام شوند.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  crmService,
  type CampaignCreatePayload,
  type ConsentUpdatePayload,
  type CrmCustomerParams,
  type CrmCustomerUpdatePayload,
} from '@/services/crm'
import {
  staffService,
  type StaffAuditParams,
  type StaffCreatePayload,
  type StaffUpdatePayload,
} from '@/services/staff'

// ─────────────────────────── Query Keys ───────────────────────────

export const crmKeys = {
  all: ['crm'] as const,
  customers: (p: CrmCustomerParams) => ['crm', 'customers', p] as const,
  customer: (userId: number, venueId: number) => ['crm', 'customer', userId, venueId] as const,
  stats: (venueId: number) => ['crm', 'stats', { venueId }] as const,
  campaigns: (venueId: number) => ['crm', 'campaigns', { venueId }] as const,
}

export const staffKeys = {
  all: ['staff'] as const,
  list: (venueId: number, includeInactive: boolean) =>
    ['staff', 'list', { venueId, includeInactive }] as const,
  audit: (p: StaffAuditParams) => ['staff', 'audit', p] as const,
}

// ─────────────────────────── CRM Queries ───────────────────────────

export function useCrmCustomers(params: CrmCustomerParams, enabled = true) {
  return useQuery({
    queryKey: crmKeys.customers(params),
    queryFn: () => crmService.listCustomers(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCrmCustomer(userId: number | null, venueId: number | null) {
  return useQuery({
    queryKey: crmKeys.customer(userId ?? 0, venueId ?? 0),
    queryFn: () => crmService.getCustomer(userId as number, venueId as number),
    enabled: userId !== null && venueId !== null && userId > 0,
  })
}

export function useCrmStats(venueId: number | null) {
  return useQuery({
    queryKey: crmKeys.stats(venueId ?? 0),
    queryFn: () => crmService.getStats(venueId as number),
    enabled: venueId !== null && venueId > 0,
  })
}

export function useCrmCampaigns(venueId: number | null) {
  return useQuery({
    queryKey: crmKeys.campaigns(venueId ?? 0),
    queryFn: () => crmService.listCampaigns(venueId as number),
    enabled: venueId !== null && venueId > 0,
  })
}

// ─────────────────────────── CRM Mutations ───────────────────────────

export function useUpdateCrmCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      venueId,
      data,
    }: {
      userId: number
      venueId: number
      data: CrmCustomerUpdatePayload
    }) => crmService.updateCustomer(userId, venueId, data),
    onSuccess: (_row, vars) => {
      queryClient.invalidateQueries({ queryKey: crmKeys.all })
      queryClient.invalidateQueries({
        queryKey: crmKeys.customer(vars.userId, vars.venueId),
      })
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignCreatePayload) => crmService.createCampaign(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.all }),
  })
}

export function useSetMarketingConsent() {
  return useMutation({
    mutationFn: (data: ConsentUpdatePayload) => crmService.setConsent(data),
  })
}

// ─────────────────────────── Staff ───────────────────────────

export function useStaffList(venueId: number | null, includeInactive = false) {
  return useQuery({
    queryKey: staffKeys.list(venueId ?? 0, includeInactive),
    queryFn: () => staffService.listStaff(venueId as number, includeInactive),
    enabled: venueId !== null && venueId > 0,
  })
}

export function useStaffAudit(params: StaffAuditParams, enabled = true) {
  return useQuery({
    queryKey: staffKeys.audit(params),
    queryFn: () => staffService.listAudit(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StaffCreatePayload) => staffService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      queryClient.invalidateQueries({ queryKey: crmKeys.all }) // ممیزی/لیست‌ها متاثر نمی‌شوند ولی ارزان است
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffUpdatePayload }) =>
      staffService.updateStaff(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}

export function useRemoveStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: number) => staffService.removeStaff(assignmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}