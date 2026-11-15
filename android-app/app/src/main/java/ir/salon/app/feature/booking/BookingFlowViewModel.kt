package ir.salon.app.feature.booking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.data.api.PricingStepDto
import ir.salon.app.data.repository.BookingRepository
import ir.salon.app.data.repository.SlotRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.common.JalaliUtil
import ir.salon.core.model.Slot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

/** یک روز قابل انتخاب با برچسب جلالی */
data class DayOption(val iso: String, val label: String, val isToday: Boolean)

/** برچسب جلالی یک روز: «امروز - ۲۵ آبان» / «شنبه ۲۶ آبان» */
object DayLabels {

    fun build(count: Int = 14, today: LocalDate = LocalDate.now()): List<DayOption> {
        return (0 until count).map { offset ->
            val date = today.plusDays(offset.toLong())
            val j = JalaliUtil.toJalali(date.year, date.monthValue, date.dayOfMonth)
            val monthName = JalaliUtil.monthNames[j.jm - 1]
            val label = if (offset == 0) {
                "امروز - ${ir.salon.core.common.PersianText.toPersianDigits(j.jd.toString())} $monthName"
            } else {
                val weekday = JalaliUtil.weekDayNames[JalaliUtil.weekDayIndexFa(date.dayOfWeek.value)]
                "$weekday ${ir.salon.core.common.PersianText.toPersianDigits(j.jd.toString())} $monthName"
            }
            DayOption(date.toString(), label, offset == 0)
        }
    }
}

data class BookingFlowState(
    val days: List<DayOption> = DayLabels.build(),
    val selectedDate: String = LocalDate.now().toString(),
    val slots: List<Slot> = emptyList(),
    val loadingSlots: Boolean = true,
    val slotsError: AppError? = null,
    val selectedSlot: Slot? = null,
    val creating: Boolean = false,
    val created: PendingBookingDto? = null,
    val createError: AppError? = null,
)

/** ارقام فارسی ساعت مثل ۰۸:۰۰ */
fun faTime(raw: String?): String =
    ir.salon.core.common.PersianText.toPersianDigits(raw.orEmpty().take(5))

/** ساعت پایان سانس — قرینهٔ getSlotEndTime */
fun slotEndTime(slot: Slot): String = endTimeOf(slot.startTime, slot.duration)

fun endTimeOf(startTime: String?, duration: Int?): String = run {
    val parts = (startTime ?: "").split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 0
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val total = (h * 60 + m + (duration ?: 90)) % (24 * 60)
    faTime("%02d:%02d".format(total / 60, total % 60))
}

@HiltViewModel
class BookingFlowViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val slotRepository: SlotRepository,
    private val bookingRepository: BookingRepository,
) : ViewModel() {

    val venueId: Int = checkNotNull(savedStateHandle["venueId"])

    private val _state = MutableStateFlow(BookingFlowState())
    val state: StateFlow<BookingFlowState> = _state

    init {
        loadSlots()
    }

    fun selectDate(iso: String) {
        _state.value = _state.value.copy(selectedDate = iso, selectedSlot = null)
        loadSlots()
    }

    fun selectSlot(slot: Slot) {
        _state.value = _state.value.copy(selectedSlot = slot, createError = null)
    }

    fun loadSlots() {
        val date = _state.value.selectedDate
        _state.value = _state.value.copy(loadingSlots = true, slotsError = null)
        viewModelScope.launch {
            _state.value = runCatching {
                val slots = slotRepository.range(venueId, date, date)
                    .filter { it.slotDate == date }
                    // سانس‌های گذشته قابل رزرو نیستند — نگهبان زمانی سرور همین را رد می‌کند
                    .filter { !isPast(it) }
                _state.value.copy(loadingSlots = false, slots = slots)
            }.getOrElse {
                _state.value.copy(loadingSlots = false, slotsError = AppErrorMapper.from(it))
            }
        }
    }

    fun createBooking(discountCode: String?, useLoyaltyPoints: Boolean) {
        val slot = _state.value.selectedSlot ?: return
        _state.value = _state.value.copy(creating = true, createError = null)
        viewModelScope.launch {
            _state.value = runCatching {
                val pending = bookingRepository.create(slot.id, discountCode, useLoyaltyPoints)
                _state.value.copy(creating = false, created = pending, selectedSlot = null)
            }.getOrElse {
                _state.value.copy(creating = false, createError = AppErrorMapper.from(it))
            }
        }
    }

    fun dismissResult() {
        _state.value = _state.value.copy(created = null, createError = null)
        loadSlots()
    }

    private fun isPast(slot: Slot): Boolean {
        val today = LocalDate.now().toString()
        if (slot.slotDate > today) return false
        if (slot.slotDate < today) return true
        val now = java.time.LocalTime.now()
        val parts = slot.startTime.split(":")
        val slotTime = java.time.LocalTime.of(
            parts.getOrNull(0)?.toIntOrNull() ?: 0,
            parts.getOrNull(1)?.toIntOrNull() ?: 0,
        )
        return slotTime <= now
    }
}

/** برچسب فارسی گام‌های ریز قیمت — قرینهٔ STEP_LABELS در PricingBreakdown.tsx */
object StepLabels {
    private val map = mapOf(
        "base" to "قیمت پایه",
        "pricing_rules" to "قوانین قیمت",
        "deal" to "دیل لحظه آخری",
        "coupon" to "کد تخفیف",
        "loyalty" to "امتیاز وفاداری",
    )

    fun of(step: String): String = map[step] ?: step
}

fun List<PricingStepDto>.payable(): Long =
    fold(0L) { acc, s -> acc + s.amount }
