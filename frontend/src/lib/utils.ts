import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-700',
    available: 'bg-green-100 text-green-700',
    booked: 'bg-red-100 text-red-700',
    blocked: 'bg-gray-100 text-gray-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getStatusLabel(status: string): string {
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

export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getDayName(day: number): string {
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
  return days[day] || ''
}