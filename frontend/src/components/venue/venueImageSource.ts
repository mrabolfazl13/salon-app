// src/components/venue/venueImageSource.ts — منبع امن تصویر سالن (بدون درخواست بی‌نتیجه)
import { parseList, toFullUrl } from '@/utils/venueMedia'

/**
 * در dev سرور Vite فقط /api/v1 و /ws را پروکسی می‌کند و هیچ پروکسی برای /static ندارد
 * (vite.config.ts) ⇒ اگر VITE_DOMAIN تنظیم نشده باشد، آدرس نسبی /static/venues/x.jpg
 * روی localhost:3001 می‌میرد و مرورگر آیکون «تصویر شکسته» + خطای کنسول می‌زند.
 * در production همان مسیر نسبی را nginx سرو می‌کند، پس فقط حالت dev بسته می‌شود و
 * معنای آدرس در production دست‌نخورده است.
 */
const isDevUnproxiedStatic = (url: string) => import.meta.env.DEV && url.startsWith('/')

/**
 * آدرس تصویر قابل‌درخواست سالن، یا '' وقتی نباید هیچ درخواستی زد
 * (تصویری وجود ندارد، یا مسیر در dev سرو نمی‌شود).
 * '' یعنی فراخوان‌کننده مستقیم کاشی جایگزین محلی را نشان دهد.
 */
export const resolveVenueImage = (images: unknown): string => {
  const [first] = parseList(images)
  if (!first) return ''
  const url = toFullUrl(first)
  return isDevUnproxiedStatic(url) ? '' : url
}
