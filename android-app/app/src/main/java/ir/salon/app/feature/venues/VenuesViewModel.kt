package ir.salon.app.feature.venues

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.app.data.repository.VenueRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.datastore.SessionStore
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
    private val engagementRepository: EngagementRepository,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow<VenuesUiState>(VenuesUiState.Loading)
    val state: StateFlow<VenuesUiState> = _state

    private val _category = MutableStateFlow<String?>(null)
    val category: StateFlow<String?> = _category

    private val _favorites = MutableStateFlow<Set<Int>>(emptySet())
    val favorites: StateFlow<Set<Int>> = _favorites


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
        loadFavorites()
    }

    fun onQueryChange(value: String) {
        query.value = value
    }

    fun onCategoryChange(value: String?) {
        if (_category.value == value) return
        _category.value = value
        refresh(force = true)
    }

    fun refresh(force: Boolean = false) {
        val q = query.value.trim()
        val category = _category.value
        val cacheKey = "$q|$category"
        if (!force && loadedQuery == cacheKey) return
        loadedQuery = cacheKey
        _state.value = VenuesUiState.Loading
        viewModelScope.launch {
            _state.value = runCatching {
                venueRepository.list(category = category, search = q.ifBlank { null })
            }.fold(
                onSuccess = { list ->
                    if (list.isEmpty()) VenuesUiState.Empty(q) else VenuesUiState.Ready(list)
                },
                onFailure = { VenuesUiState.Error(AppErrorMapper.from(it)) },
            )
        }
    }

    fun toggleFavorite(venueId: Int) {
        val wasFavorite = venueId in _favorites.value
        _favorites.value = if (wasFavorite) _favorites.value - venueId else _favorites.value + venueId
        viewModelScope.launch {
            runCatching { engagementRepository.setFavorite(venueId, !wasFavorite) }
                .onFailure {
                    // برگرداندن حالت خوش‌بینانه در صورت خطا
                    _favorites.value = if (wasFavorite) _favorites.value + venueId else _favorites.value - venueId
                }
        }
    }

    fun refreshFavorites() {
        loadFavorites()
    }

    private fun loadFavorites() {
        viewModelScope.launch {
            if (sessionStore.currentAccessToken() == null) return@launch
            runCatching { engagementRepository.favoriteIds() }
                .onSuccess { _favorites.value = it }
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
            _state.value = runCatching {
                // نگهبان زمانی: کندی شبکه هرگز نباید اسکلت را ابدی کند
                kotlinx.coroutines.withTimeout(20_000) { venueRepository.detail(venueId) }
            }.fold(
                onSuccess = { VenueDetailUiState(venue = it) },
                onFailure = { VenueDetailUiState(error = AppErrorMapper.from(it)) },
            )
        }
    }
}
