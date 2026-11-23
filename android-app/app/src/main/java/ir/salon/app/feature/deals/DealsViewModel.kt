package ir.salon.app.feature.deals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.DealItemDto
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class DealSort(val api: String, val label: String) {
    TIME("time", "نزدیک‌ترین"),
    PRICE_ASC("price_asc", "ارزان‌ترین"),
    PRICE_DESC("price_desc", "گران‌ترین"),
}

data class DealsState(
    val loading: Boolean = true,
    val items: List<DealItemDto> = emptyList(),
    val sort: DealSort = DealSort.TIME,
    val error: AppError? = null,
)

@HiltViewModel
class DealsViewModel @Inject constructor(
    private val engagementRepository: EngagementRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(DealsState())
    val state: StateFlow<DealsState> = _state

    init {
        refresh()
    }

    fun setSort(sort: DealSort) {
        _state.value = _state.value.copy(sort = sort)
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                // sort در API پشتیبانی می‌شود؛ repository فعلی پیش‌فرض time می‌فرستد
                engagementRepository.deals().let { list ->
                    when (_state.value.sort) {
                        DealSort.TIME -> list
                        DealSort.PRICE_ASC -> list.sortedBy { it.dealPrice }
                        DealSort.PRICE_DESC -> list.sortedByDescending { it.dealPrice }
                    }
                }
            }.onSuccess {
                _state.value = _state.value.copy(loading = false, items = it)
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }
}
