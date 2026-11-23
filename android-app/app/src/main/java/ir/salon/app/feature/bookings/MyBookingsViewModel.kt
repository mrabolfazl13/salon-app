package ir.salon.app.feature.bookings

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.BookingDto
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.data.repository.BookingRepository
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** ردیف یکپارچهٔ رزروها — pending (Redis) و قطعی (DB) با یک نمایه */
data class BookingRow(
    val id: String,
    val isPendingRedis: Boolean,
    val status: String,
    val slotId: Int,
    val paymentAmount: Int,
    val venueName: String?,
    val venuePhone: String?,
    val venueImage: String?,
    val slotDate: String?,
    val startTime: String?,
    val duration: Int?,
    val couponCode: String?,
    val paymentMode: String?,
    val needsReceipt: Boolean,
    val receiptStatus: String,
)

data class MyBookingsState(
    val loading: Boolean = true,
    val rows: List<BookingRow> = emptyList(),
    val error: AppError? = null,
    val cancelling: String? = null,
)

enum class BookingsTab { ALL, PENDING, CONFIRMED, CANCELLED, COMPLETED }

@HiltViewModel
class MyBookingsViewModel @Inject constructor(
    private val bookingRepository: BookingRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(MyBookingsState())
    val state: StateFlow<MyBookingsState> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            _state.value = runCatching {
                val pending = bookingRepository.myPending()
                val confirmed = bookingRepository.myBookings()
                val rows = buildList {
                    pending.forEach { p ->
                        add(
                            BookingRow(
                                id = p.id, isPendingRedis = true, status = "pending",
                                slotId = p.slotId, paymentAmount = p.paymentAmount,
                                venueName = p.venueName, venuePhone = p.venuePhone, venueImage = null,
                                slotDate = p.slotDate, startTime = p.startTime, duration = p.duration,
                                couponCode = p.couponCode, paymentMode = null,
                                needsReceipt = false, receiptStatus = "none",
                            ),
                        )
                    }
                    confirmed.forEach { b ->
                        add(
                            BookingRow(
                                id = b.id.toString(), isPendingRedis = false, status = b.status,
                                slotId = b.slotId, paymentAmount = b.paymentAmount,
                                venueName = b.venueName, venuePhone = b.venuePhone,
                                venueImage = b.venueImages.firstOrNull(),
                                slotDate = b.slotDate, startTime = b.startTime, duration = b.duration,
                                couponCode = b.couponCode, paymentMode = b.paymentMode,
                                needsReceipt = b.needsReceipt, receiptStatus = b.receiptStatus,
                            ),
                        )
                    }
                }
                MyBookingsState(loading = false, rows = rows)
            }.getOrElse {
                MyBookingsState(loading = false, error = AppErrorMapper.from(it))
            }
        }
    }

    fun cancel(row: BookingRow) {
        _state.value = _state.value.copy(cancelling = row.id)
        viewModelScope.launch {
            runCatching {
                if (row.isPendingRedis) bookingRepository.cancelPending(row.id) else bookingRepository.cancelBooking(row.id.toInt())
            }.onSuccess { refresh() }
                .onFailure {
                    _state.value = _state.value.copy(cancelling = null, error = AppErrorMapper.from(it))
                }
        }
    }
}

data class BookingDetailState(
    val loading: Boolean = true,
    val booking: BookingDto? = null,
    val error: AppError? = null,
    val cancelling: Boolean = false,
    val cancelled: Boolean = false,
    val paying: Boolean = false,
    val paymentDone: Boolean = false,
    val paymentError: AppError? = null,
)

@HiltViewModel
class BookingDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val bookingRepository: BookingRepository,
    private val engagementRepository: EngagementRepository,
) : ViewModel() {

    val bookingId: Int = checkNotNull(savedStateHandle["bookingId"])

    private val _state = MutableStateFlow(BookingDetailState())
    val state: StateFlow<BookingDetailState> = _state

    init {
        load()
    }

    fun load() {
        val keep = _state.value
        _state.value = keep.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { bookingRepository.detail(bookingId) }
                .onSuccess {
                    _state.value = _state.value.copy(loading = false, booking = it, error = null)
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        loading = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun cancel() {
        _state.value = _state.value.copy(cancelling = true)
        viewModelScope.launch {
            runCatching { bookingRepository.cancelBooking(bookingId) }
                .onSuccess { _state.value = _state.value.copy(cancelling = false, cancelled = true) }
                .onFailure {
                    _state.value = _state.value.copy(
                        cancelling = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    /** ایجاد فاکتور و پرداخت درگاه mock — دو گام متوالی سرور */
    fun pay() {
        if (_state.value.paying) return
        _state.value = _state.value.copy(paying = true, paymentError = null)
        viewModelScope.launch {
            runCatching {
                val payment = engagementRepository.createPayment(bookingId)
                if (payment.status == "paid") payment else engagementRepository.pay(payment.id)
            }.onSuccess {
                _state.value = _state.value.copy(paying = false, paymentDone = true)
                load()
            }.onFailure {
                _state.value = _state.value.copy(
                    paying = false,
                    paymentError = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun dismissPaymentResult() {
        _state.value = _state.value.copy(paymentDone = false, paymentError = null)
    }
}
