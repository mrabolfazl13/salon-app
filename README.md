# سیستم رزرو سالن فوتسال

## راه‌اندازی پروژه

### پیش‌نیازها
- Docker و Docker Compose
- Node.js 18+ (برای فرانت‌اند)
- Rust (برای Tauri)

### اجرا با Docker

`ash
# ساختن و اجرای کانتینرها
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f

# توقف سرویس‌ها
docker-compose down
`

### API Documentation

بعد از اجرا، مستندات API در آدرس زیر قابل دسترسی است:
http://localhost:8000/docs

### کاربر پیش‌فرض ادمین
- شماره موبایل: 09123456789
- رمز عبور: admin123

## API Endpoints

| متد | آدرس | توضیح |
|------|------|--------|
| POST | /api/v1/auth/register | ثبت‌نام |
| POST | /api/v1/auth/login | ورود |
| GET | /api/v1/venues | لیست سالن‌ها |
| POST | /api/v1/bookings | رزرو سانس |
| POST | /api/v1/competitions/start | شروع رقابت قیمت |
| POST | /api/v1/contracts | ایجاد قرارداد بلندمدت |

## ساختار پروژه

`
backend/                 # بک‌اند FastAPI
├── app/
│   ├── models/         # مدل‌های دیتابیس
│   ├── repositories/   # لایه دسترسی به داده
│   ├── services/       # لایه بیزینس
│   ├── api/v1/         # API routes
│   └── schemas/        # Pydantic models
└── requirements.txt

frontend/               # فرانت‌اند React + Tauri
├── src/
├── package.json
└── vite.config.ts
`
