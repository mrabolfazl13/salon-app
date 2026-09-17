// frontend/src/services/staff.ts
// تایپ‌ها و سرویس ماژول /api/v1/staff — آینه‌ی backend/app/api/v1/staff.py + schemas/staff.py
// + app/utils/permissions.py (کدهای دسترسی و ماتریس پیش‌فرض موقعیت‌ها).

import apiClient from './api'

// ─────────────── Enum‌ها ───────────────

export type StaffPosition = 'branch_manager' | 'reception' | 'cashier' | 'accountant'

/** کدهای دسترسی — دقیقاً مطابق class Perm در utils/permissions.py */
export const ALL_PERMISSION_CODES = [
  'booking.confirm',
  'booking.pending_list',
  'booking.view',
  'contract.manage',
  'contract.view',
  'coupon.manage',
  'crm.manage',
  'crm.view',
  'customer.view_basic',
  'deal.publish',
  'finance.expense.create',
  'finance.manage',
  'finance.record_payment',
  'finance.view',
  'holiday.manage',
  'payment.view',
  'pricing.manage',
  'receivables.view',
  'reports.view',
  'slot.block',
  'slot.generate',
  'slot.view_manager',
  'staff.audit',
  'staff.manage',
] as const

export type PermissionCode = (typeof ALL_PERMISSION_CODES)[number] | (string & {})

/** ماتریس پیش‌فرض موقعیت → کدها (آینه‌ی POSITION_DEFAULT_PERMISSIONS) */
export const POSITION_DEFAULT_PERMISSIONS: Record<StaffPosition, readonly string[]> = {
  branch_manager: ALL_PERMISSION_CODES,
  reception: [
    'booking.view', 'booking.confirm', 'booking.pending_list',
    'slot.view_manager', 'slot.block', 'customer.view_basic', 'deal.publish', 'contract.view',
  ],
  cashier: [
    'finance.view', 'finance.record_payment', 'finance.expense.create',
    'booking.view', 'payment.view',
  ],
  accountant: [
    'finance.view', 'finance.manage', 'finance.expense.create',
    'reports.view', 'receivables.view',
  ],
}

// ─────────────── پاسخ‌ها / ورودی‌ها ───────────────

export interface StaffRow {
  id: number
  venue_id: number
  user_id: number
  user_name: string | null
  user_phone: string | null
  position: StaffPosition | (string & {})
  permissions: string[]
  is_custom_permissions: boolean
  is_active: boolean
  created_by: number | null
  created_at: string | null
  removed_at: string | null
}

/** خودسرویس /staff/me — انتصاب فعال + کدهای دسترسی مؤثر (آینه StaffMeRow بک‌اند) */
export interface StaffMeRow {
  id: number
  venue_id: number
  venue_name: string | null
  position: StaffPosition | (string & {})
  permissions: string[]
  is_active: boolean
}

export interface StaffCreatePayload {
  phone: string
  venue_id: number
  position: StaffPosition
  /** خالی/None = پیش‌فرض موقعیت */
  permissions?: string[] | null
}

export interface StaffUpdatePayload {
  position?: StaffPosition
  permissions?: string[] | null
}

export interface StaffAuditRow {
  id: number
  actor_id: number | null
  action: string
  target_type: string | null
  target_id: number | null
  venue_id: number | null
  data: Record<string, unknown> & { actor_name?: string | null }
  ip: string | null
  created_at: string | null
}

export interface StaffAuditListResponse {
  items: StaffAuditRow[]
  total: number
  limit: number
  offset: number
}

export interface StaffAuditParams {
  venue_id?: number
  action?: string
  limit?: number
  offset?: number
}

// ─────────────── سرویس ───────────────

export const staffService = {
  /** انتصاب‌های فعال خودِ کاربر — نقش کارمند (role=user) از همین‌جا خوانده می‌شود */
  me: async (): Promise<StaffMeRow[]> => {
    const response = await apiClient.get('/staff/me')
    return response.data
  },

  listStaff: async (venueId: number, includeInactive = false): Promise<StaffRow[]> => {
    const response = await apiClient.get('/staff/', {
      params: { venue_id: venueId, include_inactive: includeInactive },
    })
    return response.data
  },

  createStaff: async (data: StaffCreatePayload): Promise<StaffRow> => {
    const response = await apiClient.post('/staff/', data)
    return response.data
  },

  updateStaff: async (assignmentId: number, data: StaffUpdatePayload): Promise<StaffRow> => {
    const response = await apiClient.put(`/staff/${assignmentId}`, data)
    return response.data
  },

  removeStaff: async (assignmentId: number): Promise<{ message: string; id: number }> => {
    const response = await apiClient.delete(`/staff/${assignmentId}`)
    return response.data
  },

  listAudit: async (params: StaffAuditParams): Promise<StaffAuditListResponse> => {
    const response = await apiClient.get('/staff/audit', { params })
    return response.data
  },
}