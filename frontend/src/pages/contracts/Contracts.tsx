// frontend/src/pages/contracts/Contracts.tsx
// «قراردادهای من» — تب‌های وضعیت بر پایه نگارخانه مرکزی (شامل pending و rejected
// با بنر «در انتظار تأیید مدیر» و نمایش دلیل رد)، دیالوگ درخواست جدید.

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import ContractList from '@/components/contract/ContractList'
import ContractForm from '@/components/contract/ContractForm'
import { EmptyBox, ErrorBox } from '@/components/contract/shared'
import { CONTRACT_TAB_STATUSES } from '@/components/contract/shared'
import { useMyContracts } from '@/hooks/useContracts'
import { venueService } from '@/services/venue'
import { toPersianDigits } from '@/lib/jalali'
import { Button } from '@/components/ui/shadcn/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import Dialog from '@/components/ui/Dialog'
import toast from 'react-hot-toast'

const PAGE_TABS = ['all', ...CONTRACT_TAB_STATUSES] as const
type ContractTab = (typeof PAGE_TABS)[number]

const TAB_LABELS: Record<ContractTab, string> = {
  all: 'همه',
  pending: 'در انتظار تأیید',
  active: 'فعال',
  rejected: 'رد شده',
  expired: 'منقضی',
  cancelled: 'لغو شده',
}

const Contracts: React.FC = () => {
  const [tab, setTab] = useState<ContractTab>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [venues, setVenues] = useState<Array<{ id: number; name: string }>>([])
  const navigate = useNavigate()
  const contractsQuery = useMyContracts()

  const contracts = useMemo(() => contractsQuery.data ?? [], [contractsQuery.data])

  const venueNames = useMemo(() => {
    const map: Record<number, string> = {}
    venues.forEach((v) => { map[v.id] = v.name })
    contracts.forEach((c) => {
      if (!map[c.venue_id]) map[c.venue_id] = `سالن #${toPersianDigits(c.venue_id)}`
    })
    return map
  }, [venues, contracts])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contracts.length }
    for (const s of CONTRACT_TAB_STATUSES) c[s] = contracts.filter((x) => x.status === s).length
    return c
  }, [contracts])

  const filtered = tab === 'all' ? contracts : contracts.filter((c) => c.status === tab)

  const openCreate = async () => {
    try {
      const data = await venueService.getAll()
      setVenues(Array.isArray(data) ? data.map((v: { id: number; name: string }) => ({ id: v.id, name: v.name })) : [])
    } catch {
      setVenues([])
    }
    setCreateOpen(true)
  }

  return (
    <Layout>
      <div className="py-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-foreground">قراردادهای من</h1>
            <Button
              onClick={openCreate}
              className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-900/20"
            >
              <Icon icon="mdi:plus" aria-hidden="true" className="h-5 w-5" />
              قرارداد جدید
            </Button>
          </div>
          <p className="mb-4 text-muted-foreground">
            درخواست قرارداد بلندمدت ثبت و اقساط آن را پیگیری کنید
          </p>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ContractTab)} className="mb-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
            {PAGE_TABS.map((t) => (
              <TabsTrigger key={t} value={t} className="min-h-10 whitespace-nowrap px-3">
                {`${TAB_LABELS[t]} (${toPersianDigits(counts[t] ?? 0)})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {contractsQuery.isError ? (
          <ErrorBox
            message="در دریافت قراردادها خطایی رخ داد."
            onRetry={() => contractsQuery.refetch()}
          />
        ) : contractsQuery.isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} aria-hidden="true" className="h-[160px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-foreground/[0.02] py-16 text-center">
            <EmptyBox
              icon="mdi:file-document-remove-outline"
              title="قراردادی یافت نشد"
              text={tab === 'pending'
                ? 'درخواست در انتظار تأییدی ندارید'
                : 'هنوز قراردادی در این وضعیت ندارید'}
            />
            <Button
              onClick={openCreate}
              className="mt-4 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-900/20"
            >
              <Icon icon="mdi:plus" aria-hidden="true" className="h-5 w-5" />
              ایجاد قرارداد جدید
            </Button>
          </div>
        ) : (
          <ContractList
            contracts={filtered}
            venueNames={venueNames}
            onView={(id) => navigate(`/contracts/${id}`)}
          />
        )}

        {tab === 'pending' && !contractsQuery.isLoading && (counts.pending ?? 0) > 0 && (
          <Alert variant="info" className="mt-6 rounded-xl">
            <Icon icon="mdi:account-clock-outline" aria-hidden="true" className="h-5 w-5" />
            <AlertDescription>
              درخواست‌های «در انتظار تأیید» برای مدیر سالن ارسال شده‌اند؛ سانس‌های درخواستی تا بررسی نهایی در دست شما رزرو می‌مانند.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        aria-label="ثبت درخواست قرارداد بلندمدت"
        maxWidth="md"
        fullWidth
      >
        <ContractForm
          venues={venues}
          onSuccess={() => {
            setCreateOpen(false)
            contractsQuery.refetch()
          }}
          onError={(msg) => toast.error(msg)}
        />
      </Dialog>
    </Layout>
  )
}

export default Contracts
