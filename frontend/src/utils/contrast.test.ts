import { describe, expect, it } from 'vitest'

import { chipInk, composite, contrastRatio, readableText } from './contrast'

describe('utils/contrast', () => {
  it('rgba را روی کاغذ می‌شکند', () => {
    expect(composite('rgba(16,185,129,0.10)')).toBe('#e7f8f2')
    expect(composite('#0596691f')).toBe('#e1f2ed')
  })

  it('کنتراست سیاه/سفید را درست می‌دهد', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#7b7f8a', '#ffffff')).toBeCloseTo(4, 0)
  })

  it('رنگ متنِ ردشده را به ۴٫۵:۱ می‌رساند و hue را نگه می‌دارد', () => {
    const ink = readableText('#0891b2', '#ffffff')
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(ink).not.toBe('#0891b2')
    // رنگِ از پیش قابل‌قبول دست‌نخورده می‌ماند
    expect(readableText('#0f172a', '#ffffff')).toBe('#0f172a')
  })

  it('جوهر چیپ با خودِ زمینهٔ تیغ‌خورده سنجیده می‌شود', () => {
    // شواهد ممیزی axe: «پرداخت‌شده» ۴٫۴۹ و «عمومی» ۳٫۴۸ بود
    const paidBg = 'rgba(22,163,74,0.1)'
    const publicBg = 'rgba(16,185,129,0.08)'
    expect(contrastRatio(chipInk('#15803d', paidBg), composite(paidBg))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(chipInk('#059669', publicBg), composite(publicBg))).toBeGreaterThanOrEqual(4.5)
  })

  it('روی زمینهٔ تیره به‌جای تیره‌کردن، روشن می‌کند', () => {
    const ink = readableText('#059669', '#121a2b')
    expect(contrastRatio(ink, '#121a2b')).toBeGreaterThanOrEqual(4.5)
  })

  it('رنگ‌های نامعتبر (inherit، شفاف) را دست‌نخورده برمی‌گرداند', () => {
    expect(readableText('inherit', '#ffffff')).toBe('inherit')
    expect(readableText('rgba(15,23,42,0.6)', '#ffffff')).toBe('rgba(15,23,42,0.6)')
  })
})
