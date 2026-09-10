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
}
