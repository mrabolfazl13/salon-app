# ============================================
# create_project_structure.ps1
# ایجاد ساختار پوشه‌ها و فایل‌های خالی پروژه
# ============================================

param(
    [string]$ProjectPath = ".",
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ایجاد ساختار پروژه فوتسال" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# if (Test-Path $ProjectPath) {
#     if ($Force) {
#         Write-Host "پوشه وجود دارد. حذف و بازسازی..." -ForegroundColor Yellow
#         Remove-Item -Path $ProjectPath -Recurse -Force
#     } else {
#         Write-Host "پوشه وجود دارد! از -Force استفاده کنید." -ForegroundColor Red
#         exit 1
#     }
# }

New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
Set-Location $ProjectPath

Write-Host "[1/4] ایجاد پوشه‌ها..." -ForegroundColor Green

$folders = @(
    "src/components/ui",
    "src/components/layout",
    "src/components/forms",
    "src/components/modals",
    "src/components/venue",
    "src/components/booking",
    "src/components/competition",
    "src/components/contract",
    "src/components/dashboard",
    "src/pages/auth",
    "src/pages/dashboard",
    "src/pages/venues",
    "src/pages/bookings",
    "src/pages/competitions",
    "src/pages/contracts",
    "src/pages/admin",
    "src/pages/profile",
    "src/hooks",
    "src/services",
    "src/store",
    "src/types",
    "src/utils",
    "src/lib",
    "src/styles",
    "src/assets/images",
    "src/assets/icons",
    "src-tauri/src",
    "src-tauri/icons",
    "public"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Host "[2/4] ایجاد فایل‌های پیکربندی..." -ForegroundColor Green

# فایل‌های پیکربندی
New-Item -ItemType File -Path "package.json" -Force | Out-Null
New-Item -ItemType File -Path "vite.config.ts" -Force | Out-Null
New-Item -ItemType File -Path "tsconfig.json" -Force | Out-Null
New-Item -ItemType File -Path "tsconfig.node.json" -Force | Out-Null
New-Item -ItemType File -Path "tailwind.config.js" -Force | Out-Null
New-Item -ItemType File -Path "postcss.config.js" -Force | Out-Null
New-Item -ItemType File -Path "index.html" -Force | Out-Null
New-Item -ItemType File -Path ".gitignore" -Force | Out-Null
New-Item -ItemType File -Path "README.md" -Force | Out-Null

Write-Host "[3/4] ایجاد فایل‌های خالی src..." -ForegroundColor Green

# فایل‌های اصلی
New-Item -ItemType File -Path "src/main.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/App.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/vite-env.d.ts" -Force | Out-Null

# استایل
New-Item -ItemType File -Path "src/styles/globals.css" -Force | Out-Null

# Lib
New-Item -ItemType File -Path "src/lib/utils.ts" -Force | Out-Null

# کامپوننت‌های UI
New-Item -ItemType File -Path "src/components/ui/Button.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Input.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Card.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Badge.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Select.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Dialog.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Table.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Tabs.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Toast.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Loading.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Empty.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/ui/Progress.tsx" -Force | Out-Null

# Layout
New-Item -ItemType File -Path "src/components/layout/Layout.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/layout/Navbar.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/layout/Footer.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/layout/Sidebar.tsx" -Force | Out-Null

# کامپوننت‌های تخصصی
New-Item -ItemType File -Path "src/components/venue/VenueCard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/venue/VenueFilter.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/venue/VenueMap.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/booking/BookingForm.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/booking/BookingList.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/booking/TimeSlotPicker.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/competition/CompetitionCard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/competition/CompetitionBid.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/contract/ContractForm.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/contract/ContractList.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/dashboard/StatCard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/dashboard/RecentBookings.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/components/dashboard/Chart.tsx" -Force | Out-Null

# صفحات
New-Item -ItemType File -Path "src/pages/Home.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/auth/Login.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/auth/Register.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/auth/ForgotPassword.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/dashboard/Dashboard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/venues/Venues.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/venues/VenueDetail.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/bookings/Bookings.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/bookings/BookingDetail.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/competitions/Competitions.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/competitions/CompetitionDetail.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/contracts/Contracts.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/contracts/ContractDetail.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/admin/AdminDashboard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/admin/Users.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/admin/Venues.tsx" -Force | Out-Null
New-Item -ItemType File -Path "src/pages/profile/Profile.tsx" -Force | Out-Null

# Hooks
New-Item -ItemType File -Path "src/hooks/useAuth.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useBooking.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useVenue.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useCompetition.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useContract.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useToast.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/hooks/useMediaQuery.ts" -Force | Out-Null

# Services
New-Item -ItemType File -Path "src/services/api.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/services/auth.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/services/venue.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/services/booking.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/services/competition.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/services/contract.ts" -Force | Out-Null

# Store
New-Item -ItemType File -Path "src/store/authStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/store/bookingStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/store/venueStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/store/uiStore.ts" -Force | Out-Null

# Types
New-Item -ItemType File -Path "src/types/index.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/api.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/user.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/venue.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/booking.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/competition.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/types/contract.ts" -Force | Out-Null

# Utils
New-Item -ItemType File -Path "src/utils/validators.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/utils/constants.ts" -Force | Out-Null
New-Item -ItemType File -Path "src/utils/helpers.ts" -Force | Out-Null

Write-Host "[4/4] ایجاد فایل‌های Tauri..." -ForegroundColor Green

# Tauri
New-Item -ItemType File -Path "src-tauri/Cargo.toml" -Force | Out-Null
New-Item -ItemType File -Path "src-tauri/tauri.conf.json" -Force | Out-Null
New-Item -ItemType File -Path "src-tauri/build.rs" -Force | Out-Null
New-Item -ItemType File -Path "src-tauri/src/main.rs" -Force | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ساختار پروژه با موفقیت ایجاد شد!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " مسیر پروژه: $ProjectPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "مرحله بعد: کدهای هر فایل را به ترتیب کپی کنید." -ForegroundColor Cyan
Write-Host ""
Write-Host "تعداد فایل‌های ایجاد شده: 70 فایل" -ForegroundColor Green