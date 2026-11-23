package ir.salon.app.feature.manager

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.CrmCustomerDto
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
    val customers: List<CrmCustomerDto> = emptyList(),
    val finance: FinanceDashboardDto? = null,
    val extrasLoading: Boolean = false,
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
                    if (selected != null) loadPending(selected)
                    if (selected != null) loadExtras(selected)
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
    }

    fun loadExtras(venueId: Int = _state.value.selectedVenueId ?: -1) {
        if (venueId <= 0) return
        _state.value = _state.value.copy(extrasLoading = true, contractsLoading = true)
        viewModelScope.launch {
            val contracts = runCatching { repository.managerPendingContracts() }.getOrDefault(emptyList())
            val customers = runCatching { repository.crmCustomers(venueId) }.getOrDefault(emptyList())
            val finance = runCatching { repository.financeDashboard(venueId) }.getOrNull()
            _state.value = _state.value.copy(
                extrasLoading = false,
                contractsLoading = false,
                contractRows = contracts,
                customers = customers,
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

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
