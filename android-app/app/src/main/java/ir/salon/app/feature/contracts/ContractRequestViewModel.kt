package ir.salon.app.feature.contracts

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.CreateContractRequest
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ContractRequestState(
    val submitting: Boolean = false,
    val error: AppError? = null,
    val success: Boolean = false,
)

/** درخواست قرارداد از صفحهٔ سالن — M5 */
@HiltViewModel
class ContractRequestViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val venueId: Int = checkNotNull(savedStateHandle["venueId"])

    private val _state = MutableStateFlow(ContractRequestState())
    val state: StateFlow<ContractRequestState> = _state

    fun submit(
        startDate: String,
        endDate: String,
        dayOfWeek: Int,
        startTime: String,
        pricePerSession: Int,
        description: String?,
    ) {
        val error = when {
            !Regex("""\d{4}-\d{2}-\d{2}""").matches(startDate) -> "تاریخ شروع را به شکل ۲۰۲۵-۰۱-۰۱ وارد کنید"
            !Regex("""\d{4}-\d{2}-\d{2}""").matches(endDate) -> "تاریخ پایان را به شکل ۲۰۲۵-۰۱-۰۱ وارد کنید"
            endDate <= startDate -> "تاریخ پایان باید بعد از شروع باشد"
            !Regex("""\d{2}:\d{2}""").matches(startTime) -> "ساعت را به شکل ۱۸:۳۰ وارد کنید"
            pricePerSession <= 0 -> "قیمت هر سانس را وارد کنید"
            else -> null
        }
        if (error != null) {
            _state.value = _state.value.copy(error = AppError.Unknown(error))
            return
        }
        _state.value = _state.value.copy(submitting = true, error = null)
        viewModelScope.launch {
            runCatching {
                repository.createContract(
                    CreateContractRequest(
                        venueId = venueId,
                        startDate = startDate,
                        endDate = endDate,
                        dayOfWeek = dayOfWeek,
                        startTime = startTime,
                        discountedPrice = pricePerSession,
                        description = description?.trim()?.takeIf { it.isNotBlank() },
                    ),
                )
            }.onSuccess {
                _state.value = ContractRequestState(success = true)
            }.onFailure {
                _state.value = _state.value.copy(
                    submitting = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun dismissResult() {
        _state.value = _state.value.copy(error = null, success = false)
    }
}
