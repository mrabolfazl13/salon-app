# گزارش عملکرد (Performance Report)

**تاریخ:** ۲۰۲۶-۱۰-۱۸ | **محیط:** سندباکس محلی (localhost:3001 → localhost:8000)

> ⚠️ **هشدار مهم:** اعداد زیر از بیلد تحویلی روی `localhost` گرفته شده‌اند. شبکهٔ داخلی بدون تأخیر WAN، کش DNS و CDN نیست. اعداد production واقعی احتمالاً ۲–۵× کندتر خواهند بود (به‌ویژه TTFB و LCP). این گزارش الگوی نسبی را نشان می‌دهد، نه مطلق.

---

## خلاصه کلیدی

| معیار | Cold (میانگین) | Warm (میانگین) | هدف WCAG/UX | وضعیت |
|-------|----------------|----------------|-------------|--------|
| FCP (First Contentful Paint) | 44–100 ms | 44–72 ms | ≤۲ ثانیه | ✅ عالی |
| LCP (Largest Contentful Paint) | 236–1088 ms | 136–968 ms | ≤۲.۵ ثانیه | ✅ خوب |
| TTFB (Time to First Byte) | 1–2 ms | 2–3 ms | ≤۲۰۰ ms | ✅ عالی (localhost) |
| تعداد منابع | 25–60 | 25–60 | — | — |
| JS انتقالی (cold) | 293–357 KB | 2–6 KB | — | lazy chunks مؤثر |
| فراخوانی API | 5–10 | 5–10 | — | — |

## جزئیات به‌ازای مسیر

| مسیر | حالت | FCP | LCP | منابع | JS KB | API calls |
|------|------|-----|-----|-------|-------|-----------|
| `/` | cold | 68ms | 1088ms | 60 | 320 | 10 |
| `/` | warm | 52ms | 968ms | 60 | 5 | 10 |
| `/bookings` | cold | 84ms | 236ms | 34 | 307 | 7 |
| `/bookings` | warm | 68ms | 652ms | 34 | 4 | 7 |
| `/dashboard` | cold | 80ms | 268ms | 25 | 293 | 5 |
| `/dashboard` | warm | 52ms | 156ms | 25 | 2 | 5 |
| `/finance` | cold | 72ms | 252ms | 38 | 357 | 7 |
| `/finance` | warm | 72ms | 548ms | 38 | 5 | 7 |
| `/manager/shifts` | cold | 100ms | 292ms | 38 | 357 | 7 |
| `/manager/shifts` | warm | 48ms | 136ms | 38 | 5 | 7 |
| `/teams/1` | cold | 72ms | 296ms | 46 | 336 | 10 |
| `/teams/1` | warm | 44ms | 152ms | 46 | 6 | 10 |

## تحلیل

### نقاط قوت

1. **FCP بسیار سریع** (۴۴–۱۰۰ms): محتوای اولیه تقریباً آنی رندر می‌شود.
2. **Lazy loading مؤثر**: JS انتقالی در حالت warm فقط ۲–۶ KB (chunkهای مورد نیاز).
3. **تعداد API منطقی**: ۵–۱۰ فراخوانی در هر صفحه — N+1 queries کنترل شده.

### نگرانی‌ها

1. **LCP بالا در Home (1088ms cold)**: احتمالاً به‌دلیل تصاویر unsplash ( unreachable → retry timeout) و انیمیشن‌های framer-motion.
2. **LCP warm هنوز بالا (548–968ms)**: حتی با کش مرورگر، LCP قابل‌توجه است. ممکن است به‌دلیل layout shift از تصاویر لودنشده یا chart rendering باشد.
3. **منابع زیاد در Home (60)**: تصاویر seed + آیکون‌ها + chunkهای lazy.

### توصیه‌ها برای production

1. **تصاویر unsplash را با placeholder محلی جایگزین کنید** یا از CDN ایرانی استفاده کنید.
2. **Image lazy loading با aspect-ratio ثابت** برای جلوگیری از layout shift.
3. **Code splitting بهبود**: vendor-mui (406KB) و vendor-charts (395KB) کاندیدای further splitting هستند.
4. **Service Worker برای caching** assets استاتیک و API responses.

## اندازهٔ بیلد

```
dist/assets/index-*.js          220.05 kB │ gzip:  73.35 kB
dist/assets/vendor-charts-*.js  395.46 kB │ gzip: 109.31 kB
dist/assets/vendor-mui-*.js     406.85 kB │ gzip: 120.02 kB
─────────────────────────────────────────────────────
Total JS (gzip)                 ~303 KB
Total files in dist             129 files / 3.08 MiB
```

## داده‌های خام

- `audit-artifacts/perf-web.json`: ۳۶ اندازه‌گیری (۶ مسیر × ۳ نقش × cold/warm)
