// frontend/src/components/pricing/PricingRulesTab.tsx
// قوانین قیمت سالن: لیست + ساخت/ویرایش/حذف، تنظیم مبنای پیش‌فرض قیمت،
// و پنل پیش‌نمایش موتور قیمت.

import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
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

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

const PricingRulesTab: React.FC<Props> = ({ venues, venueId }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null)
  const [basePriceInput, setBasePriceInput] = useState('')

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* مبنای پیش‌فرض قیمت — ورودی PUT pricing/venue default */}
      <SectionCard title="مبنای پیش‌فرض قیمت سانس" icon="mdi:cash-marker" color="#059669">
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          مبنای تولید خودکار سانس‌ها و نقطه‌ی شروع موتور قیمت (بدون در نظر گرفتن قوانین). خالی = پیش‌فرض سیستم.
          {venues.length > 0 ? ' مقدار فعلی از سرور قابل خواندن نیست؛ با ثبت مقدار جدید جایگزین می‌شود.' : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <TextField
            label="مبلغ پایه (ریال)"
            value={basePriceInput}
            onChange={(e) => setBasePriceInput(e.target.value)}
            size="small"
            placeholder="مثلاً ۲۰۰۰۰۰"
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Button
            variant="contained"
            onClick={saveBasePrice}
            disabled={setDefault.isPending}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, height: 40, background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            {setDefault.isPending ? '...' : 'ثبت'}
          </Button>
        </Box>
      </SectionCard>

      <SectionCard
        title={`قوانین ${venues.find((v) => v.id === venueId)?.name ?? 'سالن'}`}
        icon="mdi:tag-percent-outline"
        color="#d97706"
        action={
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
            startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
          >
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
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700 }}>برچسب</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>روز</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>بازه</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>اثر</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>اولویت</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>فعال</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} sx={{ opacity: rule.is_active ? 1 : 0.55, '&:hover': { bgcolor: 'rgba(37,99,235,0.02)' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{rule.label || `قانون #${toPersianDigits(rule.id)}`}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ruleDaysLabel(rule)}
                        color={rule.holiday_applies ? 'warning' : 'default'}
                        sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} dir="rtl">
                      {ruleTimeWindow(rule)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{MODIFIER_LABELS[rule.modifier_type]}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ruleValueLabel(rule.modifier_type, rule.value)}</Typography>
                    </TableCell>
                    <TableCell>{toPersianDigits(rule.priority)}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={rule.is_active}
                        disabled={updateRule.isPending}
                        onChange={(e) =>
                          updateRule.mutate(
                            { ruleId: rule.id, data: { is_active: e.target.checked } },
                            {
                              onSuccess: () => toast.success(e.target.checked ? 'قانون فعال شد' : 'قانون غیرفعال شد'),
                              onError: (err) => toast.error(extractError(err, 'خطا در تغییر وضعیت')),
                            },
                          )
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => {
                          setEditing(rule)
                          setDialogOpen(true)
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        startIcon={<Icon icon="mdi:pencil-outline" className="h-4 w-4" />}
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(rule)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        startIcon={<Icon icon="mdi:trash-can-outline" className="h-4 w-4" />}
                      >
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
    </Box>
  )
}

export default PricingRulesTab