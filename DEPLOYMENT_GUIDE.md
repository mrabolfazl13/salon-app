# راهنمای تنظیم وابستگی‌های خارجی - Phase 27

این راهنما شامل مراحل دقیق برای تنظیم ۴ وابستگی خارجی باقی‌مانده است که برای تکمیل نهایی فیچرها لازم هستند.

---

## 📱 ۱. Firebase Project Setup (برای Push Notifications)

### مرحله ۱: ساخت پروژه Firebase

1. به [Firebase Console](https://console.firebase.google.com/) بروید
2. روی **"Add project"** کلیک کنید
3. نام پروژه: `salon-futsal-booking`
4. Google Analytics را **غیرفعال** کنید (اختیاری)
5. روی **"Create project"** کلیک کنید

### مرحله ۲: ثبت اپلیکیشن Android

1. در داشبورد Firebase، روی آیکون **Android** کلیک کنید
2. **Package name** را وارد کنید:
   ```
   com.salon.futsal.booking
   ```
   > ⚠️ این باید با `applicationId` در `android_flutter/android/app/build.gradle.kts` مطابقت داشته باشد
3. **App nickname**: `Salon Futsal - Android`
4. روی **"Register app"** کلیک کنید

### مرحله ۳: دانلود google-services.json

1. فایل `google-services.json` دانلود می‌شود
2. آن را در مسیر زیر قرار دهید:
   ```
   android_flutter/android/app/google-services.json
   ```

### مرحله ۴: فعال‌سازی Firebase Cloud Messaging (FCM)

1. در منوی سمت چپ Firebase Console، روی **"Cloud Messaging"** کلیک کنید
2. تب **"Cloud Messaging API"** را باز کنید
3. روی **"Manage API in Google Cloud Console"** کلیک کنید
4. API را **Enable** کنید

### مرحله ۵: اضافه کردن Server Key به GitHub Secrets

1. در Firebase Console → Project Settings → Cloud Messaging
2. **Server key** را کپی کنید
3. به GitHub Repository → Settings → Secrets and variables → Actions بروید
4. Secret جدید بسازید:
   - Name: `FCM_SERVER_KEY`
   - Value: [Server key از Firebase]

### مرحله ۶: تست FCM

```bash
cd android_flutter
flutter run
```

در اپ، توکن FCM لاگ می‌شود:
```
I/flutter (xxxxx): FCM Token: <TOKEN_HERE>
```

---

## 🔐 ۲. Keystore برای امضای APK Release

### مرحله ۱: ساخت Keystore

```bash
# در پوشه android_flutter/android
cd android_flutter/android

# ساخت keystore با الگوریتم RSA 2048-bit
keytool -genkey -v \
  -keystore salon-release-key.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias salon-app \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Salon Futsal, OU=Mobile, O=SalonApp, L=Tehran, ST=Tehran, C=IR"
```

> ⚠️ **رمزها را جایی امن ذخیره کنید** - بعداً به آنها نیاز دارید

### مرحله ۲: ایجاد key.properties

فایل `android_flutter/android/key.properties` بسازید:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=salon-app
storeFile=salon-release-key.jks
```

### مرحله ۳: اضافه کردن به .gitignore

مطمئن شوید این خطوط در `android_flutter/.gitignore` وجود دارند:

```gitignore
# Keystore files
*.jks
*.keystore
key.properties

# Build outputs
build/
app/release/
```

### مرحله ۴: تبدیل Keystore به Base64 برای GitHub Secrets

```bash
# تبدیل فایل به base64
base64 -w 0 salon-release-key.jks > salon-release-key.jks.b64

# محتوای فایل b64 را کپی کنید
cat salon-release-key.jks.b64
```

### مرحله ۵: اضافه کردن Secrets به GitHub

به GitHub Repository → Settings → Secrets and variables → Actions بروید و این secrets را بسازید:

| Secret Name | Value |
|------------|-------|
| `KEYSTORE_BASE64` | محتوای فایل `.b64` از مرحله قبل |
| `KEYSTORE_PASSWORD` | رمز keystore (YOUR_STORE_PASSWORD) |
| `KEY_PASSWORD` | رمز key (YOUR_KEY_PASSWORD) |
| `KEY_ALIAS` | `salon-app` |

### مرحله ۶: تست Build Signed APK

```bash
cd android_flutter

# Build release APK
flutter build apk --release

# خروجی باید در این مسیر باشد:
ls -lh build/app/outputs/flutter-apk/app-release.apk
```

APK باید بدون خطا ساخته شود و قابل نصب باشد.

---

## 📧 ۳. SMS Provider Credentials (برای OTP Login)

### گزینه A: کاوه نگار (پیشنهادی)

#### مرحله ۱: ثبت‌نام و خرید اعتبار

1. به [کاوه نگار](https://kavehnegar.com/) بروید
2. ثبت‌نام کنید
3. بسته پیامک خریداری کنید (حداقل ۱۰۰ پیامک)

#### مرحله ۲: دریافت API Key

1. به پنل کاربری بروید
2. منوی **"تنظیمات"** → **"API Key"**
3. API Key را کپی کنید

#### مرحله ۳: تایید فرستنده

1. منوی **"خطوط ارسالی"** → **"درخواست خط اختصاصی"**
2. شماره موبایل خود را وارد کنید
3. کد تأیید را وارد کنید
4. صبر کنید تا تأیید شود (معمولاً چند ساعت)

#### مرحله ۴: اضافه کردن به Environment Variables

روی سرور پروداکشن (`~/backend/.env`):

```bash
# SMS Configuration - Kavehnegar
SMS_PROVIDER=kavehnegar
SMS_API_KEY=YOUR_KAVEHNEGAR_API_KEY_HERE
SMS_SENDER_NUMBER=0912XXXXXXX  # شماره تأیید شده
```

### گزینه B: ملی پیامک

#### مرحله ۱: ثبت‌نام

1. به [ملی پیامک](https://melipayamak.com/) بروید
2. ثبت‌نام کنید
3. احراز هویت انجام دهید

#### مرحله ۲: دریافت API Credentials

1. به پنل کاربری بروید
2. منوی **"وب سرویس"** → **"API Rest"**
3. Username و Password را دریافت کنید

#### مرحله ۴: اضافه کردن به Environment Variables

```bash
# SMS Configuration - Meli Payamak
SMS_PROVIDER=melipayamak
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
SMS_SENDER_NUMBER=3000XXXXX  # شماره خط خدماتی
```

### مرحله ۵: تست ارسال SMS

```bash
# SSH به سرور
ssh salonapp

# تست API
curl -X POST https://api.kavehnegar.com/v1/Send.json \
  -H "Content-Type: application/json" \
  -d '{
    "apikey": "YOUR_API_KEY",
    "receptor": "09123456789",
    "message": "کد تأیید: 123456"
  }'
```

باید پاسخ موفق دریافت کنید:
```json
{"return":{"status":200,"message":"success"}}
```

---

## 🌐 ۴. Domain Name Configuration

### مرحله ۱: خرید دامنه (اگر ندارید)

پیشنهادات:
- [.ir دامنه‌های ملی](https://nic.ir/) - ارزان‌تر
- [Namecheap](https://namecheap.com/) - بین‌المللی
- [IranServer](https://iranserver.com/) - هاستینگ ایرانی

### مرحله ۲: تنظیم DNS Records

به پنل مدیریت دامنه بروید و این رکوردها را اضافه کنید:

```
Type    Name              Value                    TTL
A       @                 YOUR_SERVER_IP           3600
A       www               YOUR_SERVER_IP           3600
A       api               YOUR_SERVER_IP           3600
A       cdn               YOUR_SERVER_IP           3600
CNAME   minio             cdn.yourdomain.com       3600
```

> جای `YOUR_SERVER_IP` آی‌پی سرور خود را بگذارید

### مرحله ۳: دریافت SSL Certificate با Let's Encrypt

```bash
# SSH به سرور
ssh salonapp

# نصب certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# دریافت certificate برای تمام سابدامین‌ها
sudo certbot certonly --nginx \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  -d cdn.yourdomain.com
```

ایمیل و موافقت با شرایط را وارد کنید.

### مرحله ۴: پیکربندی Nginx

فایل `/etc/nginx/sites-available/salon` را ویرایش کنید:

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com cdn.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS for React Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/salon-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTPS for Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# HTTPS for MinIO (CDN)
server {
    listen 443 ssl http2;
    server_name cdn.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Enable upload
        client_max_body_size 100M;
    }
}
```

### مرحله ۵: ری‌استارت Nginx

```bash
sudo nginx -t  # تست کانفیگ
sudo systemctl restart nginx
```

### مرحله ۶: به‌روزرسانی Environment Variables

روی سرور (`~/backend/.env`):

```bash
# Domain Configuration
DOMAIN=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
MINIO_PUBLIC_URL=https://cdn.yourdomain.com

# CORS allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,tauri://localhost,capacitor://localhost
```

### مرحله ۷: به‌روزرسانی Docker Compose

فایل `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - DOMAIN=https://api.yourdomain.com
      - FRONTEND_URL=https://yourdomain.com
      - MINIO_PUBLIC_URL=https://cdn.yourdomain.com

  minio:
    environment:
      - MINIO_SERVER_URL=https://cdn.yourdomain.com
```

```bash
# ری‌استارت سرویس‌ها
cd ~/backend
docker compose up -d
```

### مرحله ۸: به‌روزرسانی Flutter App

فایل `android_flutter/lib/config/app_config.dart`:

```dart
class AppConfig {
  static const String baseUrl = 'https://api.yourdomain.com';
  static const String wsUrl = 'wss://api.yourdomain.com/ws';
  static const String minioUrl = 'https://cdn.yourdomain.com';
}
```

### مرحله ۹: تست نهایی

```bash
# تست HTTPS
curl -I https://api.yourdomain.com/health

# باید ببینید:
# HTTP/2 200
# strict-transport-security: max-age=31536000
```

```bash
# تست فرانت‌اند
curl -I https://yourdomain.com

# تست MinIO
curl -I https://cdn.yourdomain.com
```

---

## ✅ چک‌لیست نهایی

بعد از انجام تمام مراحل بالا، این موارد را چک کنید:

- [ ] Firebase FCM token در لاگ Flutter نمایش داده می‌شود
- [ ] APK signed ساخته می‌شود و روی گوشی نصب می‌شود
- [ ] پیامک OTP ارسال می‌شود (تست با شماره واقعی)
- [ ] HTTPS برای تمام سابدامین‌ها کار می‌کند
- [ ] CORS errors در کنسول مرورگر نیست
- [ ] تصاویر سالن از CDN لود می‌شوند
- [ ] WebSocket با wss:// کار می‌کند

---

## 🆘 عیب‌یابی

### مشکل: Firebase token نمی‌آید
```bash
# چک کنید google-services.json درست باشد
cat android_flutter/android/app/google-services.json | grep package_name

# باید با applicationId در build.gradle.kts مطابقت داشته باشد
```

### مشکل: Keystore password اشتباه
```bash
# تست keystore
keytool -list -keystore salon-release-key.jks -storepass YOUR_PASSWORD

# باید لیست keys را نشان دهد
```

### مشکل: SMS ارسال نمی‌شود
```bash
# چک کردن لاگ بک‌اند
docker logs salon-backend | grep SMS

# تست مستقیم API کاوه نگار
curl https://api.kavehnegar.com/v1/Send.json \
  -d '{"apikey":"TEST","receptor":"09123456789","message":"test"}'
```

### مشکل: SSL certificate منقضی شده
```bash
# تمدید خودکار با cron
sudo certbot renew --dry-run

# اگر کار کرد، cron job اضافه کنید
echo "0 3 * * * certbot renew --quiet" | sudo tee /etc/cron.d/certbot
```

---

## 📞 پشتیبانی

اگر به مشکل خوردید:
1. لاگ‌ها را چک کنید: `docker logs salon-backend`
2. مستندات رسمی هر سرویس را بخوانید
3. از GitHub Issues استفاده کنید

تمام! 🎉
