// src/test/setup.ts — راه‌اندازی محیط jsdom برای تست‌های واحد
import '@testing-library/jest-dom/vitest'

// framer-motion و Radix روی این‌ها اتکا دارند و jsdom پیاده‌سازی‌شان نمی‌کند
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!('ResizeObserver' in window)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = RO
}

// jsdom کلاس PointerEvent ندارد؛ fireEvent.pointerDown آن‌گاه Event خالی می‌سازد و
// pointerType/button از دست می‌رود. Radix Select فقط با pointerType === 'mouse' باز
// می‌شود، پس این کلاس لازم است تا رفتار مرورگر واقعی شبیه‌سازی شود.
if (!('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    width: number
    height: number
    pressure: number
    tangentialPressure: number
    tiltX: number
    tiltY: number
    twist: number
    pointerType: string
    isPrimary: boolean

    // PointerEventInit در lib.dom این نسخه از TS نیست؛ پارامترهای اضافی را از
    // همان آبجکت init می‌خوانیم. cast به never چون eslint این نوع‌ها را نمی‌شناسد
    // و MouseEventInit هم در env آن تعریف نشده است.
    constructor(
      type: string,
      params: {
        pointerId?: number
        width?: number
        height?: number
        pressure?: number
        tangentialPressure?: number
        tiltX?: number
        tiltY?: number
        twist?: number
        pointerType?: string
        isPrimary?: boolean
        [key: string]: unknown
      } = {},
    ) {
      super(type, params as never)
      this.pointerId = Number(params.pointerId ?? 1)
      this.width = Number(params.width ?? 1)
      this.height = Number(params.height ?? 1)
      this.pressure = Number(params.pressure ?? 0)
      this.tangentialPressure = Number(params.tangentialPressure ?? 0)
      this.tiltX = Number(params.tiltX ?? 0)
      this.tiltY = Number(params.tiltY ?? 0)
      this.twist = Number(params.twist ?? 0)
      this.pointerType = String(params.pointerType ?? '')
      this.isPrimary = Boolean(params.isPrimary ?? false)
    }
  }
  Object.assign(window, { PointerEvent: PointerEventPolyfill })
}

// Radix Select/Dialog در open شدن دستگیرهٔ اشاره‌گر را چک می‌کنند؛ jsdom این سه
// متد را ندارد و بدون آن‌ها click روی trigger با TypeError می‌شکند.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

// Radix هنگام فوکوس، گزینه/آیتم را به دید می‌آورد
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
