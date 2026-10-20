/**
 * MOBILE-AUDIT HARNESS (mission: mobile-first UI/UX audit, 2026-10-18)
 *
 * هدف: بازرسی خودکار تمام Routeها در اندازه‌های موبایل با Backend واقعی و جمع‌آوری
 * شواهد قابل‌استناد: خطای Console، درخواست ناموفق، سرریز افقی، هدف لمس کوچک،
 * نبود h1، تصویر بدون alt، وضعیت Loading/خالی، و اسکرین‌شات.
 *
 * اجرا (این هارنس به‌صورت پیش‌فرض غیرفعال است تا CI را درگیر نکند):
 *   $env:MOBILE_AUDIT='1'; pnpm exec playwright test e2e/mobile-audit.spec.ts --project=chromium
 *
 * چرا opt-in است؟ این هارنس با حساب‌های demo به Backend واقعی لاگین می‌کند و برای
 * سندباکس محلی نوشته شده است؛ اجرای خودکار آن در CI هم بی‌فایده است و هم سهمیهٔ
 * ورود (rate limit) را مصرف می‌کند.
 *
 * خروجی ماشین‌خوان: frontend/audit-artifacts/audit-report-*.json
 * اسکرین‌شات‌ها: frontend/audit-artifacts/shots/<role>__<path>__<viewport>.png
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * نگهبان CI: بدون MOBILE_AUDIT=1 هیچ تستی در این فایل اجرا نمی‌شود.
 * (در CI فقط smoke/e2e عمومی اجرا می‌شوند؛ این ملف ابزار ممیزی محلی است.)
 */
test.skip(process.env.MOBILE_AUDIT !== '1', 'mobile-audit harness runs only when MOBILE_AUDIT=1')

// این فایل در حالت ESM اجرا می‌شود؛ __dirname وجود ندارد. ریشه = پوشه frontend
const ART = path.resolve(process.cwd(), 'audit-artifacts')
const SHOTS = path.join(ART, 'shots')
const AUTH = path.join(ART, 'auth')

/**
 * بک‌اند مقصد و حساب‌ها — دو بک‌اند واقعی وجود دارد و حساب‌هایشان یکی نیست
 * (هیچ‌کدام mock نیست):
 *
 *  1) سندباکس محلی — پروکسی vite به `VITE_PROXY_TARGET` (`.env.development.local`
 *     آن را روی 127.0.0.1:8000 می‌اندازد). ACCOUNTS پایین مال همین است؛ هر پنج نقش
 *     حساب دارد ⇒ پوشش STAFF/COACH. Redis محلی نیست ⇒ سقف درخواست کار نمی‌کند
 *     (backend/app/utils/rate_limit.py fail-open) و sweep کامل بی‌مزاحمت اجرا می‌شود.
 *  2) Production (`http://2.189.255.225`) — دادهٔ منتشرشده (۵۰ سالن، سانس قیمت‌دار).
 *     حساب‌هایش: کاربر `09000000111`، مدیر سالن `09121000001` (Manager123!، مالک یک
 *     سالن تهرانی با سانس)، مدیر کل `09000000311` با رمز `demo1234` — همان «دسترسی
 *     سریع» صفحهٔ ورود (src/config/quickAccess.ts). هیچ کاربر STAFF/COACH ندارد و
 *     سقف‌هایش سخت است: ۱۰ ورود در ساعت و ۶۰ درخواست API در دقیقه به‌ازای IP.
 *     برای همین sweep کامل آنجا نه ممکن است نه بی‌آزار (بار روی سرویس واقعی).
 *
 * health و دادهٔ پروداکشن جدا از این harness سنجیده می‌شود (تأیید ۲۰۲۶-۱۰-۲۰:
 * /api/v1/venues=۵۰، سانس‌های قیمت‌دار تا ۲۰۲۷-۰۲-۲۸، /updates/latest.json=۲۰۰).
 * با `BASE_URL` (همان که newContextForRole می‌خواند) + حساب‌های پروداکشن می‌توان
 * نمونه‌برداری نقطه‌ای گرفت؛ آنجا نقشی که حساب ندارد با یافتهٔ `role-unavailable`
 * حذف می‌شود، نه ردیف کاذب.
 */
type RoleName = 'guest' | 'user' | 'staff' | 'coach' | 'manager' | 'super_admin'

const ACCOUNTS: Record<Exclude<RoleName, 'guest'>, { phone: string; password: string }> = {
  user: { phone: '09123000001', password: 'user123' },
  staff: { phone: '09122000001', password: 'staff123' },
  coach: { phone: '09124000001', password: 'coach123' },
  manager: { phone: '09121000001', password: 'manager123' },
  super_admin: { phone: '09120000001', password: 'admin123' },
}

/**
 * فاصلهٔ بین ناوبری‌ها تا سقف درخواست بک‌اند (در صورت فعال بودن) خورده نشود؛
 * ۴۲۹ در findings با kind=rate-limited برچسب می‌خورد تا با باگ UI اشتباه نشود.
 */
const ROUTE_GAP_MS = Number(process.env.MOBILE_AUDIT_GAP_MS ?? 1200)

/**
 * اجرای تکه‌ای (MOBILE_AUDIT_ROLES=guest,user): این ماشین با RAM کم نمی‌تواند
 * یک sweep شش‌نقشی را یک‌جا نگه دارد (اجرای ۲۰۲۶-۱۰-۲۰ با مرگ مرورگر قطع شد).
 * هر تکه ردیف‌های خودش را به فایل گزارش اضافه می‌کند و ردیف نقش‌های دیگر را
 * دست‌نخورده نگه می‌دارد؛ اجرای بدون این متغیر همچنان کل فایل را از نو می‌سازد.
 */
const ROLE_FILTER = (process.env.MOBILE_AUDIT_ROLES || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean) as RoleName[]
const ACTIVE = (r: RoleName) => ROLE_FILTER.length === 0 || ROLE_FILTER.includes(r)

/** تکه‌کردن مسیرها برای ماشین‌های کم‌حافظه: MOBILE_AUDIT_ROUTES="/a,/b" */
const ROUTE_FILTER = (process.env.MOBILE_AUDIT_ROUTES || '').split(',').map((x) => x.trim()).filter(Boolean)
const ROUTE_ACTIVE = (p: string) => ROUTE_FILTER.length === 0 || ROUTE_FILTER.includes(p)

/** Routeهای واقعی استخراج‌شده از src/App.tsx */
const ROUTES: Array<{
  p: string
  roles: RoleName[]
  note?: string
  /** کدهای HTTP که برای این مسیر «درست» هستند (پروب عمدی حالت خطا) ⇒ یافتهٔ P1 نمی‌سازند */
  expectStatuses?: number[]
  /** متنی که باید در صفحه باشد تا حالتِ مورد انتظار تأیید شود */
  expectText?: string
}> = [
  { p: '/', roles: ['guest', 'user', 'staff', 'coach', 'manager', 'super_admin'] },
  { p: '/search', roles: ['guest', 'user'] },
  { p: '/favorites', roles: ['guest', 'user'] },
  { p: '/venues', roles: ['guest', 'user'] },
  { p: '/venues/1', roles: ['guest', 'user'] },
  { p: '/login', roles: ['guest'] },
  { p: '/register', roles: ['guest'] },
  { p: '/forgot-password', roles: ['guest'] },
  { p: '/verify', roles: ['guest'] },
  { p: '/dashboard', roles: ['user', 'manager'] },
  { p: '/manager-dashboard', roles: ['manager'] },
  { p: '/finance', roles: ['user', 'staff', 'manager'], note: 'allowStaff' },
  { p: '/manager/pricing', roles: ['user', 'staff', 'manager'], note: 'allowStaff' },
  { p: '/deals', roles: ['user', 'manager'] },
  { p: '/quiz', roles: ['user'] },
  { p: '/bookings', roles: ['user', 'manager'] },
  { p: '/bookings/1', roles: ['user', 'manager'] },
  { p: '/competitions', roles: ['user'] },
  { p: '/tournaments', roles: ['user', 'manager'] },
  { p: '/tournaments/1', roles: ['user', 'manager'] },
  // براکت ۸ تیمی = سه ستون مرحله ⇒ سناریوی «جدول پهن/اسکرول کنترل‌شده» در ۳۲۰px
  { p: '/tournaments/2', roles: ['user', 'manager'], note: 'براکت پهن (دادهٔ تست)' },
  // لینک مرده ⇒ حالت خالی، نه اسکلتون یا دکمهٔ تلاش‌مجدد (۴۰۴ از بک‌اند درست است)
  {
    p: '/tournaments/999',
    roles: ['user'],
    note: 'پروب ۴۰۴ تورنمنت ناموجود',
    expectStatuses: [404],
    expectText: 'این تورنمنت پیدا نشد',
  },
  { p: '/contracts', roles: ['user', 'manager'] },
  { p: '/contracts/1', roles: ['user', 'manager'] },
  { p: '/games', roles: ['guest', 'user'] },
  { p: '/games/new', roles: ['user'] },
  { p: '/games/1', roles: ['guest', 'user'] },
  { p: '/teams', roles: ['user', 'manager'] },
  { p: '/teams/discover', roles: ['user'] },
  { p: '/teams/1', roles: ['user'] },
  { p: '/manager/contracts', roles: ['user', 'staff', 'manager'], note: 'allowStaff' },
  { p: '/manager/contracts/1', roles: ['user', 'staff', 'manager'], note: 'allowStaff' },
  { p: '/manager/teams', roles: ['manager'] },
  { p: '/manager/crm', roles: ['user', 'staff', 'manager'], note: 'allowStaff با crm.view/customer.view_basic' },
  { p: '/manager/checkin', roles: ['manager'] },
  { p: '/manager/shifts', roles: ['user', 'staff', 'manager'], note: 'allowStaff' },
  { p: '/coach', roles: ['coach', 'super_admin'] },
  { p: '/profile', roles: ['user', 'manager'] },
  { p: '/admin', roles: ['super_admin'] },
  { p: '/admin/users', roles: ['super_admin'] },
  { p: '/admin/venues', roles: ['super_admin'] },
  { p: '/this-route-does-not-exist', roles: ['guest'], note: '404 catch-all' },
]

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
]

/** فقط برای ماتریس کامل اندازه‌ها */
const ALL_VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '360x640', width: 360, height: 640 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '600x960', width: 600, height: 960 },
  // افقی (mission: پرتره و لنداسکیپ هر دو) — همان صفحه در ارتفاع کم: ناوبری پایین،
  // مودال‌های بلند و جدول‌های پهن رفتار متفاوتی نشان می‌دهند.
  { name: '568x320', width: 568, height: 320 },
  { name: '844x390', width: 844, height: 390 },
  { name: '932x430', width: 932, height: 430 },
]

const KEY_ROUTES = ['/', '/venues', '/venues/1', '/bookings', '/dashboard', '/manager-dashboard', '/manager/crm', '/finance', '/tournaments/2']

type Finding = {
  severity: 'P0' | 'P1' | 'P2' | 'P3'
  kind: string
  role: RoleName
  route: string
  viewport: string
  detail: string
}

const findings: Finding[] = []
const routeRows: any[] = []

function record(f: Finding) {
  findings.push(f)
}

/**
 * مهلت برای هر مرحله‌ای که Playwright آن را با timeout نمی‌پوشاند
 * (evaluate/screenshot/scrollTo timeout پیش‌فرض ندارند).
 * بدون این، یک ردیف می‌تواند بی‌خطا کل sweep را بخواباند — در اجرای
 * ۲۰۲۶-۱۰-۲۰ ردیف guest/@games/1 هفت دقیقه بی‌حرکت ماند (همان مسیر به‌تنهایی
 * در ۱٫۶ ثانیه رندر می‌شد ⇒ علت، تراکم state صفحهٔ مشترک است نه خودِ route).
 * با مهلت، مرحله برچسب‌دار شکست می‌خورد، یافته ثبت می‌شود و پیمایش ادامه می‌کند.
 */
async function withDeadline<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: any
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error(`step-timeout:${label}`)), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/** جمع‌آوری متریک‌های صفحه — همه مقادیر از DOM واقعی */
async function collectMetrics(page: Page) {
  return withDeadline(page.evaluate(() => {
    const vw = window.innerWidth
    /**
     * نام قابل‌دسترس طبق الگوریتم ARIA (سایه‌ی WAI-ACCNAME)، نه فقط aria-label.
     * نسخهٔ اول فقط aria-label/innerText/placeholder را می‌دید؛ ورودی‌های برچسب‌خوردهٔ
     * MUI که نامشان از `<label for>` می‌آید «بی‌برچسب» گزارش می‌شدند (۴ یافتهٔ کاذب
     * در /finance، /manager/pricing و /profile — ممیزی ۲۰۲۶-۱۰-۲۰).
     */
    const accName = (el: Element): string => {
      const t = el as HTMLElement
      const by = el.getAttribute('aria-labelledby')
      if (by) {
        const txt = by
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent || '')
          .join(' ')
          .trim()
        if (txt) return txt
      }
      const aria = el.getAttribute('aria-label')
      if (aria && aria.trim()) return aria.trim()
      const id = el.getAttribute('id')
      if (id && id.length < 200) {
        const forEl = document.querySelector(`label[for="${id.replace(/"/g, '')}"]`)
        const txt = (forEl?.textContent || '').trim()
        if (txt) return txt
      }
      const wrapping = el.closest('label')
      const wrapTxt = (wrapping?.textContent || '').trim()
      if (wrapTxt) return wrapTxt
      const own = (t.innerText || t.textContent || '').trim()
      if (own) return own
      for (const attr of ['placeholder', 'title', 'alt']) {
        const v = el.getAttribute(attr)
        if (v && v.trim()) return v.trim()
      }
      const value = (el as HTMLInputElement).value
      const type = (el.getAttribute('type') || '').toLowerCase()
      if (typeof value === 'string' && value.trim() && ['button', 'submit', 'reset'].includes(type)) return value.trim()
      return ''
    }
    // هدف لمس = هر چیزی که کاربر با انگشت/کیبورد فعال می‌کند. combobox و readonly input
    // عمداً اضافه شدند: نسخهٔ اول فقط BUTTON را می‌دید و Select کوچک (۴۰px) در /finance
    // از چنگال ممیزی در رفته بود (پروب کیبورد، ۲۰۲۶-۱۰-۱۹).
    const TAP_SELECTOR =
      'button, a[href], [role="button"], [role="combobox"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="link"], input:not([type="hidden"]), select, textarea'
    const all = Array.from(document.querySelectorAll(TAP_SELECTOR))
    // هدفِ واقعیِ لمس برای input/combobox درون MUI، ریشهٔ OutlinedInput/ButtonBase است
    // (input فقط ۲۳–۴۰px ارتفاع دارد ولی کل جعبهٔ ۴۴px کلیک‌پذیر است). بدون این تصحیح،
    // هر فرمِ سالمی «هدف کوچک» گزارش می‌شد. ورودی‌های aria-hidden (native input سلکت)
    // و جعبه‌های ≤۴px (رادیوهای مخفی Rating) اصلاً هدف کاربر نیستند.
    const effective = (el: Element) => {
      let w = (el as HTMLElement).offsetWidth
      let h = (el as HTMLElement).offsetHeight
      let host = el.parentElement
      while (host && host !== document.body) {
        if (host.matches('.MuiInputBase-root, .MuiButtonBase-root, label')) {
          w = Math.max(w, host.offsetWidth)
          h = Math.max(h, host.offsetHeight)
        }
        host = host.parentElement
      }
      return { w, h }
    }
    const visible = all
      .filter((el) => el.getAttribute('aria-hidden') !== 'true')
      .map((el) => {
        const r = el.getBoundingClientRect()
        const cs = window.getComputedStyle(el)
        const size = effective(el)
        return {
          tag: el.tagName,
          role: el.getAttribute('role') || '',
          label: accName(el).slice(0, 50),
          // اندازهٔ هدف لمس از جعبهٔ چچین (layout) گرفته می‌شود: getBoundingClientRect
          // مقیاسِ میانهٔ انیمیشن framer-motion را هم لحاظ می‌کند و دکمهٔ ۴۴px را
          // ۴۲–۴۳ نشان می‌داد (ممیزی: «دریافت جایزه» در LoyaltySection).
          w: size.w,
          h: size.h,
          left: Math.round(r.left),
          right: Math.round(r.right),
          display: cs.display,
          visibility: cs.visibility,
        }
      })
      .filter((x) => x.w > 4 && x.h > 4 && x.display !== 'none' && x.visibility !== 'hidden')

    const isTap = (x: { tag: string; role: string }) =>
      x.tag === 'BUTTON' ||
      x.tag === 'A' ||
      x.tag === 'INPUT' ||
      x.tag === 'SELECT' ||
      x.tag === 'TEXTAREA' ||
      ['button', 'combobox', 'menuitem', 'tab', 'switch', 'checkbox', 'radio', 'link'].includes(x.role)
    const overflowing = visible.filter((x) => x.right > vw + 1 || x.left < -1)
    const smallTap = visible.filter((x) => isTap(x) && (x.w < 44 || x.h < 44))
    const unlabeledButtons = visible.filter((x) => isTap(x) && !x.label)

    const imgs = Array.from(document.querySelectorAll('img'))
    return {
      url: location.pathname,
      vw,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw,
      landmarks: {
        header: document.querySelectorAll('header').length,
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
      },
      interactiveCount: visible.length,
      overflowing: overflowing.slice(0, 12),
      smallTap: smallTap.slice(0, 20),
      unlabeledButtons: unlabeledButtons.slice(0, 10),
      h1: Array.from(document.querySelectorAll('h1')).map((h) => (h as HTMLElement).innerText.trim().slice(0, 60)),
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((h) => h.tagName).join(',').slice(0, 120),
      imgs: imgs.length,
      imgsNoAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 160),
      textLen: (document.body.innerText || '').length,
      hasLoadingText: /در حال بارگذاری|بارگذاری\.\.\./.test(document.body.innerText || ''),
      buttonsWithMinHeightBelow44: smallTap.length,
    }
  }), 25_000, 'collectMetrics')
}

/** ورود واقعی از UI و ذخیره storageState */
async function loginViaUi(page: Page, role: Exclude<RoleName, 'guest'>) {
  const acc = ACCOUNTS[role]
  await page.goto('/login')
  await page.locator('input[autocomplete="tel"]').fill(acc.phone)
  await page.locator('input[autocomplete="current-password"]').fill(acc.password)
  await page.locator('button[type="submit"]').click()
  // یا توکن می‌آید، یا پیام خطای خود صفحه (۴۰۱ رمز نادرست / ۴۲۹ سقف ورود).
  // race می‌کنیم تا مسیر موفق ۱۵ ثانیه معطل نشود.
  const ok = await Promise.race([
    page.waitForFunction(() => !!window.localStorage.getItem('auth-token'), null, { timeout: 25000 }).then(() => true),
    page
      .waitForFunction(() => !!document.querySelector('[role="alert"], .MuiAlert-message'), null, { timeout: 25000 })
      .then(() => false),
  ]).catch(() => false)
  if (!ok) {
    const msg = await page
      .evaluate(() => (document.querySelector('[role="alert"], .MuiAlert-message')?.textContent || '').trim().slice(0, 120))
      .catch(() => '')
    throw new Error(msg ? `صفحهٔ ورود خطا داد: ${msg}` : 'پس از ۲۵ ثانیه auth-token ست نشد')
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  return page.evaluate(() => ({
    token: window.localStorage.getItem('auth-token') ? 'present' : 'missing',
    store: window.localStorage.getItem('auth-storage') ? 'present' : 'missing',
    path: location.pathname,
  }))
}

async function newContextForRole(browser: any, role: RoleName): Promise<{ context: BrowserContext; page: Page }> {
  const file = path.join(AUTH, `${role}.json`)
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    viewport: { width: 375, height: 812 },
    // ۲× برای این ماشین (~۱ گیگ RAM آزاد) رندرر را می‌کشت (worker code=134 در
    // اجرای ۲۰۲۶-۱۰-۲۰)؛ ۱× برای مرور بصری ۳۷۵×۸۱۲ کافی است.
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  if (role !== 'guest' && fs.existsSync(file)) {
    // storageState با همان کلیدهای localStorage اپ (auth-token + auth-storage)
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    await context.addInitScript((s: any) => {
      for (const o of s.origins || []) {
        for (const kv of o.localStorage || []) window.localStorage.setItem(kv.name, kv.value)
      }
    }, state)
  }
  const page = await context.newPage()
  return { context, page }
}

async function auditRoute(
  page: Page,
  role: RoleName,
  route: string,
  vp: { name: string; width: number; height: number },
  opts: { expectStatuses?: number[]; expectText?: string; screenshot?: boolean } = {}
) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  const badStatuses: string[] = []
  const onConsole = (m: any) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200))
  }
  const onRequestFailed = (r: any) => failedRequests.push(`${r.method()} ${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`)
  const onResponse = (r: any) => {
    const s = r.status()
    if (s >= 400) badStatuses.push(`${s} ${r.request().method()} ${r.url().slice(0, 120)}`)
  }
  page.on('console', onConsole)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)

  // اگر اندازه‌گیری به مهلت بخورد (صفحهٔ قفل‌شده) باید دیده شود، نه اینکه ردیف
  // بی‌متریک به‌طور خاموش از کنار یافته‌های ساختاری رد شود.
  let stepTimeouts: string[] = []
  // setViewportSize هم مهلت ندارد؛ روی رندرر قفل‌شده (تجربهٔ /venues/1) اجرای
  // کل chunk را بی‌پایان می‌خواباند. اگر جابه‌جایی viewport نشد، این ردیف را
  // ناتمام ثبت می‌کنیم تا حلقهٔ بیرونی context را بازسازی کند.
  const resized = await withDeadline(
    page.setViewportSize({ width: vp.width, height: vp.height }),
    10_000,
    'setViewport'
  )
    .then(() => true)
    .catch((e: any) => {
      stepTimeouts.push(String(e?.message || e))
      return false
    })
  let navError: string | null = null
  if (!resized) {
    routeRows.push({ role, route, viewport: vp.name, finalPath: page.url(), navError: 'setViewport-timeout', incomplete: true, metrics: null, stepTimeouts })
    record({
      severity: 'P2',
      kind: 'page-unresponsive',
      role,
      route,
      viewport: vp.name,
      detail: 'تغییر اندازهٔ viewport به مهلت خورد — رندرر قفل شده؛ این مسیر باید تک‌تنها دوباره گرفته شود',
    })
    page.off('console', onConsole)
    page.off('requestfailed', onRequestFailed)
    page.off('response', onResponse)
    return
  }
  try {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // انتظار تا پایان fallback تعلیق (Suspense): «در حال بارگذاری...»
    // بدون این انتظار، صفحات cold در حالت fallback اندازه‌گیری می‌شدند و یافته‌های
    // جعلی (بدون header/h1، متن خالی) ثبت می‌شد.
    await page
      .waitForFunction(() => !/در حال بارگذاری/.test(document.body.innerText || ''), null, { timeout: 25000 })
      .catch(() => {})
    // انتظار تا ناپدید شدن اسکلتون‌های داده (چون اسکلتون از DOM نهایی حذف می‌شود)
    await page
      .waitForFunction(() => document.querySelectorAll('.MuiSkeleton-root').length === 0, null, { timeout: 10000 })
      .catch(() => {})
    // پروب‌های دارای حالتِ انتظار (مثلاً ۴۰۴ تورنمنت): پیش از اندازه‌گیری منتظر متن بمان،
    // وگرنه نوسان شبکه در ۳۲۰px «یافتهٔ P1 کاذب» می‌سازد.
    if (opts.expectText)
      await page
        .waitForFunction((t: string) => (document.body.innerText || '').includes(t), opts.expectText, { timeout: 15000 })
        .catch(() => {})
    await page.waitForTimeout(500)
  } catch (e: any) {
    navError = String(e?.message || e).slice(0, 200)
  }

  // اگر اندازه‌گیری به مهلت بخورد (صفحهٔ قفل‌شده) باید دیده شود، نه اینکه ردیف
  // بی‌متریک به‌طور خاموش از کنار یافته‌های ساختاری رد شود.
  let metrics = await collectMetrics(page).catch((e: any) => {
    stepTimeouts.push(String(e?.message || e))
    return null
  })
  const finalPath = new URL(page.url()).pathname

  // صفحه‌ای که حتی پس از انتظار، هنوز fallback/خالی است ⇒ اندازه‌گیری معتبر نیست.
  // نکته: «در حال بارگذاری…» می‌تواند مربوط به یک **بخش** باشد (نمودار سری‌های مالی)
  // در حالی که بقیهٔ صفحه پر است؛ اگر کل اندازه‌گیری را باطل می‌کرد، سرریز ۳۲۰px
  // کارت‌های مالی دیده نشد (ممیزی: manager/@finance@320).
  const isIncomplete = (m: any) => !!m && (m.textLen <= 25 || (m.hasLoadingText && m.textLen < 400))
  let incomplete = !metrics || isIncomplete(metrics)
  if (incomplete) {
    // Vite dev هنگام کشف وابستگی تازه یک full-reload می‌زند و بدنه لحظه‌ای خالی است؛
    // یک بار reload دوباره، تا «stuck-loading» کاذب ثبت نشود (بیلد production ندارد).
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
    await page
      .waitForFunction(() => !/در حال بارگذاری/.test(document.body.innerText || ''), null, { timeout: 20000 })
      .catch(() => {})
    await page.waitForTimeout(500)
    metrics = await collectMetrics(page).catch((e: any) => {
      stepTimeouts.push(String(e?.message || e))
      return null
    })
    incomplete = !metrics || isIncomplete(metrics)
  }
  const row: any = { role, route, viewport: vp.name, finalPath, navError, incomplete, metrics, stepTimeouts }
  routeRows.push(row)

  if (navError) record({ severity: 'P1', kind: 'navigation-error', role, route, viewport: vp.name, detail: navError })
  if (stepTimeouts.length || !metrics)
    record({
      severity: 'P2',
      kind: 'page-unresponsive',
      role,
      route,
      viewport: vp.name,
      detail: `اندازه‌گیری DOM به مهلت خورد (${stepTimeouts.join(' | ') || 'metrics=null'}) — صفحه پس از پیمایش‌های پیشین در همان context قفل شده؛ این مسیر باید تک‌تنها دوباره گرفته شود`,
    })
  if (incomplete)
    record({
      severity: 'P2',
      kind: 'page-stuck-loading',
      role,
      route,
      viewport: vp.name,
      detail: `پس از انتظار، صفحه هنوز fallback/خالی بود (textLen=${metrics?.textLen}, loading=${metrics?.hasLoadingText}) — یافته‌های ساختاری این ردیف ثبت نشد`,
    })
  if (metrics && !incomplete) {
    if (metrics.overflowX > 1)
      record({
        severity: 'P2',
        kind: 'horizontal-overflow',
        role,
        route,
        viewport: vp.name,
        detail: `overflowX=${metrics.overflowX}px; offenders=${JSON.stringify(metrics.overflowing.map((o: any) => `${o.tag}:${o.label}[${o.left}..${o.right}]`))}`,
      })
    // صفحه‌های جریان ورود (Login/Register/Forgot/Verify) عمداً بی‌پوسته‌اند (کارت
    // متمرکز، بدون ناوبری) — این الگو در خودِ اپ طراحی شده، پس landmark اجباری نیست.
    const isAuthFlow = /^\/(login|register|forgot-password|verify)/.test(finalPath)
    if (metrics.landmarks.header === 0 && !isAuthFlow)
      record({ severity: 'P3', kind: 'missing-header-landmark', role, route, viewport: vp.name, detail: 'no <header> element' })
    if (metrics.imgsNoAlt > 0)
      record({ severity: 'P2', kind: 'img-without-alt', role, route, viewport: vp.name, detail: `${metrics.imgsNoAlt} of ${metrics.imgs} images have no alt` })
    if (metrics.smallTap.length > 0)
      record({
        severity: 'P2',
        kind: 'touch-target-below-44',
        role,
        route,
        viewport: vp.name,
        detail: `${metrics.smallTap.length} هدف لمس < 44px: ${JSON.stringify(metrics.smallTap.slice(0, 6).map((s: any) => `${s.label || s.tag}(${s.w}x${s.h})`))}`,
      })
    if (metrics.h1.length === 0 && finalPath !== '/login')
      record({ severity: 'P3', kind: 'missing-h1', role, route, viewport: vp.name, detail: 'page has no h1' })
    // سیگنال سرعت: بخشی از صفحه هنوز در حال دریافت بود (نه کل صفحه)
    if (metrics.hasLoadingText)
      record({
        severity: 'P3',
        kind: 'section-loading-at-measure',
        role,
        route,
        viewport: vp.name,
        detail: `صفحه پر است (textLen=${metrics.textLen}) ولی یک بخش هنوز «در حال بارگذاری» نشان می‌داد`,
      })
  }
  // پروب‌های عمدی (مثل نشانیِ تورنمنت حذف‌شده) کد ۴xx «درست» می‌گیرند؛ آن‌ها را
  // در ردیف P1 نمی‌شماریم، ولی اگر متن حالتِ انتظار نرود باید P1 شود.
  // ۴۲۹ هم استثناست: روی پروداکشن سقف سراسری ۶۰ درخواست/دقیقه به‌ازای IP وجود دارد
  // و sweep می‌تواند آن را بخورد؛ آن را P3 «rate-limited» می‌نویسیم تا با باگ UI اشتباه نشود.
  const expected = new Set(opts.expectStatuses || [])
  const limited = badStatuses.filter((s) => s.startsWith('429'))
  const unexpected = badStatuses.filter((s) => !expected.has(Number(s.slice(0, 3))) && !s.startsWith('429'))
  const expectedSeen = badStatuses.filter((s) => expected.has(Number(s.slice(0, 3))))
  if (expectedSeen.length)
    record({ severity: 'P3', kind: 'expected-http-error', role, route, viewport: vp.name, detail: expectedSeen.slice(0, 3).join(' | ') })
  if (limited.length)
    record({
      severity: 'P3',
      kind: 'rate-limited',
      role,
      route,
      viewport: vp.name,
      detail: `${limited.length} پاسخ ۴۲۹ (سقف درخواست بک‌اند، نه باگ UI) ⇒ این ردیف را با فاصلهٔ بیشتر دوباره بگیرید: ${limited.slice(0, 3).join(' | ')}`,
    })
  if (unexpected.length) record({ severity: 'P1', kind: 'http-error', role, route, viewport: vp.name, detail: unexpected.slice(0, 6).join(' | ') })
  if (opts.expectText) {
    const text =
      (await withDeadline(page.evaluate(() => document.body.innerText), 15_000, 'expectText').catch(() => '')) || ''
    if (!text.includes(opts.expectText))
      record({
        severity: 'P1',
        kind: 'expected-state-missing',
        role,
        route,
        viewport: vp.name,
        detail: `انتظار متن «${opts.expectText}» بود؛ دیده نشد (textLen=${text.length})`,
      })
  }
  if (opts.screenshot !== false) {
    const base = `${role}__${route.replace(/\W+/g, '_') || 'root'}__${vp.name}`
    await withDeadline(page.screenshot({ path: path.join(SHOTS, `${base}.png`), fullPage: false }), 30_000, 'screenshot').catch(() => {})
    // پردهٔ دوم: محتوای پایین صفحه (براکت تورنمنت، جدول‌ها، فرم‌ها) در ممیزی بصری
    // دیده نشد اگر فقط viewport اول عکس شود.
    await withDeadline(page.evaluate((h: number) => window.scrollTo(0, h), vp.height), 10_000, 'scrollDown').catch(() => {})
    await page.waitForTimeout(250)
    await withDeadline(page.screenshot({ path: path.join(SHOTS, `${base}__p2.png`), fullPage: false }), 30_000, 'screenshot-p2').catch(() => {})
    await withDeadline(page.evaluate(() => window.scrollTo(0, 0)), 10_000, 'scrollUp').catch(() => {})
  }
  if (failedRequests.length)
    record({ severity: 'P2', kind: 'request-failed', role, route, viewport: vp.name, detail: failedRequests.slice(0, 5).join(' | ') })
  const realConsoleErrors = consoleErrors.filter(
    (t) => !/favicon|ERR_ABORTED|ResizeObserver|Download the React DevTools|WebSocket/i.test(t)
  )
  if (realConsoleErrors.length)
    record({ severity: 'P2', kind: 'console-error', role, route, viewport: vp.name, detail: realConsoleErrors.slice(0, 5).join(' | ') })

  page.off('console', onConsole)
  page.off('requestfailed', onRequestFailed)
  page.off('response', onResponse)
  return row
}

test.describe.configure({ mode: 'serial' })

/** نقش‌هایی که در بک‌اند مقصد حساب فعال ندارند ⇒ از sweep حذف می‌شوند */
const unavailable = new Set<RoleName>()

test.beforeAll(() => {
  fs.mkdirSync(SHOTS, { recursive: true })
  // auth/*.json توکن‌های اجرای‌های پیشین است (JWT یک‌روزه). اگر بماند، نقشی که
  // این بار ورودش شکست خورده با توکن منقضی «احراز هویت‌شده» به‌نظر می‌رسد و
  // ردیف‌هایش به‌جای خطای ورود، حالت خالی/ریدایرکت نشان می‌دهد ⇒ شواهد گمراه‌کننده.
  fs.rmSync(AUTH, { recursive: true, force: true })
  fs.mkdirSync(AUTH, { recursive: true })
})

test.describe('MOBILE AUDIT — ورود نقش‌ها از UI', () => {
  for (const role of (['user', 'staff', 'coach', 'manager', 'super_admin'] as Exclude<RoleName, 'guest'>[]).filter(ACTIVE)) {
    test(`login as ${role}`, async ({ page, browser }) => {
      let info: Awaited<ReturnType<typeof loginViaUi>>
      try {
        info = await loginViaUi(page, role)
      } catch (e: any) {
        // حساب این نقش در بک‌اند مقصد وجود ندارد (مثلاً STAFF/COACH در پروداکشن) یا
        // سقف ورود خورده است. تست را نمی‌شکنیم (حالت serial بقیه را حذف می‌کرد)؛
        // نقش را علامت می‌زنیم تا sweep آن را رد کند و یافتهٔ شفاف ثبت شود.
        unavailable.add(role)
        record({
          severity: 'P3',
          kind: 'role-unavailable',
          role,
          route: '/login',
          viewport: '375x812',
          detail: `ورود ${role} ممکن نشد ⇒ همهٔ ردیف‌های این نقش از sweep حذف شد: ${String(e?.message || e).slice(0, 160)}`,
        })
        return
      }
      expect(info.token).toBe('present')
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
      await ctx.addInitScript(
        ([t, s]: string[]) => {
          window.localStorage.setItem('auth-token', t)
          window.localStorage.setItem('auth-storage', s)
        },
        [
          (await page.evaluate(() => window.localStorage.getItem('auth-token'))) as string,
          (await page.evaluate(() => window.localStorage.getItem('auth-storage'))) as string,
        ]
      )
      const p = await ctx.newPage()
      await p.goto('/')
      await p.waitForTimeout(500)
      const stored = await p.evaluate(() => ({
        origin: location.origin,
        ls: Object.keys(window.localStorage).map((k) => ({ name: k, value: window.localStorage.getItem(k) || '' })),
      }))
      fs.writeFileSync(
        path.join(AUTH, `${role}.json`),
        JSON.stringify({ cookies: [], origins: [{ origin: stored.origin, localStorage: stored.ls }] }, null, 2)
      )
      await ctx.close()
    })
  }
})

test.describe('MOBILE AUDIT — پیمایش Routeها (۳۲۰ و ۳۷۵)', () => {
  test('route sweep', async ({ browser }) => {
    test.skip(process.env.MOBILE_AUDIT_SKIP_SWEEP === '1', 'در اجرای تست‌های نقش‌محور، sweep جداگانه اجرا می‌شود')
    test.setTimeout(60 * 60 * 1000)
    const roles: RoleName[] = (['guest', 'user', 'staff', 'coach', 'manager', 'super_admin'] as RoleName[]).filter(ACTIVE)
    // حلقهٔ بیرونی = نقش، نه مسیر: شش context هم‌زمان ≈ شش رندرر Chromium و این
    // ماشین با ~۱ گیگ RAM آزاد (اجرای ۲۰۲۶-۱۰-۲۰) وسط sweep می‌خوابد.
    // با یک context زنده، هر نقش که تمام شد بسته می‌شود و ردیف‌ها همان‌جا روی دیسک
    // می‌نویسند؛ پس اگر اجرا قطع شود، تا آن نقطه شواهد از دست نمی‌رود.
    const REPORT = path.join(ART, 'audit-report-routes.json')
    // در اجرای تکه‌ای، ردیف/یافتهٔ نقش‌های دیگر از فایل قبلی حفظ می‌شود
    const flush = () => {
      let prior: any = { findings: [], rows: [] }
      if (ROLE_FILTER.length && fs.existsSync(REPORT)) {
        try {
          prior = JSON.parse(fs.readFileSync(REPORT, 'utf8'))
        } catch {
          prior = { findings: [], rows: [] }
        }
      }
      // ردیف‌های نقش‌های دیگر + مسیرهای خارج از تکهٔ جاری دست‌نخورده می‌مانند
      const keepRows = (prior.rows || []).filter(
        (r: any) => !roles.includes(r.role) || (ROUTE_FILTER.length > 0 && !ROUTE_ACTIVE(r.route))
      )
      const keepFindings = (prior.findings || []).filter(
        (f: any) => !roles.includes(f.role) || (ROUTE_FILTER.length > 0 && !ROUTE_ACTIVE(f.route))
      )
      fs.writeFileSync(REPORT, JSON.stringify({ findings: [...keepFindings, ...findings], rows: [...keepRows, ...routeRows] }, null, 2))
    }
    for (const role of roles) {
      if (unavailable.has(role)) continue
      let handle = await newContextForRole(browser, role)
      try {
        for (const r of ROUTES) {
          if (!r.roles.includes(role)) continue
          if (!ROUTE_ACTIVE(r.p)) continue
          for (const vp of VIEWPORTS) {
            const args = { expectStatuses: r.expectStatuses, expectText: r.expectText }
            let row: any = null
            try {
              row = await auditRoute(handle.page, role, r.p, vp, args)
            } catch (e: any) {
              // مرگ مرورگر/context وسط مسیر: با context تازه یک بار دیگر
              record({
                severity: 'P1',
                kind: 'harness-browser-crash',
                role,
                route: r.p,
                viewport: vp.name,
                detail: `مرورگر/صفحه از دست رفت و ردیف نیمه‌کاره ماند: ${String(e?.message || e).slice(0, 160)}`,
              })
              await handle.context.close().catch(() => {})
              handle = await newContextForRole(browser, role)
              row = await auditRoute(handle.page, role, r.p, vp, args).catch(() => null)
            }
            if (!row) continue
            if (ROUTE_GAP_MS > 0) await handle.page.waitForTimeout(ROUTE_GAP_MS).catch(() => {})
            // یک رندرر قفل‌شده، ردیف‌های بعدی همان نقش را هم می‌خواباند؛ context را
            // عوض می‌کنیم (localStorage از auth/*.json دوباره تزریق می‌شود).
            if (row?.stepTimeouts?.length) {
              await handle.context.close().catch(() => {})
              handle = await newContextForRole(browser, role)
            }
          }
          flush()
        }
      } finally {
        await handle.context.close().catch(() => {})
      }
      flush()
    }
    flush()
    expect(routeRows.length).toBeGreaterThan(0)
  })
})

test.describe('MOBILE AUDIT — ماتریس کامل اندازه‌ها برای صفحات کلیدی', () => {
  test('viewport matrix', async ({ browser }) => {
    test.skip(!ACTIVE('manager'), 'فقط در تکهٔ manager اجرا می‌شود')
    test.skip(ROUTE_FILTER.length > 0, 'در اجرای تکه‌ای مسیرها، تست‌های نقش‌محور جدا اجرا می‌شوند')
    test.skip(unavailable.has('manager'), 'حساب manager در این بک‌اند در دسترس نبود')
    test.setTimeout(30 * 60 * 1000)
    const { context, page } = await newContextForRole(browser, 'manager')
    const local: any[] = []
    try {
      for (const r of KEY_ROUTES) {
        for (const vp of ALL_VIEWPORTS) {
          // اسکرین‌شات داخل auditRoute گرفته می‌شود (نام فایل با نقش+viewport)
          const row = await auditRoute(page, 'manager', r, vp)
          local.push(row)
          if (ROUTE_GAP_MS > 0) await page.waitForTimeout(ROUTE_GAP_MS)
        }
      }
    } finally {
      await context.close().catch(() => {})
    }
    fs.writeFileSync(path.join(ART, 'audit-report-viewports.json'), JSON.stringify({ findings, rows: local }, null, 2))
  })
})

test.describe('MOBILE AUDIT — کنترل دسترسی نقش‌ها (نگهبان سمت کلاینت)', () => {
  test('role guard behaviour', async ({ browser }) => {
    test.skip(!ACTIVE('manager'), 'فقط در تکهٔ manager اجرا می‌شود')
    test.skip(ROUTE_FILTER.length > 0, 'در اجرای تکه‌ای مسیرها، تست‌های نقش‌محور جدا اجرا می‌شوند')
    test.setTimeout(10 * 60 * 1000)
    const checks: Array<{ role: RoleName; route: string; finalPath: string; redirected: boolean }> = []
    const allCases: Array<{ role: RoleName; route: string }> = [
      { role: 'guest', route: '/dashboard' },
      { role: 'user', route: '/manager-dashboard' },
      { role: 'user', route: '/admin' },
      { role: 'user', route: '/coach' },
      { role: 'coach', route: '/admin' },
      { role: 'manager', route: '/coach' },
      { role: 'manager', route: '/admin' },
      { role: 'super_admin', route: '/admin' },
      { role: 'super_admin', route: '/coach' },
      { role: 'staff', route: '/finance' },
      { role: 'manager', route: '/finance' },
      { role: 'user', route: '/finance' },
    ]
    // نقشی که حسابش در بک‌اند مقصد نیست با storageState خالی = مهمان ⇒ ریدایرکت را
    // «نگهبان رد کرد» تفسیر می‌کرد؛ آن مورد را اصلاً اجرا نمی‌کنیم.
    const cases = allCases.filter((c) => !unavailable.has(c.role))
    for (const c of cases) {
      const { context, page } = await newContextForRole(browser, c.role)
      try {
        await page.goto(c.route, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
        await page
          .waitForFunction(() => !/در حال بارگذاری/.test(document.body.innerText || ''), null, { timeout: 20000 })
          .catch(() => {})
        await page.waitForTimeout(500)
        const finalPath = new URL(page.url()).pathname
        const innerText = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 120))
        checks.push({ role: c.role, route: c.route, finalPath, redirected: finalPath !== c.route, innerText } as any)
      } finally {
        await context.close().catch(() => {})
      }
    }
    fs.writeFileSync(path.join(ART, 'audit-report-access.json'), JSON.stringify({ checks, findings }, null, 2))
    expect(checks.length).toBe(cases.length)
  })
})

test.describe('MOBILE AUDIT — پیمایش با کیبورد (WCAG 2.4.7)', () => {
  /** یک ایستگاه کیبورد: تگ، نام قابل‌دسترس، و اینکه آیا نشانهٔ تمرکز دیده می‌شود */
  const activeStop = (page: Page) =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const cs = window.getComputedStyle(el)
      const ring =
        (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
        (cs.boxShadow !== '' && cs.boxShadow !== 'none')
      const name =
        el.getAttribute('aria-label') ||
        (el.innerText || '').trim().slice(0, 40) ||
        el.getAttribute('placeholder') ||
        '(بی‌نام)'
      // توقف تکراری: div قابل‌فوکوس که داخلش یک المان ذاتاً قابل‌فوکوس هست
      const dup =
        el.tagName === 'DIV' &&
        !!el.querySelector('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="combobox"]')
      return { tag: el.tagName.toLowerCase(), name, ring, dup }
    })

  test('focus ring + tab order', async ({ browser }) => {
    test.skip(!ACTIVE('manager'), 'فقط در تکهٔ manager اجرا می‌شود')
    test.skip(ROUTE_FILTER.length > 0, 'در اجرای تکه‌ای مسیرها، تست‌های نقش‌محور جدا اجرا می‌شوند')
    test.setTimeout(10 * 60 * 1000)
    const rows: Array<Record<string, unknown>> = []
    const allCases: Array<{ role: RoleName; route: string }> = [
      { role: 'user', route: '/' },
      { role: 'user', route: '/venues/1' },
      { role: 'user', route: '/dashboard' },
      { role: 'manager', route: '/finance' },
      { role: 'guest', route: '/login' },
    ]
    const cases = allCases.filter((c) => !unavailable.has(c.role))
    for (const c of cases) {
      const { context, page } = await newContextForRole(browser, c.role)
      try {
        await page.goto(c.route, { waitUntil: 'load', timeout: 60000 }).catch(() => {})
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
        await page.waitForTimeout(800)
        await page.evaluate(() => document.body.focus())
        const stops: Array<{ tag: string; name: string; ring: boolean; dup: boolean }> = []
        for (let i = 0; i < 16; i++) {
          await page.keyboard.press('Tab')
          // حلقهٔ تمرکز باید آنی باشد، اما اگر روزی transition دیگری برگردد
          // اندازه‌گیریِ بی‌درنگ مقدار ۰px را در میانهٔ انیمیشن می‌خواند (ریشهٔ F-28).
          await page.waitForTimeout(60)
          const s = await activeStop(page)
          if (!s) break
          stops.push(s)
        }
        const noRing = stops.filter((s) => !s.ring)
        const dups = stops.filter((s) => s.dup)
        rows.push({ role: c.role, route: c.route, stops: stops.length, noRing: noRing.length, dups: dups.length })
        if (noRing.length)
          record({
            severity: 'P2',
            kind: 'focus-ring-invisible',
            role: c.role,
            route: c.route,
            viewport: '375x812',
            detail: `${noRing.length}/${stops.length} توقف کیبورد بدون حلقهٔ قابل‌مشاهده: ${JSON.stringify(noRing.slice(0, 4).map((s) => `${s.tag}:${s.name}`))}`,
          })
        if (dups.length)
          record({
            severity: 'P3',
            kind: 'duplicate-tab-stop',
            role: c.role,
            route: c.route,
            viewport: '375x812',
            detail: `${dups.length} ظرف قابل‌فوکوس که المان فعالِ داخلش دوبار ایستگاه کیبورد می‌سازد`,
          })
      } finally {
        await context.close().catch(() => {})
      }
    }
    fs.writeFileSync(path.join(ART, 'audit-report-keyboard.json'), JSON.stringify({ rows, findings }, null, 2))
    const allNoRing = rows.reduce((a, r) => a + (r.noRing as number), 0)
    const allDup = rows.reduce((a, r) => a + (r.dups as number), 0)
    // F-28 ریشه‌یابی شد: حلقه وجود داشت ولی transition:all آن را از ۰px باز می‌کرد و
    // اندازه‌گیریِ بی‌درنگ همان ۰px را می‌دید. با فهرست صریح transition در تم، حلقه آنی است.
    expect(allNoRing, 'همهٔ ایستگاه‌های کیبورد باید حلقهٔ تمرکز داشته باشند').toBe(0)
    expect(allDup, 'ظرف‌های انیمیشن نباید ایستگاه کیبورد تکراری بسازند').toBe(0)
  })

  test('open layer behaves with the keyboard', async ({ browser }) => {
    test.skip(!ACTIVE('manager'), 'فقط در تکهٔ manager اجرا می‌شود')
    test.skip(ROUTE_FILTER.length > 0, 'در اجرای تکه‌ای مسیرها، تست‌های نقش‌محور جدا اجرا می‌شوند')
    test.skip(unavailable.has('manager'), 'حساب manager در این بک‌اند در دسترس نبود')
    const { context, page } = await newContextForRole(browser, 'manager')
    let closedByEscape = false
    try {
      await page.goto('/finance', { waitUntil: 'load', timeout: 60000 }).catch(() => {})
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(900)
      await page.locator('input[aria-haspopup="dialog"]').first().click()
      await page.waitForTimeout(500)
      const paper = page.locator('.MuiPopover-paper')
      const opened = (await paper.count()) > 0
      if (opened) {
        await paper.first().evaluate((el) => el.setAttribute('data-audit-layer', '1'))
        // Popover غیرمدال MUI تمرکز را حبس نمی‌کند (حق انتخاب استاندارد): Tab باید
        // لایه را ببندد. اگر باز بماند و تمرکز بیرون برود، لایهٔ «شبح» ساخته می‌شود.
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab')
          const stillOpen = await page.evaluate(() => !!document.querySelector('[data-audit-layer]'))
          if (!stillOpen) break
        }
        const stillOpen = await page.evaluate(() => !!document.querySelector('[data-audit-layer]'))
        if (stillOpen) {
          await page.keyboard.press('Escape')
          await page.waitForTimeout(400)
          closedByEscape = await page.evaluate(() => !document.querySelector('[data-audit-layer]'))
          record({
            severity: 'P3',
            kind: 'open-layer-with-focus-outside',
            role: 'manager',
            route: '/finance',
            viewport: '375x812',
            detail: `Tab تمرکز را از پاپ‌اور تاریخ بیرون برد و لایه باز ماند (با Escape بسته شد: ${closedByEscape})`,
          })
        }
      }
      expect(opened, 'پاپ‌اور انتخاب تاریخ باید باز شود').toBe(true)
    } finally {
      await context.close().catch(() => {})
    }
  })
})

test.afterAll(() => {
  fs.mkdirSync(ART, { recursive: true })
  const bySeverity = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})
  fs.writeFileSync(path.join(ART, 'audit-findings-summary.json'), JSON.stringify({ total: findings.length, bySeverity, findings }, null, 2))
})
