/**
 * نگهبانِ الگوی «نامِ قابل‌دسترسِ input» در این اپ.
 * شش فیلد فقط‌با-placeholder (ورود، جستجوی تیم، برچسب CRM، دسته‌بندی مالی،
 * امکانات داشبورد مدیر، جستجوی ادمین) `aria-label` را روی ریشۀ
 * `TextField`/`InputBase` می‌دادند؛ MUI آن را روی divوالد می‌گذارد و خودِ input
 * بی‌نام می‌ماند (صفحه‌خوان فقط placeholder را می‌خواند). چهارتا از آن شش پشتِ
 * احراز هویت‌اند و بدون حساب تست (X1) دیدنی نیستند، پس الگو همین‌جا قفل می‌شود
 * و ادعا در سطح واحد می‌ماند، نه روی دستگاه.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InputBase, TextField } from '@mui/material'

describe('نام قابل‌دسترسِ فیلدهای بی‌برچسب', () => {
  it('slotProps.htmlInput روی TextField نام را به خودِ input می‌رساند', () => {
    render(
      <TextField
        placeholder="09xxxxxxxxx"
        slotProps={{ htmlInput: { 'aria-label': 'شماره تلفن همراه', inputMode: 'tel' } }}
      />,
    )
    const input = screen.getByLabelText('شماره تلفن همراه')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('inputmode', 'tel')
  })

  it('aria-label روی ریشۀ TextField (الگوی شکسته) input را بی‌نام می‌گذارد', () => {
    render(<TextField placeholder="09xxxxxxxxx" aria-label="شماره تلفن همراه" />)
    // نام روی divوالد می‌نشیند: خودِ input هیچ aria-label ندارد و آنچه
    // getByLabelText برمی‌گرداند همان div است نه کنترلی که کاربر تایپ می‌کند
    expect(document.querySelector('input[aria-label="شماره تلفن همراه"]')).toBeNull()
    expect(screen.getByLabelText('شماره تلفن همراه').tagName).toBe('DIV')
  })

  it('slotProps.input روی InputBase (جستجوی ادمین) همان کار را می‌کند', () => {
    render(
      <InputBase
        placeholder="جستجوی نام یا شماره موبایل..."
        slotProps={{ input: { 'aria-label': 'جستجوی کاربران' } }}
      />,
    )
    expect(screen.getByLabelText('جستجوی کاربران').tagName).toBe('INPUT')
  })
})
