import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { LinearProgress } from '@mui/material'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useUpdateStore } from '@/store/updateStore'

const faDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} مگابایت`

const UpdateDialog: React.FC = () => {
  const {
    dialogOpen,
    phase,
    manifest,
    currentVersion,
    progress,
    error,
    startDownload,
    installDownloaded,
    remindLater,
    skipVersion,
    closeDialog,
  } = useUpdateStore()

  if (!dialogOpen) return null

  const force = manifest?.force ?? false
  const pct = progress.total > 0 ? Math.min(100, (progress.received / progress.total) * 100) : 0

  return (
    <Dialog open onClose={closeDialog} maxWidth="sm">
      <div className="text-center py-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="mx-auto"
        >
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
              phase === 'error'
                ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                : phase === 'up-to-date'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-gradient-to-br from-lime-400 to-emerald-500 text-white shadow-lg',
            )}
          >
            <Icon
              icon={
                phase === 'error'
                  ? 'mdi:alert-circle-outline'
                  : phase === 'up-to-date'
                    ? 'mdi:check-circle-outline'
                    : 'mdi:cellphone-arrow-down'
              }
              className="h-8 w-8"
            />
          </div>
        </motion.div>

        {phase === 'checking' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">در حال بررسی بروزرسانی…</h2>
            <div className="py-4"><LinearProgress /></div>
          </>
        )}

        {phase === 'up-to-date' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">همه‌چیز به‌روز است</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              نسخهٔ فعلی شما {currentVersion || manifest?.version} است و نسخهٔ جدیدتری منتشر نشده.
            </p>
            <div className="flex justify-center mt-5">
              <Button onClick={closeDialog}>باشه</Button>
            </div>
          </>
        )}

        {phase === 'error' && !manifest && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">بروزرسانی ممکن نشد</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-6">{error}</p>
            <div className="flex justify-center mt-5">
              <Button onClick={closeDialog}>بستن</Button>
            </div>
          </>
        )}

        {(phase === 'available' || phase === 'downloading' || phase === 'ready' || phase === 'error') && manifest && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              نسخهٔ جدید {manifest.version}
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              {faDate(manifest.pub_date)} · {mb(manifest.size)}
              {force ? ' · نصب این بروزرسانی الزامی است' : ''}
            </p>

            <ul className="text-right text-sm text-gray-600 dark:text-gray-300 space-y-1.5 mb-3 px-2">
              {manifest.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icon icon="mdi:soccer-ball" className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>

            {phase === 'downloading' && (
              <div className="px-2 pb-2">
                <LinearProgress variant="determinate" value={pct} className="rounded-full" />
                <p className="text-xs text-gray-400 mt-2 tabular-nums">
                  {mb(progress.received)} از {mb(progress.total || manifest.size)}
                </p>
              </div>
            )}

            {phase === 'ready' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                دانلود تمام شد — در حال باز کردن نصب‌کننده…
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 mb-2 leading-5">{error}</p>
            )}

            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              {phase === 'error' && !force && (
                <>
                  <Button variant="outline" onClick={remindLater}>بعداً</Button>
                  <Button variant="outline" onClick={skipVersion}>رد کردن این نسخه</Button>
                </>
              )}
              {phase === 'error' && <Button variant="outline" onClick={closeDialog}>بستن</Button>}
              {phase === 'available' && (
                <>
                  {!force && <Button variant="outline" onClick={remindLater}>بعداً اطلاع‌رسانی کن</Button>}
                  {!force && <Button variant="outline" onClick={skipVersion}>رد کردن این نسخه</Button>}
                  <Button onClick={startDownload}>دانلود و نصب</Button>
                </>
              )}
              {phase === 'downloading' && !force && (
                <Button variant="outline" disabled>در حال دانلود…</Button>
              )}
              {phase === 'ready' && <Button onClick={installDownloaded}>شروع نصب</Button>}
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

export default UpdateDialog
