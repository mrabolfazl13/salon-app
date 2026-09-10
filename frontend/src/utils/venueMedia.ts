// ابزار مشترک تصاویر سالن — مورد استفاده VenueImage، VenueCard، Home و ...

// بک‌اند ممکن است JSON field را به‌صورت string یا array بفرستد
export const parseList = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string' && v) {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// تبدیل filename به آدرس کامل: {DOMAIN}/static/venues/{filename}
const STATIC_URL = `${import.meta.env.VITE_DOMAIN.replace(/\/+$/, '')}/static/venues`

export const toFullUrl = (f: string): string => {
  if (!f) return ''
  if (/^https?:\/\//i.test(f)) return f
  return `${STATIC_URL}/${f.replace(/^\/+/, '')}`
}
