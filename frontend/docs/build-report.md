# گزارش بیلد (Build Report)

**تاریخ:** ۲۰۲۶-۱۰-۲۰ | **دستور:** `node --max-old-space-size=3072 node_modules/vite/bin/vite.js build`

---

## نتیجه

| مورد | مقدار |
|------|-------|
| وضعیت | ✅ موفق |
| زمان | ۱m ۳s |
| خروجی | `dist/` |
| خطا/هشدار Vite | ندارد |

## بزرگ‌ترین چانک‌ها

| فایل | حجم | gzip |
|------|-----|------|
| `vendor-mui-*.js` | 406.81 kB | 119.98 kB |
| `vendor-charts-*.js` | 395.40 kB | 109.27 kB |
| `index-*.js` | 220.37 kB | 73.38 kB |
| `vendor-react-*.js` | 179.14 kB | 58.58 kB |
| `vendor-maps-*.js` | 153.58 kB | 44.61 kB |
| `vendor-utils-*.js` | 129.81 kB | 41.74 kB |
| `vendor-forms-*.js` | 120.02 kB | 35.60 kB |
| `ManagerDashboard-*.js` | 80.47 kB | 20.24 kB |

> heap صریح ۳۰۷۲MB لازم است: Node این میزبان زیر فشار RAM heap کوچک انتخاب می‌کند و بدون آن `vite build` با «allocation failure» می‌میرد (نه خطای کد).

## یادداشت

- بیلد وب با `VITE_DOMAIN` خالی و مسیر نسبی `/api/v1` ساخته می‌شود؛ Tauri با دامنهٔ مطلق.
- این دور فقط بیلد وب اجرا شد؛ بیلد Tauri/Android در CI tag-gated است و اجرا نشد.
