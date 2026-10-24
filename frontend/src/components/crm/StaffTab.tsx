// frontend/src/components/crm/StaffTab.tsx
// «پرسنل» — جدول انتصاب‌ها (GET /staff) + افزودن/حذف نرم + تغییر inline موقعیت +
// نمودار دسترسی‌ها (ماتریس utils/permissions.py) + زیرلیست ممیزی امنیتی (GET /staff/audit).

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Dialog from '@/components/ui/Dialog'
import { Alert } from '@/components/ui/shadcn/alert'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Switch } from '@/components/ui/shadcn/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { EmptyBox, ErrorBox, LoadingBox, Pager, SectionCard, extractError } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useRemoveStaff, useStaffAudit, useStaffList, useCreateStaff, useUpdateStaff } from '@/hooks/useCrm'
import {
  ALL_PERMISSION_CODES,
  POSITION_DEFAULT_PERMISSIONS,
  type StaffPosition,
  type StaffRow,
} from '@/services/staff'
import {
  ForbiddenPanel,
  PERMISSION_LABELS,
  PermissionMatrixRow,
  POSITION_DESCRIPTIONS,
  POSITION_LABELS,
  POSITION_ORDER,
  crmErrorMessage,
  isForbidden,
} from './shared'

const AUDIT_PAGE_SIZE = 10

const AUDIT_ACTIONS = [
  '', 'staff.created', 'staff.recreated', 'staff.updated', 'staff.removed',
  'crm.campaign_sent', 'permission.denied',
] as const

const AUDIT_ACTION_LABELS: Record<string, string> = {
  '': 'همه رویدادها',
  'staff.created': 'انتصاب جدید',
  'staff.recreated': 'احیای انتصاب',
  'staff.updated': 'تغییر دسترسی/موقعیت',
  'staff.removed': 'حذف انتصاب',
  'crm.campaign_sent': 'ارسال کمپین',
  'permission.denied': 'تلاش دسترسی رد شده',
}

const matrixSets: Record<StaffPosition, Set<string>> = {
  branch_manager: new Set(POSITION_DEFAULT_PERMISSIONS.branch_manager),
  reception: new Set(POSITION_DEFAULT_PERMISSIONS.reception),
  cashier: new Set(POSITION_DEFAULT_PERMISSIONS.cashier),
  accountant: new Set(POSITION_DEFAULT_PERMISSIONS.accountant),
}

function auditIcon(action: string): { icon: string; color: string } {
  if (action === 'permission.denied') return { icon: 'mdi:lock-alert-outline', color: '#ef4444' }
  if (action === 'staff.removed') return { icon: 'mdi:account-remove', color: '#ef4444' }
  if (action === 'crm.campaign_sent') return { icon: 'mdi:message-alert', color: '#d97706' }
  if (action === 'staff.recreated') return { icon: 'mdi:account-refresh', color: '#059669' }
  if (action === 'staff.updated') return { icon: 'mdi:account-cog', color: '#2563eb' }
  return { icon: 'mdi:account-plus', color: '#2563eb' }
}

interface Props {
  venueId: number
}

const StaffTab: React.FC<Props> = ({ venueId }) => {
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StaffRow | null>(null)
  const [auditPage, setAuditPage] = useState(1)
  const [auditAction, setAuditAction] = useState<string>('')

  const includeInactiveId = useId()

  const staffQuery = useStaffList(venueId, includeInactive)
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const removeStaff = useRemoveStaff()

  const auditQuery = useStaffAudit({
    venue_id: venueId,
    action: auditAction || undefined,
    limit: AUDIT_PAGE_SIZE,
    offset: (auditPage - 1) * AUDIT_PAGE_SIZE,
  })

  const rows = staffQuery.data ?? []
  const auditItems = auditQuery.data?.items ?? []
  const auditTotal = auditQuery.data?.total ?? 0
  const auditPages = Math.max(1, Math.ceil(auditTotal / AUDIT_PAGE_SIZE))

  const changePosition = (row: StaffRow, position: StaffPosition) => {
    updateStaff.mutate(
      { id: row.id, data: { position } },
      {
        onSuccess: () => toast.success('موقعیت شغلی تغییر کرد'),
        onError: (err) => toast.error(crmErrorMessage(err, 'تغییر موقعیت ناموفق بود')),
      },
    )
  }

  const resetCustomPermissions = (row: StaffRow) => {
    updateStaff.mutate(
      { id: row.id, data: { permissions: [] } },
      {
        onSuccess: () => toast.success('دسترسی‌ها به پیش‌فرض موقعیت بازگشت'),
        onError: (err) => toast.error(crmErrorMessage(err, 'بازگشت به پیش‌فرض ناموفق بود')),
      },
    )
  }

  const confirmRemove = () => {
    if (!removeTarget) return
    removeStaff.mutate(removeTarget.id, {
      onSuccess: () => {
        toast.success('انتصاب حذف شد (نرم — با انتصاب مجدد احیا می‌شود)')
        setRemoveTarget(null)
      },
      onError: (err) => toast.error(crmErrorMessage(err, 'حذف انتصاب ناموفق بود')),
    })
  }

  const activeCount = rows.filter((r) => r.is_active).length

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title={`کارکنان سالن (${toPersianDigits(activeCount)} فعال)`}
        icon="mdi:badge-account-outline"
        color="#2563eb"
      >
        {/* نوار ابزار زیر عنوان: در ۳۹۰px عنوان سرتیتر در برابر سوئیچ+دکمه به یک حرف خلاصه می‌شد */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id={includeInactiveId}
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <Label htmlFor={includeInactiveId} className="cursor-pointer text-[0.68rem] font-semibold text-foreground">
              نمایش حذف‌شده‌ها
            </Label>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="font-bold">
            <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden="true" />
            افزودن کارمند
          </Button>
        </div>
        {staffQuery.isPending ? (
          <LoadingBox text="در حال دریافت کارکنان..." />
        ) : staffQuery.isError ? (
          isForbidden(staffQuery.error) ? <ForbiddenPanel detail="مدیریت کارکنان به دسترسی staff.manage نیاز دارد." /> : <ErrorBox message={crmErrorMessage(staffQuery.error, 'دریافت کارکنان ممکن نشد')} onRetry={() => staffQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyBox icon="mdi:badge-account-outline" title="هنوز کارمندی انتصاب نشده" text="با دکمه «افزودن کارمند» کاربرِ ثبت‌نام‌شده را با شماره موبایل انتصاب دهید." />
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <Table aria-label="لیست کارکنان سالن" className="min-w-[720px]">
              <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableRow className="hover:bg-transparent">
                  {['کارمند', 'موبایل', 'موقعیت', 'دسترسی‌ها', 'وضعیت', 'عملیات'].map((h, i) => (
                    <TableHead key={i} scope="col" className="whitespace-nowrap font-extrabold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className={row.is_active ? 'hover:bg-muted/50' : 'opacity-60 hover:bg-muted/50'}>
                    <TableCell className="font-bold text-foreground">{row.user_name ?? '—'}</TableCell>
                    <TableCell dir="ltr" className="tabular-nums text-foreground">{row.user_phone ?? '—'}</TableCell>
                    <TableCell>
                      {row.is_active ? (
                        <div className="min-w-[138px]">
                          <Select
                            value={POSITION_ORDER.includes(row.position as StaffPosition) ? row.position : 'reception'}
                            onValueChange={(v) => changePosition(row, v as StaffPosition)}
                            disabled={updateStaff.isPending}
                          >
                            <SelectTrigger aria-label="سمت" className="min-h-11 rounded-xl text-[0.8rem] font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {POSITION_ORDER.map((pos) => (
                                <SelectItem key={pos} value={pos}>{POSITION_LABELS[pos]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="inline-flex h-5 items-center rounded-lg border border-border px-2 text-[0.68rem] font-bold text-foreground">
                          {POSITION_LABELS[row.position as StaffPosition] ?? String(row.position)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.is_custom_permissions ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex max-w-[330px] flex-wrap items-center gap-1">
                              {row.permissions.slice(0, 4).map((code) => (
                                <span key={code} className="inline-flex h-[18px] items-center rounded-md bg-violet-600/[0.08] px-1.5 text-[0.6rem] font-bold text-violet-700 dark:text-violet-300">
                                  {code}
                                </span>
                              ))}
                              {row.permissions.length > 4 && (
                                <span className="inline-flex h-[18px] items-center rounded-md bg-muted px-1.5 text-[0.6rem] font-bold text-foreground">
                                  {'+' + toPersianDigits(row.permissions.length - 4)}
                                </span>
                              )}
                              {row.is_active && (
                                <button
                                  type="button"
                                  onClick={() => resetCustomPermissions(row)}
                                  disabled={updateStaff.isPending}
                                  aria-label="بازگرداندن دسترسی به پیش‌فرض"
                                  className="inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:text-blue-400"
                                >
                                  <Icon icon="mdi:restore" className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>دسترسی سفارشی — با آیکن بازگشت به پیش‌فرض موقعیت برمی‌گردد</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-[0.68rem] text-muted-foreground">پیش‌فرض {POSITION_LABELS[row.position as StaffPosition] ?? row.position}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.is_active
                            ? 'inline-flex h-5 items-center rounded-lg bg-emerald-600/[0.12] px-2 text-[0.68rem] font-bold leading-none text-emerald-700 dark:text-emerald-400'
                            : 'inline-flex h-5 items-center rounded-lg bg-slate-500/[0.12] px-2 text-[0.68rem] font-bold leading-none text-muted-foreground'
                        }
                      >
                        {row.is_active ? 'فعال' : 'حذف‌شده'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.is_active && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setRemoveTarget(row)}
                              aria-label="حذف انتصاب"
                              className="inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-red-400"
                            >
                              <Icon icon="mdi:account-remove-outline" className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>حذف انتصاب</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* نمودار دسترسی‌ها */}
      <SectionCard
        title="نمودار دسترسی‌ها (ماتریس پیش‌فرض موقعیت‌ها)"
        icon="mdi:table-large"
        color="#7c3aed"
        action={
          <Button size="sm" variant="ghost" onClick={() => setShowMatrix((s) => !s)} className="font-bold">
            {showMatrix ? 'بستن' : 'نمایش'}
            <Icon icon={showMatrix ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="h-4 w-4" aria-hidden="true" />
          </Button>
        }
      >
        {!showMatrix ? (
          <p className="text-[0.68rem] text-muted-foreground">
            برای شفافیت، لیست کامل کدهای دسترسی هر موقعیت را ببینید. انتصابِ «دسترسی سفارشی» این ماتریس را دور می‌زند.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="mb-1 grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(44px,0.6fr))] items-center gap-1 rounded-[10px] bg-blue-600/[0.06] px-3 py-2">
                <span className="text-[0.68rem] font-extrabold text-foreground">کد دسترسی</span>
                {POSITION_ORDER.map((pos) => (
                  <span key={pos} className="text-center text-[0.68rem] font-extrabold text-foreground">{POSITION_LABELS[pos]}</span>
                ))}
              </div>
              {ALL_PERMISSION_CODES.map((code) => (
                <PermissionMatrixRow key={code} code={code} allowedFor={POSITION_ORDER.map((pos) => matrixSets[pos])} />
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ممیزی امنیتی */}
      <SectionCard title="گزارش ممیزی امنیتی" icon="mdi:shield-lock-outline" color="#059669">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {AUDIT_ACTIONS.map((a) => {
            const active = auditAction === a
            return (
              <button
                key={a || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => { setAuditAction(a); setAuditPage(1) }}
                className={
                  active
                    ? 'inline-flex min-h-[44px] items-center rounded-[12px] bg-blue-600 px-3.5 text-[0.68rem] font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    : 'inline-flex min-h-[44px] items-center rounded-[12px] border border-border bg-card px-3.5 text-[0.68rem] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                }
              >
                {AUDIT_ACTION_LABELS[a]}
              </button>
            )
          })}
        </div>
        {auditQuery.isPending ? (
          <LoadingBox text="در حال دریافت ممیزی..." />
        ) : auditQuery.isError ? (
          isForbidden(auditQuery.error) ? <ForbiddenPanel detail="گزارش ممیزی به دسترسی staff.audit نیاز دارد." /> : <ErrorBox message={crmErrorMessage(auditQuery.error, 'دریافت ممیزی ممکن نشد')} onRetry={() => auditQuery.refetch()} />
        ) : auditItems.length === 0 ? (
          <EmptyBox icon="mdi:shield-check-outline" title="رویدادی با این فیلتر ثبت نشده" />
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {auditItems.map((e) => {
                const ai = auditIcon(e.action)
                return (
                  <div
                    key={e.id}
                    className={
                      e.action === 'permission.denied'
                        ? 'flex items-center gap-3 rounded-xl border border-red-500/[0.12] bg-red-500/[0.04] px-3 py-2.5'
                        : 'flex items-center gap-3 rounded-xl border border-border/60 bg-slate-50/60 px-3 py-2.5 dark:bg-slate-900/40'
                    }
                  >
                    <Icon icon={ai.icon} className="h-5 w-5 shrink-0" style={{ color: ai.color }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] font-bold text-foreground">
                        {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                      </p>
                      <p className="block truncate text-[0.68rem] text-muted-foreground">
                        {e.data?.actor_name ? e.data.actor_name + ' · ' : ''}
                        {e.target_type ? e.target_type + (e.target_id ? ' #' + toPersianDigits(e.target_id) : '') + ' · ' : ''}
                        {e.ip ? 'IP: ' + e.ip : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.68rem] text-muted-foreground tabular-nums">
                      {e.created_at ? formatJalaliDateTime(e.created_at, { format: 'numeric' }) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            {auditTotal > AUDIT_PAGE_SIZE && (
              <div className="mt-3 flex justify-center">
                <Pager count={auditPages} page={auditPage} onChange={setAuditPage} />
              </div>
            )}
          </>
        )}
      </SectionCard>

      <AddStaffDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        venueId={venueId}
        pending={createStaff.isPending}
        onSubmit={(payload) => {
          createStaff.mutate(payload, {
            onSuccess: () => {
              toast.success('کارمند انتصاب یافت و فعال شد')
              setAddOpen(false)
            },
            onError: (err) => toast.error(extractError(err, 'افزودن کارمند ناموفق بود')),
          })
        }}
      />

      <ConfirmModal
        open={removeTarget !== null}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}
        title="حذف انتصاب کارمند"
        description={'با حذف «' + (removeTarget?.user_name ?? '') + '» تمام دسترسی‌های این فرد به پنل سالن بلافاصله لغو و اعلان حذف برایش ارسال می‌شود. این حذف نرم است؛ انتصاب مجدد همان کاربر، رکورد قبلی را احیا می‌کند.'}
        confirmText="حذف و لغو دسترسی"
        variant="destructive"
        loading={removeStaff.isPending}
        onConfirm={confirmRemove}
      />
    </div>
  )
}

// ─────────────── دیالوگ افزودن کارمند ───────────────

interface AddStaffPayload {
  phone: string
  venue_id: number
  position: StaffPosition
  permissions?: string[]
}

const AddStaffDialog: React.FC<{
  open: boolean
  onClose: () => void
  venueId: number
  pending: boolean
  onSubmit: (payload: AddStaffPayload) => void
}> = ({ open, onClose, venueId, pending, onSubmit }) => {
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState<StaffPosition>('reception')
  const [custom, setCustom] = useState(false)
  const [codes, setCodes] = useState<string[]>([])

  const phoneId = useId()
  const customId = useId()

  const reset = () => { setPhone(''); setCustom(false); setCodes([]); setPosition('reception') }

  const submit = () => {
    if (!/^0?\d{9,11}$/.test(phone.trim())) {
      toast.error('شماره موبایل معتبر وارد کنید (کاربر باید از پیش ثبت‌نام کرده باشد)')
      return
    }
    if (custom && codes.length === 0) {
      toast.error('در حالت سفارشی حداقل یک کد دسترسی انتخاب کنید')
      return
    }
    onSubmit({
      phone: phone.trim(),
      venue_id: venueId,
      position,
      permissions: custom ? codes : undefined,
    })
    reset()
  }

  return (
    <Dialog open={open} onClose={onClose} title="افزودن کارمند" maxWidth="sm">
      <div className="flex flex-col gap-4 pt-1">
        <Alert variant="info" className="rounded-xl text-[0.76rem]">
          <Icon icon="mdi:information-outline" className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>کاربر باید ابتدا در اپ ثبت‌نام کرده باشد؛ انتصاب با شماره موبایل انجام و بلافاصله فعال می‌شود.</span>
        </Alert>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={phoneId}>شماره موبایل کاربر</Label>
          <Input
            id={phoneId}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="09121234567"
            className="tabular-nums"
          />
        </div>
        <div>
          <Select value={position} onValueChange={(v) => setPosition(v as StaffPosition)}>
            <SelectTrigger aria-label="سمت" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_ORDER.map((pos) => (
                <SelectItem key={pos} value={pos}>{POSITION_LABELS[pos]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 block text-[0.68rem] text-muted-foreground">
            <Icon icon="mdi:information-outline" className="inline h-3.5 w-3.5 me-1" aria-hidden="true" />
            {POSITION_DESCRIPTIONS[position]}
          </p>
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <Switch id={customId} checked={custom} onCheckedChange={setCustom} />
          <Label htmlFor={customId} className="cursor-pointer text-[0.68rem] font-extrabold text-foreground">
            دسترسی سفارشی (به‌جای پیش‌فرض موقعیت)
          </Label>
        </div>
        {custom ? (
          <div className="max-h-[230px] overflow-auto rounded-xl border border-border p-2">
            {ALL_PERMISSION_CODES.map((code) => (
              <label key={code} className="flex items-center gap-2 py-[1px]">
                <Checkbox
                  checked={codes.includes(code)}
                  onCheckedChange={(v) => setCodes((prev) => (v ? [...prev, code] : prev.filter((c) => c !== code)))}
                />
                <span className="text-[0.76rem] text-foreground">
                  <span className="font-bold" dir="ltr">{code}</span>{' '}
                  <span className="text-muted-foreground">— {PERMISSION_LABELS[code] ?? code}</span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[0.68rem] text-muted-foreground">پیش‌فرض «{POSITION_LABELS[position]}»:</span>
            {matrixSets[position].size === ALL_PERMISSION_CODES.length ? (
              <span className="inline-flex h-[18px] items-center rounded-md bg-amber-500/10 px-1.5 text-[0.6rem] font-bold text-amber-700 dark:text-amber-400">
                دسترسی کامل
              </span>
            ) : (
              Array.from(matrixSets[position]).map((code) => (
                <span key={code} className="inline-flex h-[18px] items-center rounded-md bg-blue-600/[0.07] px-1.5 text-[0.58rem] font-semibold text-blue-700 dark:text-blue-300">
                  {code}
                </span>
              ))
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="font-bold">انصراف</Button>
          <Button
            onClick={submit}
            disabled={pending}
            className="bg-gradient-to-br from-blue-600 to-violet-600 font-extrabold text-white hover:from-blue-700 hover:to-violet-700"
          >
            {pending ? (
              <span
                className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent"
                role="status"
                aria-label="در حال بارگذاری"
              />
            ) : 'انتصاب کارمند'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default StaffTab
