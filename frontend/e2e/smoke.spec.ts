/**
 * E2E Smoke Tests — Basic health checks for the futsal booking frontend
 * These tests verify that critical pages load and render correctly
 */
import { test, expect } from '@playwright/test'

test.describe('Futsal Booking System - Smoke Tests', () => {
  test('homepage loads with Persian title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/فوتسال/)
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('venues page displays venue list', async ({ page }) => {
    await page.goto('/venues')
    await expect(page).toHaveTitle(/سالن/)
    // Wait for venues to load
    const venueCards = page.locator('[data-testid="venue-card"]')
    await expect(venueCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('login page renders the phone+password form', async ({ page }) => {
    // ورودِ این سامانه شماره تلفن + رمز است (نه ایمیل)؛ `input[type=email]` هرگز
    // در DOM نبود، پس این تست از روز اول ادعای سازندهٔ دیگری را می‌سنجید.
    // getByRole نامِ قابل‌دسترسِ واقعی را می‌سنجد — نه فقط وجود اتریبیوت:
    // aria-label روی ریشۀ TextField روی div می‌نشست و input بی‌نام می‌ماند.
    await page.goto('/login')
    const phoneInput = page.getByLabel('شماره تلفن همراه', { exact: true })
    // اولین بار که chunkِ lazy صفحۀ ورود دیده می‌شود، vite آن را تازه transform می‌کند
    // و پیش‌فرض ۵ ثانیه کوتاه است (صفحه در Suspense «در حال بارگذاری...» می‌ماند).
    await expect(phoneInput).toBeVisible({ timeout: 20_000 })
    await expect(phoneInput).toHaveAttribute('placeholder', /09/)
    await expect(phoneInput).toHaveAttribute('inputmode', 'tel')
    const passwordInput = page.getByLabel('رمز عبور', { exact: true })
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('navigation menu is accessible', async ({ page }) => {
    await page.goto('/')
    // سربرگ (landmark اصلی صفحۀ بیرونی) و لینک صفحۀ اصلی در هر دو بریک‌پوینت باید دیده شود
    const header = page.locator('header')
    await expect(header).toBeVisible()
    const homeLink = page.locator('a[href="/"], a:has-text("خانه")')
    await expect(homeLink.first()).toBeVisible()

    // ناوبری اصلی روی موبایل «نوار پایین» است و روی دسکتاپ ردیف دکمه‌های هدر
    // (display:none/md:flex)؛ ادعای «nav دیدنی در ۱۲۸۰px» برای کاربر مهمان غلط بود،
    // پس landmark در بریک‌پوینت خودش سنجیده می‌شود
    await page.setViewportSize({ width: 375, height: 667 })
    const nav = page.locator('nav[aria-label="ناوبری اصلی"]')
    await expect(nav).toBeVisible()
  })

  test('responsive layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    // Ensure no horizontal overflow
    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)
    const clientWidth = await body.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // Allow 1px tolerance
  })

  test('error page shows 404 for invalid route', async ({ page }) => {
    // این تست عمداً بی‌ادعا بود: `expect(statusCode).toBeDefined()` روی یک Promise
    // همیشه درست است و هیچ‌چیزی دربارهٔ صفحۀ ۴۰۴ نمی‌سنجید. حالا رفتارِ واقعی
    // مسیرِ ناشناخته (catch-all در App.tsx) سنجیده می‌شود.
    await page.goto('/this-route-does-not-exist')
    await expect(page.locator('h1')).toContainText('صفحه مورد نظر یافت نشد')
    // صفحهٔ ۴۰۴ اکنون داخل پوستهٔ برنامه رندر می‌شود (هدر/ناوبری)؛ پس لینک خانه
    // چند بار در DOM هست و locator عمومی به strict-mode می‌خورد (F-15).
    await expect(page.getByRole('button', { name: 'صفحه اصلی' })).toBeVisible()
    await expect(page.locator('a[href="/"][data-discover="true"]').first()).toBeVisible()
    await expect(page.locator('a[href="/venues"]').first()).toBeVisible()
  })
})
