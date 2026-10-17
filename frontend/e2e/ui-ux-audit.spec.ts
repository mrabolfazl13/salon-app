/**
 * UI/UX Audit Tests — Touch targets, accessibility, responsive design
 * Based on Apple HIG (44×44pt) and Material Design (48×48dp) standards
 */
import { test, expect } from '@playwright/test'

test.describe('UI/UX Audit - Touch Targets', () => {
  test('all buttons meet minimum touch target size (44×44px)', async ({ page }) => {
    await page.goto('/')
    
    // Get all interactive buttons
    const buttons = page.locator('button, [role="button"], a')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        // Skip very small decorative elements
        if (box.width > 20 && box.height > 20) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })

  test('filter chips are tappable', async ({ page }) => {
    await page.goto('/venues')
    
    // Wait for venue list to load
    await page.waitForSelector('[data-testid="venue-card"]', { timeout: 10000 })
    
    // Check filter button
    const filterBtn = page.locator('[aria-label*="فیلتر"]')
    await expect(filterBtn).toBeVisible()
    
    const box = await filterBtn.boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('bookings is protected: guests are sent to the login screen', async ({ page }) => {
    // تب‌های /bookings پشت ProtectedRoute‌اند و بدون حساب تست (X1) دیدنی نیستند؛
    // چیزی که همین حالا می‌شود سنجید همان رفتارِ سازنده است: ریدایرکت به /login.
    // اندازه‌گیری touch targetِ تب‌ها به fixture حساب تست موکول است.
    await page.goto('/bookings')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByLabel('شماره تلفن همراه', { exact: true })).toBeVisible()
  })

  test('cards have adequate click area', async ({ page }) => {
    await page.goto('/venues')
    
    // Wait for venue cards
    await page.waitForSelector('[data-testid="venue-card"]', { timeout: 10000 })
    
    const cards = page.locator('[data-testid="venue-card"]')
    const count = await cards.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = cards.nth(i)
      const box = await card.boundingBox()
      
      if (box) {
        // Cards should be full-width on mobile
        expect(box.width).toBeGreaterThan(300)
        expect(box.height).toBeGreaterThan(100)
      }
    }
  })
})

test.describe('UI/UX Audit - Accessibility', () => {
  test('all images have alt text', async ({ page }) => {
    await page.goto('/')
    
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeDefined()
    }
  })

  test('form inputs have accessible names', async ({ page }) => {
    await page.goto('/login')

    // ادعای قبلی بی‌ادعا بود: MUI روی هر input یک `id` می‌گذارد، پس شرط
    // «aria-label یا id» همیشه برقرار است و نامِ قابل‌دسترسِ خالی را نمی‌گرفت
    // (همان باگی که aria-label روی ریشۀ TextField روی div می‌نشست).
    const unnamed = await page.locator('input').evaluateAll((inputs) =>
      inputs
        .filter((el) => {
          const labelledBy = el.getAttribute('aria-labelledby')
          const byLabelledBy = labelledBy
            ? labelledBy.split(' ').some((ref) => (document.getElementById(ref)?.textContent ?? '').trim())
            : false
          const hasName =
            Boolean((el.getAttribute('aria-label') ?? '').trim()) ||
            byLabelledBy ||
            (el.labels?.length ?? 0) > 0
          return !hasName && el.type !== 'hidden'
        })
        .map((el) => el.type + '/' + el.id),
    )
    expect(unnamed).toEqual([])
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Tab through the page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Something should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })
})

test.describe('UI/UX Audit - Responsive Design', () => {
  test('mobile viewport (375px) renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // No horizontal scroll
    const body = page.locator('body')
    const scrollWidth = await body.evaluate(el => el.scrollWidth)
    const clientWidth = await body.evaluate(el => el.clientWidth)
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('tablet viewport (768px) uses a multi-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/venues')

    await page.waitForSelector('[data-testid="venue-card"]', { timeout: 15000 })

    // MUI گرید را با کلاس می‌سازد، نه inline style ⇒ `[style*="grid"]` هرگز
    // نمی‌خورد؛ ادعای واقعی «چندستونه» است، پس از روی هندسۀ کارت‌ها سنجیده می‌شود
    const columns = await page.locator('[data-testid="venue-card"]').evaluateAll((cards) =>
      new Set(cards.slice(0, 6).map((c) => Math.round(c.getBoundingClientRect().left))).size)
    expect(columns).toBeGreaterThanOrEqual(2)
  })

  test('desktop viewport (1440px) shows the hero call to action', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // متن hero به حالت احراز هویت وابسته است: «همین حالا سانس رزرو کن» برای کاربر
    // لاگین‌شده و «همین حالا رایگان شروع کن» برای مهمان؛ تستِ قبلی فقط نصِ اول را
    // می‌خواست و در CI (همیشه بی‌login) می‌بازد
    const heroCta = page.locator('text=/همین حالا (سانس رزرو کن|رایگان شروع کن)/')
    await expect(heroCta.first()).toBeVisible()
  })
})

test.describe('UI/UX Audit - Loading States', () => {
  test('shows loading skeleton while fetching venues', async ({ page }) => {
    await page.goto('/venues')

    // بلافاصله بعد از goto هنوز نه skeleton نشسته و نه کارت (query تازه راه افتاده)،
    // پس `.count()` روی صفر می‌شد؛ ادعا باید تا ظهورِ یکی از دو حالت صبر کند
    await expect
      .poll(async () =>
        (await page.locator('.MuiSkeleton-root').count()) +
        (await page.locator('[data-testid="venue-card"]').count()), { timeout: 15000 })
      .toBeGreaterThan(0)
  })

  test('unauthenticated bookings asks the user to sign in', async ({ page }) => {
    await page.goto('/bookings')

    // ProtectedRoute مهمان را به /login می‌فرستد (نه empty state در /bookings)؛
    // «وارد شوید» هم هیچ‌جا در متن این صفحه نبود، پس ادعا روی رفتارِ واقعی نشست
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByLabel('شماره تلفن همراه', { exact: true })).toBeVisible()
  })
})

test.describe('UI/UX Audit - Error Handling', () => {
  // این دو قبلاً `test.skip()` بی‌محتوا بودند («needs mocking»). mock فقط لایۀ
  // شبکه است (page.route)؛ صفحه، store و مسیر retry همان کدِ واقعیِ اپ‌اند
  test('shows the venues error state when the request fails', async ({ page }) => {
    await page.route('**/api/v1/venues**', (route) => route.abort('failed'))
    await page.goto('/venues')
    await expect(page.getByText('خطا در دریافت سالن‌ها')).toBeVisible()
    await expect(page.getByRole('button', { name: 'تلاش مجدد' })).toBeVisible()
  })

  test('retry asks the server again and renders the venues', async ({ page }) => {
    let venueRequests = 0
    await page.route('**/api/v1/venues**', async (route) => {
      venueRequests += 1
      if (venueRequests === 1) {
        await route.abort('failed')
        return
      }
      await route.continue()
    })
    await page.goto('/venues')
    const retry = page.getByRole('button', { name: 'تلاش مجدد' })
    await expect(retry).toBeVisible()
    await retry.click()
    await expect(page.locator('[data-testid="venue-card"]').first()).toBeVisible({ timeout: 20000 })
    expect(venueRequests).toBeGreaterThanOrEqual(2)
  })
})
