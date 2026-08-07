import { z } from 'zod'

export const emailSchema = z.string().email('ایمیل معتبر وارد کنید')

export const phoneSchema = z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر وارد کنید')

export const passwordSchema = z.string().min(6, 'رمز عبور حداقل 6 کاراکتر')

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'نام حداقل 3 کاراکتر'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تکرار آن مطابقت ندارند',
    path: ['confirmPassword'],
  })

export const venueSchema = z.object({
  name: z.string().min(3, 'نام حداقل 3 کاراکتر'),
  address: z.string().min(5, 'آدرس حداقل 5 کاراکتر'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: phoneSchema,
  description: z.string().optional(),
  amenities: z.array(z.string()),
  images: z.array(z.string()),
  price: z.number().min(10000, 'قیمت حداقل ۱۰,۰۰۰ تومان'),
})

export const bookingSchema = z.object({
  venueId: z.string().min(1, 'لطفاً سالن را انتخاب کنید'),
  date: z.string().min(1, 'لطفاً تاریخ را انتخاب کنید'),
  slotId: z.string().min(1, 'لطفاً سانس را انتخاب کنید'),
})

export const contractSchema = z.object({
  venueId: z.string().min(1, 'لطفاً سالن را انتخاب کنید'),
  startDate: z.string().min(1, 'لطفاً تاریخ شروع را انتخاب کنید'),
  endDate: z.string().min(1, 'لطفاً تاریخ پایان را انتخاب کنید'),
  recurrence: z.string().min(1, 'لطفاً نوع تکرار را انتخاب کنید'),
  dayOfWeek: z.string().min(1, 'لطفاً روز هفته را انتخاب کنید'),
  startTime: z.string().min(1, 'لطفاً ساعت شروع را انتخاب کنید'),
  pricePerSession: z.number().min(10000, 'قیمت هر جلسه حداقل ۱۰,۰۰۰ تومان'),
})