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
// VITE_DOMAIN در بیلد نبود خالی در نظر می‌آید تا مسیر نسبی (/static/venues) کار کند؛
// هرگز نباید روی undefined صدایی شود وگرنه ماژول در زمان load کرش می‌کند (صفحه سفید).
const STATIC_URL = `${(import.meta.env.VITE_DOMAIN || '').replace(/\/+$/, '')}/static/venues`

export const toFullUrl = (f: string): string => {
  if (!f) return ''
  if (/^https?:\/\//i.test(f)) return f
  return `${STATIC_URL}/${f.replace(/^\/+/, '')}`
}

// Placeholder images با موضوعات مختلف فوتسال
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', // Futsal court
  'https://images.unsplash.com/photo-1529900748604-07564a6354d5?w=800&q=80', // Indoor sports
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80', // Sports hall
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80', // Stadium
  'https://images.unsplash.com/photo-1562771242-a02d909dd3b4?w=800&q=80', // Soccer field
]

/** دریافت تصویر placeholder بر اساس ID سالن برای تنوع */
export const getPlaceholderImage = (venueId?: number, index: number = 0): string => {
  const idx = venueId ? (venueId + index) % PLACEHOLDER_IMAGES.length : index % PLACEHOLDER_IMAGES.length
  return PLACEHOLDER_IMAGES[idx]
}
