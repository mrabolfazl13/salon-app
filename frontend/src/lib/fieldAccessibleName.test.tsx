/**
 * نگهبانِ الگوی «نامِ قابل‌دسترسِ input» در این اپ.
 * شش فیلد فقط‌با-placeholder (ورود، جستجوی تیم، برچسب CRM، دسته‌بندی مالی،
 * امکانات داشبورد مدیر، جستجوی ادمین) `aria-label` را روی ریشهٔ کامپوننت
 * می‌دادند؛ آن‌گاه نام روی divِ والد می‌نشست و خودِ input بی‌نام می‌ماند
 * (صفحه‌خوان فقط placeholder را می‌خواند). چهارتا از آن شش پشتِ
 * احراز هویت‌اند و بدون حساب تست (X1) دیدنی نیستند، پس الگو همین‌جا قفل می‌شود
 * و ادعا در سطح واحد می‌ماند، نه روی دستگاه.
 *
 * پس از حذف MUI همان قرارداد روی Input/Textarea (shadcn، عناصر بومی DOM)
 * بررسی می‌شود: نام باید به خودِ کنترل برسد، نه به پوستهٔ والد.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Label } from '@/components/ui/shadcn/label'

describe('نام قابل‌دسترسِ فیلدهای بی‌برچسب', () => {
  it('aria-label روی Input نام را به خودِ input می‌رساند', () => {
    render(<Input placeholder="09xxxxxxxxx" aria-label="شماره تلفن همراه" inputMode="tel" />)
    const input = screen.getByLabelText('شماره تلفن همراه')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('inputmode', 'tel')
  })

  it('aria-label روی ریشهٔ والد (الگوی شکسته) input را بی‌نام می‌گذارد', () => {
    render(
      <div aria-label="شماره تلفن همراه">
        <Input placeholder="09xxxxxxxxx" />
      </div>,
    )
    // نام روی divِ والد می‌نشیند: خودِ input هیچ aria-label ندارد و آنچه
    // getByLabelText برمی‌گرداند همان div است نه کنترلی که کاربر تایپ می‌کند
    expect(document.querySelector('input[aria-label="شماره تلفن همراه"]')).toBeNull()
    expect(screen.getByLabelText('شماره تلفن همراه').tagName).toBe('DIV')
  })

  it('aria-label روی Textarea (جستجوی ادمین) همان کار را می‌کند', () => {
    render(
      <Textarea
        placeholder="جستجوی نام یا شماره موبایل..."
        aria-label="جستجوی کاربران"
      />,
    )
    expect(screen.getByLabelText('جستجوی کاربران').tagName).toBe('TEXTAREA')
  })

  it('Label با htmlFor کنترل را نام‌دار می‌کند', () => {
    render(
      <>
        <Label htmlFor="profile-full-name">نام کامل</Label>
        <Input id="profile-full-name" />
      </>,
    )
    expect(screen.getByLabelText('نام کامل').tagName).toBe('INPUT')
  })
})
