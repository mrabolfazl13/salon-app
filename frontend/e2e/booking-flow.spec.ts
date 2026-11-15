/**
 * E2E جریان طلایی فاز MVP:
 *   کاربر سانس‌های «پر» و «رزرو قرارداد» را می‌بیند → رزرو می‌کند →
 *   در «رزروهای من» رزرو pending با دکمه تماس دیده می‌شود →
 *   سالن‌دار در داشبورد رزرو را تأیید می‌کند → کاربر وضعیت «تایید شده» می‌بیند.
 *
 * پیش‌نیاز: بک‌اند + دیتابیس seed شده با `python scripts/seed_full_demo.py --reset --sqlite …`
 * و vite با پراکسی به همان بک‌اند (VITE_PROXY_TARGET).
 * اگر بک‌اند در دسترس نیست، تست skip می‌شود (شواهد ساخت مشروط به محیط).
 */
import { test, expect, type Page } from '@playwright/test'

const DEMO_USER = { phone: '09123000001', password: 'user123' }
const DEMO_MANAGER = { phone: '09121000001', password: 'manager123' }

/** ورود از مسیر UI واقعی (نه storageState) تا جریان ورود هم پوشش داده شود */
async function login(page: Page, account: { phone: string; password: string }) {
  await page.goto('/login')
  const phoneInput = page.getByLabel('شماره تلفن همراه', { exact: true })
  await expect(phoneInput).toBeVisible({ timeout: 20_000 })
  await phoneInput.fill(account.phone)
  await page.getByLabel('رمز عبور', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'ورود', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
}

async function logout(page: Page) {
  // خروج مطمئن: پاک‌سازی نشست سمت کلاینت (فرم ورود برای کاربر واردشده redirect می‌شود)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
}

test.describe('جریان طلایی رزرو فاز MVP', () => {
  test.beforeEach(async ({ request }) => {
    // بک‌اند از مسیر پراکسی vite چک می‌شود؛ نبودِ آن یعنی محیط کامل نیست
    const res = await request.get('/api/v1/venues/')
    test.skip(res.status() !== 200, `بک‌اند در دسترس نیست (status=${res.status()}) — seed و proxy لازم است`)
  })

  test('رزرو کاربر → دیدن رزرو با دکمه تماس → تأیید سالن‌دار → وضعیت تایید', async ({ page }) => {
    test.setTimeout(180_000)

    // ۱) ورود کاربر و انتخاب سالن فوتسال نمونه (سالن ۱ seed = «فوتسال آرش» با سانس‌ها و قرارداد)
    await login(page, DEMO_USER)
    // صریحاً امروز — UI بدون این پارامتر اولین روزِ دادهٔ seed (دیروز) را نشان می‌دهد
    const today = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD محلی
    await page.goto(`/venues/1?date=${today}`)

    // باز کردن تب/بخش سانس‌ها
    const slotsTab = page.getByRole('tab', { name: /سانس‌ها/ }).first()
    if (await slotsTab.isVisible().catch(() => false)) {
      await slotsTab.click()
    } else {
      await page.getByRole('button', { name: 'مشاهده سانس‌ها' }).click()
    }

    // ۲) نوار وضعیت سانس‌ها: سانس‌های پر و رزرو قرارداد باید در گرید قابل تشخیص باشند.
    // وجودِ سانس پر/قراردادی وابسته به دادهٔ seed است — soft check؛ سانس غیرقابل‌کلیک
    // (disabled) همان نشانهٔ رزروشده/قراردادی بودن است و همیشه باید غیر از آزادها چیزی باشد یا کل روز آزاد باشد.
    const bookedSlot = page.getByRole('button', { name: /، پر$/ }).first()
    const reservedSlot = page.getByRole('button', { name: /، رزرو قرارداد$/ }).first()
    const hasFull = await bookedSlot.isVisible().catch(() => false)
    const hasReserved = await reservedSlot.isVisible().catch(() => false)
    if (hasFull) await expect(bookedSlot).toBeDisabled()
    if (hasReserved) await expect(reservedSlot).toBeDisabled()

    // ۳) انتخاب یک سانس آزاد و ثبت رزرو
    const availableSlot = page.getByRole('button', { name: /، آزاد$/ }).first()
    await expect(availableSlot).toBeVisible({ timeout: 20_000 })
    await availableSlot.click()
    await page.getByRole('button', { name: 'تایید و رزرو' }).first().click()
    await page.getByRole('button', { name: 'تایید رزرو' }).click()

    // ۴) دیالوگ موفقیت: پیام تأیید + دکمه تماس با سالن (فاز MVP)
    await expect(page.getByText(/رزرو ثبت شد/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/برای هماهنگی سریع‌تر.*تماس/)).toBeVisible()
    const callLink = page.getByRole('link', { name: /تماس با سالن/ })
    await expect(callLink).toBeVisible()
    await expect(callLink).toHaveAttribute('href', /^tel:0\d{9,10}$/)
    await page.getByRole('button', { name: 'بعداً' }).click()

    // ۵) «رزروهای من»: رزرو pending با دکمه تماس
    await page.goto('/bookings')
    await expect(page.getByText('در انتظار', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'تماس' }).first()).toBeVisible()

    // توکن کاربر برای راستی‌آزمایی نهایی (ورود سوم از UI سقف نرخ auth را می‌شکند)
    const userToken = await page.evaluate(() => localStorage.getItem('auth-token'))
    expect(userToken).toBeTruthy()

    // رزرو pending ثبت‌شده در این ران (برای تطبیق نهایی)
    const pendingRes = await page.request.get('/api/v1/bookings/pending/my', {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    const pendingList = (await pendingRes.json()) as Array<{ id: string; slot_id: number; venue_name?: string }>
    expect(pendingList.length).toBeGreaterThan(0)
    const bookedSlotId = pendingList[0].slot_id

    // یادداشت: جزئیات رزروی pending (Redis) در endpoint دیتابیسی نیست؛ همین assertions کافی است
    // و آلرت «در انتظار تأیید سالن‌دار» فقط روی رزروهای DB ظاهر می‌شود.

    // ۶) خروج و ورود سالن‌دار
    await logout(page)
    await login(page, DEMO_MANAGER)

    // ۷) تأیید رزرو از داشبورد مدیر (تب «رزروها» → دکمه «تأیید»)
    await page.goto('/manager-dashboard')
    const bookingsTab = page.getByRole('tab', { name: 'رزروها' })
    await expect(bookingsTab).toBeVisible({ timeout: 20_000 })
    await bookingsTab.click()
    await page.waitForTimeout(1_500)
    const confirmButtons = page.getByRole('button', { name: /^تأیید$/ })
    await expect(confirmButtons.first()).toBeVisible({ timeout: 20_000 })
    await confirmButtons.first().click()
    await page.waitForTimeout(1_000) // ثبت pending → DB

    // ۸) کاربر وضعیت تاییدشده را می‌بیند — از طریق API با توکن همان کاربر
    const finalRes = await page.request.get('/api/v1/bookings', {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    expect(finalRes.status()).toBe(200)
    const bookings = (await finalRes.json()) as Array<{ status: string; slot_id: number }>
    const confirmedNow = bookings.find((b) => b.slot_id === bookedSlotId)
    expect(confirmedNow?.status).toBe('confirmed')
  })
})
