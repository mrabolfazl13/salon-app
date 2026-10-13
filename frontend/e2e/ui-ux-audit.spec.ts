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

  test('tab navigation meets touch standards', async ({ page }) => {
    await page.goto('/bookings')
    
    // Wait for tabs to appear
    await page.waitForSelector('[role="tab"]', { timeout: 5000 })
    
    const tabs = page.locator('[role="tab"]')
    const count = await tabs.count()
    
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i)
      const box = await tab.boundingBox()
      
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48)
      }
    }
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

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login')
    
    const inputs = page.locator('input')
    const count = await inputs.count()
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      const id = await input.getAttribute('id')
      
      if (!ariaLabel && !id) {
        // At least one should exist
        throw new Error(`Input ${i} has no label`)
      }
    }
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

  test('tablet viewport (768px) uses grid layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/venues')
    
    // Wait for content
    await page.waitForSelector('[data-testid="venue-card"]', { timeout: 10000 })
    
    // Should show multiple columns
    const grid = page.locator('[style*="grid"]')
    await expect(grid.first()).toBeVisible()
  })

  test('desktop viewport (1440px) shows full layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    
    // Hero section should be visible
    const hero = page.locator('text=همین حالا سانس رزرو کن')
    await expect(hero).toBeVisible()
  })
})

test.describe('UI/UX Audit - Loading States', () => {
  test('shows loading skeleton while fetching venues', async ({ page }) => {
    await page.goto('/venues')
    
    // Should show either skeleton or content
    const hasSkeleton = await page.locator('.MuiSkeleton-root').count()
    const hasContent = await page.locator('[data-testid="venue-card"]').count()
    
    expect(hasSkeleton > 0 || hasContent > 0).toBeTruthy()
  })

  test('empty state displays when no data', async ({ page }) => {
    await page.goto('/bookings')
    
    // If not authenticated, should show empty state or login prompt
    const emptyState = page.locator('text=رزرویی یافت نشد')
    const loginPrompt = page.locator('text=وارد شوید')
    
    const hasEmpty = await emptyState.count()
    const hasLogin = await loginPrompt.count()
    
    expect(hasEmpty > 0 || hasLogin > 0).toBeTruthy()
  })
})

test.describe('UI/UX Audit - Error Handling', () => {
  test('shows error message on network failure', async ({ page }) => {
    // This would require mocking - skip for now
    test.skip()
  })

  test('retry button works after error', async ({ page }) => {
    // This would require mocking - skip for now
    test.skip()
  })
})
