import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// مقیاس شفافیتِ Tailwind 3.4 این ریپو فقط مضرب‌های ۵ را می‌سازد. «/92» هیچ rulei تولید
// نمی‌کند و صامت می‌ماند: عنصر بی‌پس‌زمینه رندر می‌شود و نه tsc، نه eslint، نه تستِ رندر
// این را می‌گیرند (یک مورد واقعی: نوار چسبانِ صفحهٔ جستجو، هر دو شاخهٔ روشن و تاریک).

const UTILITY = /^(?:bg|text|border|ring|from|via|to|shadow|fill|stroke|outline|divide|placeholder|decoration|accent|caret)-[^/\s"'`]+\/(\d{1,3})$/

/** `supports-[backdrop-filter]:bg-background/70` هم باید سنجیده شود، پس واریانت کناری بریده می‌شود */
const bare = (token: string) => token.slice(token.lastIndexOf(':') + 1)

const isDead = (token: string) => {
  const m = UTILITY.exec(bare(token))
  return m !== null && Number(m[1]) % 5 !== 0
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : name.endsWith('.tsx') ? [full] : []
  })

const offenders = walk('src').flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      line
        .split(/[\s"'`]+/)
        .filter(isDead)
        .map((token) => `${file}:${index + 1} ${token}`)
    )
)

describe('مقیاس شفافیت Tailwind (کلاس «ارگومان بی‌اثر»)', () => {
  it('هیچ اصلاح‌کنندهٔ شفافیتِ تولیدنشدنی در src نیست', () => {
    expect(offenders).toEqual([])
  })

  it('مضرب‌های ۵، فرم‌های براکتی و کلاس‌های بی‌ارگومان رد نمی‌شوند', () => {
    for (const token of [
      'bg-background/95',
      'border-white/20',
      'bg-white/[0.08]',
      'dark:bg-slate-950/85',
      'supports-[backdrop-filter]:bg-background/70',
      'text-[0.68rem]',
      'bg-card',
    ]) {
      expect(isDead(token), token).toBe(false)
    }
  })

  it('کنترل منفی: همان کلاس‌هایی که در پروداکشن صامت بودند گرفته می‌شوند', () => {
    for (const token of ['bg-[#f6f7f9]/92', 'dark:bg-[#0b1220]/92', 'border-white/33']) {
      expect(isDead(token), token).toBe(true)
    }
  })
})
