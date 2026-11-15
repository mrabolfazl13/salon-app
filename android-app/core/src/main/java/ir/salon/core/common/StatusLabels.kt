package ir.salon.core.common

/**
 * برچسب‌های فارسی وضعیت‌ها — قرینهٔ `frontend/src/lib/utils.ts`
 * (getBookingStatusClass/BOOKING_STATUS_LABELS/SLOT_STATUS_LABELS/PAYMENT_MODE_LABELS)
 */
object StatusLabels {

    enum class Tone { POSITIVE, NEUTRAL, NEGATIVE, INFO }

    data class Label(val text: String, val tone: Tone)

    val booking: Map<String, Label> = mapOf(
        "pending" to Label("در انتظار تأیید", Tone.NEUTRAL),
        "confirmed" to Label("تأیید شده", Tone.POSITIVE),
        "cancelled" to Label("لغو شده", Tone.NEGATIVE),
        "completed" to Label("تکمیل شده", Tone.INFO),
    )

    val slot: Map<String, Label> = mapOf(
        "available" to Label("آزاد", Tone.POSITIVE),
        "booked" to Label("پر", Tone.NEGATIVE),
        "blocked" to Label("مسدود", Tone.NEUTRAL),
        "in_competition" to Label("در حال رقابت", Tone.INFO),
        "reserved" to Label("رزرو قرارداد", Tone.INFO),
    )

    val paymentMode: Map<String, Label> = mapOf(
        "gateway" to Label("درگاه آنلاین", Tone.INFO),
        "bank_receipt" to Label("فیش واریزی", Tone.NEUTRAL),
        "pay_in_place" to Label("پرداخت در محل", Tone.POSITIVE),
    )

    val contract: Map<String, Label> = mapOf(
        "pending" to Label("در انتظار بررسی", Tone.NEUTRAL),
        "active" to Label("فعال", Tone.POSITIVE),
        "rejected" to Label("رد شده", Tone.NEGATIVE),
        "expired" to Label("منقضی", Tone.NEUTRAL),
        "cancelled" to Label("لغو شده", Tone.NEGATIVE),
        "suspended" to Label("معلق", Tone.NEUTRAL),
    )

    fun bookingOf(key: String?): Label =
        booking[key] ?: Label("نامشخص", Tone.NEUTRAL)

    fun slotOf(key: String?): Label =
        slot[key] ?: Label("نامشخص", Tone.NEUTRAL)
}
