import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// چیپ «متن رویش + تتینگ» که با استایل درجا ساخته شود در حالت تاریک می‌میرد: variant دارک
// روی style کار نمی‌کند، پس جوهر تیرهٔ پالت (مثلاً #92400e) روی کارت #121a2b به ≈۲٫۳:۱
// می‌افتد. سویپ تاریکِ کنسول مالی ۱۳ خطای واقعی از همین کلاس داشت.
// دو قانون:
// ۱) مصرف‌کننده: سطرِ استایلِ درجا که هم‌زمان `backgroundColor:` و `color:` (هگز تیرهٔ
//    پالت یا `….fg`/`….color`) داشته باشد ممنوع — باید chipStyle()/inkStyle() + CHIP_INK شود.
// ۲) نگاشت: سطرِ نگاشتِ وضعیت با `bg: 'rgba(...)'` و جوهر تیرهٔ پالت تنها در فایلِ
//    مصرف‌کنندهٔ chipStyle/inkStyle مجاز است؛ وگرنه جوهرش خام روی DOM می‌نشیند.

const LIGHT_INKS = [
  '#047857', '#92400e', '#b91c1c', '#1d4ed8', '#0369a1', '#6d28d9', '#be185d', '#475569',
  '#059669', '#d97706', '#dc2626', '#ef4444', '#2563eb', '#0891b2', '#0ea5e9', '#7c3aed',
  '#8b5cf6', '#db2777', '#be123c', '#64748b', '#6b7280', '#16a34a', '#b45309', '#15803d',
]
const TINT_BG = /bg:\s*'rgba\(/
const INK_TEXT = /(?:color|fg):\s*'(#[0-9a-fA-F]{6})'/
const RAW_STYLE = /backgroundColor:\s*[^,}]+,\s*color:\s*(?:'?(#[0-9a-fA-F]{6})'?|[\w.[\]]+\.(?:fg|color))/

/** نگاشت خالص برای اینکه کنترل‌های مثبت/منبع تست همان قاعدهٔ تولید را بخوانند */
export const pairOf = (line: string): string | null => {
  if (!TINT_BG.test(line)) return null
  const m = INK_TEXT.exec(line)
  return m && LIGHT_INKS.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : null
}

/** جوهر خامِ درجا روی تتینگ؛ خروجی null یعنی سطر پاک است */
export const rawInkOf = (line: string): string | null => {
  const m = RAW_STYLE.exec(line)
  if (!m) return null
  return m[1] ? (LIGHT_INKS.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : null) : 'passthrough'
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : /\.(tsx|ts)$/.test(name) ? [full] : []
  })

const sources = walk('src').filter((file) => !file.includes('.test.'))

/** سطح ثابتِ تم‌مدار (کارت گرادیانی تیره…) — با کامنتِ `chip-ink-allow` روی همان سطر یا سطر بالا */
const ALLOW = 'chip-ink-allow'

const offenders = sources.flatMap((file) => {
  const text = readFileSync(file, 'utf8')
  // فایلِ مصرف‌کنندهٔ سازوکار دوتم، نگاشت‌هایش را خودش به جوهرِ دارک‌سنجیده تبدیل می‌کند
  const derived = /chipStyle\(|inkStyle\(/.test(text)
  const lines = text.split('\n')
  return lines.flatMap((line, index) => {
    if (line.includes(ALLOW) || (index > 0 && lines[index - 1].includes(ALLOW))) return []
    const raw = rawInkOf(line)
    const map = derived ? null : pairOf(line)
    return raw || map ? [`${file}:${index + 1} ${raw ?? map}`] : []
  })
})

describe('جوهرِ فقط‌روشن در چیپِ تتینگ‌دار (حالت تاریک)', () => {
  it('هیچ جوهر خام یا نگاشتِ بی‌سازوکارِ دارک در src نمانده', () => {
    expect(offenders).toEqual([])
  })

  it('کنترل مثبت: همان الگویی که در مرورگر تاریک رد شد گرفته می‌شود', () => {
    expect(pairOf(`pending: { label: 'x', bg: 'rgba(245,158,11,0.1)', color: '#d97706' },`)).toBe('#d97706')
    expect(pairOf(`session: { bg: 'rgba(37,99,235,0.07)', fg: '#2563eb' },`)).toBe('#2563eb')
    expect(rawInkOf(`style={{ backgroundColor: tone.bg, color: tone.color }}`)).toBe('passthrough')
    expect(rawInkOf(`style={{ backgroundColor: myBadge.bg, color: '#92400e' }}`)).toBe('#92400e')
  })

  it('کنترل منفی: کلاس Tailwind، یوتیلیتی مرکزی، جوهر روشنِ پالت و تتینگِ بی‌متن رد می‌شوند', () => {
    for (const line of [
      `pending: { label: 'x', cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },`,
      `dormant: { label: 'x', bg: 'rgba(100,116,139,0.10)', color: '#94a3b8' },`,
      `<Icon icon={x} style={{ color: '#2563eb' }} />`,
      `success: '#047857',`,
      `style={chipStyle(c.fg, c.bg)}`,
      `style={chipStyle(tone.color, tone.bg)}`,
      `"--chip-ink": chipInk(fg, bg, PAPER_LIGHT),`,
    ]) {
      expect(rawInkOf(line), line).toBeNull()
    }
  })
})
