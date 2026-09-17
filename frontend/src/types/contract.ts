// frontend/src/types/contract.ts
// تایپ‌های قدیمی کنار گذاشته شدند — منبع واحد حالا services/contract.ts
// (آینه‌ی schemas/contract.py بک‌اند) است. این فایل برای سازگاری import بازنشر می‌کند.

export type {
  ContractData,
  ContractDetailData,
  ContractSessionData,
  ContractPaymentData,
  ContractEconomicsData,
  ContractManagerRow,
  ContractAuditEvent,
  ContractCreatePayload,
  ContractApprovePayload,
  InstallmentPlanPayload,
  ContractStatusValue,
  ContractPaymentStatusValue,
  ContractSlotStatusValue,
  RecurrenceValue,
} from '@/services/contract'