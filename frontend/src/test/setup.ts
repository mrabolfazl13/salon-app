// src/test/setup.ts — راه‌اندازی محیط jsdom برای تست‌های واحد
import '@testing-library/jest-dom/vitest'

// MUI/فرا‌موشن روی این‌ها اتکا دارند و jsdom پیاده‌سازی‌شان نمی‌کند
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
