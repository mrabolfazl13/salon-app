
import toast from 'react-hot-toast'

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
      icon: '✅',
    })
  }

  const error = (message: string) => {
    toast.error(message, {
      duration: 4000,
      icon: '❌',
    })
  }

  const info = (message: string) => {
    toast(message, {
      duration: 3000,
      icon: 'ℹ️',
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