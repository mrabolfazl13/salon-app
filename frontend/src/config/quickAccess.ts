// حساب‌های نمایشی صفحهٔ ورود — هم‌تراز با backend/app/seed_quick_access.py
// این رمز عمداً عمومی است؛ حساب‌ها فقط برای دمو و آزمون نقش‌ها ساخته شده‌اند.

export interface QuickAccessUser {
  phone: string
  password: string
  name: string
}

export interface QuickAccessGroup {
  key: 'user' | 'manager' | 'admin'
  label: string
  icon: string
  color: string
  users: QuickAccessUser[]
}

const DEMO_PASSWORD = 'demo1234'

const demoUser = (phone: string, name: string): QuickAccessUser => ({
  phone,
  password: DEMO_PASSWORD,
  name,
})

export const QUICK_ACCESS_GROUPS: QuickAccessGroup[] = [
  {
    key: 'user',
    label: 'کاربر عادی',
    icon: 'mdi:account-outline',
    color: '#0369a1',
    users: [
      demoUser('09000000111', 'کاربر نمونه ۱'),
      demoUser('09000000112', 'کاربر نمونه ۲'),
      demoUser('09000000113', 'کاربر نمونه ۳'),
    ],
  },
  {
    key: 'manager',
    label: 'مدیر سالن',
    icon: 'mdi:account-tie-outline',
    color: '#b45309',
    users: [
      demoUser('09000000211', 'مدیر سالن نمونه ۱'),
      demoUser('09000000212', 'مدیر سالن نمونه ۲'),
      demoUser('09000000213', 'مدیر سالن نمونه ۳'),
    ],
  },
  {
    key: 'admin',
    label: 'مدیر کل',
    icon: 'mdi:shield-crown-outline',
    color: '#6d28d9',
    users: [
      demoUser('09000000311', 'مدیر کل نمونه ۱'),
      demoUser('09000000312', 'مدیر کل نمونه ۲'),
      demoUser('09000000313', 'مدیر کل نمونه ۳'),
    ],
  },
]
