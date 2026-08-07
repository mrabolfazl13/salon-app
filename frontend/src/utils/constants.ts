export const APP_NAME = 'فوتسال'
export const APP_DESCRIPTION = 'سیستم رزرو سالن فوتسال'

export const ROLES = {
  USER: 'user',
  VENUE_MANAGER: 'venue_manager',
  CLUB_ADMIN: 'club_admin',
  SUPER_ADMIN: 'super_admin',
} as const

export const ROLE_LABELS = {
  [ROLES.USER]: 'کاربر عادی',
  [ROLES.VENUE_MANAGER]: 'مدیر سالن',
  [ROLES.CLUB_ADMIN]: 'مدیر باشگاه',
  [ROLES.SUPER_ADMIN]: 'ادمین',
} as const

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'در انتظار',
  [BOOKING_STATUS.CONFIRMED]: 'تایید شده',
  [BOOKING_STATUS.CANCELLED]: 'لغو شده',
  [BOOKING_STATUS.COMPLETED]: 'انجام شده',
} as const

export const CONTRACT_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export const CONTRACT_STATUS_LABELS = {
  [CONTRACT_STATUS.ACTIVE]: 'فعال',
  [CONTRACT_STATUS.EXPIRED]: 'منقضی',
  [CONTRACT_STATUS.CANCELLED]: 'لغو شده',
} as const

export const RECURRENCE_TYPES = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const

export const RECURRENCE_LABELS = {
  [RECURRENCE_TYPES.WEEKLY]: 'هفتگی',
  [RECURRENCE_TYPES.BIWEEKLY]: 'دو هفته یکبار',
  [RECURRENCE_TYPES.MONTHLY]: 'ماهانه',
} as const

export const DAYS_OF_WEEK = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
]

export const AMENITIES = [
  'پارکینگ',
  'کافه',
  'دوش',
  'سالن انتظار',
  'تلویزیون',
  'سیستم صوتی',
  'اینترنت',
  'تهویه',
  'کفپوش استاندارد',
  'نورپردازی',
] as const