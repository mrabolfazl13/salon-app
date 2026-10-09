# راهنمای تنظیم SSL برای api.absadeghi.ir

## وضعیت فعلی:
- ✅ دامنه `api.absadeghi.ir` ثبت شده
- ✅ DNS به Cloudflare اشاره می‌کند (IPv6: 2606:4700:3037::ac43:aa05)
- ❌ HTTPS کار نمی‌کند (Connection reset)
- ❌ SSL certificate نصب نشده

---

## 🎯 دو راه حل:

### راه حل A: استفاده از Cloudflare SSL (سریع‌ترین - پیشنهادی)

Cloudflare خودش SSL رایگان ارائه می‌دهد و نیازی به نصب certbot روی سرور نیست.

#### مرحله ۱: فعال‌سازی SSL در Cloudflare Dashboard

1. به [Cloudflare Dashboard](https://dash.cloudflare.com/) بروید
2. دامنه `absadeghi.ir` را انتخاب کنید
3. منوی **SSL/TLS** → **Overview**
4. حالت SSL را روی **"Full"** یا **"Full (strict)"** قرار دهید:
   - **Flexible**: فقط بین کاربر و Cloudflare رمزنگاری می‌شود (امنیت کمتر)
   - **Full**: بین همه نقاط رمزنگاری می‌شود (پیشنهادی)
   - **Full (strict)**: مثل Full ولی نیاز به certificate معتبر روی سرور دارد

#### مرحله ۲: ایجاد Origin Certificate (اگر Full strict انتخاب کردی)

1. در Cloudflare Dashboard → SSL/TLS → **Origin Server**
2. روی **"Create Certificate"** کلیک کنید
3. تنظیمات:
   - Hostnames: `api.absadeghi.ir`
   - Certificate Type: RSA 2048
   - Key Type: PEM
4. روی **"Next"** کلیک کنید
5. هر دو فایل را دانلود کن:
   - `origin.crt` (certificate)
   - `origin.key` (private key)

#### مرحله ۳: نصب Origin Certificate روی سرور

```bash
# SSH به سرور
ssh salonapp

# ساخت پوشه برای certificates
sudo mkdir -p /etc/ssl/cloudflare
cd /etc/ssl/cloudflare

# آپلود فایل‌ها (از طریق SCP یا copy-paste)
sudo nano origin.crt
# محتوای origin.crt را paste کن، Ctrl+X, Y, Enter

sudo nano origin.key
# محتوای origin.key را paste کن، Ctrl+X, Y, Enter

# تنظیم permissions
sudo chmod 600 origin.key
sudo chmod 644 origin.crt
```

#### مرحله ۴: پیکربندی Nginx با SSL

```bash
# SSH به سرور
ssh salonapp

# ویرایش Nginx config
sudo nano /etc/nginx/sites-available/salon-api
```

محتوای فایل:

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.absadeghi.ir;
    return 301 https://$host$request_uri;
}

# HTTPS for Backend API
server {
    listen 443 ssl http2;
    server_name api.absadeghi.ir;

    # SSL Certificate (Cloudflare Origin)
    ssl_certificate /etc/ssl/cloudflare/origin.crt;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Proxy to backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host $host;
    }
}
```

#### مرحله ۵: فعال‌سازی سایت و ری‌استارت Nginx

```bash
# ایجاد symlink
sudo ln -sf /etc/nginx/sites-available/salon-api /etc/nginx/sites-enabled/

# تست کانفیگ
sudo nginx -t

# اگر خطا نبود، ری‌استارت
sudo systemctl restart nginx

# بررسی status
sudo systemctl status nginx
```

#### مرحله ۶: تست HTTPS

```bash
# تست از local
curl -I https://api.absadeghi.ir/health

# باید ببینی:
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains
```

---

### راه حل B: Let's Encrypt Certbot (اگر Cloudflare نداری)

اگر نمی‌خواهی از Cloudflare SSL استفاده کنی:

#### مرحله ۱: غیرفعال کردن Cloudflare Proxy (موقت)

1. در Cloudflare Dashboard → DNS
2. رکورد `api` را پیدا کن
3. آیکون ابر نارنجی را کلیک کن تا **خاکستری** شود (DNS only)
4. صبر کن تا DNS propagate شود (۵ دقیقه)

#### مرحله ۲: نصب Certbot

```bash
ssh salonapp

sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### مرحله ۳: دریافت Certificate

```bash
sudo certbot --nginx -d api.absadeghi.ir

# ایمیل وارد کن
# شرایط را قبول کن (Agree)
# گزینه 2 را انتخاب کن (redirect HTTP to HTTPS)
```

#### مرحله ۴: تست خودکار Renewal

```bash
sudo certbot renew --dry-run
```

اگر موفق بود، cron job اضافه کن:

```bash
echo "0 3 * * * certbot renew --quiet" | sudo tee /etc/cron.d/certbot
```

#### مرحله ۵: فعال‌سازی مجدد Cloudflare Proxy

1. در Cloudflare DNS، ابر را دوباره **نارنجی** کن
2. SSL mode را روی **Full** قرار بده

---

## 🔧 به‌روزرسانی Environment Variables

بعد از اینکه SSL کار کرد، این env vars را روی سرور به‌روز کن:

```bash
ssh salonapp

# ویرایش فایل .env در پوشه backend
nano ~/backend/.env
```

تغییرات:

```bash
# قبلی (HTTP):
DOMAIN=http://YOUR_IP:8000
FRONTEND_URL=http://YOUR_IP:5173
MINIO_PUBLIC_URL=http://YOUR_IP:9000

# جدید (HTTPS):
DOMAIN=https://api.absadeghi.ir
FRONTEND_URL=https://api.absadeghi.ir
MINIO_PUBLIC_URL=https://api.absadeghi.ir

# CORS allowed origins
ALLOWED_ORIGINS=https://api.absadeghi.ir,tauri://localhost,capacitor://localhost
```

ری‌استارت Docker:

```bash
cd ~/backend
docker compose down
docker compose up -d
```

---

## 📱 به‌روزرسانی Flutter App

فایل `android_flutter/lib/config/app_config.dart`:

```dart
class AppConfig {
  static const String baseUrl = 'https://api.absadeghi.ir';
  static const String wsUrl = 'wss://api.absadeghi.ir/ws';
  static const String minioUrl = 'https://api.absadeghi.ir';
}
```

Rebuild اپ:

```bash
cd android_flutter
flutter clean
flutter build apk --release
```

---

## ✅ چک‌لیست نهایی

- [ ] SSL certificate نصب شده (`curl -I https://api.absadeghi.ir` → 200)
- [ ] HTTP به HTTPS redirect می‌شود
- [ ] Environment variables به‌روز شده‌اند
- [ ] Docker containers ری‌استارت شده‌اند
- [ ] Flutter app با URL جدید rebuild شده
- [ ] WebSocket با wss:// کار می‌کند
- [ ] CORS errors در مرورگر نیست

---

## 🆘 عیب‌یابی

### مشکل: Nginx start نمی‌شود
```bash
sudo nginx -t
# خطا را بخوان و اصلاح کن
sudo journalctl -u nginx -n 50 --no-pager
```

### مشکل: Certificate expired
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### مشکل: Cloudflare Error 525 (SSL handshake failed)
- در Cloudflare Dashboard → SSL/TLS → Overview
- حالت را از "Full (strict)" به "Full" تغییر بده
- یا origin certificate را دوباره بساز

### مشکل: WebSocket کار نمی‌کند
```bash
# تست WebSocket
wscat -c wss://api.absadeghi.ir/ws

# لاگ Nginx
sudo tail -f /var/log/nginx/error.log
```

---

تمام! 🎉
