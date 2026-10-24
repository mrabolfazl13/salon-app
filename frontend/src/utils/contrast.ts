// رنگ‌های وضعیت در سراسر اپ به‌صورت هگزهای تزئینی (tailwind) نوشته شده‌اند؛ به‌عنوان
// متن روی کاغذ یا روی تیغِ ۱۰–۱۲٪ی خودشان، خیلی‌هایشان زیر ۴٫۵:۱ می‌افتند
// (#059669≈3.3، #0891b2≈3.2، #15803d≈4.3، #64748b≈4.2). ممیزی axe F-21.

import type { CSSProperties } from 'react'

type Rgb = [number, number, number, number]

const HEX6 = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i
const RGB_FN = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i

const toRgb = (color: string): Rgb | null => {
  const c = color.trim()
  const hex = HEX6.exec(c)
  // هگز ۸ رقمی (#rrggbbaa) هم در پالت وضعیت استفاده می‌شود
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16), hex[4] === undefined ? 1 : parseInt(hex[4], 16) / 255]
  const fn = RGB_FN.exec(c)
  if (fn) return [+fn[1], +fn[2], +fn[3], fn[4] === undefined ? 1 : +fn[4]]
  return null
}

const channel = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
const toHex = ([r, g, b]: Rgb) => `#${channel(r)}${channel(g)}${channel(b)}`

/** WCAG 2.1 نسبی */
const luminance = ([r, g, b]: Rgb): number => {
  const [x, y, z] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * x + 0.7152 * y + 0.0722 * z
}

export const contrastRatio = (a: string, b: string): number => {
  const [f, s] = [toRgb(a), toRgb(b)]
  if (!f || !s) return 1
  const [hi, lo] = [luminance(f), luminance(s)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

/** رنگ نیمه‌شفاف را روی کاغذ می‌شکند تا هگزِ واقعیِ پس‌زمینه دست بدهد */
export const composite = (color: string, paper = '#ffffff'): string => {
  const [f, p] = [toRgb(color), toRgb(paper)]
  if (!f || !p) return paper
  const a = f[3]
  return toHex([f[0] * a + p[0] * (1 - a), f[1] * a + p[1] * (1 - a), f[2] * a + p[2] * (1 - a), 1])
}

/**
 * رنگ متن را آن‌قدر تیره (و روی زمینهٔ تیره، روشن) می‌کند تا حداقل کنتراست را پاس دهد.
 * hue حفظ می‌شود: فقط به سمت سیاه/سفتم پیش می‌رود.
 */
export const readableText = (fg: string, bg: string, min = 4.5): string => {
  const [f, b] = [toRgb(fg), toRgb(bg)]
  if (!f || !b || f[3] !== 1) return fg
  const target = toHex(b)
  const toward: Rgb = luminance(b) < 0.5 ? [255, 255, 255, 1] : [0, 0, 0, 1]
  let current = f
  for (let i = 0; i <= 12; i++) {
    const hex = toHex(current)
    if (contrastRatio(hex, target) >= min) return hex
    current = [current[0] + (toward[0] - current[0]) * 0.08, current[1] + (toward[1] - current[1]) * 0.08, current[2] + (toward[2] - current[2]) * 0.08, 1]
  }
  return toHex(current)
}

/** جوهرِ خواناتِ یک چیپ: رنگ متن سنجیده‌شده با پس‌زمینهٔ تیغ‌خوردهٔ خودش */
export const chipInk = (fg: string, bg: string, paper = '#ffffff'): string =>
  readableText(fg, composite(bg, paper))

// کاغذِ روشن/تیره برای سنجش جوهرِ چیپ‌ها (جایگزین palette.background.paper)
const PAPER_LIGHT = '#ffffff'
const PAPER_DARK = '#121a2b'

/**
 * جوهر هر دو تم در متغیر CSS می‌نشیند تا `dark:` آن را جایگزین کند؛ جوهرِ تیرهٔ پالت
 * (مثلاً #92400e) روی کارت تیره #121a2b به ≈۲٫۳:۱ می‌افتد و روی style کار نمی‌کند.
 */
export const chipStyle = (fg: string, bg: string): CSSProperties =>
  ({
    backgroundColor: bg,
    '--chip-ink': chipInk(fg, bg, PAPER_LIGHT),
    '--chip-ink-dark': chipInk(fg, bg, PAPER_DARK),
  }) as CSSProperties

/** همان جوهر، اما روی خودِ کاغذ (بی‌تیغ) — برای متن/آیکنِ رنگی روی سطح کارت */
export const inkStyle = (fg: string): CSSProperties =>
  ({
    '--chip-ink': readableText(fg, PAPER_LIGHT),
    '--chip-ink-dark': readableText(fg, PAPER_DARK),
  }) as CSSProperties

/** کلاسِ جوهرِ دوتم؛ همراه با chipStyle/inkStyle استفاده شود */
export const CHIP_INK = 'text-[color:var(--chip-ink)] dark:text-[color:var(--chip-ink-dark)]'
