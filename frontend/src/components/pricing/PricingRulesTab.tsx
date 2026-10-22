// frontend/src/components/pricing/PricingRulesTab.tsx
// قوانین قیمت سالن: لیست + ساخت/ویرایش/حذف، تنظیم مبنای پیش‌فرض قیمت،
// و پنل پیش‌نمایش موتور قیمت.

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import ConfirmModal from '@/components/modals/ConfirmModal'
import { EmptyBox, ErrorBox, LoadingBox, extractError, SectionCard } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import {
  useCreatePricingRule,
  useDeletePricingRule,
  usePricingRules,
  useSetDefaultPrice,
  useUpdatePricingRule,
} from '@/hooks/usePricing'
import type { PricingRule, PricingRulePayload } from '@/services/pricing'
import PricingRuleDialog from './PricingRuleDialog'
import PricingPreviewPanel from './PricingPreviewPanel'
import { MODIFIER_LABELS, parseIntFa, ruleDaysLabel, ruleTimeWindow, ruleValueLabel } from './shared'
import type { FinanceVenue } from '@/hooks/useFinance'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

const PricingRulesTab: React.FC<Props> = ({ venues, venueId }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null)
  const [basePriceInput, setBasePriceInput] = useState('')

  const basePriceId = useId()

  const rulesQuery = usePricingRules(venueId, venueId != null)
  const createRule = useCreatePricingRule(venueId)
  const updateRule = useUpdatePricingRule(venueId)
  const deleteRule = useDeletePricingRule(venueId)
  const setDefault = useSetDefaultPrice(venueId)

  if (venueId == null) {
    return (
      <SectionCard title="قوانین قیمت‌گذاری" icon="mdi:tag-percent-outline" color="#d97706">
        <EmptyBox icon="mdi:store-outline" title="ابتدا یک سالن انتخاب کنید" text="قوانین قیمت سالن‌محورند؛ برای دیدن و ویرایش آن‌ها سالن خود را از بالا انتخاب کنید." />
      </SectionCard>
    )
  }

  const rules = rulesQuery.data ?? []

  const submitRule = (payload: PricingRulePayload) => {
    const done = () => {
      toast.success('قانون ذخیره شد ✅')
      setDialogOpen(false)
      setEditing(null)
    }
    const fail = (err: unknown) => toast.error(extractError(err, 'خطا در ذخیره قانون'))
    if (editing) {
      updateRule.mutate({ ruleId: editing.id, data: payload }, { onSuccess: done, onError: fail })
    } else {
      createRule.mutate(payload, { onSuccess: done, onError: fail })
    }
  }

  const saveBasePrice = () => {
    const v = parseIntFa(basePriceInput)
    if (v === null || v <= 0) {
      toast.error('مبلغ پایه باید عددِ مثبت (ریال) باشد')
      return
    }
    setDefault.mutate(v, {
      onSuccess: () => {
        toast.success('مبنای پیش‌فرض قیمت سالن ثبت شد ✅')
        setBasePriceInput('')
      },
      onError: (err) => toast.error(extractError(err, 'خطا در ثبت مبنای قیمت')),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* مبنای پیش‌فرض قیمت — ورودی PUT pricing/venue default */}
      <SectionCard title="مبنای پیش‌فرض قیمت سانس" icon="mdi:cash-marker" color="#059669">
        <p className="mb-3 text-[0.68rem] text-muted-foreground">
          مبنای تولید خودکار سانس‌ها و نقطه‌ی شروع موتور قیمت (بدون در نظر گرفتن قوانین). خالی = پیش‌فرض سیستم.
          {venues.length > 0 ? ' مقدار فعلی از سرور قابل خواندن نیست؛ با ثبت مقدار جدید جایگزین می‌شود.' : ''}
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={basePriceId}>مبلغ پایه (ریال)</Label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                id={basePriceId}
                value={basePriceInput}
                onChange={(e) => setBasePriceInput(e.target.value)}
                placeholder="مثلاً ۲۰۰۰۰۰"
                inputMode="numeric"
                className="tabular-nums"
              />
            </div>
            <Button
              onClick={saveBasePrice}
              disabled={setDefault.isPending}
              className="bg-gradient-to-br from-emerald-600 to-emerald-500 font-bold text-white hover:from-emerald-700 hover:to-emerald-600"
            >
              {setDefault.isPending ? '...' : 'ثبت'}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={`قوانین ${venues.find((v) => v.id === venueId)?.name ?? 'سالن'}`}
        icon="mdi:tag-percent-outline"
        color="#d97706"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-gradient-to-br from-amber-600 to-amber-500 font-bold text-stone-900 hover:from-amber-700 hover:to-amber-600"
          >
            <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden="true" />
            قانون جدید
          </Button>
        }
      >
        {rulesQuery.isPending ? (
          <LoadingBox text="در حال بارگذاری قوانین..." />
        ) : rulesQuery.isError ? (
          <ErrorBox message="خطا در دریافت قوانین" onRetry={() => rulesQuery.refetch()} />
        ) : rules.length === 0 ? (
          <EmptyBox
            icon="mdi:tag-percent-outline"
            title="هنوز قانونی تعریف نشده"
            text="همه‌ی سانس‌ها با مبنای پیش‌فرض قیمت‌گذاری می‌شوند. برای اوج/کم‌ترافیک یا تعطیلات قانون بسازید."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table aria-label="قوانین قیمت‌گذاری">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="font-bold">برچسب</TableHead>
                  <TableHead scope="col" className="font-bold">روز</TableHead>
                  <TableHead scope="col" className="font-bold">بازه</TableHead>
                  <TableHead scope="col" className="font-bold">اثر</TableHead>
                  <TableHead scope="col" className="font-bold">اولویت</TableHead>
                  <TableHead scope="col" className="font-bold">فعال</TableHead>
                  <TableHead scope="col" className="text-center font-bold">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className={
                      rule.is_active
                        ? 'hover:bg-blue-600/[0.02]'
                        : 'opacity-55 hover:bg-blue-600/[0.02]'
                    }
                  >
                    <TableCell className="font-semibold text-foreground">{rule.label || `قانون #${toPersianDigits(rule.id)}`}</TableCell>
                    <TableCell>
                      <span
                        className={
                          rule.holiday_applies
                            ? 'inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-800 dark:text-amber-300'
                            : 'inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-semibold text-foreground'
                        }
                      >
                        {ruleDaysLabel(rule)}
                      </span>
                    </TableCell>
                    <TableCell dir="rtl" className="whitespace-nowrap text-[0.8rem] text-foreground tabular-nums">
                      {ruleTimeWindow(rule)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-[0.68rem] font-bold text-foreground">{MODIFIER_LABELS[rule.modifier_type]}</p>
                      <p className="text-[0.68rem] text-muted-foreground">{ruleValueLabel(rule.modifier_type, rule.value)}</p>
                    </TableCell>
                    <TableCell className="tabular-nums text-foreground">{toPersianDigits(rule.priority)}</TableCell>
                    <TableCell>
                      <div className="flex min-h-9 min-w-11 items-center">
                        <Switch
                          checked={rule.is_active}
                          disabled={updateRule.isPending}
                          aria-label={rule.is_active ? 'غیرفعال کردن قانون' : 'فعال کردن قانون'}
                          onCheckedChange={(checked) =>
                            updateRule.mutate(
                              { ruleId: rule.id, data: { is_active: checked } },
                              {
                                onSuccess: () => toast.success(checked ? 'قانون فعال شد' : 'قانون غیرفعال شد'),
                                onError: (err) => toast.error(extractError(err, 'خطا در تغییر وضعیت')),
                              },
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(rule)
                            setDialogOpen(true)
                          }}
                          className="font-semibold"
                        >
                          <Icon icon="mdi:pencil-outline" className="h-4 w-4" aria-hidden="true" />
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(rule)}
                          className="font-semibold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                        >
                          <Icon icon="mdi:trash-can-outline" className="h-4 w-4" aria-hidden="true" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <PricingPreviewPanel venueId={venueId} />

      <PricingRuleDialog
        open={dialogOpen}
        venueId={venueId}
        rule={editing}
        saving={createRule.isPending || updateRule.isPending}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSubmit={submitRule}
      />

      <ConfirmModal
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="حذف قانون قیمت"
        description={deleteTarget ? `قانون «${deleteTarget.label || ('#' + toPersianDigits(deleteTarget.id))}» حذف می‌شود؛ این عمل قابل بازگشت نیست.` : ''}
        confirmText="حذف"
        variant="destructive"
        loading={deleteRule.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteRule.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('قانون حذف شد')
              setDeleteTarget(null)
            },
            onError: (err) => toast.error(extractError(err, 'خطا در حذف قانون')),
          })
        }}
      />
    </div>
  )
}

export default PricingRulesTab
