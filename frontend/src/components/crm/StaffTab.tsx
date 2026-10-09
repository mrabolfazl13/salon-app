// frontend/src/components/crm/StaffTab.tsx
// «پرسنل» — جدول انتصاب‌ها (GET /staff) + افزودن/حذف نرم + تغییر inline موقعیت +
// نمودار دسترسی‌ها (ماتریس utils/permissions.py) + زیرلیست ممیزی امنیتی (GET /staff/audit).

import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Dialog from '@/components/ui/Dialog'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError } from '@/components/finance/shared'
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <SectionCard
        title={`کارکنان سالن (${toPersianDigits(activeCount)} فعال)`}
        icon="mdi:badge-account-outline"
        color="#2563eb"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={<Switch size="small" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />}
              label={<Typography variant="caption" sx={{ fontWeight: 600 }}>نمایش حذف‌شده‌ها</Typography>}
              sx={{ mr: 0 }}
            />
            <Button size="small" variant="contained" onClick={() => setAddOpen(true)} startIcon={<Icon icon="mdi:plus" />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
              افزودن کارمند
            </Button>
          </Box>
        }
      >
        {staffQuery.isPending ? (
          <LoadingBox text="در حال دریافت کارکنان..." />
        ) : staffQuery.isError ? (
          isForbidden(staffQuery.error) ? <ForbiddenPanel detail="مدیریت کارکنان به دسترسی staff.manage نیاز دارد." /> : <ErrorBox message={crmErrorMessage(staffQuery.error, 'دریافت کارکنان ممکن نشد')} onRetry={() => staffQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyBox icon="mdi:badge-account-outline" title="هنوز کارمندی انتصاب نشده" text="با دکمه «افزودن کارمند» کاربرِ ثبت‌نام‌شده را با شماره موبایل انتصاب دهید." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {['کارمند', 'موبایل', 'موقعیت', 'دسترسی‌ها', 'وضعیت', 'عملیات'].map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 800, whiteSpace: 'nowrap', bgcolor: 'rgba(248,250,252,0.8)' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ opacity: row.is_active ? 1 : 0.6 }}>
                    <TableCell sx={{ fontWeight: 700 }}>{row.user_name ?? '—'}</TableCell>
                    <TableCell dir="ltr" sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.user_phone ?? '—'}</TableCell>
                    <TableCell>
                      {row.is_active ? (
                        <FormControl size="small" sx={{ minWidth: 138 }}>
                          <Select
                            value={POSITION_ORDER.includes(row.position as StaffPosition) ? row.position : 'reception'}
                            onChange={(e) => changePosition(row, e.target.value as StaffPosition)}
                            disabled={updateStaff.isPending}
                            sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem' }}
                          >
                            {POSITION_ORDER.map((pos) => (
                              <MenuItem key={pos} value={pos}>{POSITION_LABELS[pos]}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip label={POSITION_LABELS[row.position as StaffPosition] ?? String(row.position)} size="small" variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {row.is_custom_permissions ? (
                        <Tooltip title="دسترسی سفارشی — با آیکن بازگشت به پیش‌فرض موقعیت برمی‌گردد">
                          <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', alignItems: 'center', maxWidth: 330 }}>
                            {row.permissions.slice(0, 4).map((code) => (
                              <Chip key={code} label={code} size="small" sx={{ height: 18, fontSize: '0.6rem', borderRadius: '6px', bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontWeight: 700 }} />
                            ))}
                            {row.permissions.length > 4 && (
                              <Chip label={'+' + toPersianDigits(row.permissions.length - 4)} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                            )}
                            {row.is_active && (
                              <IconButton size="small" onClick={() => resetCustomPermissions(row)} disabled={updateStaff.isPending}>
                                <Icon icon="mdi:restore" className="h-4 w-4" style={{ color: '#2563eb' }} />
                              </IconButton>
                            )}
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">پیش‌فرض {POSITION_LABELS[row.position as StaffPosition] ?? row.position}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.is_active ? 'فعال' : 'حذف‌شده'}
                        size="small"
                        sx={{
                          borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', height: 20,
                          bgcolor: row.is_active ? 'rgba(5,150,105,0.12)' : 'rgba(107,114,128,0.12)',
                          color: row.is_active ? '#059669' : '#6b7280',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.is_active && (
                        <Tooltip title="حذف انتصاب">
                          <span>
                            <IconButton size="small" onClick={() => setRemoveTarget(row)}>
                              <Icon icon="mdi:account-remove-outline" className="h-5 w-5" style={{ color: '#ef4444' }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </SectionCard>

      {/* نمودار دسترسی‌ها */}
      <SectionCard
        title="نمودار دسترسی‌ها (ماتریس پیش‌فرض موقعیت‌ها)"
        icon="mdi:table-large"
        color="#7c3aed"
        action={
          <Button size="small" onClick={() => setShowMatrix((s) => !s)} sx={{ textTransform: 'none', fontWeight: 700 }} endIcon={<Icon icon={showMatrix ? 'mdi:chevron-up' : 'mdi:chevron-down'} />}>
            {showMatrix ? 'بستن' : 'نمایش'}
          </Button>
        }
      >
        {!showMatrix ? (
          <Typography variant="caption" color="text.secondary">
            برای شفافیت، لیست کامل کدهای دسترسی هر موقعیت را ببینید. انتصابِ «دسترسی سفارشی» این ماتریس را دور می‌زند.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 560 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1.6fr) repeat(4, minmax(44px,0.6fr))',
                  gap: 0.5, px: 1.5, py: 1, bgcolor: 'rgba(37,99,235,0.06)', borderRadius: '10px', mb: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800 }}>کد دسترسی</Typography>
                {POSITION_ORDER.map((pos) => (
                  <Typography key={pos} variant="caption" sx={{ fontWeight: 800, textAlign: 'center' }}>{POSITION_LABELS[pos]}</Typography>
                ))}
              </Box>
              {ALL_PERMISSION_CODES.map((code) => (
                <PermissionMatrixRow key={code} code={code} allowedFor={POSITION_ORDER.map((pos) => matrixSets[pos])} />
              ))}
            </Box>
          </Box>
        )}
      </SectionCard>

      {/* ممیزی امنیتی */}
      <SectionCard title="گزارش ممیزی امنیتی" icon="mdi:shield-lock-outline" color="#059669">
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
          {AUDIT_ACTIONS.map((a) => (
            <Chip
              key={a || 'all'}
              label={AUDIT_ACTION_LABELS[a]}
              size="small"
              color={auditAction === a ? 'primary' : 'default'}
              variant={auditAction === a ? 'filled' : 'outlined'}
              onClick={() => { setAuditAction(a); setAuditPage(1) }}
              sx={{ borderRadius: '9px', fontWeight: 700, fontSize: '0.75rem', height: 26 }}
            />
          ))}
        </Box>
        {auditQuery.isPending ? (
          <LoadingBox text="در حال دریافت ممیزی..." />
        ) : auditQuery.isError ? (
          isForbidden(auditQuery.error) ? <ForbiddenPanel detail="گزارش ممیزی به دسترسی staff.audit نیاز دارد." /> : <ErrorBox message={crmErrorMessage(auditQuery.error, 'دریافت ممیزی ممکن نشد')} onRetry={() => auditQuery.refetch()} />
        ) : auditItems.length === 0 ? (
          <EmptyBox icon="mdi:shield-check-outline" title="رویدادی با این فیلتر ثبت نشده" />
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {auditItems.map((e) => {
                const ai = auditIcon(e.action)
                return (
                  <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.06)', bgcolor: e.action === 'permission.denied' ? 'rgba(239,68,68,0.04)' : 'rgba(248,250,252,0.6)' }}>
                    <Icon icon={ai.icon} className="h-5 w-5" style={{ color: ai.color, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.data?.actor_name ? e.data.actor_name + ' · ' : ''}
                        {e.target_type ? e.target_type + (e.target_id ? ' #' + toPersianDigits(e.target_id) : '') + ' · ' : ''}
                        {e.ip ? 'IP: ' + e.ip : ''}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {e.created_at ? formatJalaliDateTime(e.created_at, { format: 'numeric' }) : '—'}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
            {auditTotal > AUDIT_PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                <Pagination count={auditPages} color="primary" shape="rounded" page={auditPage} onChange={(_, v) => setAuditPage(v)} size="small" />
              </Box>
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
    </Box>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
        <Alert severity="info" sx={{ borderRadius: '12px', fontSize: '0.76rem' }}>
          کاربر باید ابتدا در اپ ثبت‌نام کرده باشد؛ انتصاب با شماره موبایل انجام و بلافاصله فعال می‌شود.
        </Alert>
        <TextField
          label="شماره موبایل کاربر"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          dir="ltr"
          placeholder="09121234567"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Box>
          <FormControl fullWidth size="small">
            <Select value={position} onChange={(e) => setPosition(e.target.value as StaffPosition)} sx={{ borderRadius: '10px' }}>
              {POSITION_ORDER.map((pos) => (
                <MenuItem key={pos} value={pos}>{POSITION_LABELS[pos]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            <Icon icon="mdi:information-outline" className="h-3.5 w-3.5 inline ml-1" />
            {POSITION_DESCRIPTIONS[position]}
          </Typography>
        </Box>
        <Divider />
        <FormControlLabel
          control={<Switch checked={custom} onChange={(e) => setCustom(e.target.checked)} />}
          label={<Typography variant="body2" sx={{ fontWeight: 800 }}>دسترسی سفارشی (به‌جای پیش‌فرض موقعیت)</Typography>}
          sx={{ mr: 0 }}
        />
        {custom ? (
          <Box sx={{ maxHeight: 230, overflow: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: '12px', p: 1 }}>
            {ALL_PERMISSION_CODES.map((code) => (
              <FormControlLabel
                key={code}
                control={
                  <Checkbox
                    size="small"
                    checked={codes.includes(code)}
                    onChange={(e) => setCodes((prev) => (e.target.checked ? [...prev, code] : prev.filter((c) => c !== code)))}
                  />
                }
                label={
                  <Box component="span" sx={{ fontSize: '0.76rem' }}>
                    <Box component="span" sx={{ fontWeight: 700 }} dir="ltr">{code}</Box>{' '}
                    <Box component="span" color="text.secondary">— {PERMISSION_LABELS[code] ?? code}</Box>
                  </Box>
                }
                sx={{ display: 'flex', mr: 0, py: 0.1 }}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">پیش‌فرض «{POSITION_LABELS[position]}»:</Typography>
            {matrixSets[position].size === ALL_PERMISSION_CODES.length ? (
              <Chip label="دسترسی کامل" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(217,119,6,0.1)', color: '#d97706' }} />
            ) : (
              Array.from(matrixSets[position]).map((code) => (
                <Chip key={code} label={code} size="small" sx={{ height: 18, fontSize: '0.58rem', borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.07)', color: '#2563eb', fontWeight: 600 }} />
              ))
            )}
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>انصراف</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={pending}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            {pending ? <CircularProgress size={18} color="inherit" /> : 'انتصاب کارمند'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default StaffTab