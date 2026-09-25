// سرویس بروزرسانی درون‌برنامه‌ای — مانیفست /updates/latest.json روی سرور
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

export interface UpdateManifest {
  version: string
  notes: string[]
  pub_date: string
  force: boolean
  min_supported: string
  apk: string
  size: number
}

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function fetchUpdateManifest(): Promise<UpdateManifest> {
  const base = (import.meta.env.VITE_DOMAIN || '').replace(/\/+$/, '')
  const url = `${base}/updates/latest.json?t=${Date.now()}`
  const doFetch = isTauri() ? tauriFetch : window.fetch.bind(window)
  const res = await doFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<UpdateManifest>
}

// مقایسه نسخه نقطه‌ای: '0.1.2' > '0.1.0'
export function isNewer(candidate: string, current: string): boolean {
  const a = candidate.split('.').map((n) => parseInt(n, 10) || 0)
  const b = current.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return import.meta.env.VITE_APP_VERSION || '0.1.0-web'
  const { getVersion } = await import('@tauri-apps/api/app')
  return getVersion()
}
