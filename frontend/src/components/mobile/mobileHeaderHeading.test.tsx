import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MobileHeader from '@/components/mobile/MobileHeader'
import { useAuthStore } from '@/store/authStore'

function renderHeader(props?: { headingTag?: 'p' | 'h1' }) {
  return render(
    <MemoryRouter>
      <MobileHeader {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true, user: { fullName: 'کاربر نمونه' } as never })
})

describe('MobileHeader heading level', () => {
  it('renders the greeting as h1 when the page asks for it', () => {
    const { container } = renderHeader({ headingTag: 'h1' })
    const h1 = container.querySelector('h1')
    expect(h1?.textContent).toBe('سلام کاربر')
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  // نمای مهمان سرتیتر بازاریابی خودش را دارد؛ پیش‌فرض <p> باید بماند وگرنه خانه دو h1 می‌گیرد
  it('defaults to a paragraph, not a heading', () => {
    const { container } = renderHeader()
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('p')?.textContent).toBe('سلام کاربر')
  })
})
