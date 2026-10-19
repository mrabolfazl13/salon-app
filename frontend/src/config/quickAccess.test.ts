import { describe, expect, it } from 'vitest'

import { QUICK_ACCESS_GROUPS } from './quickAccess'

describe('QUICK_ACCESS_GROUPS', () => {
  it('یک گروه برای هر نقش اصلی دارد', () => {
    expect(QUICK_ACCESS_GROUPS.map((g) => g.key)).toEqual(['user', 'manager', 'admin'])
  })

  it('برای هر نقش سه حساب با شمارهٔ معتبر دارد', () => {
    for (const group of QUICK_ACCESS_GROUPS) {
      expect(group.users).toHaveLength(3)
      for (const user of group.users) {
        expect(user.phone).toMatch(/^09\d{9}$/)
        expect(user.password.length).toBeGreaterThanOrEqual(4)
        expect(new Set(group.users.map((u) => u.phone)).size).toBe(3)
      }
    }
  })

  it('شمارهٔ حساب‌ها بین نقش‌ها یکتا است', () => {
    const phones = QUICK_ACCESS_GROUPS.flatMap((g) => g.users.map((u) => u.phone))
    expect(new Set(phones).size).toBe(phones.length)
  })
})
