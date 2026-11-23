package ir.salon.app.feature.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.app.data.repository.VenueRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.Venue
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavoritesState(
    val loading: Boolean = true,
    val venues: List<Venue> = emptyList(),
    val error: AppError? = null,
)

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val engagementRepository: EngagementRepository,
    private val venueRepository: VenueRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(FavoritesState())
    val state: StateFlow<FavoritesState> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val ids = engagementRepository.favoriteIds()
                if (ids.isEmpty()) return@runCatching emptyList()
                coroutineScope {
                    ids.map { id ->
                        async { runCatching { venueRepository.detail(id) }.getOrNull() }
                    }.awaitAll().filterNotNull()
                }
            }.onSuccess {
                _state.value = _state.value.copy(loading = false, venues = it)
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun remove(venueId: Int) {
        viewModelScope.launch {
            runCatching { engagementRepository.setFavorite(venueId, false) }
                .onSuccess { refresh() }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }
}
