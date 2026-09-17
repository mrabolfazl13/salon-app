// frontend/src/utils/helpers.ts
// لایهٔ سازگاری — تعاریف مشترک در src/lib/utils.ts و منطق جلالی در src/lib/jalali.ts است.
// همهٔ نمایش‌های تاریخ اینجا جلالی هستند (قبلاً با date-fns میلادی چاپ می‌شد و ناسازگار بود).

import { formatJalaliDate, formatJalaliDateTime, formatJalaliTime } from '@/lib/jalali'

export const formatPersianDate = (date: string | Date) =>
  formatJalaliDate(date, { format: 'numeric' })

export const formatPersianDateTime = (date: string | Date) =>
  formatJalaliDateTime(date, { format: 'numeric' })

export const formatPersianTime = (date: string | Date) => formatJalaliTime(date)

export { formatPrice, getInitials } from '@/lib/utils'