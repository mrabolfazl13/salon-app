import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'

/**
 * این دیالوگ را ۳۳ فایل مصرف می‌کند و هیچ تستی از رفتار دسترس‌پذیری‌اش نداشت.
 * سه چیزی که shim باید تضمین کند و بدون تست، هر بازآرایی‌ای می‌تواند خرابشان کند:
 * نام قابل‌دسترسِ دیالوگ، بستن با Esc/دکمهٔ «بستن»، و ارجاع‌نداشتن به عنوانِ نبود.
 */
describe('دیالوگ مشترک پروژه', () => {
  it('با عنوان: صفحه‌خوان دیالوگ را بی‌نام اعلام نمی‌کند', () => {
    render(
      <Dialog open onClose={() => {}} title="افزودن کارمند">
        <p>محتوا</p>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName('افزودن کارمند')
  })

  it('بدون عنوان: aria-labelledby به شناسهٔ ناموجود اشاره نمی‌کند', () => {
    render(
      <Dialog open onClose={() => {}}>
        <p>محتوا</p>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    const ref = dialog.getAttribute('aria-labelledby')
    expect(ref === null || ref === undefined || document.getElementById(ref) !== null).toBe(true)
  })

  it('آیکون کنار عنوان تزئینی است و وارد نام دیالوگ نمی‌شود', () => {
    render(
      <Dialog
        open
        onClose={() => {}}
        title="حذف تراکنش"
        titleIcon={<Icon icon="mdi:trash-can-outline" />}
      >
        <p>محتوا</p>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName('حذف تراکنش')
  })

  it('Esc و دکمهٔ «بستن» هر دو onClose را صدا می‌زنند', () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="تنظیمات">
        <p>محتوا</p>
      </Dialog>,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'بستن' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('اقدامات پایین دیالوگ می‌آیند و قابل‌دسترس‌اند', () => {
    render(
      <Dialog open onClose={() => {}} title="ثبت هزینه" actions={<Button_Spy />}>
        <p>محتوا</p>
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'ثبت' })).toBeInTheDocument()
  })
})

function Button_Spy() {
  return <button type="button">ثبت</button>
}
