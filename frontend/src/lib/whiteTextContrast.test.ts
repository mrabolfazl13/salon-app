import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

// کنتراست متن سفید روی رنگ برند (WCAG 1.4.3). مقادیر از پالت واقعی Tailwind همین ریپو
// گرفته می‌شوند، نه از جدول دستی: کفِ هر خانواده سایه‌ای است که اولین بار نسبت ≥ ۴٫۵ می‌دهد.
// موج مرورگری ثابت کرد این قانون قابل‌اجراست (amber-500 روی سفید = ۲٫۱۵) و که خودِ مرورگر
// کافی نیست: دیالوگ آپدیت و چیپ‌های «کاهش/افزایش» هرگز باز نشدند ولی اینجا گرفته می‌شوند.
// محدودیتِ آگاهانه: سنجش خط‌به‌خط است، نه آب‌ورفتگی CSS. اگر یک خط هم‌زمان رنگ متنِ `dark:`
// و یک سفیدِ تعاملی داشته باشد، آن رنگ متن بازنویسی فرض می‌شود (حالت کم‌تکرار؛ در عوض
// `dark:bg-blue-500 dark:text-slate-950` صحیح رد می‌شود). متن سفیدِ والد و پس‌زمینهٔ فرزندی
// هم دیده نمی‌شود — پوششِ آن همان پروب مرورگری است.

const require = createRequire(import.meta.url)
const palette = require('tailwindcss/colors') as Record<string, Record<string, string>>

const HUES = [
  'amber', 'orange', 'yellow', 'green', 'emerald', 'teal', 'cyan', 'lime',
  'red', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'slate', 'gray', 'grey', 'zinc', 'neutral', 'stone',
]

const channel = (v: number) => {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) => {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}
const againstWhite = (hex: string) => (1.05) / (luminance(hex) + 0.05)

/** کمترین سایه‌ای از آن خانواده که متن سفید رویش ۴٫۵ می‌گیرد */
const floorOf = (hue: string) => {
  const scale = palette[hue] ?? palette[hue === 'grey' ? 'gray' : hue]
  for (const shade of [500, 600, 700, 800, 900, 950]) {
    if (scale?.[shade] && againstWhite(scale[shade]) >= 4.5) return shade
  }
  return 950
}
const FLOOR: Record<string, number> = Object.fromEntries(HUES.map((h) => [h, floorOf(h)]))

// پیشوندهای تعاملی/رسانه‌ای معنا را عوض نمی‌کنند؛ فقط `dark:` سبد را دو تا می‌کند
const BUCKET = /(^|:)dark:/
// سایه‌های Tailwind سه‌رقمی هم دارند (950)؛ الگوی `\d00` آن‌ها را نمی‌دید
const COLOR_TOKEN = /^(?:[a-z[-]+:)*(bg|from|via|to|text)-([a-z]+)-(\d{2,3})(?:\/\d{1,3})?$/
const WHITE_TOKEN = /^(?:[a-z[-]+:)*text-white(?:\/\d{1,3})?$/
const ANY_TEXT = /^(?:[a-z[-]+:)*text-[a-z]+-\d{2,3}/

const scopeOf = (token: string) => (BUCKET.test(token) ? 'dark' : 'both')

const violationsInLine = (line: string): string[] => {
  const tokens = line.split(/[\s"'`;()[\]{}]+/).filter(Boolean)
  const out: string[] = []
  for (const token of tokens) {
    const m = COLOR_TOKEN.exec(token)
    if (!m || m[1] === 'text') continue
    const [, kind, hue, shade] = m
    if (!HUES.includes(hue) || !palette[hue]?.[shade]) continue
    if (Number(shade) >= FLOOR[hue]) continue
    // یک کلاس بی‌پیشوند در هر دو حالت اعمال می‌شود، پس هر دو حالت بررسی می‌شوند
    const modes = scopeOf(token) === 'dark' ? (['dark'] as const) : (['light', 'dark'] as const)
    const bad = modes.some((mode) => {
      const whiteInEffect = tokens.some(
        (t) => WHITE_TOKEN.test(t) && (scopeOf(t) === 'both' || (mode === 'dark' && scopeOf(t) === 'dark'))
      )
      if (!whiteInEffect) return false
      // بازنویسیِ متن در همان حالت: `dark:bg-blue-500 dark:text-slate-950` سفید را می‌برد
      const overridden = tokens.some(
        (t) => ANY_TEXT.test(t) && !WHITE_TOKEN.test(t) && (mode === 'dark' ? scopeOf(t) === 'dark' : scopeOf(t) === 'both')
      )
      return !overridden
    })
    if (bad) out.push(`${kind}-${hue}-${shade} needs >= ${FLOOR[hue]} for text-white [${scopeOf(token)}]`)
  }
  return out
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : name.endsWith('.tsx') ? [full] : []
  })

const offenders = walk('src').flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) => violationsInLine(line).map((why) => `${file}:${index + 1} ${why}`))
)

describe('کنتراست متن سفید روی رنگ برند (WCAG 1.4.3)', () => {
  it('کفِ هر خانواده از پالت نصب‌شده محاسبه می‌شود، نه از عدد دستی', () => {
    // سه دستهٔ واقعی: گرم‌ها ۷۰۰، سرد/بنفش‌ها ۶۰۰، خاکستری‌ها ۵۰۰
    for (const hue of ['amber', 'orange', 'yellow', 'green', 'emerald', 'teal', 'cyan', 'lime']) {
      expect(FLOOR[hue], hue).toBe(700)
    }
    for (const hue of ['red', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']) {
      expect(FLOOR[hue], hue).toBe(600)
    }
    for (const hue of ['slate', 'gray', 'grey', 'zinc', 'neutral', 'stone']) {
      expect(FLOOR[hue], hue).toBe(500)
    }
  })

  it('هیچ متن سفیدی روی سایهٔ کم‌کنتراست در src نمانده است', () => {
    expect(offenders).toEqual([])
  })

  it('کنترل منفی: همان کلاس‌هایی که در پروداکشن رد شدند گرفته می‌شوند', () => {
    expect(violationsInLine(`className="bg-gradient-to-br from-lime-400 to-emerald-500 text-white"`)).toHaveLength(2)
    expect(violationsInLine(`'bg-blue-600 text-white dark:bg-blue-500'`)).toEqual([
      'bg-blue-500 needs >= 600 for text-white [dark]',
    ])
    expect(violationsInLine(`'bg-amber-500 text-white'`)).toHaveLength(1)
  })

  it('حالت‌های سالم رد نمی‌شوند', () => {
    const safe = [
      `'bg-amber-700 text-white hover:bg-amber-800'`,
      // سبد تاریک رنگ متن خودش را دارد، پس سفیدِ سبد روشن به آن سرریز نمی‌کند
      `'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950'`,
      `'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'`,
      `'bg-red-600 text-white dark:bg-red-600'`,
      `'bg-card text-foreground'`,
    ]
    for (const line of safe) expect(violationsInLine(line), line).toEqual([])
  })
})
