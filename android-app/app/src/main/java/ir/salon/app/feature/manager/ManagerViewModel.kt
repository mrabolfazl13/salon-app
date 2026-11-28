package ir.salon.app.feature.manager

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.FinanceDashboardDto
import ir.salon.app.data.api.ManagerContractRowDto
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.Venue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ManagerState(
    val loading: Boolean = true,
    val venues: List<Venue> = emptyList(),
    val selectedVenueId: Int? = null,
    val pending: List<PendingBookingDto> = emptyList(),
    val pendingLoading: Boolean = false,
    val actionId: String? = null,
    val error: AppError? = null,
    val message: String? = null,
    val checkInCode: String = "",
    val checkInLoading: Boolean = false,
    val checkInMessage: String? = null,
    val contractRows: List<ManagerContractRowDto> = emptyList(),
    val contractsLoading: Boolean = false,
    val finance: FinanceDashboardDto? = null,
    val extrasLoading: Boolean = false,
    // مدیریت سانس‌ها
    val slotDate: String = java.time.LocalDate.now().toString(),
    val slots: List<ir.salon.core.model.Slot> = emptyList(),
    val slotsLoading: Boolean = false,
    val generating: Boolean = false,
    val busySlotId: Int? = null,
    // ایتا
    val eitaaChatId: String = "",
    val eitaaToken: String = "",
    val eitaaActive: Boolean = true,
    val eitaaExists: Boolean = false,
    val eitaaSaving: Boolean = false,
    val eitaaPosting: Boolean = false,
    val eitaaLastDate: String? = null,
    val eitaaLastError: String? = null,
) {
    val selectedVenue: Venue? get() = venues.firstOrNull { it.id == selectedVenueId }
}

@HiltViewModel
class ManagerViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ManagerState())
    val state: StateFlow<ManagerState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { repository.myVenues() }
                .onSuccess { venues ->
                    val selected = _state.value.selectedVenueId
                        ?.takeIf { id -> venues.any { it.id == id } }
                        ?: venues.firstOrNull()?.id
                    _state.value = _state.value.copy(
                        loading = false,
                        venues = venues,
                        selectedVenueId = selected,
                    )
                    if (selected != null) {
                        loadPending(selected)
                        loadExtras(selected)
                        loadSlots()
                        loadEitaa()
                    }
                }
                .onFailure {
                    _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun selectVenue(id: Int) {
        _state.value = _state.value.copy(selectedVenueId = id, pending = emptyList())
        loadPending(id)
        loadExtras(id)
        loadSlots()
        loadEitaa()
    }

    fun loadExtras(venueId: Int = _state.value.selectedVenueId ?: -1) {
        if (venueId <= 0) return
        _state.value = _state.value.copy(extrasLoading = true, contractsLoading = true)
        viewModelScope.launch {
            val contracts = runCatching { repository.managerPendingContracts() }.getOrDefault(emptyList())
            val finance = runCatching { repository.financeDashboard(venueId) }.getOrNull()
            _state.value = _state.value.copy(
                extrasLoading = false,
                contractsLoading = false,
                contractRows = contracts,
                finance = finance,
            )
        }
    }

    fun approveContract(row: ManagerContractRowDto) {
        viewModelScope.launch {
            runCatching { repository.approveContract(row.contract.id) }
                .onSuccess {
                    _state.value = _state.value.copy(message = "قرارداد تأیید شد")
                    loadExtras()
                }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }

    fun rejectContract(row: ManagerContractRowDto, reason: String) {
        if (reason.trim().length < 3) {
            _state.value = _state.value.copy(error = AppError.Unknown("دلیل رد باید حداقل ۳ کاراکتر باشد"))
            return
        }
        viewModelScope.launch {
            runCatching { repository.rejectContract(row.contract.id, reason.trim()) }
                .onSuccess {
                    _state.value = _state.value.copy(message = "قرارداد رد شد")
                    loadExtras()
                }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }

    fun loadPending(venueId: Int = _state.value.selectedVenueId ?: -1) {
        if (venueId <= 0) return
        _state.value = _state.value.copy(pendingLoading = true)
        viewModelScope.launch {
            runCatching { repository.venuePending(venueId) }
                .onSuccess {
                    _state.value = _state.value.copy(pendingLoading = false, pending = it)
                }
                .onFailure {
                    _state.value = _state.value.copy(pendingLoading = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun confirm(pending: PendingBookingDto) {
        if (_state.value.actionId != null) return
        _state.value = _state.value.copy(actionId = pending.id)
        viewModelScope.launch {
            runCatching { repository.confirmPending(pending.id) }
                .onSuccess {
                    _state.value = _state.value.copy(actionId = null, message = "رزرو تأیید شد")
                    loadPending()
                }
                .onFailure {
                    _state.value = _state.value.copy(actionId = null, error = AppErrorMapper.from(it))
                }
        }
    }

    fun reject(pending: PendingBookingDto) {
        if (_state.value.actionId != null) return
        _state.value = _state.value.copy(actionId = pending.id)
        viewModelScope.launch {
            runCatching { repository.rejectPending(pending.id) }
                .onSuccess {
                    _state.value = _state.value.copy(actionId = null, message = "رزرو رد شد")
                    loadPending()
                }
                .onFailure {
                    _state.value = _state.value.copy(actionId = null, error = AppErrorMapper.from(it))
                }
        }
    }

    fun onCheckInCodeChange(value: String) {
        _state.value = _state.value.copy(checkInCode = value, checkInMessage = null)
    }

    fun verifyCheckIn() {
        val code = _state.value.checkInCode.trim()
        if (code.isEmpty() || _state.value.checkInLoading) return
        _state.value = _state.value.copy(checkInLoading = true, checkInMessage = null)
        viewModelScope.launch {
            runCatching { repository.verifyCheckIn(code) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        checkInLoading = false,
                        checkInCode = "",
                        checkInMessage = it.message.ifBlank { "چک‌این ثبت شد" },
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        checkInLoading = false,
                        checkInMessage = AppErrorMapper.from(it).uiMessage(),
                    )
                }
        }
    }

    // ───────────── مدیریت سانس‌ها ─────────────

    fun onSlotDateChange(iso: String) {
        _state.value = _state.value.copy(slotDate = iso)
        loadSlots()
    }

    fun loadSlots() {
        val venueId = _state.value.selectedVenueId ?: return
        _state.value = _state.value.copy(slotsLoading = true)
        viewModelScope.launch {
            runCatching { repository.slotsByDate(venueId, _state.value.slotDate) }
                .onSuccess { _state.value = _state.value.copy(slotsLoading = false, slots = it) }
                .onFailure {
                    _state.value = _state.value.copy(
                        slotsLoading = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    /** تولید خودکار سانس‌های روز — یک ضربه، قیمت‌گذاری سمت سرور */
    fun generateSlots() {
        val venueId = _state.value.selectedVenueId ?: return
        if (_state.value.generating) return
        _state.value = _state.value.copy(generating = true)
        viewModelScope.launch {
            runCatching { repository.generateSlots(venueId, _state.value.slotDate) }
                .onSuccess {
                    _state.value = _state.value.copy(generating = false, message = it)
                    loadSlots()
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        generating = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun toggleSlotBlocked(slot: ir.salon.core.model.Slot) {
        if (_state.value.busySlotId != null) return
        val blocked = slot.status == "blocked"
        _state.value = _state.value.copy(busySlotId = slot.id)
        viewModelScope.launch {
            runCatching { repository.setSlotBlocked(slot.id, !blocked) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        busySlotId = null,
                        message = if (!blocked) "سانس مسدود شد" else "سانس آزاد شد",
                    )
                    loadSlots()
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        busySlotId = null,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    // ───────────── ایتا ─────────────

    fun onEitaaChatIdChange(v: String) {
        _state.value = _state.value.copy(eitaaChatId = v)
    }

    fun onEitaaTokenChange(v: String) {
        _state.value = _state.value.copy(eitaaToken = v)
    }

    fun onEitaaActiveChange(v: Boolean) {
        _state.value = _state.value.copy(eitaaActive = v)
    }

    fun loadEitaa() {
        val venueId = _state.value.selectedVenueId ?: return
        viewModelScope.launch {
            runCatching { repository.eitaaChannel(venueId) }
                .onSuccess { ch ->
                    if (ch != null) {
                        _state.value = _state.value.copy(
                            eitaaExists = true,
                            eitaaChatId = ch.chat_id,
                            eitaaActive = ch.is_active,
                            eitaaLastDate = ch.last_post_date,
                            eitaaLastError = ch.last_error,
                            eitaaToken = "",
                        )
                    } else {
                        _state.value = _state.value.copy(eitaaExists = false, eitaaChatId = "")
                    }
                }
                .onFailure { _state.value = _state.value.copy(eitaaExists = false) }
        }
    }

    fun saveEitaa() {
        val venueId = _state.value.selectedVenueId ?: return
        val chatId = _state.value.eitaaChatId.trim()
        if (chatId.isEmpty() || _state.value.eitaaSaving) return
        _state.value = _state.value.copy(eitaaSaving = true)
        viewModelScope.launch {
            runCatching {
                repository.upsertEitaaChannel(
                    venueId, chatId,
                    _state.value.eitaaToken.takeIf { it.isNotBlank() && !_state.value.eitaaExists },
                    _state.value.eitaaActive, true,
                )
            }
                .onSuccess {
                    _state.value = _state.value.copy(
                        eitaaSaving = false,
                        eitaaExists = true,
                        eitaaChatId = it.chat_id,
                        eitaaActive = it.is_active,
                        eitaaToken = "",
                        message = "کانال ایتا ذخیره شد",
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        eitaaSaving = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun postEitaaNow() {
        val venueId = _state.value.selectedVenueId ?: return
        if (_state.value.eitaaPosting) return
        _state.value = _state.value.copy(eitaaPosting = true)
        viewModelScope.launch {
            runCatching { repository.postEitaaNow(venueId) }
                .onSuccess {
                    _state.value = _state.value.copy(eitaaPosting = false, message = it)
                    loadEitaa()
                }
                .onFailure {
                    _state.value = _state.value.copy(eitaaPosting = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
