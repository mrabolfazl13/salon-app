# تحلیل بین‌نقشی - سیستم رزرو فوتسال

## خلاصه اجرایی

این سند تحلیلی جامع، الگوهای مشترک، نقاط همپوشانی و فرصت‌های یکپارچه‌سازی را در میان ۸ نقش اصلی سیستم (مشتری، مدیر سالن، پذیرش، مدیر چندسالنه، مربی، کاپیتان تیم، برگزارکننده رقابت، بازاریابی) بررسی می‌کند. هدف شناسایی قابلیت‌هایی است که با پیاده‌سازی واحد، ارزش افزوده برای تمام نقش‌ها ایجاد کنند و همچنین تضادهای نیازمندی‌ها را آشکار سازد.

---

## ۱. مشکلات مشترک در تمام نقش‌ها

### ۱.۱ عدم وجود سیستم اعلان مرکزی

**وضعیت فعلی:** هر نقش مکانیزم اطلاع‌رسانی خود را دارد:
- مشتری: ایمیل/پیامک تأیید رزرو (`bookingService`)
- مدیر سالن: نوتیفیکیشن پنل (`ManagerDashboard.tsx`)
- مربی: بدون سیستم اعلان اختصاصی

**مشکل:** 
- کاربر باید به صورت دستی صفحات مختلف را چک کند
- هیچ inbox متمرکز برای مشاهده همه رویدادها وجود ندارد
- تاریخچه اعلان‌ها ذخیره نمی‌شود

**راهکار پیشنهادی:**
```typescript
// src/types/notification.ts
interface Notification {
  id: number
  recipient_id: number
  recipient_role: 'user' | 'venue_manager' | 'coach' | 'captain'
  type: 'booking_confirmed' | 'payment_received' | 'slot_cancelled' | 'competition_update'
  title: string
  body: string
  action_url?: string
  read_at: string | null
  created_at: string
}

// کامپوننت مشترک NotificationBell
const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter(n => !n.read_at).length
  
  return (
    <Badge badgeContent={unreadCount} color="error">
      <IconButton onClick={openInbox}>
        <Icon icon="mdi:bell-outline" />
      </IconButton>
    </Badge>
  )
}
```

### ۱.۲ مدیریت خطا ناهماهنگ

**وضعیت فعلی:**
- صفحات از `toast.error()` استفاده می‌کنند اما پیام‌ها استاندارد نیست
- `BookingDetail.tsx`: "خطا در لغو رزرو"
- `AdminDashboard.tsx`: "خطا در دریافت اطلاعات از سرور"
- `Venues.tsx`: "مشکلی در ارتباط با سرور پیش آمد"

**مشکل:**
- پیام‌های خطا راهنمایی عملی ندارند
- کدهای HTTP به کاربر نمایش داده نمی‌شوند
- راهکار بازیابی ارائه نمی‌شود

**راهکار:**
```typescript
// src/lib/errorHandler.ts
export function handleApiError(error: any, context: string): string {
  const status = error.response?.status
  const detail = error.response?.data?.detail
  
  switch(status) {
    case 401: return 'لطفاً مجدداً وارد شوید'
    case 403: return 'دسترسی شما به این بخش محدود شده است'
    case 404: return `${context} یافت نشد`
    case 422: return `اطلاعات وارد شده نامعتبر است: ${detail}`
    case 500: return 'خطای سرور. لطفاً دقایقی بعد تلاش کنید'
    default: return detail || `خطا در ${context}. لطفاً دوباره تلاش کنید`
  }
}
```

### ۱.۳ بارگذاری و حالت‌های خالی ناسازگار

**وضعیت فعلی:**
- `Dashboard.tsx`: از `Skeleton` MUI استفاده می‌کند
- `Venues.tsx`: از `VenueCardSkeletonList` سفارشی استفاده می‌کند
- `Search.tsx`: از `SearchResultsSkeleton` استفاده می‌کند
- `EmptyState.tsx`: کامپوننت مشترک دارد اما محتوا متفاوت است

**مشکل:**
- تجربه کاربری ناهماهنگ هنگام لود شدن داده‌ها
- طراحی skeletonها از نظر بصری یکسان نیست

**راهکار:**
```typescript
// src/components/ui/DataLoader.tsx - کامپوننت یکپارچه
interface DataLoaderProps<T> {
  loading: boolean
  error: boolean
  data: T[]
  emptyMessage: string
  retryAction: () => void
  renderItem: (item: T) => React.ReactNode
}

const DataLoader: React.FC<DataLoaderProps<any>> = ({
  loading, error, data, emptyMessage, retryAction, renderItem
}) => {
  if (loading) return <UnifiedSkeleton count={6} />
  if (error) return <ErrorState onRetry={retryAction} />
  if (data.length === 0) return <EmptyState title={emptyMessage} />
  return <>{data.map(renderItem)}</>
}
```

---

## ۲. ویژگی‌های مشترک نیازمند پیاده‌سازی واحد

### ۲.۱ تقویم و زمان‌بندی

**نقش‌های متاثر:** مشتری، مدیر سالن، مربی، کاپیتان، برگزارکننده

**وضعیت فعلی:**
- مشتری: `DateSelector` + `TimeSlotPicker` در `VenueDetail.tsx`
- مدیر سالن: بدون تقویم بصری، فقط لیست سانس‌ها
- مربی: بدون ابزار زمان‌بندی

**مشکل:**
- هر نقش رابط کاربری جداگانه برای انتخاب تاریخ/زمان دارد
- منطق تداخل زمانی در چندین نقطه تکرار شده
- پشتیبانی ناقص از timezone و DST

**راهکار یکپارچه:**
```typescript
// src/components/calendar/SmartCalendar.tsx
interface SmartCalendarProps {
  mode: 'booking' | 'management' | 'training' | 'competition'
  venueId?: number
  teamId?: number
  coachId?: number
  availableSlots?: TimeSlot[]
  bookedSlots?: Booking[]
  maintenanceSlots?: Slot[]
  onSelectSlot: (slot: TimeSlot) => void
  conflicts?: Conflict[]
}

// منطق مرکزی تشخیص تداخل
function detectConflicts(
  newSlot: TimeSlot,
  existingBookings: Booking[],
  maintenanceWindows: Slot[]
): Conflict[] {
  return existingBookings.filter(b => 
    isOverlapping(newSlot, b.slot)
  ).map(b => ({
    type: 'booking_conflict',
    bookingId: b.id,
    message: `تداخل با رزرو #${b.id}`
  }))
}
```

### ۲.۲ سیستم پرداخت و صورتحساب

**نقش‌های متاثر:** مشتری، مدیر سالن، مربی، کاپیتان تیم

**وضعیت فعلی:**
- مشتری: `PaymentDialog` + `BookingPaymentPanel`
- مدیر سالن: `ManagerFinance.tsx` با جدول تراکنش‌ها
- مربی: بدون دسترسی مالی

**مشکل:**
- گردش پرداخت بین نقش‌ها شفاف نیست
- فیش واریزی فقط در سطح رزرو مدیریت می‌شود
- گزارش‌گیری مالی برای مربیان وجود ندارد

**راهکار:**
```typescript
// src/services/payment/shared.ts
interface PaymentFlow {
  // مرحله 1: ایجاد درخواست پرداخت
  createPaymentRequest(params: {
    payer_role: 'customer' | 'team_captain' | 'coach'
    payee_role: 'venue_manager' | 'coach'
    amount: number
    purpose: 'booking' | 'membership' | 'coaching_fee' | 'competition_entry'
    reference_id: number  // booking_id یا team_id
  }): Promise<PaymentRequest>
  
  // مرحله 2: پردازش پرداخت
  processPayment(method: 'gateway' | 'bank_receipt' | 'pay_in_place'): Promise<PaymentResult>
  
  // مرحله 3: تایید/رد توسط گیرنده (برای فیش واریزی)
  verifyReceipt(receiptId: number, status: 'approved' | 'rejected', note?: string): Promise<void>
  
  // مرحله 4: گزارش‌گیری
  generateReport(filters: PaymentFilter): Promise<FinancialReport>
}
```

### ۲.۳ جستجو و فیلتر

**نقش‌های متاثر:** مشتری، مدیر سالن، برگزارکننده، بازاریابی

**وضعیت فعلی:**
- مشتری: `SearchBar` + `FilterBottomSheet` در `Venues.tsx`
- مدیر سالن: بدون جستجوی پیشرفته در پنل
- برگزارکننده: جستجوی دستی تیم‌ها

**مشکل:**
- موتور جستجو برای هر نقش متفاوت است
- فیلترها قابل ذخیره‌سازی نیستند
- جستجوی ترکیبی (متن + موقعیت + قیمت) پشتیبانی نمی‌شود

**راهکار:**
```typescript
// src/services/search/unified.ts
interface UnifiedSearchParams {
  query: string
  entityType: 'venue' | 'team' | 'coach' | 'competition' | 'user'
  filters: {
    location?: { lat: number; lng: number; radius_km: number }
    priceRange?: { min: number; max: number }
    rating?: { min: number }
    amenities?: string[]
    availability?: DateRange
    verifiedOnly?: boolean
  }
  sortBy: 'relevance' | 'price' | 'rating' | 'distance' | 'newest'
  page: number
  limit: number
}

// سرویس مرکزی جستجو
class UnifiedSearchService {
  async search<T>(params: UnifiedSearchParams): Promise<SearchResult<T>> {
    // منطق یکپارچه با caching و debouncing
  }
  
  saveSearchPreset(name: string, params: UnifiedSearchParams): Promise<SavedSearch>
  getSavedSearches(): Promise<SavedSearch[]>
}
```

---

## ۳. همپوشانی داده‌ها و موجودیت‌های مشترک

### ۳.۱ موجودیت Venue (سالن)

**دسترسی از نقش‌های مختلف:**
- **مشتری:** مشاهده تصاویر، امکانات، قیمت، رزرو (`VenueDetail.tsx`)
- **مدیر سالن:** ویرایش اطلاعات، مدیریت سانس‌ها، تنظیم قیمت (`ManagerPricing.tsx`)
- **مربی:** بررسی کیفیت زمین برای تمرین
- **بازاریابی:** تحلیل محبوبیت سالن بر اساس رزروها

**مشکل:**
- فیلدهای `amenities` به صورت آرایه رشته‌ای ذخیره می‌شود، نه ساختاریافته
- تصاویر بدون متادیتا (عنوان، alt text، ترتیب نمایش)
- اطلاعات تماس در چندین جدول پراکنده است

**راهکار:**
```typescript
// src/types/venue.ts - مدل بهبود یافته
interface Venue {
  id: number
  name: string
  slug: string
  address: string
  coordinates: { lat: number; lng: number }
  
  // اطلاعات ساختاریافته امکانات
  amenities: VenueAmenity[]
  facilities: Facility[]
  
  // مدیریت رسانه
  media: {
    images: VenueImage[]
    videos: VenueVideo[]
    virtualTourUrl?: string
  }
  
  // اطلاعات تماس متمرکز
  contact: {
    phone: string
    email?: string
    whatsapp?: string
    instagram?: string
    website?: string
  }
  
  // متادیتای مدیریتی
  management: {
    ownerId: number
    managerIds: number[]
    staffIds: number[]
    verificationStatus: 'pending' | 'verified' | 'rejected'
  }
}

interface VenueAmenity {
  key: string  // 'parking', 'shower', 'wifi'
  label: string
  icon: string
  category: 'facility' | 'service' | 'accessibility'
}

interface VenueImage {
  id: number
  url: string
  title: string
  altText: string
  sortOrder: number
  isPrimary: boolean
  uploadedAt: string
}
```

### ۳.۲ موجودیت User (کاربر)

**همپوشانی بین نقش‌ها:**
- یک کاربر می‌تواند همزمان مشتری، مربی و کاپیتان باشد
- پروفایل در `Profile.tsx` نمایش داده می‌شود اما اطلاعات نقش‌محور پراکنده است
- مجوزها در `authStore` ذخیره می‌شود اما تفکیک دقیق ندارد

**مشکل:**
- نقش‌ها به صورت single-role مدیریت می‌شوند (`user.role`)
- تاریخچه فعالیت‌ها بر اساس نقش تفکیک نمی‌شود
- تنظیمات حریم خصوصی برای هر نقش جداگانه نیست

**راهکار:**
```typescript
// src/types/user.ts - مدل چند‌نقشی
interface User {
  id: number
  fullName: string
  phone: string
  email?: string
  avatar?: string
  
  // چندین نقش همزمان
  roles: UserRole[]
  
  // پروفایل عمومی (قابل مشاهده توسط همه)
  publicProfile: {
    displayName: string
    bio?: string
    skills?: string[]  // برای مربیان
    preferredPositions?: string[]  // برای بازیکنان
  }
  
  // تنظیمات نقش‌محور
  roleSettings: {
    customer?: CustomerSettings
    coach?: CoachSettings
    captain?: CaptainSettings
    venueManager?: ManagerSettings
  }
  
  // حریم خصوصی
  privacy: {
    showPhone: boolean
    showEmail: boolean
    allowDirectMessages: boolean
    visibleToRoles: ('customer' | 'coach' | 'manager')[]
  }
}

interface UserRole {
  role: 'customer' | 'coach' | 'captain' | 'venue_manager' | 'club_admin' | 'super_admin'
  grantedAt: string
  permissions: Permission[]
  metadata?: Record<string, any>
}
```

### ۳.۳ موجودیت Booking (رزرو)

**دسترسی چند‌جانبه:**
- **مشتری:** ایجاد، لغو، مشاهده وضعیت (`Bookings.tsx`)
- **مدیر سالن:** تایید، رد، check-in (`ManagerCheckin.tsx`)
- **مربی:** مشاهده رزروهای تیم تحت آموزش
- **پذیرش:** ثبت رزرو تلفنی

**مشکل:**
- وضعیت‌های رزرو (`pending`, `confirmed`, `cancelled`, `completed`) برای همه سناریوها کافی نیست
- تاریخچه تغییرات وضعیت ذخیره نمی‌شود
- ارتباط رزرو با رقابت‌ها/تمرینات مشخص نیست

**راهکار:**
```typescript
// src/types/booking.ts - مدل پیشرفته
interface Booking {
  id: number
  slotId: number
  userId: number
  status: BookingStatus
  statusHistory: StatusChange[]
  
  // نوع رزرو
  bookingType: 'individual' | 'team_training' | 'competition' | 'private_coaching'
  
  // اطلاعات مالی
  payment: {
    amount: number
    currency: 'IRR'
    method: 'gateway' | 'bank_receipt' | 'pay_in_place'
    status: 'pending' | 'paid' | 'refunded' | 'partial'
    receipt?: ReceiptDetails
    discountApplied?: Discount
  }
  
  // متادیتای اضافی
  metadata: {
    teamId?: number
    coachId?: number
    competitionId?: number
    notes?: string
    specialRequests?: string[]
  }
  
  // زمان‌بندی
  schedule: {
    date: string
    startTime: string
    endTime: string
    durationMinutes: number
  }
  
  createdAt: string
  updatedAt: string
}

interface StatusChange {
  fromStatus: BookingStatus | null
  toStatus: BookingStatus
  changedBy: number  // user_id
  reason?: string
  timestamp: string
}
```

---

## ۴. فرآیندهای مشترک

### ۴.۱ فرآیند رزرو (Booking Flow)

**مسیر فعلی:**
```
مشتری → Venues.tsx → VenueDetail.tsx → TimeSlotPicker → BookingSummary → PaymentDialog
```

**نقاط ضعف:**
- فرآیند برای رزرو گروهی (تیمی) بهینه نشده
- امکان رزرو recurring (مثلاً هر هفته سه‌شنبه) وجود ندارد
- صف انتظار (`waitlistService`) فقط برای سانس‌های پر کار می‌کند

**بهینه‌سازی:**
```typescript
// src/services/booking/advanced.ts
interface BookingWorkflow {
  // مرحله 1: انتخاب نوع رزرو
  selectBookingType(type: 'single' | 'recurring' | 'bulk'): void
  
  // مرحله 2: اعتبارسنجیavailability
  validateAvailability(params: {
    venueId: number
    slots: TimeSlot[]
    userId: number
    teamSize?: number
  }): Promise<ValidationResult>
  
  // مرحله 3: اعمال تخفیف‌ها
  applyDiscounts(codes: string[], loyaltyPoints?: number): Promise<PricingBreakdown>
  
  // مرحله 4: رزرو موقت (Redis)
  createPendingReservation(params: ReservationParams): Promise<PendingBooking>
  
  // مرحله 5: پرداخت و نهایی‌سازی
  completeBooking(paymentMethod: PaymentMethod): Promise<BookingConfirmation>
  
  // مرحله 6: اعلان‌ها
  sendNotifications(recipients: NotificationTarget[]): Promise<void>
}
```

### ۴.۲ فرآیند اعلان (Notification Flow)

**وضعیت فعلی:** پراکنده و واکنشی

**فرآیند مطلوب:**
```typescript
// src/services/notification/orchestrator.ts
interface NotificationOrchestrator {
  // تعریف رویدادها
  events: {
    BOOKING_CREATED: {
      triggers: ['email', 'sms', 'push']
      recipients: ['customer', 'venue_manager']
      template: 'booking_confirmation'
    }
    PAYMENT_RECEIVED: {
      triggers: ['email', 'push']
      recipients: ['customer', 'venue_manager', 'accountant']
      template: 'payment_receipt'
    }
    SLOT_CANCELLED: {
      triggers: ['sms', 'push', 'email']
      recipients: ['affected_customers']
      priority: 'high'
      template: 'cancellation_notice'
    }
  }
  
  // ارسال هوشمند
  dispatch(event: string, context: EventContext): Promise<DeliveryReport>
  
  // ترجیحات کاربر
  getUserPreferences(userId: number): Promise<NotificationPreferences>
  updatePreferences(userId: number, prefs: NotificationPreferences): Promise<void>
}
```

### ۴.۳ فرآیند پرداخت (Payment Flow)

**چالش‌های بین‌نقشی:**
- مشتری می‌خواهد انعطاف‌پذیری در روش پرداخت داشته باشد
- مدیر سالن می‌خواهد ریسک عدم پرداخت را کاهش دهد
- حسابدار می‌خواهد گزارش‌گیری دقیق داشته باشد

**راهکار یکپارچه:**
```typescript
// src/services/payment/unified.ts
interface UnifiedPaymentProcessor {
  // ایجاد سفارش پرداخت
  createOrder(order: {
    amount: number
    payerId: number
    payeeId: number
    purpose: PaymentPurpose
    splitPayments?: SplitPayment[]  // برای پرداخت‌های تیمی
  }): Promise<PaymentOrder>
  
  // پردازش با روش‌های مختلف
  processWithGateway(orderId: number): Promise<GatewayResponse>
  processWithReceipt(orderId: number, receipt: ReceiptUpload): Promise<PendingVerification>
  processCashPayment(orderId: number, receivedBy: number): Promise<CashReceipt>
  
  // مدیریت بازگشت وجه
  initiateRefund(paymentId: number, reason: string): Promise<RefundRequest>
  approveRefund(refundId: number, approvedBy: number): Promise<void>
  
  // گزارش‌گیری
  generateStatement(filters: StatementFilter): Promise<FinancialStatement>
}
```

---

## ۵. فرصت‌های اتوماسیون چند‌نقشی

### ۵.۱ اتوماسیون رزروهای تکراری

**سناریو:** تیمی می‌خواهد هر هفته سه‌شنبه ساعت ۱۸-۲۰ یک زمین رزرو کند

**وضعیت فعلی:** کاربر باید هر هفته دستی رزرو کند

**اتوماسیون پیشنهادی:**
```typescript
// src/services/booking/recurring.ts
interface RecurringBookingRule {
  id: number
  userId: number
  venueId: number
  pattern: {
    frequency: 'weekly' | 'biweekly' | 'monthly'
    dayOfWeek: number  // 0-6
    startTime: string
    duration: number
  }
  dateRange: {
    startDate: string
    endDate: string
    exceptions: string[]  // تاریخ‌های استثنا
  }
  autoRenew: boolean
  paymentMethod: 'auto_charge' | 'manual'
  notificationDaysBefore: number
}

// سرویس پردازش خودکار
class RecurringBookingProcessor {
  async processUpcomingBookings(): Promise<ProcessingResult> {
    // هر روز صبح اجرا شود
    // بررسی قوانین فعال
    // رزرو خودکار سانس‌های آینده
    // ارسال اعلان به کاربر و مدیر سالن
  }
}
```

### ۵.۲ اتوماسیون یادآوری و پیگیری

**سناریوهای قابل اتوماسیون:**
- یادآوری ۲۴ ساعت قبل از رزرو
- پیگیری پرداخت فیش واریزی پس از ۴۸ ساعت
- اعلان تمدید اشتراک بدنسازی
- یادآوری جلسه تمرینی به شاگردان

**پیاده‌سازی:**
```typescript
// src/services/automation/scheduler.ts
interface AutomationRule {
  trigger: {
    type: 'time_before_event' | 'time_after_event' | 'status_change'
    offset: { value: number; unit: 'minutes' | 'hours' | 'days' }
    conditions?: Condition[]
  }
  action: {
    type: 'send_notification' | 'create_task' | 'update_status' | 'generate_report'
    params: Record<string, any>
  }
  targetAudience: 'customer' | 'venue_manager' | 'coach' | 'all'
}

// مثال: یادآوری خودکار
const reminderRule: AutomationRule = {
  trigger: {
    type: 'time_before_event',
    offset: { value: 24, unit: 'hours' },
    conditions: [{ field: 'booking.status', operator: 'equals', value: 'confirmed' }]
  },
  action: {
    type: 'send_notification',
    params: {
      channels: ['push', 'sms'],
      template: 'booking_reminder_24h',
      includeQrCode: true
    }
  },
  targetAudience: 'customer'
}
```

### ۵.۳ اتوماسیون گزارش‌دهی مالی

**برای مدیران سالن:**
- گزارش روزانه درآمد
- هشدار هزینه‌های غیرعادی
- پیش‌بینی جریان نقدینگی

**برای مربیان:**
- گزارش حضور و غیاب ماهانه شاگردان
- محاسبه خودکار شهریه بر اساس جلسات حاضر
- اعلان بدهکاران

```typescript
// src/services/reporting/auto.ts
interface AutomatedReport {
  id: number
  name: string
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    timeOfDay: string
  }
  recipients: number[]
  format: 'pdf' | 'excel' | 'dashboard'
  query: ReportQuery
  deliveryMethod: 'email' | 'dashboard' | 'both'
}
```

---

## ۶. تضادهای نیازمندی بین نقش‌ها

### ۶.۱ انعطاف‌پذیری مشتری vs پیش‌بینی‌پذیری مدیر

**تضاد:**
- **مشتری** می‌خواهد بتواند تا لحظه آخر رزرو را لغو یا تغییر دهد
- **مدیر سالن** می‌خواهد برنامه سانس‌ها ثابت باشد تا بتواند نیروی انسانی را برنامه‌ریزی کند

**راهکار تعادل:**
```typescript
// سیاست‌های لغو پلکانی
interface CancellationPolicy {
  tiers: CancellationTier[]
}

interface CancellationTier {
  hoursBeforeBooking: number
  refundPercentage: number
  penaltyFee: number
  allowedActions: ('cancel' | 'reschedule' | 'transfer')[]
}

// مثال:
const standardPolicy: CancellationPolicy = {
  tiers: [
    { hoursBeforeBooking: 48, refundPercentage: 100, penaltyFee: 0, allowedActions: ['cancel', 'reschedule'] },
    { hoursBeforeBooking: 24, refundPercentage: 75, penaltyFee: 50000, allowedActions: ['reschedule'] },
    { hoursBeforeBooking: 12, refundPercentage: 50, penaltyFee: 100000, allowedActions: ['reschedule'] },
    { hoursBeforeBooking: 0, refundPercentage: 0, penaltyFee: 150000, allowedActions: [] }
  ]
}
```

### ۶.۲ حریم خصوصی کاربر vs شفافیت برای مربی

**تضاد:**
- **کاربر** می‌خواهد اطلاعات تماس و مالی‌اش خصوصی بماند
- **مربی** نیاز دارد بداند کدام شاگردان شهریه را پرداخت کرده‌اند

**راهکار:**
```typescript
// کنترل دسترسی گرانشی
interface AccessControlRule {
  resource: 'user_phone' | 'payment_history' | 'attendance_record'
  requesterRole: 'coach' | 'captain' | 'admin'
  ownerConsent: boolean  // آیا نیاز به رضایت صاحب داده دارد؟
  dataMasking?: {
    phone: 'show_last_4' | 'hide_all'
    amount: 'show_range' | 'hide_all'
  }
}

// مثال: مربی فقط وضعیت کلی پرداخت را می‌بیند، نه مبلغ دقیق
const coachAccessRule: AccessControlRule = {
  resource: 'payment_history',
  requesterRole: 'coach',
  ownerConsent: true,
  dataMasking: {
    amount: 'show_range'  // "پرداخت شده" یا "بدهکار"
  }
}
```

### ۶.۳ کیفیت تجربه مشتری vs هزینه عملیاتی سالن

**تضاد:**
- **مشتری** می‌خواهد سالن تمیز، تجهیزات باکیفیت و خدمات عالی داشته باشد
- **مدیر سالن** می‌خواهد هزینه‌های نگهداری را کنترل کند

**راهکار:**
- سیستم امتیازدهی شفاف به کیفیت سالن
- گزارش‌دهی خودکار مشکلات نگهداری
- بودجه‌بندی هوشمند بر اساس میزان استفاده

---

## ۷. فرصت‌های بازارگاه (Marketplace)

### ۷.۱ اتصال سالن‌ها، تیم‌ها و مربیان

**مدل فعلی:** هر موجودیت جداگانه عمل می‌کند

**مدل بازارگاهی پیشنهادی:**
```typescript
// src/types/marketplace.ts
interface MarketplaceListing {
  id: number
  type: 'venue_slot' | 'coaching_service' | 'team_recruitment' | 'equipment_rental'
  
  // ارائه‌دهنده
  provider: {
    type: 'venue' | 'coach' | 'team'
    id: number
    rating: number
    verificationStatus: 'verified' | 'pending'
  }
  
  // جزئیات عرضه
  offering: {
    title: string
    description: string
    price: number
    availability: DateRange[]
    capacity?: number
    requirements?: string[]
  }
  
  // تقاضا
  demandMetrics: {
    views: number
    inquiries: number
    bookings: number
    waitlistCount: number
  }
}

// مثال: مربی خدمات خود را لیست می‌کند
const coachingListing: MarketplaceListing = {
  type: 'coaching_service',
  provider: { type: 'coach', id: 42, rating: 4.8, verificationStatus: 'verified' },
  offering: {
    title: 'تمرین تخصصی دروازه‌بانی',
    description: 'جلسات ۹۰ دقیقه‌ای با تمرکز بر تکنیک‌های مدرن',
    price: 500000,
    availability: [{ start: '2026-10-15T16:00:00Z', end: '2026-10-15T17:30:00Z' }],
    capacity: 4,
    requirements: ['دروازه‌بانی حداقل ۲ سال سابقه']
  }
}
```

### ۷.۲ سیستم حراج سانس‌های خالی

**سناریو:** سالنی فردا ساعت ۱۸ خالی است و می‌خواهد با تخفیف پر کند

**پیاده‌سازی:**
```typescript
// src/services/marketplace/auction.ts
interface SlotAuction {
  slotId: number
  venueId: number
  startingPrice: number
  currentBid: number
  minimumIncrement: number
  endTime: string
  participants: Bid[]
  status: 'active' | 'ended' | 'cancelled'
}

interface Bid {
  userId: number
  amount: number
  timestamp: string
  autoAcceptThreshold?: number  // حداکثر مبلغی که کاربر حاضر است بپردازد
}

// سرویس مدیریت حراج
class SlotAuctionService {
  createAuction(slotId: number, params: AuctionParams): Promise<SlotAuction>
  placeBid(auctionId: number, bid: Bid): Promise<BidResult>
  endAuction(auctionId: number): Promise<AuctionWinner>
}
```

### ۷.۳ تبادل بازیکن بین تیم‌ها

**سناریو:** تیمی بازیکن کم دارد، تیم دیگر بازیکن مازاد

**پیاده‌سازی:**
```typescript
interface PlayerExchange {
  requestingTeam: {
    teamId: number
    neededPositions: string[]
    skillLevel: 'beginner' | 'intermediate' | 'advanced'
    availability: DayOfWeek[]
  }
  offeringPlayer: {
    playerId: number
    positions: string[]
    experienceYears: number
    rating: number
  }
  trialPeriod: {
    sessions: number
    evaluationCriteria: string[]
  }
}
```

---

## ۸. پتانسیل اثر شبکه‌ای (Network Effect)

### ۸.۱ چگونه کاربران بیشتر = ارزش بیشتر؟

**اثرات مستقیم:**
1. **تعداد بیشتر سالن‌ها** → انتخاب بیشتر برای مشتریان → جذب مشتریان بیشتر → انگیزه بیشتر برای سالن‌ها جهت عضویت
2. **تعداد بیشتر تیم‌ها** → رقابت‌های جذاب‌تر → جذب تماشاگر و اسپانسر
3. **تعداد بیشتر مربیان** → تخصص متنوع‌تر → کیفیت بالاتر تمرینات

**اثرات غیرمستقیم:**
1. **داده‌های رفتاری کاربران** → الگوریتم توصیه‌گر بهتر → تجربه شخصی‌سازی‌شده
2. **نظرات و امتیازات** → شفافیت بیشتر → اعتماد بیشتر → مشارکت بیشتر
3. **تعاملات اجتماعی** → تشکیل جامعه → وفاداری برند

### ۸.۲ معیارهای کلیدی اثر شبکه‌ای

```typescript
// src/analytics/networkEffects.ts
interface NetworkEffectMetrics {
  // ضریب ویروسی
  viralCoefficient: number  // تعداد کاربران جدید دعوت‌شده توسط هر کاربر
  
  // تراکم تعامل
  interactionDensity: {
    bookingsPerVenue: number
    messagesPerUser: number
    reviewsPerBooking: number
  }
  
  // ارزش شبکه
  networkValue: {
    totalConnections: number  // تعداد روابط بین کاربران
    averagePathLength: number  // میانگین فاصله بین دو کاربر
    clusteringCoefficient: number  // میزان خوشه‌بندی
  }
  
  // نقاط بحرانی
  criticalMassReached: {
    venues: boolean  // حداقل ۵۰ سالن فعال
    activeUsers: boolean  // حداقل ۱۰۰۰ کاربر ماهانه
    monthlyTransactions: boolean  // حداقل ۵۰۰۰ رزرو در ماه
  }
}
```

### ۸.۳ استراتژی‌های تقویت اثر شبکه‌ای

1. **برنامه ارجاع (Referral Program):**
   ```typescript
   interface ReferralReward {
     referrerBonus: number  // اعتبار برای دعوت‌کننده
     refereeBonus: number   // تخفیف برای دعوت‌شونده
     validFor: number  // روز
     maxReferrals: number
   }
   ```

2. **چالش‌های اجتماعی:**
   - لیگ‌های آنلاین با جدول امتیازات
   - مسابقات عکس از بهترین گل‌ها
   - رتبه‌بندی تیم‌های فعال

3. **محتوای تولیدشده توسط کاربر (UGC):**
   - امکان آپلود ویدیو از بازی‌ها
   - نوشتن مقاله درباره تکنیک‌ها
   - اشتراک‌گذاری استراتژی‌های تیمی

---

## ۹. فرصت‌های هوش مصنوعی بر اساس الگوهای بین‌نقشی

### ۹.۱ توصیه‌گر هوشمند (Recommendation Engine)

**برای مشتریان:**
```typescript
// src/services/ai/recommendations.ts
interface RecommendationRequest {
  userId: number
  context: {
    location: { lat: number; lng: number }
    budget: { min: number; max: number }
    preferredSports: string[]
    pastBookings: Booking[]
    ratings: VenueRating[]
  }
}

interface RecommendationResult {
  venues: RecommendedVenue[]
  coaches: RecommendedCoach[]
  teams: RecommendedTeam[]
  confidence: number  // 0-1
  reasoning: string[]  // توضیح دلایل توصیه
}

// مدل ML برای یادگیری ترجیحات
class PreferenceLearningModel {
  train(userHistory: UserActivity[]): Promise<Model>
  predict(userProfile: UserProfile, options: Option[]): Promise<ScoredOptions>
  explainPrediction(prediction: Prediction): Explanation
}
```

**برای مدیران سالن:**
- پیش‌بینی تقاضا برای سانس‌های آینده
- توصیه قیمت بهینه بر اساس فصل، روز هفته، رویدادهای محلی
- شناسایی الگوهای لغو رزرو

### ۹.۲ چت‌بات پشتیبانی چند‌زبانه

**قابلیت‌ها:**
- پاسخ به سوالات متداول درباره رزرو، پرداخت، لغو
- کمک به پیدا کردن سالن مناسب
- حل مشکلات فنی ساده
- ارجاع به اپراتور انسان در صورت نیاز

```typescript
// src/services/ai/chatbot.ts
interface ChatbotSession {
  userId: number
  conversation: Message[]
  intent: Intent
  entities: Entity[]
  suggestedActions: Action[]
}

type Intent = 
  | 'book_venue'
  | 'cancel_booking'
  | 'check_payment'
  | 'find_coach'
  | 'report_issue'
  | 'general_inquiry'

interface Entity {
  type: 'date' | 'time' | 'location' | 'price' | 'venue_name'
  value: any
  confidence: number
}
```

### ۹.۳ تحلیل احساسات نظرات

**هدف:** شناسایی خودکار مشکلات سالن‌ها از نظرات کاربران

```typescript
// src/services/ai/sentiment.ts
interface SentimentAnalysis {
  reviewId: number
  overallSentiment: 'positive' | 'neutral' | 'negative'
  score: number  // -1 to +1
  aspects: {
    cleanliness: { sentiment: string; score: number }
    equipment: { sentiment: string; score: number }
    staff: { sentiment: string; score: number }
    pricing: { sentiment: string; score: number }
  }
  keywords: string[]
  actionableInsights: string[]
}

// داشبورد مدیر سالن
const sentimentDashboard = {
  averageScore: 4.2,
  trendingIssues: ['تمیزی رختکن', 'کیفیت چمن'],
  positiveHighlights: ['برخورد پرسنل', 'امکانات پارکینگ'],
  recommendedActions: [
    'بررسی سیستم تهویه رختکن',
    'تعویض چمن زمین شماره ۲'
  ]
}
```

### ۹.۴ بهینه‌سازی پویای قیمت

**الگوریتم:**
```typescript
// src/services/ai/pricing.ts
interface DynamicPricingModel {
  inputs: {
    historicalDemand: Booking[]
    competitorPrices: CompetitorPrice[]
    seasonalFactors: {
      month: number
      holidays: string[]
      localEvents: Event[]
    }
    weatherForecast?: WeatherData
  }
  
  output: {
    recommendedPrice: number
    confidenceInterval: { min: number; max: number }
    expectedOccupancyRate: number
    revenueProjection: number
  }
  
  constraints: {
    minimumPrice: number
    maximumPrice: number
    maximumChangePercentage: number  // جلوگیری از تغییر ناگهانی
  }
}
```

---

## ۱۰. فرصت‌های درآمدی چند‌نقشی

### ۱۰.۱ مدل‌های درآمدی مستقیم

1. **کمیسیون از رزروها:**
   - ۵-۱۰٪ از هر رزرو موفق
   - تخفیف حجمی برای سالن‌های پربازده

2. **اشتراک ویژه (Premium Subscription):**
   ```typescript
   interface PremiumPlan {
     name: 'Basic' | 'Pro' | 'Enterprise'
     price: { monthly: number; yearly: number }
     features: {
       prioritySupport: boolean
       advancedAnalytics: boolean
       customBranding: boolean
       apiAccess: boolean
       dedicatedAccountManager: boolean
     }
     targetAudience: 'small_venue' | 'medium_chain' | 'large_enterprise'
   }
   ```

3. **تبلیغات هدفمند:**
   - بنرهای تبلیغاتی در صفحه جستجو
   - اسپانسرشیپ رقابت‌ها
   - تبلیغات native در فید اخبار

### ۱۰.۲ مدل‌های درآمدی غیرمستقیم

1. **فروش داده‌های ناشناس‌سازی‌شده:**
   - تحلیل‌های بازار به تولیدکنندگان تجهیزات ورزشی
   - الگوهای مصرف به سرمایه‌گذاران
   - روندهای صنعت به مشاوران

2. **خدمات ارزش‌افزوده:**
   - بیمه ورزشی برای بازیکنان
   - فروشگاه آنلاین تجهیزات
   - خدمات حمل‌ونقل به سالن‌ها

3. **آموزش و گواهینامه:**
   - دوره‌های آنلاین مربیگری
   - گواهینامه‌های رسمی
   - وبینارهای تخصصی

### ۱۰.۳ مدل درآمدی بازارگاه (Marketplace Revenue)

```typescript
// src/services/revenue/marketplace.ts
interface MarketplaceRevenueModel {
  // کمیسیون از معاملات
  transactionFee: {
    percentage: number  // ۳-۷٪
    minimumFee: number  // حداقل کارمزد
    cappedAt: number    // حداکثر کارمزد
  }
  
  // هزینه لیستینگ
  listingFee: {
    freeListings: number  // تعداد رایگان در ماه
    additionalListingCost: number
    featuredListingCost: number  // برای نمایش برجسته
  }
  
  // خدمات پریمیوم
  premiumServices: {
    verifiedBadge: number  // نشان تأیید
    priorityPlacement: number  // قرارگیری در صدر نتایج
    analyticsDashboard: number  // داشبورد تحلیل
  }
}
```

### ۱۰.۴ پیش‌بینی درآمد

**سناریو محافظه‌کارانه (سال اول):**
- ۱۰۰ سالن فعال
- ۵۰۰۰ کاربر ماهانه
- ۱۰,۰۰۰ رزرو در ماه
- میانگین کمیسیون: ۵۰,۰۰۰ تومان
- **درآمد ماهانه: ۵۰۰ میلیون تومان**

**سناریو رشد (سال دوم):**
- ۵۰۰ سالن فعال
- ۵۰,۰۰۰ کاربر ماهانه
- ۱۰۰,۰۰۰ رزرو در ماه
- درآمد از اشتراک‌ها: ۲۰۰ میلیون تومان
- درآمد از تبلیغات: ۱۰۰ میلیون تومان
- **درآمد ماهانه: ۷ میلیارد تومان**

---

## نتیجه‌گیری و توصیه‌های استراتژیک

### اولویت‌های کوتاه‌مدت (۳ ماهه)

1. **یکپارچه‌سازی سیستم اعلان‌ها** - ایجاد NotificationHub مرکزی
2. **استانداردسازی مدیریت خطا** - پیاده‌سازی ErrorHandler مشترک
3. **بهبود فرآیند رزرو** - افزودن پشتیبانی از رزرو تکراری و گروهی
4. **توسعه API یکپارچه جستجو** - UnifiedSearchService

### اولویت‌های میان‌مدت (۶ ماهه)

1. **پیاده‌سازی مدل چند‌نقشی کاربر** - Migration از single-role به multi-role
2. **راه‌اندازی بازارگاه خدمات** - Coaching marketplace + Slot auction
3. **اتوماسیون گزارش‌دهی** - Automated reporting engine
4. **سیستم توصیه‌گر پایه** - Collaborative filtering برای سالن‌ها

### اولویت‌های بلندمدت (۱۲ ماهه)

1. **هوش مصنوعی پیشرفته** - Dynamic pricing + Sentiment analysis
2. **اثر شبکه‌ای** - Referral program + Social challenges
3. **توسعه بین‌المللی** - Multi-language + Multi-currency
4. **اکوسیستم باز** - Public API + Developer portal

### معیارهای موفقیت

- **NPS (Net Promoter Score):** بالای ۵۰
- **نرخ حفظ کاربر ماهانه:** بالای ۷۰٪
- **میانگین رزرو به ازای هر کاربر:** بالای ۲ در ماه
- **زمان پاسخ پشتیبانی:** زیر ۲ ساعت
- **رضایت مدیران سالن:** بالای ۴.۵ از ۵

---

**تهیه‌شده توسط:** تیم تحلیل محصول  
**تاریخ:** اکتبر ۲۰۲۶  
**نسخه:** ۱.۰
