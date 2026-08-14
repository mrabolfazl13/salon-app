# Futsal Booking System - نسخه پایدار (v1.0.0)

سیستم هوشمند رزرو سالن فوتسال با قابلیت رقابت قیمت و قراردادهای بلندمدت

## 🚀 شروع سریع

### پیش‌نیازها
- Docker و Docker Compose
- Node.js 18+ (برای توسعه فرانت‌اند)

### راه‌اندازی سریع

```bash
# 1. کپی فایل محیط
cp .env.example .env

# 2. شروع سرویس‌ها
docker-compose up -d

# 3. راه‌اندازی دیتابیس
cd backend
pip install -r requirements.txt
cd scripts
python setup_db.py --action setup

# 4. شروع سرور بک‌اند
cd ..
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. شروع فرانت‌اند (در ترمینال جداگانه)
cd ../frontend
npm install
npm run dev
```

## 🔑 اطلاعات ورود پیش‌فرض

### مدیر سیستم (Super Admin)
- **شماره تلفن**: 09123456789
- **رمز عبور**: admin123

### مدیر سالن نمونه (Venue Manager)
- **شماره تلفن**: 09111111111
- **رمز عبور**: manager123

## 📋 API Endpoints

### احراز هویت
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | ثبت‌نام کاربر | Public |
| POST | `/auth/login` | ورود کاربر | Public |
| GET | `/auth/me` | اطلاعات کاربر فعلی | JWT |

### سالن‌ها
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/venues` | ایجاد سالن جدید | Manager |
| GET | `/venues` | لیست سالن‌ها | Public |
| GET | `/venues/my-venues` | سالن‌های مدیر | Manager |
| PUT | `/venues/{id}` | ویرایش سالن | Manager |
| POST | `/venues/{id}/verify` | تایید سالن | Admin |
| POST | `/venues/{id}/prices` | قیمت‌گذاری | Manager |
| GET | `/venues/{id}/prices` | دریافت قیمت‌ها | Manager |

### سانس‌ها
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/slots/venue/{id}` | سانس‌های یک سالن | JWT |
| GET | `/slots/venue/{id}/available` | سانس‌های آزاد | JWT |
| POST | `/slots/venue/{id}/generate` | تولید سانس | Manager |
| GET | `/slots/venue/{id}/range` | سانس‌ها برای بازه تاریخ | JWT |

### رزروها
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/bookings` | ایجاد رزرو | JWT |
| GET | `/bookings/my-bookings` | رزروهای کاربر | JWT |
| GET | `/bookings/{id}` | جزئیات رزرو | JWT |

## 🏗️ معماری پروژه

```
futsal-booking-system/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # API Routes
│   │   ├── models/            # SQLModel Models
│   │   ├── repositories/      # Data Repositories
│   │   ├── schemas/           # Pydantic Schemas
│   │   ├── services/          # Business Logic
│   │   ├── utils/             # Utilities
│   │   └── database.py        # Database Config
│   ├── requirements.txt       # Python Dependencies
│   └── Dockerfile
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/               # API Client
│   │   ├── components/        # React Components
│   │   ├── pages/             # Page Components
│   │   ├── services/          # API Services
│   │   ├── store/             # Zustand Stores
│   │   ├── types/             # TypeScript Types
│   │   └── lib/               # Utilities
│   └── package.json
├── scripts/                    # Utility Scripts
│   └── setup_db.py            # Database Setup
├── docker-compose.yml          # Docker Configuration
└── .env                        # Environment Variables
```

## 🔧 دستورات مفید

### راه‌اندازی دیتابیس
```bash
cd scripts
python setup_db.py --action setup          # راه‌اندازی کامل
python setup_db.py --action create-admin   # ایجاد مدیر
python setup_db.py --action create-sample  # ایجاد داده نمونه
python setup_db.py --action drop           # حذف تمام جداول
```

### Docker Commands
```bash
# شروع سرویس‌ها
docker-compose up -d

# توقف سرویس‌ها
docker-compose down

# مشاهده لاگ‌ها
docker-compose logs -f

# ریست کامل
docker-compose down -v
docker-compose up -d
```

## 📱 ویژگی‌های اصلی

- ✅ سیستم احراز هویت با JWT
- ✅ ثبت‌نام و ورود با شماره موبایل
- ✅ مدیریت سالن‌ها (ایجاد، ویرایش، تایید)
- ✅ تولید و مدیریت سانس‌ها
- ✅ سیستم رزرو آنلاین
- ✅ قیمت‌گذاری پویا
- ✅ سیستم رقابت قیمت
- ✅ قراردادهای بلندمدت
- ✅ داشبورد مدیر سالن
- ✅ داشبورد مدیر سیستم
- ✅ طراحی ریسپانسیو

## 🌐 آدرس‌ها

- **فرانت‌اند**: http://localhost:3000
- **بک‌اند API**: http://localhost:8000/api/v1
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc Docs**: http://localhost:8000/redoc

## 📝 لایسنس

MIT