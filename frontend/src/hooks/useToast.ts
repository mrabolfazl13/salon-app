
import toast from 'react-hot-toast'
import { createElement } from 'react'

// ایموجی به‌عنوان icon برای صفحه‌خوان «heavy check mark» خوانده می‌شود؛ نقشش تزئینی است
// پس aria-hidden (این فایل .ts است، پس JSX نمی‌شود نوشت).
const glyph = (ch: string) => createElement('span', { 'aria-hidden': true }, ch)

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
      icon: glyph('✅'),
    })
  }

  const error = (message: string) => {
    toast.error(message, {
      duration: 4000,
      icon: glyph('❌'),
      // پیش‌فرض کتابخانه role=status/live=polite است؛ خطا باید فوری اعلام شود (WCAG 4.1.3)
      ariaProps: { role: 'alert', 'aria-live': 'assertive' },
    })
  }

  const info = (message: string) => {
    toast(message, {
      duration: 3000,
      icon: glyph('ℹ️'),
    })
  }

  const loading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    info,
    loading,
    dismiss,
  }
}