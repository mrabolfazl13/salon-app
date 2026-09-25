// استور بروزرسانی — چک خودکار، دانلود APK با پیشرفت، فراخوانی نصب‌کننده
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  fetchUpdateManifest,
  getAppVersion,
  isNewer,
  isTauri,
  type UpdateManifest,
} from '@/services/update'

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'up-to-date'

const AUTO_CHECK_HOURS = 18
const SNOOZE_HOURS = 24

interface UpdateState {
  phase: UpdatePhase
  dialogOpen: boolean
  manifest: UpdateManifest | null
  currentVersion: string
  progress: { received: number; total: number }
  error: string | null
  downloadedFile: string | null
  availableSilently: boolean
  manual: boolean

  dismissedVersion: string | null
  lastAutoCheckAt: number
  snoozeUntil: number
  snoozedVersion: string | null

  runAutoCheck: () => Promise<void>
  check: (manual?: boolean) => Promise<void>
  startDownload: () => Promise<void>
  installDownloaded: () => Promise<void>
  remindLater: () => void
  skipVersion: () => void
  closeDialog: () => void
  setDismissedVersion: (v: string | null) => void
}

const fmtErr = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'خطای نامشخص'

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => {
      let unlistenProgress: (() => void) | null = null

      const openAvailable = (m: UpdateManifest) =>
        set({ phase: 'available', manifest: m, dialogOpen: true, error: null, progress: { received: 0, total: m.size } })

      return {
        phase: 'idle',
        dialogOpen: false,
        manifest: null,
        currentVersion: '',
        progress: { received: 0, total: 0 },
        error: null,
        downloadedFile: null,
        availableSilently: false,
        manual: false,

        dismissedVersion: null,
        lastAutoCheckAt: 0,
        snoozeUntil: 0,
        snoozedVersion: null,

        runAutoCheck: async () => {
          if (!isTauri()) return
          const s = get()
          const now = Date.now()
          if (now - s.lastAutoCheckAt < AUTO_CHECK_HOURS * 3600_000) return
          set({ lastAutoCheckAt: now })
          try {
            const [m, current] = await Promise.all([fetchUpdateManifest(), getAppVersion()])
            set({ currentVersion: current })
            if (!isNewer(m.version, current)) return
            if (s.dismissedVersion === m.version) return
            if (!m.force && s.snoozedVersion === m.version && now < s.snoozeUntil) return
            set({ availableSilently: true })
            // دیالوگ خودکار فقط یک بار در هر راه‌اندازی؛ force همیشه نمایش داده می‌شود
            openAvailable(m)
          } catch {
            /* چک خودکار بی‌صدا شکست می‌خورد */
          }
        },

        check: async (manual = true) => {
          if (!isTauri()) {
            set({ phase: 'error', dialogOpen: true, error: 'بروزرسانی درون‌برنامه‌ای فقط در اپ موبایل فعال است.' })
            return
          }
          set({ phase: 'checking', dialogOpen: manual ? true : get().dialogOpen, manual, error: null })
          try {
            const [m, current] = await Promise.all([fetchUpdateManifest(), getAppVersion()])
            set({ currentVersion: current })
            if (isNewer(m.version, current)) {
              set({ availableSilently: true })
              openAvailable(m)
            } else {
              set({ phase: 'up-to-date', manifest: m, dialogOpen: true })
            }
          } catch (e) {
            set({ phase: 'error', dialogOpen: true, error: `خطا در بررسی بروزرسانی: ${fmtErr(e)}` })
          }
        },

        startDownload: async () => {
          const { manifest } = get()
          if (!manifest) return
          set({ phase: 'downloading', error: null, progress: { received: 0, total: manifest.size } })
          try {
            unlistenProgress?.()
            unlistenProgress = await listen<{ received: number; total: number; done: boolean }>(
              'update://progress',
              ({ payload }) => set({ progress: { received: payload.received, total: payload.total } }),
            )
            const fileName = await invoke<string>('download_update', {
              url: manifest.apk,
              version: manifest.version,
            })
            set({ phase: 'ready', downloadedFile: fileName })
            await get().installDownloaded()
          } catch (e) {
            set({ phase: 'error', error: `دانلود ناموفق بود: ${fmtErr(e)}` })
          } finally {
            unlistenProgress?.()
            unlistenProgress = null
          }
        },

        installDownloaded: async () => {
          const { downloadedFile } = get()
          if (!downloadedFile) return
          try {
            await invoke('install_update', { fileName: downloadedFile })
            set({ dialogOpen: false, phase: 'idle' })
          } catch (e) {
            const msg = fmtErr(e)
            if (msg === 'INSTALL_UNSUPPORTED') {
              set({ phase: 'available', error: 'نصب خودکار در این پلتفرم پشتیبانی نمی‌شود؛ فایل دانلودشده را از پوشه دانلودها باز کنید.' })
            } else {
              set({ phase: 'ready', error: `نشست نصب باز نشد (${msg}). دوباره تلاش کنید یا فایل «${downloadedFile}» را از حافظه برنامه باز کنید.` })
            }
          }
        },

        remindLater: () => {
          const m = get().manifest
          set({
            dialogOpen: false,
            phase: 'idle',
            snoozeUntil: Date.now() + SNOOZE_HOURS * 3600_000,
            snoozedVersion: m?.version ?? null,
          })
        },

        skipVersion: () => {
          const m = get().manifest
          set({ dialogOpen: false, phase: 'idle', dismissedVersion: m?.version ?? null })
        },

        closeDialog: () => {
          const { manifest, phase } = get()
          if (phase === 'downloading') return
          if (manifest?.force) return
          set({ dialogOpen: false, phase: 'idle' })
        },

        setDismissedVersion: (v) => set({ dismissedVersion: v }),
      }
    },
    {
      name: 'futsal-update-store',
      partialize: (s) => ({
        dismissedVersion: s.dismissedVersion,
        lastAutoCheckAt: s.lastAutoCheckAt,
        snoozeUntil: s.snoozeUntil,
        snoozedVersion: s.snoozedVersion,
      }),
    },
  ),
)
