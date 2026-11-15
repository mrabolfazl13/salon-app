package ir.salon.app.feature.venues

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.VenueRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.Venue
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface VenuesUiState {
    data object Loading : VenuesUiState
    data class Ready(val venues: List<Venue>) : VenuesUiState
    data class Empty(val query: String) : VenuesUiState
    data class Error(val error: AppError) : VenuesUiState
}

@OptIn(FlowPreview::class)
@HiltViewModel
class VenuesViewModel @Inject constructor(
    private val venueRepository: VenueRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<VenuesUiState>(VenuesUiState.Loading)
    val state: StateFlow<VenuesUiState> = _state

    private val query = MutableStateFlow("")
    private var loadedQuery: String? = null

    init {
        viewModelScope.launch {
            query
                .debounce(350)
                .distinctUntilChanged()
                .collect { refresh(force = true) }
        }
        refresh()
    }

    fun onQueryChange(value: String) {
        query.value = value
    }

    fun refresh(force: Boolean = false) {
        val q = query.value.trim()
        if (!force && loadedQuery == q) return
        loadedQuery = q
        _state.value = VenuesUiState.Loading
        viewModelScope.launch {
            _state.value = runCatching { venueRepository.list(search = q.ifBlank { null }) }
                .fold(
                    onSuccess = { list ->
                        if (list.isEmpty()) VenuesUiState.Empty(q) else VenuesUiState.Ready(list)
                    },
                    onFailure = { VenuesUiState.Error(AppErrorMapper.from(it)) },
                )
        }
    }
}

data class VenueDetailUiState(
    val loading: Boolean = true,
    val venue: Venue? = null,
    val error: AppError? = null,
)

@HiltViewModel
class VenueDetailViewModel @Inject constructor(
    savedStateHandle: androidx.lifecycle.SavedStateHandle,
    private val venueRepository: VenueRepository,
) : ViewModel() {

    private val venueId: Int = checkNotNull(savedStateHandle["venueId"])

    private val _state = MutableStateFlow(VenueDetailUiState())
    val state: StateFlow<VenueDetailUiState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = VenueDetailUiState(loading = true)
        viewModelScope.launch {
            _state.value = runCatching { VenueDetailUiState(venue = venueRepository.detail(venueId)) }
                .fold(
                    onSuccess = { it },
                    onFailure = { VenueDetailUiState(error = AppErrorMapper.from(it)) },
                )
        }
    }
}
