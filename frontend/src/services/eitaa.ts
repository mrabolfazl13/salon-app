// frontend/src/services/eitaa.ts
// تنظیمات کانال ایتای سالن — فقط مدیر سالن ( یا کارکن با دسترسی slot.generate).
// توکن ایتایار هرگز در پاسخ GET برگردانده نمیشود؛ فقط هنگام ذخیره ارسال میشود.

import apiClient from './api'

export interface EitaaChannel {
  venue_id: number
  chat_id: string
  is_active: boolean
  pin_updates: boolean
  last_post_date?: string | null
  last_message_id?: number | null
  last_error?: string | null
}

export interface EitaaChannelInput {
  chat_id: string
  bot_token: string
  is_active: boolean
  pin_updates: boolean
}

export const eitaaService = {
  get: (venueId: number): Promise<EitaaChannel> =>
    apiClient.get<EitaaChannel>(`/venues/${venueId}/eitaa-channel`).then((r) => r.data),

  upsert: (venueId: number, data: EitaaChannelInput): Promise<EitaaChannel> =>
    apiClient.put<EitaaChannel>(`/venues/${venueId}/eitaa-channel`, data).then((r) => r.data),

  remove: (venueId: number): Promise<void> =>
    apiClient.delete(`/venues/${venueId}/eitaa-channel`).then(() => undefined),

  postNow: (venueId: number): Promise<{ message_id: number; day: string; reposted: boolean }> =>
    apiClient
      .post<{ message_id: number; day: string; reposted: boolean }>(
        `/venues/${venueId}/eitaa-channel/post-now`,
      )
      .then((r) => r.data),
}
