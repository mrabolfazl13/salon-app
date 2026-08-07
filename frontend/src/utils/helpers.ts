import { format } from 'date-fns'
import { faIR } from 'date-fns/locale'

export const formatPersianDate = (date: string | Date) => {
  return format(new Date(date), 'yyyy/MM/dd', { locale: faIR })
}

export const formatPersianDateTime = (date: string | Date) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: faIR })
}

export const formatPersianTime = (date: string | Date) => {
  return format(new Date(date), 'HH:mm', { locale: faIR })
}

export const getDayName = (day: number) => {
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
  return days[day] || ''
}

export const getMonthName = (month: number) => {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  return months[month] || ''
}

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'info',
    active: 'success',
    expired: 'default',
    available: 'success',
    booked: 'error',
    blocked: 'default',
  }
  return colors[status] || 'default'
}

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    confirmed: 'تایید شده',
    pending: 'در انتظار',
    cancelled: 'لغو شده',
    completed: 'انجام شده',
    active: 'فعال',
    expired: 'منقضی',
    available: 'آزاد',
    booked: 'رزرو شده',
    blocked: 'مسدود',
  }
  return labels[status] || status
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const truncateText = (text: string, length: number = 50) => {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export const isMobile = () => {
  return window.innerWidth < 768
}

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

export const isDesktop = () => {
  return window.innerWidth >= 1024
}