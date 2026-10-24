import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

/**
 * دامِ «loading» در دامِ قدیمی ui/Button: دکمه واقعاً disabled می‌شود، پس صفحه‌خوان
 * فقط «غیرفعال» را می‌گوید و کاربر نمی‌فهمد ارسال در جریان است یا اینکه چیزی غلط
 * است. این تست aria-busy را قفل می‌کند تا کسی آن را «تزئینی» حذف نکند.
 */
describe('aria-busy روی دکمهٔ در حال ارسال', () => {
  it('وقتی loading است: هم disabled و هم aria-busy=true', () => {
    render(<Button loading>ارسال کد</Button>)
    const btn = screen.getByRole('button', { name: 'ارسال کد' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('وقتی loading نیست: اصلاً aria-busy ندارد (تا حالت عادی «busy» اعلام نشود)', () => {
    render(<Button>ذخیره</Button>)
    const btn = screen.getByRole('button', { name: 'ذخیره' })
    expect(btn).not.toHaveAttribute('aria-busy')
  })

  it('آیکون تزئینی بخشی از نام قابل‌دسترس نمی‌شود', () => {
    // @iconify/react در jsdom svg تولید نمی‌کند، پس فقط خودِ نام قفل می‌شود
    render(<Button loading icon="mdi:check">پرداخت</Button>)
    expect(screen.getByRole('button')).toHaveAccessibleName('پرداخت')
  })
})
