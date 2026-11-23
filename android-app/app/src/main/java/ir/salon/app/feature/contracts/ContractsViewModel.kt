package ir.salon.app.feature.contracts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.ContractDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ContractsState(
    val loading: Boolean = true,
    val items: List<ContractDto> = emptyList(),
    val error: AppError? = null,
)

@HiltViewModel
class ContractsViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ContractsState())
    val state: StateFlow<ContractsState> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { repository.contracts() }
                .onSuccess { _state.value = _state.value.copy(loading = false, items = it) }
                .onFailure { _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it)) }
        }
    }
}

data class ContractDetailState(
    val loading: Boolean = true,
    val contract: ContractDto? = null,
    val error: AppError? = null,
    val payingId: Int? = null,
    val message: String? = null,
    val cancelling: Boolean = false,
)

@HiltViewModel
class ContractDetailViewModel @Inject constructor(
    savedStateHandle: androidx.lifecycle.SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val contractId: Int = checkNotNull(savedStateHandle["contractId"])

    private val _state = MutableStateFlow(ContractDetailState())
    val state: StateFlow<ContractDetailState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { repository.contract(contractId) }
                .onSuccess { _state.value = _state.value.copy(loading = false, contract = it) }
                .onFailure { _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it)) }
        }
    }

    fun pay(paymentId: Int) {
        if (_state.value.payingId != null) return
        _state.value = _state.value.copy(payingId = paymentId, message = null)
        viewModelScope.launch {
            runCatching { repository.payContractInstallment(contractId, paymentId) }
                .onSuccess {
                    _state.value = _state.value.copy(payingId = null, message = "قسط پرداخت شد")
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(payingId = null, error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }

    fun cancel(reason: String) {
        if (reason.trim().length < 3) {
            _state.value = _state.value.copy(error = AppError.Unknown("دلیل لغو باید حداقل ۳ کاراکتر باشد"))
            return
        }
        _state.value = _state.value.copy(cancelling = true, error = null)
        viewModelScope.launch {
            runCatching { repository.cancelContract(contractId, reason.trim()) }
                .onSuccess {
                    _state.value = _state.value.copy(cancelling = false, message = "قرارداد لغو شد")
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(cancelling = false, error = AppErrorMapper.from(it))
                }
        }
    }
}
