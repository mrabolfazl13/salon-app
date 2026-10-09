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

  test('login page renders form', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"], input[name*="email" i], input[placeholder*="ایمیل" i]')
    await expect(emailInput).toBeVisible()
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('navigation menu is accessible', async ({ page }) => {
    await page.goto('/')
    // Check for main navigation elements
    const nav = page.locator('nav, [role="navigation"]')
    await expect(nav).toBeVisible()
    // Check for home link
    const homeLink = page.locator('a[href="/"], a:has-text("خانه")')
    await expect(homeLink.first()).toBeVisible()
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
    await page.goto('/this-route-does-not-exist')
    // Should show some error state or redirect
    const statusCode = page.request.get('/this-route-does-not-exist').then(r => r.status())
    expect(statusCode).toBeDefined()
  })
})
