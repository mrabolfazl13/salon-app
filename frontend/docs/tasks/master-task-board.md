---
title: تابلوی اصلی وظایف (Master Task Board)
description: نمای جامع تمام وظایف پروژه سیستم رزرو سالن فوتسال
version: 1.0
date: 2026-10-08
status: Draft
---

# تابلوی اصلی وظایف - سیستم رزرو سالن فوتسال

## راهنما

این سند شامل تمام وظایف چهار تیم Backend، Frontend، Android و QA در تمام فازهای پروژه است.

**ستون‌ها:**
- **ID:** شناسه منحصر به فرد وظیفه
- **عنوان وظیفه:** شرح مختصر کار
- **تیم:** تیم مسئول (Backend/Frontend/Android/QA)
- **فاز:** فاز پروژه (Phase 0 تا Phase 6)
- **اولویت:** P0 (بحرانی)، P1 (بالا)، P2 (متوسط)، P3 (پایین)
- **وابستگی‌ها:** وظایفی که باید قبل از این تکمیل شوند
- **مسدودکننده:** وظایفی که این کار آن‌ها را بلوکه می‌کند
- **وضعیت:** Todo / In Progress / Done
- **مالک:** شخص یا تیم مسئول
- **تلاش تخمینی:** S (کوچک)، M (متوسط)، L (بزرگ)، XL (خیلی بزرگ)

---

## Phase 0 - زیرساخت و آماده‌سازی

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-001 | راه‌اندازی پروژه Node.js با TypeScript | Backend | Phase 0 | P0 | - | - | Todo | Backend Lead | M |
| BE-002 | پیکربندی ESLint و Prettier | Backend | Phase 0 | P1 | BE-001 | - | Todo | Backend Dev | S |
| BE-003 | راه‌اندازی PostgreSQL و Docker Compose | Backend | Phase 0 | P0 | - | - | Todo | Backend Dev | M |
| BE-004 | پیکربندی TypeORM و migrations | Backend | Phase 0 | P0 | BE-003 | - | Todo | Backend Dev | M |
| BE-005 | طراحی ساختار پوشه‌ها و معماری لایه‌ای | Backend | Phase 0 | P1 | BE-001 | - | Todo | Backend Lead | S |
| BE-006 | راه‌اندازی سیستم لاگینگ (Winston) | Backend | Phase 0 | P2 | BE-001 | - | Todo | Backend Dev | S |
| BE-007 | پیکربندی متغیرهای محیطی (.env) | Backend | Phase 0 | P1 | BE-001 | - | Todo | Backend Dev | S |
| BE-008 | راه‌اندازی Jest برای تست واحد | Backend | Phase 0 | P1 | BE-001 | - | Todo | Backend Dev | M |
| BE-009 | ایجاد CI/CD Pipeline اولیه | Backend | Phase 0 | P1 | BE-001, BE-008 | - | Todo | DevOps | M |
| BE-010 | مستندات API با Swagger/OpenAPI | Backend | Phase 0 | P2 | BE-001 | - | Todo | Backend Dev | S |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-001 | راه‌اندازی پروژه React با Vite | Frontend | Phase 0 | P0 | - | - | Todo | Frontend Lead | M |
| FE-002 | پیکربندی TypeScript و ESLint | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | S |
| FE-003 | نصب و پیکربندی Tailwind CSS | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | S |
| FE-004 | راه‌اندازی React Router v6 | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | S |
| FE-005 | پیکربندی Zustand برای State Management | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | S |
| FE-006 | راه‌اندازی TanStack Query | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | S |
| FE-007 | ایجاد ساختار کامپوننت‌های پایه | Frontend | Phase 0 | P2 | FE-001 | - | Todo | Frontend Dev | M |
| FE-008 | پیکربندی React Hook Form + Zod | Frontend | Phase 0 | P2 | FE-001 | - | Todo | Frontend Dev | S |
| FE-009 | راه‌اندازی Vitest و React Testing Library | Frontend | Phase 0 | P1 | FE-001 | - | Todo | Frontend Dev | M |
| FE-010 | پیکربندی Storybook برای UI Components | Frontend | Phase 0 | P2 | FE-001 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-001 | راه‌اندازی پروژه Flutter | Android | Phase 0 | P0 | - | - | Todo | Android Lead | M |
| AN-002 | پیکربندی lints و code formatting | Android | Phase 0 | P1 | AN-001 | - | Todo | Android Dev | S |
| AN-003 | راه‌اندازی Riverpod برای State Management | Android | Phase 0 | P1 | AN-001 | - | Todo | Android Dev | M |
| AN-004 | پیکربندی Dio برای HTTP Client | Android | Phase 0 | P1 | AN-001 | - | Todo | Android Dev | S |
| AN-005 | راه‌اندازی Go Router برای Navigation | Android | Phase 0 | P1 | AN-001 | - | Todo | Android Dev | S |
| AN-006 | پیکربندی Hive برای Local Storage | Android | Phase 0 | P2 | AN-001 | - | Todo | Android Dev | S |
| AN-007 | راه‌اندازی Flutter Test و Integration Test | Android | Phase 0 | P1 | AN-001 | - | Todo | Android Dev | M |
| AN-008 | ایجاد تم و Design Tokens اولیه | Android | Phase 0 | P2 | AN-001 | - | Todo | Android Dev | M |
| AN-009 | پیکربندی Flavorها (dev/staging/prod) | Android | Phase 0 | P2 | AN-001 | - | Todo | Android Dev | S |
| AN-010 | راه‌اندازی CI/CD برای Android | Android | Phase 0 | P1 | AN-001 | - | Todo | DevOps | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-001 | انتخاب فریمورک تست E2E (Playwright/Cypress) | QA | Phase 0 | P1 | - | - | Todo | QA Lead | S |
| QA-002 | راه‌اندازی محیط تست ایزوله | QA | Phase 0 | P1 | QA-001 | - | Todo | QA Dev | M |
| QA-003 | طراحی استراتژی تست کلی | QA | Phase 0 | P1 | - | - | Todo | QA Lead | M |
| QA-004 | ایجاد قالب‌های تست کیس | QA | Phase 0 | P2 | QA-003 | - | Todo | QA Dev | S |
| QA-005 | پیکربندی گزارش‌دهی تست | QA | Phase 0 | P2 | QA-001 | - | Todo | QA Dev | S |
| QA-006 | یکپارچه‌سازی تست با CI/CD | QA | Phase 0 | P1 | QA-001, QA-002 | - | Todo | QA Dev | M |
| QA-007 | مستندات استانداردهای تست | QA | Phase 0 | P2 | QA-003 | - | Todo | QA Lead | S |
| QA-008 | راه‌اندازی ابزار Coverage Analysis | QA | Phase 0 | P2 | QA-001 | - | Todo | QA Dev | S |

---

## Phase 1 - احراز هویت و مدیریت کاربران

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-011 | طراحی مدل User و Role | Backend | Phase 1 | P0 | BE-004 | - | Todo | Backend Dev | M |
| BE-012 | پیاده‌سازی Registration Endpoint | Backend | Phase 1 | P0 | BE-011, SP-001 | - | Todo | Backend Dev | M |
| BE-013 | پیاده‌سازی Login با JWT | Backend | Phase 1 | P0 | BE-011, SP-001 | - | Todo | Backend Dev | M |
| BE-014 | پیاده‌سازی Refresh Token | Backend | Phase 1 | P1 | BE-013 | - | Todo | Backend Dev | M |
| BE-015 | پیاده‌سازی Logout و Blacklist Token | Backend | Phase 1 | P1 | BE-013 | - | Todo | Backend Dev | S |
| BE-016 | Middleware احراز هویت JWT | Backend | Phase 1 | P0 | BE-013 | - | Todo | Backend Dev | M |
| BE-017 | Middleware بررسی نقش‌ها (RBAC) | Backend | Phase 1 | P1 | BE-016 | - | Todo | Backend Dev | M |
| BE-018 | Endpoint بازیابی رمز عبور | Backend | Phase 1 | P2 | BE-011 | - | Todo | Backend Dev | M |
| BE-019 | Endpoint تغییر رمز عبور | Backend | Phase 1 | P2 | BE-016 | - | Todo | Backend Dev | S |
| BE-020 | Endpoint دریافت پروفایل کاربر | Backend | Phase 1 | P1 | BE-016 | - | Todo | Backend Dev | S |
| BE-021 | Endpoint به‌روزرسانی پروفایل | Backend | Phase 1 | P1 | BE-016 | - | Todo | Backend Dev | S |
| BE-022 | آپلود آواتار کاربر | Backend | Phase 1 | P2 | BE-016 | - | Todo | Backend Dev | M |
| BE-023 | Validation ورودی‌ها با Class Validator | Backend | Phase 1 | P1 | BE-012 | - | Todo | Backend Dev | S |
| BE-024 | Rate Limiting برای اندپوینت‌های Auth | Backend | Phase 1 | P1 | BE-012 | - | Todo | Backend Dev | S |
| BE-025 | تست واحد سرویس‌های Auth | Backend | Phase 1 | P1 | BE-012, BE-013 | - | Todo | Backend Dev | M |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-011 | طراحی صفحه Login | Frontend | Phase 1 | P0 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-012 | پیاده‌سازی فرم Login | Frontend | Phase 1 | P0 | FE-011 | - | Todo | Frontend Dev | M |
| FE-013 | طراحی صفحه Register | Frontend | Phase 1 | P0 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-014 | پیاده‌سازی فرم Register | Frontend | Phase 1 | P0 | FE-013 | - | Todo | Frontend Dev | M |
| FE-015 | پیاده‌سازی API Call برای Login | Frontend | Phase 1 | P0 | FE-012, SP-001 | - | Todo | Frontend Dev | S |
| FE-016 | پیاده‌سازی API Call برای Register | Frontend | Phase 1 | P0 | FE-014, SP-001 | - | Todo | Frontend Dev | S |
| FE-017 | ذخیره‌سازی Token در HttpOnly Cookie | Frontend | Phase 1 | P0 | FE-015 | - | Todo | Frontend Dev | S |
| FE-018 | Protected Routes Implementation | Frontend | Phase 1 | P0 | FE-017 | - | Todo | Frontend Dev | M |
| FE-019 | صفحه Forgot Password | Frontend | Phase 1 | P2 | FE-007 | - | Todo | Frontend Dev | M |
| FE-020 | صفحه Reset Password | Frontend | Phase 1 | P2 | FE-019 | - | Todo | Frontend Dev | M |
| FE-021 | صفحه پروفایل کاربر | Frontend | Phase 1 | P1 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-022 | فرم ویرایش پروفایل | Frontend | Phase 1 | P1 | FE-021 | - | Todo | Frontend Dev | M |
| FE-023 | آپلود آواتار با Preview | Frontend | Phase 1 | P2 | FE-022 | - | Todo | Frontend Dev | M |
| FE-024 | نمایش خطاهای Validation | Frontend | Phase 1 | P1 | FE-012, FE-014 | - | Todo | Frontend Dev | S |
| FE-025 | تست کامپوننت‌های Auth | Frontend | Phase 1 | P1 | FE-012, FE-014 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-011 | طراحی صفحه Login | Android | Phase 1 | P0 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-012 | پیاده‌سازی فرم Login | Android | Phase 1 | P0 | AN-011 | - | Todo | Android Dev | M |
| AN-013 | طراحی صفحه Register | Android | Phase 1 | P0 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-014 | پیاده‌سازی فرم Register | Android | Phase 1 | P0 | AN-013 | - | Todo | Android Dev | M |
| AN-015 | پیاده‌سازی API Service برای Auth | Android | Phase 1 | P0 | AN-004, SP-001 | - | Todo | Android Dev | M |
| AN-016 | مدیریت Token با Secure Storage | Android | Phase 1 | P0 | AN-015 | - | Todo | Android Dev | M |
| AN-017 | Route Guard برای صفحات محافظت شده | Android | Phase 1 | P0 | AN-016 | - | Todo | Android Dev | M |
| AN-018 | صفحه Forgot Password | Android | Phase 1 | P2 | AN-008 | - | Todo | Android Dev | M |
| AN-019 | صفحه پروفایل کاربر | Android | Phase 1 | P1 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-020 | فرم ویرایش پروفایل | Android | Phase 1 | P1 | AN-019 | - | Todo | Android Dev | M |
| AN-021 | آپلود آواتار با Image Picker | Android | Phase 1 | P2 | AN-020 | - | Todo | Android Dev | M |
| AN-022 | اعتبارسنجی فرم‌ها | Android | Phase 1 | P1 | AN-012, AN-014 | - | Todo | Android Dev | S |
| AN-023 | مدیریت خطاهای شبکه | Android | Phase 1 | P1 | AN-015 | - | Todo | Android Dev | M |
| AN-024 | تست ویجت‌های Auth | Android | Phase 1 | P1 | AN-012, AN-014 | - | Todo | Android Dev | M |
| AN-025 | تست Integration Flow Auth | Android | Phase 1 | P1 | AN-015, AN-017 | - | Todo | Android Dev | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-009 | نوشتن تست کیس‌های Login | QA | Phase 1 | P1 | QA-004, SP-001 | - | Todo | QA Dev | M |
| QA-010 | نوشتن تست کیس‌های Register | QA | Phase 1 | P1 | QA-004, SP-001 | - | Todo | QA Dev | M |
| QA-011 | تست E2E جریان احراز هویت وب | QA | Phase 1 | P1 | QA-002, FE-015 | - | Todo | QA Dev | M |
| QA-012 | تست E2E جریان احراز هویت موبایل | QA | Phase 1 | P1 | QA-002, AN-015 | - | Todo | QA Dev | M |
| QA-013 | تست امنیت JWT Token | QA | Phase 1 | P1 | BE-013 | - | Todo | QA Dev | M |
| QA-014 | تست Rate Limiting | QA | Phase 1 | P2 | BE-024 | - | Todo | QA Dev | S |
| QA-015 | تست Recovery Password Flow | QA | Phase 1 | P2 | BE-018 | - | Todo | QA Dev | M |
| QA-016 | تست Performance اندپوینت‌های Auth | QA | Phase 1 | P2 | BE-012, BE-013 | - | Todo | QA Dev | M |

---

## Phase 2 - مدیریت سالن‌ها و امکانات

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-026 | طراحی مدل Salon و Facility | Backend | Phase 2 | P0 | BE-004, SP-002 | - | Todo | Backend Dev | M |
| BE-027 | Migration جداول Salons و Facilities | Backend | Phase 2 | P0 | BE-026 | - | Todo | Backend Dev | M |
| BE-028 | CRUD Endpoints برای Salons | Backend | Phase 2 | P0 | BE-027, SP-001 | - | Todo | Backend Dev | L |
| BE-029 | CRUD Endpoints برای Facilities | Backend | Phase 2 | P1 | BE-027, SP-001 | - | Todo | Backend Dev | L |
| BE-030 | Endpoint جستجوی سالن‌ها با فیلتر | Backend | Phase 2 | P1 | BE-028 | - | Todo | Backend Dev | M |
| BE-031 | آپلود تصاویر سالن | Backend | Phase 2 | P1 | BE-028 | - | Todo | Backend Dev | M |
| BE-032 | Geolocation و محاسبه فاصله | Backend | Phase 2 | P2 | BE-028 | - | Todo | Backend Dev | M |
| BE-033 | Pagination و Sorting برای لیست سالن‌ها | Backend | Phase 2 | P1 | BE-030 | - | Todo | Backend Dev | S |
| BE-034 | Cache نتایج جستجو با Redis | Backend | Phase 2 | P2 | BE-030 | - | Todo | Backend Dev | M |
| BE-035 | تست واحد سرویس‌های Salon | Backend | Phase 2 | P1 | BE-028, BE-029 | - | Todo | Backend Dev | M |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-026 | طراحی صفحه لیست سالن‌ها | Frontend | Phase 2 | P0 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-027 | پیاده‌سازی کارت سالن | Frontend | Phase 2 | P0 | FE-026 | - | Todo | Frontend Dev | M |
| FE-028 | فیلتر و جستجوی سالن‌ها | Frontend | Phase 2 | P1 | FE-026 | - | Todo | Frontend Dev | M |
| FE-029 | صفحه جزئیات سالن | Frontend | Phase 2 | P0 | FE-026, SP-001 | - | Todo | Frontend Dev | L |
| FE-030 | گالری تصاویر سالن | Frontend | Phase 2 | P1 | FE-029 | - | Todo | Frontend Dev | M |
| FE-031 | نمایش امکانات سالن | Frontend | Phase 2 | P1 | FE-029 | - | Todo | Frontend Dev | S |
| FE-032 | نقشه موقعیت سالن | Frontend | Phase 2 | P2 | FE-029 | - | Todo | Frontend Dev | M |
| FE-033 | Infinite Scroll برای لیست سالن‌ها | Frontend | Phase 2 | P2 | FE-026 | - | Todo | Frontend Dev | M |
| FE-034 | تست کامپوننت‌های Salon | Frontend | Phase 2 | P1 | FE-027, FE-029 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-026 | طراحی صفحه لیست سالن‌ها | Android | Phase 2 | P0 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-027 | پیاده‌سازی کارت سالن | Android | Phase 2 | P0 | AN-026 | - | Todo | Android Dev | M |
| AN-028 | فیلتر و جستجوی سالن‌ها | Android | Phase 2 | P1 | AN-026 | - | Todo | Android Dev | M |
| AN-029 | صفحه جزئیات سالن | Android | Phase 2 | P0 | AN-026, SP-001 | - | Todo | Android Dev | L |
| AN-030 | گالری تصاویر با Swipe | Android | Phase 2 | P1 | AN-029 | - | Todo | Android Dev | M |
| AN-031 | نمایش امکانات سالن | Android | Phase 2 | P1 | AN-029 | - | Todo | Android Dev | S |
| AN-032 | نقشه با Google Maps Flutter | Android | Phase 2 | P2 | AN-029 | - | Todo | Android Dev | M |
| AN-033 | Pull to Refresh لیست سالن‌ها | Android | Phase 2 | P2 | AN-026 | - | Todo | Android Dev | S |
| AN-034 | تست ویجت‌های Salon | Android | Phase 2 | P1 | AN-027, AN-029 | - | Todo | Android Dev | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-017 | تست کیس‌های CRUD سالن | QA | Phase 2 | P1 | QA-004, SP-002 | - | Todo | QA Dev | M |
| QA-018 | تست کیس‌های جستجو و فیلتر | QA | Phase 2 | P1 | QA-004, BE-030 | - | Todo | QA Dev | M |
| QA-019 | تست E2E مرور سالن‌ها وب | QA | Phase 2 | P1 | QA-002, FE-029 | - | Todo | QA Dev | M |
| QA-020 | تست E2E مرور سالن‌ها موبایل | QA | Phase 2 | P1 | QA-002, AN-029 | - | Todo | QA Dev | M |
| QA-021 | تست Performance جستجو | QA | Phase 2 | P2 | BE-030, BE-034 | - | Todo | QA Dev | M |
| QA-022 | تست آپلود تصاویر | QA | Phase 2 | P2 | BE-031 | - | Todo | QA Dev | S |

---

## Phase 3 - سیستم رزرو و زمان‌بندی

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-036 | طراحی مدل Booking و TimeSlot | Backend | Phase 3 | P0 | BE-004, SP-002 | - | Todo | Backend Dev | L |
| BE-037 | Migration جداول Bookings و TimeSlots | Backend | Phase 3 | P0 | BE-036 | - | Todo | Backend Dev | M |
| BE-038 | الگوریتم بررسی تداخل زمانی | Backend | Phase 3 | P0 | BE-036 | - | Todo | Backend Dev | L |
| BE-039 | Endpoint ایجاد رزرو جدید | Backend | Phase 3 | P0 | BE-038, SP-001 | - | Todo | Backend Dev | L |
| BE-040 | Endpoint لغو رزرو | Backend | Phase 3 | P1 | BE-039 | - | Todo | Backend Dev | M |
| BE-041 | Endpoint دریافت رزروهای کاربر | Backend | Phase 3 | P1 | BE-039 | - | Todo | Backend Dev | M |
| BE-042 | Endpoint دریافت زمان‌های خالی | Backend | Phase 3 | P0 | BE-038, SP-001 | - | Todo | Backend Dev | L |
| BE-043 | Transaction Management برای رزرو | Backend | Phase 3 | P0 | BE-039 | - | Todo | Backend Dev | M |
| BE-044 | Queue Processing برای رزروهای همزمان | Backend | Phase 3 | P1 | BE-039 | - | Todo | Backend Dev | L |
| BE-045 | تست واحد منطق رزرو | Backend | Phase 3 | P1 | BE-039, BE-042 | - | Todo | Backend Dev | XL |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-035 | طراحی صفحه انتخاب زمان | Frontend | Phase 3 | P0 | FE-007, SP-001 | - | Todo | Frontend Dev | L |
| FE-036 | تقویم تعاملی برای انتخاب تاریخ | Frontend | Phase 3 | P0 | FE-035 | - | Todo | Frontend Dev | M |
| FE-037 | نمایش Time Slot‌های موجود | Frontend | Phase 3 | P0 | FE-035, SP-001 | - | Todo | Frontend Dev | M |
| FE-038 | فرم تأیید رزرو | Frontend | Phase 3 | P0 | FE-035, SP-001 | - | Todo | Frontend Dev | M |
| FE-039 | پیاده‌سازی API Call برای رزرو | Frontend | Phase 3 | P0 | FE-038, SP-001 | - | Todo | Frontend Dev | S |
| FE-040 | صفحه لیست رزروهای من | Frontend | Phase 3 | P1 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-041 | جزئیات رزرو و امکان لغو | Frontend | Phase 3 | P1 | FE-040 | - | Todo | Frontend Dev | M |
| FE-042 | نمایش وضعیت رزرو (Pending/Confirmed) | Frontend | Phase 3 | P1 | FE-040 | - | Todo | Frontend Dev | S |
| FE-043 | تست کامپوننت‌های Booking | Frontend | Phase 3 | P1 | FE-035, FE-038 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-035 | طراحی صفحه انتخاب زمان | Android | Phase 3 | P0 | AN-008, SP-001 | - | Todo | Android Dev | L |
| AN-036 | تقویم تعاملی برای انتخاب تاریخ | Android | Phase 3 | P0 | AN-035 | - | Todo | Android Dev | M |
| AN-037 | نمایش Time Slot‌های موجود | Android | Phase 3 | P0 | AN-035, SP-001 | - | Todo | Android Dev | M |
| AN-038 | فرم تأیید رزرو | Android | Phase 3 | P0 | AN-035, SP-001 | - | Todo | Android Dev | M |
| AN-039 | پیاده‌سازی API Call برای رزرو | Android | Phase 3 | P0 | AN-038, SP-001 | - | Todo | Android Dev | S |
| AN-040 | صفحه لیست رزروهای من | Android | Phase 3 | P1 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-041 | جزئیات رزرو و امکان لغو | Android | Phase 3 | P1 | AN-040 | - | Todo | Android Dev | M |
| AN-042 | نمایش وضعیت رزرو | Android | Phase 3 | P1 | AN-040 | - | Todo | Android Dev | S |
| AN-043 | تست ویجت‌های Booking | Android | Phase 3 | P1 | AN-035, AN-038 | - | Todo | Android Dev | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-023 | تست کیس‌های ایجاد رزرو | QA | Phase 3 | P0 | QA-004, SP-002 | - | Todo | QA Dev | L |
| QA-024 | تست کیس‌های تداخل زمانی | QA | Phase 3 | P0 | QA-004, BE-038 | - | Todo | QA Dev | XL |
| QA-025 | تست E2E جریان کامل رزرو وب | QA | Phase 3 | P0 | QA-002, FE-039, SP-003 | - | Todo | QA Dev | XL |
| QA-026 | تست E2E جریان کامل رزرو موبایل | QA | Phase 3 | P0 | QA-002, AN-039, SP-003 | - | Todo | QA Dev | XL |
| QA-027 | تست Race Conditions در رزرو | QA | Phase 3 | P1 | BE-044 | - | Todo | QA Dev | XL |
| QA-028 | تست لغو رزرو | QA | Phase 3 | P1 | BE-040 | - | Todo | QA Dev | M |
| QA-029 | تست Performance زمان‌های اوج | QA | Phase 3 | P2 | BE-039 | - | Todo | QA Dev | L |

---

## Phase 4 - سیستم پرداخت

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-046 | طراحی مدل Payment و Invoice | Backend | Phase 4 | P0 | BE-004, SP-002 | - | Todo | Backend Dev | M |
| BE-047 | Migration جداول Payments و Invoices | Backend | Phase 4 | P0 | BE-046 | - | Todo | Backend Dev | M |
| BE-048 | یکپارچه‌سازی با درگاه پرداخت | Backend | Phase 4 | P0 | BE-046, SP-001 | - | Todo | Backend Dev | XL |
| BE-049 | Webhook دریافت نتیجه پرداخت | Backend | Phase 4 | P0 | BE-048 | - | Todo | Backend Dev | L |
| BE-050 | Endpoint ایجاد درخواست پرداخت | Backend | Phase 4 | P0 | BE-048, SP-001 | - | Todo | Backend Dev | M |
| BE-051 | Endpoint دریافت فاکتورها | Backend | Phase 4 | P1 | BE-046 | - | Todo | Backend Dev | M |
| BE-052 | Endpoint بازپرداخت (Refund) | Backend | Phase 4 | P2 | BE-048 | - | Todo | Backend Dev | M |
| BE-053 | Encryption داده‌های حساس پرداخت | Backend | Phase 4 | P0 | BE-048 | - | Todo | Backend Dev | M |
| BE-054 | Audit Log برای تراکنش‌ها | Backend | Phase 4 | P1 | BE-048 | - | Todo | Backend Dev | S |
| BE-055 | تست واحد سرویس‌های Payment | Backend | Phase 4 | P1 | BE-048, BE-050 | - | Todo | Backend Dev | L |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-044 | طراحی صفحه پرداخت | Frontend | Phase 4 | P0 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-045 | یکپارچه‌سازی با درگاه پرداخت | Frontend | Phase 4 | P0 | FE-044, SP-001 | - | Todo | Frontend Dev | L |
| FE-046 | نمایش وضعیت پرداخت | Frontend | Phase 4 | P0 | FE-045 | - | Todo | Frontend Dev | S |
| FE-047 | صفحه لیست فاکتورها | Frontend | Phase 4 | P1 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-048 | جزئیات فاکتور | Frontend | Phase 4 | P1 | FE-047 | - | Todo | Frontend Dev | S |
| FE-049 | دانلود PDF فاکتور | Frontend | Phase 4 | P2 | FE-048 | - | Todo | Frontend Dev | M |
| FE-050 | تست کامپوننت‌های Payment | Frontend | Phase 4 | P1 | FE-044, FE-045 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-044 | طراحی صفحه پرداخت | Android | Phase 4 | P0 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-045 | یکپارچه‌سازی با درگاه پرداخت | Android | Phase 4 | P0 | AN-044, SP-001 | - | Todo | Android Dev | L |
| AN-046 | نمایش وضعیت پرداخت | Android | Phase 4 | P0 | AN-045 | - | Todo | Android Dev | S |
| AN-047 | صفحه لیست فاکتورها | Android | Phase 4 | P1 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-048 | جزئیات فاکتور | Android | Phase 4 | P1 | AN-047 | - | Todo | Android Dev | S |
| AN-049 | اشتراک‌گذاری فاکتور | Android | Phase 4 | P2 | AN-048 | - | Todo | Android Dev | M |
| AN-050 | تست ویجت‌های Payment | Android | Phase 4 | P1 | AN-044, AN-045 | - | Todo | Android Dev | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-030 | تست کیس‌های پرداخت موفق | QA | Phase 4 | P0 | QA-004, BE-048 | - | Todo | QA Dev | L |
| QA-031 | تست کیس‌های پرداخت ناموفق | QA | Phase 4 | P0 | QA-004, BE-048 | - | Todo | QA Dev | L |
| QA-032 | تست Webhook پرداخت | QA | Phase 4 | P0 | BE-049 | - | Todo | QA Dev | M |
| QA-033 | تست E2E جریان پرداخت وب | QA | Phase 4 | P0 | QA-002, FE-045 | - | Todo | QA Dev | L |
| QA-034 | تست E2E جریان پرداخت موبایل | QA | Phase 4 | P0 | QA-002, AN-045 | - | Todo | QA Dev | L |
| QA-035 | تست Security داده‌های پرداخت | QA | Phase 4 | P0 | BE-053 | - | Todo | QA Dev | M |
| QA-036 | تست Refund | QA | Phase 4 | P2 | BE-052 | - | Todo | QA Dev | M |

---

## Phase 5 - سیستم اعلان‌ها و ارتباطات

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-056 | طراحی مدل Notification | Backend | Phase 5 | P0 | BE-004, SP-002 | - | Todo | Backend Dev | M |
| BE-057 | Migration جدول Notifications | Backend | Phase 5 | P0 | BE-056 | - | Todo | Backend Dev | S |
| BE-058 | یکپارچه‌سازی Firebase Cloud Messaging | Backend | Phase 5 | P0 | BE-056 | - | Todo | Backend Dev | L |
| BE-059 | Endpoint ارسال Push Notification | Backend | Phase 5 | P1 | BE-058, SP-001 | - | Todo | Backend Dev | M |
| BE-060 | Endpoint دریافت اعلان‌های کاربر | Backend | Phase 5 | P1 | BE-056, SP-001 | - | Todo | Backend Dev | M |
| BE-061 | Endpoint علامت‌گذاری اعلان به عنوان خوانده شده | Backend | Phase 5 | P2 | BE-060 | - | Todo | Backend Dev | S |
| BE-062 | Email Notifications با SendGrid/Nodemailer | Backend | Phase 5 | P1 | BE-056 | - | Todo | Backend Dev | M |
| BE-063 | SMS Notifications با سرویس پیامک | Backend | Phase 5 | P2 | BE-056 | - | Todo | Backend Dev | M |
| BE-064 | Template Engine برای اعلان‌ها | Backend | Phase 5 | P1 | BE-056 | - | Todo | Backend Dev | M |
| BE-065 | تست واحد سرویس‌های Notification | Backend | Phase 5 | P1 | BE-058, BE-059 | - | Todo | Backend Dev | M |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-051 | طراحی صفحه اعلان‌ها | Frontend | Phase 5 | P1 | FE-007, SP-001 | - | Todo | Frontend Dev | M |
| FE-052 | نمایش Badge تعداد اعلان‌های جدید | Frontend | Phase 5 | P1 | FE-051 | - | Todo | Frontend Dev | S |
| FE-053 | لیست اعلان‌ها با Pagination | Frontend | Phase 5 | P1 | FE-051, SP-001 | - | Todo | Frontend Dev | M |
| FE-054 | علامت‌گذاری اعلان به عنوان خوانده شده | Frontend | Phase 5 | P2 | FE-053 | - | Todo | Frontend Dev | S |
| FE-055 | تنظیمات اعلان‌ها | Frontend | Phase 5 | P2 | FE-007 | - | Todo | Frontend Dev | S |
| FE-056 | تست کامپوننت‌های Notification | Frontend | Phase 5 | P1 | FE-051, FE-053 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-051 | پیکربندی Firebase Cloud Messaging | Android | Phase 5 | P0 | AN-001, BE-058 | - | Todo | Android Dev | M |
| AN-052 | دریافت و نمایش Push Notification | Android | Phase 5 | P0 | AN-051 | - | Todo | Android Dev | M |
| AN-053 | طراحی صفحه اعلان‌ها | Android | Phase 5 | P1 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-054 | نمایش Badge تعداد اعلان‌های جدید | Android | Phase 5 | P1 | AN-053 | - | Todo | Android Dev | S |
| AN-055 | لیست اعلان‌ها با Pagination | Android | Phase 5 | P1 | AN-053, SP-001 | - | Todo | Android Dev | M |
| AN-056 | علامت‌گذاری اعلان به عنوان خوانده شده | Android | Phase 5 | P2 | AN-055 | - | Todo | Android Dev | S |
| AN-057 | تنظیمات اعلان‌ها | Android | Phase 5 | P2 | AN-008 | - | Todo | Android Dev | S |
| AN-058 | تست ویجت‌های Notification | Android | Phase 5 | P1 | AN-053, AN-055 | - | Todo | Android Dev | M |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-037 | تست کیس‌های Push Notification | QA | Phase 5 | P1 | QA-004, BE-058 | - | Todo | QA Dev | M |
| QA-038 | تست کیس‌های Email Notification | QA | Phase 5 | P1 | QA-004, BE-062 | - | Todo | QA Dev | M |
| QA-039 | تست E2E دریافت اعلان وب | QA | Phase 5 | P1 | QA-002, FE-053 | - | Todo | QA Dev | M |
| QA-040 | تست E2E دریافت اعلان موبایل | QA | Phase 5 | P1 | QA-002, AN-052 | - | Todo | QA Dev | M |
| QA-041 | تست SMS Notification | QA | Phase 5 | P2 | BE-063 | - | Todo | QA Dev | S |

---

## Phase 6 - داشبورد مدیریت و گزارش‌گیری

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-066 | طراحی مدل Admin Dashboard Data | Backend | Phase 6 | P1 | BE-004 | - | Todo | Backend Dev | M |
| BE-067 | Endpoint آمار کلی سیستم | Backend | Phase 6 | P1 | SP-001 | - | Todo | Backend Dev | M |
| BE-068 | Endpoint گزارش رزروها | Backend | Phase 6 | P1 | SP-001 | - | Todo | Backend Dev | M |
| BE-069 | Endpoint گزارش مالی | Backend | Phase 6 | P1 | SP-001 | - | Todo | Backend Dev | M |
| BE-070 | Endpoint مدیریت کاربران (Admin) | Backend | Phase 6 | P1 | SP-001 | - | Todo | Backend Dev | M |
| BE-071 | Endpoint مدیریت سالن‌ها (Admin) | Backend | Phase 6 | P1 | SP-001 | - | Todo | Backend Dev | M |
| BE-072 | Export داده‌ها به Excel/CSV | Backend | Phase 6 | P2 | BE-068, BE-069 | - | Todo | Backend Dev | M |
| BE-073 | Aggregate Queries بهینه‌سازی شده | Backend | Phase 6 | P1 | BE-067, BE-068 | - | Todo | Backend Dev | L |
| BE-074 | تست واحد سرویس‌های Dashboard | Backend | Phase 6 | P1 | BE-067, BE-068 | - | Todo | Backend Dev | M |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-057 | طراحی داشبورد Admin | Frontend | Phase 6 | P1 | FE-007, SP-001 | - | Todo | Frontend Dev | L |
| FE-058 | نمودارهای آماری با Chart.js | Frontend | Phase 6 | P1 | FE-057 | - | Todo | Frontend Dev | M |
| FE-059 | جدول گزارش رزروها | Frontend | Phase 6 | P1 | FE-057, SP-001 | - | Todo | Frontend Dev | M |
| FE-060 | جدول گزارش مالی | Frontend | Phase 6 | P1 | FE-057, SP-001 | - | Todo | Frontend Dev | M |
| FE-061 | صفحه مدیریت کاربران | Frontend | Phase 6 | P1 | FE-057, SP-001 | - | Todo | Frontend Dev | M |
| FE-062 | صفحه مدیریت سالن‌ها | Frontend | Phase 6 | P1 | FE-057, SP-001 | - | Todo | Frontend Dev | M |
| FE-063 | Export داده‌ها | Frontend | Phase 6 | P2 | FE-059, FE-060 | - | Todo | Frontend Dev | S |
| FE-064 | فیلترهای پیشرفته گزارش‌ها | Frontend | Phase 6 | P2 | FE-059, FE-060 | - | Todo | Frontend Dev | M |
| FE-065 | تست کامپوننت‌های Dashboard | Frontend | Phase 6 | P1 | FE-057, FE-058 | - | Todo | Frontend Dev | M |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-059 | طراحی داشبورد Admin ساده | Android | Phase 6 | P2 | AN-008, SP-001 | - | Todo | Android Dev | M |
| AN-060 | نمایش آمار کلی | Android | Phase 6 | P2 | AN-059, SP-001 | - | Todo | Android Dev | S |
| AN-061 | لیست گزارش رزروها | Android | Phase 6 | P2 | AN-059, SP-001 | - | Todo | Android Dev | M |
| AN-062 | لیست گزارش مالی | Android | Phase 6 | P2 | AN-059, SP-001 | - | Todo | Android Dev | M |
| AN-063 | تست ویجت‌های Dashboard | Android | Phase 6 | P2 | AN-059, AN-060 | - | Todo | Android Dev | S |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-042 | تست کیس‌های گزارش‌گیری | QA | Phase 6 | P1 | QA-004, BE-068, BE-069 | - | Todo | QA Dev | M |
| QA-043 | تست کیس‌های مدیریت Admin | QA | Phase 6 | P1 | QA-004, BE-070, BE-071 | - | Todo | QA Dev | M |
| QA-044 | تست E2E داشبورد وب | QA | Phase 6 | P1 | QA-002, FE-057 | - | Todo | QA Dev | M |
| QA-045 | تست Export داده‌ها | QA | Phase 6 | P2 | BE-072 | - | Todo | QA Dev | S |
| QA-046 | تست Performance گزارش‌های سنگین | QA | Phase 6 | P2 | BE-073 | - | Todo | QA Dev | M |

---

## وظایف مشترک و نهایی‌سازی

### Backend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| BE-075 | بهینه‌سازی Performance کلی | Backend | Phase 6 | P1 | تمام وظایف Backend | - | Todo | Backend Lead | XL |
| BE-076 | مستندات نهایی API | Backend | Phase 6 | P1 | تمام اندپوینت‌ها | - | Todo | Backend Dev | L |
| BE-077 | Security Audit و Penetration Test | Backend | Phase 6 | P0 | تمام فیچرها | - | Todo | Security Team | XL |
| BE-078 | آماده‌سازی Deployment Production | Backend | Phase 6 | P0 | SP-005 | - | Todo | DevOps | L |

### Frontend Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| FE-066 | بهینه‌سازی Performance وب | Frontend | Phase 6 | P1 | تمام وظایف Frontend | - | Todo | Frontend Lead | L |
| FE-067 | Accessibility Audit (WCAG) | Frontend | Phase 6 | P1 | تمام صفحات | - | Todo | Frontend Dev | M |
| FE-068 | SEO Optimization | Frontend | Phase 6 | P2 | تمام صفحات | - | Todo | Frontend Dev | M |
| FE-069 | آماده‌سازی Build Production | Frontend | Phase 6 | P0 | SP-005 | - | Todo | Frontend Lead | S |

### Android Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| AN-064 | بهینه‌سازی Performance اپ | Android | Phase 6 | P1 | تمام وظایف Android | - | Todo | Android Lead | L |
| AN-065 | تست سازگاری دستگاه‌های مختلف | Android | Phase 6 | P1 | تمام صفحات | - | Todo | Android Dev | L |
| AN-066 | آماده‌سازی APK/AAB Production | Android | Phase 6 | P0 | SP-005 | - | Todo | Android Lead | M |
| AN-067 | مستندات انتشار در Play Store | Android | Phase 6 | P2 | AN-066 | - | Todo | Android Lead | S |

### QA Tasks

| ID | عنوان وظیفه | تیم | فاز | اولویت | وابستگی‌ها | مسدودکننده | وضعیت | مالک | تلاش |
|----|------------|-----|-----|--------|-----------|-----------|-------|------|------|
| QA-047 | Regression Testing کامل | QA | Phase 6 | P0 | تمام فیچرها, SP-004 | - | Todo | QA Lead | XL |
| QA-048 | Load Testing و Stress Testing | QA | Phase 6 | P1 | BE-075 | - | Todo | QA Dev | XL |
| QA-049 | Security Testing | QA | Phase 6 | P0 | BE-077 | - | Todo | QA Dev | L |
| QA-050 | تهیه گزارش نهایی کیفیت | QA | Phase 6 | P0 | تمام تست‌ها | - | Todo | QA Lead | M |
| QA-051 | مستندات تست برای نگهداری | QA | Phase 6 | P1 | تمام تست‌ها | - | Todo | QA Dev | M |

---

## خلاصه وظایف بحرانی (Critical Path)

این وظایف بیشترین تعداد وابستگی را دارند و تکمیل آن‌ها برای پیشرفت پروژه حیاتی است:

| ID | عنوان وظیفه | تیم | تعداد وابسته |
|----|------------|-----|--------------|
| SP-001 | نهایی‌سازی قرارداد API | همه | ۵۰+ |
| SP-002 | انجماد اسکیما پایگاه داده | Backend, QA | ۳۰+ |
| BE-013 | پیاده‌سازی Login با JWT | Backend | ۱۵+ |
| BE-039 | Endpoint ایجاد رزرو جدید | Backend | ۲۰+ |
| BE-048 | یکپارچه‌سازی با درگاه پرداخت | Backend | ۱۸+ |
| SP-003 | تکمیل جریان اصلی رزرو | همه | ۲۵+ |

---

## وظایف مستقل (Independent Tasks)

این وظایف را می‌توان بدون وابستگی به سایر تیم‌ها انجام داد:

| ID | عنوان وظیفه | تیم |
|----|------------|-----|
| BE-001 تا BE-010 | وظایف زیرساخت Backend | Backend |
| FE-001 تا FE-010 | وظایف زیرساخت Frontend | Frontend |
| AN-001 تا AN-010 | وظایف زیرساخت Android | Android |
| QA-001 تا QA-008 | وظایف زیرساخت QA | QA |
| BE-006 | راه‌اندازی سیستم لاگینگ | Backend |
| FE-010 | پیکربندی Storybook | Frontend |
| AN-008 | ایجاد تم اولیه | Android |

---

## وظایف پرریسک (High-Risk Tasks)

این وظایف پیچیدگی بالا یا عدم قطعیت زیادی دارند و نیاز به توجه زودهنگام دارند:

| ID | عنوان وظیفه | تیم | دلیل ریسک |
|----|------------|-----|----------|
| BE-038 | الگوریتم بررسی تداخل زمانی | Backend | منطق پیچیده تجاری |
| BE-044 | Queue Processing برای رزروهای همزمان | Backend | Concurrency Issues |
| BE-048 | یکپارچه‌سازی با درگاه پرداخت | Backend | وابستگی خارجی، Compliance |
| QA-027 | تست Race Conditions در رزرو | QA | دشواری شبیه‌سازی |
| BE-058 | یکپارچه‌سازی FCM | Backend | پیکربندی پیچیده |
| BE-077 | Security Audit | Backend | تخصص ویژه مورد نیاز |

---

## بردهای سریع (Quick Wins)

وظایف کم‌هزینه با ارزش بالا که باید زود انجام شوند:

| ID | عنوان وظیفه | تیم | ارزش |
|----|------------|-----|------|
| BE-002 | پیکربندی ESLint و Prettier | Backend | کیفیت کد |
| FE-003 | نصب Tailwind CSS | Frontend | سرعت توسعه |
| AN-004 | پیکربندی Dio | Android | استانداردسازی HTTP |
| BE-024 | Rate Limiting برای Auth | Backend | امنیت فوری |
| FE-024 | نمایش خطاهای Validation | Frontend | تجربه کاربری |
| AN-022 | اعتبارسنجی فرم‌ها | Android | تجربه کاربری |
| QA-006 | یکپارچه‌سازی تست با CI/CD | QA | اتوماسیون |

---

## آمار کلی

- **کل وظایف:** ۱۷۶ وظیفه
- **Backend:** ۷۸ وظیفه
- **Frontend:** ۶۹ وظیفه
- **Android:** ۶۷ وظیفه
- **QA:** ۵۱ وظیفه

**توزیع اولویت:**
- P0 (بحرانی): ۴۵ وظیفه
- P1 (بالا): ۸۹ وظیفه
- P2 (متوسط): ۴۲ وظیفه

**توزیع تلاش تخمینی:**
- S (کوچک): ۵۸ وظیفه
- M (متوسط): ۷۲ وظیفه
- L (بزرگ): ۳۵ وظیفه
- XL (خیلی بزرگ): ۱۱ وظیفه

---

## یادداشت‌ها

۱. تمام وظایف در ابتدا با وضعیت `Todo` شروع می‌شوند
۲. مالکان وظایف پس از تخصیص تیم‌ها مشخص خواهند شد
۳. وابستگی‌ها ممکن است در طول پروژه تغییر کنند
۴. وظایف جدید ممکن است در حین توسعه شناسایی و اضافه شوند
۵. این سند باید در پایان هر فاز به‌روزرسانی شود
