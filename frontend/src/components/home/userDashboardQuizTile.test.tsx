import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { User, UserRole } from '@/types'

vi.mock('@/services/venue', () => ({
  venueService: { getAll: vi.fn().mockResolvedValue([]) },
}))

import UserDashboard from '@/components/home/UserDashboard'

/**
 * چالش هفتگی مدت‌ها فقط از خانهٔ مهمان لینک داشت، یعنی کاربرِ واردشده هرگز به آن
 * نمی‌رسید. این تست همان قاعده را قفل می‌کند: تایل برای مشتری و مربی هست، و برای
 * کنسول‌دارها نیست چون شش تایلِ کاریِ آن‌ها کامل است.
 */
const renderFor = async (role: UserRole) => {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, fullName: 'کاربر نمونه', role } as unknown as User,
  })
  render(
    <MemoryRouter>
      <UserDashboard />
    </MemoryRouter>,
  )
  // سالن‌ها را در اثرِ جانبی async می‌گیرد؛ بدون تهیۀ این Promise، React هشدار act می‌دهد
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

describe('تایل «چالش هفتگی» در دسترسی سریع خانه', () => {
  beforeEach(() => vi.clearAllMocks())

  it('برای کاربر عادی هست و در موبایل تمام عرض را می‌گیرد', async () => {
    await renderFor('user')
    const tile = screen.getByRole('button', { name: /چالش هفتگی/ })
    expect(tile).toBeInTheDocument()
    expect(tile).toHaveClass('col-span-2', 'sm:col-span-1')
  })

  it('برای مربی هم هست', async () => {
    await renderFor('coach')
    expect(screen.getByRole('button', { name: /چالش هفتگی/ })).toBeInTheDocument()
  })

  it.each(['venue_manager', 'club_admin'])('برای کنسولِ %s اضافه نمی‌شود', async (role) => {
    await renderFor(role as UserRole)
    expect(screen.queryByRole('button', { name: /چالش هفتگی/ })).not.toBeInTheDocument()
  })
})
