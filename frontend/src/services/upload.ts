import apiClient from './api'

export const uploadService = {
  /** آپلود چندین عکس به MinIO و برگرداندن URLهای آن‌ها */
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    const response = await apiClient.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data.urls as string[]
  },

  /** آپلود یک فیش واریزی (فیلد multipart با نام file) — خروجی: url */
  uploadReceipt: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/upload/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data.url as string
  },
}