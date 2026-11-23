package ir.salon.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.AuthRepository
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.app.data.repository.VenueRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.datastore.SessionStore
import ir.salon.core.model.User
import ir.salon.core.model.Venue
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeState(
    val loading: Boolean = true,
    val user: User? = null,
    val venues: List<Venue> = emptyList(),
    val favorites: Set<Int> = emptySet(),
    val unread: Int = 0,
    val error: AppError? = null,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val venueRepository: VenueRepository,
    private val engagementRepository: EngagementRepository,
    private val authRepository: AuthRepository,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state

    init {
        refresh()
    }

    fun refresh(silent: Boolean = false) {
        _state.value = _state.value.copy(loading = !silent, error = null)
        viewModelScope.launch {
            runCatching {
                coroutineScope {
                    val authenticated = sessionStore.currentAccessToken() != null
                    val userDeferred = async {
                        if (authenticated) runCatching { authRepository.currentUser() }.getOrNull() else null
                    }
                    val venuesDeferred = async { venueRepository.list() }
                    val favoritesDeferred = async {
                        if (authenticated) {
                            runCatching { engagementRepository.favoriteIds() }.getOrDefault(emptySet<Int>())
                        } else {
                            emptySet<Int>()
                        }
                    }
                    val unreadDeferred = async {
                        if (authenticated) {
                            runCatching { engagementRepository.unreadCount() }.getOrDefault(0)
                        } else {
                            0
                        }
                    }
                    HomeState(
                        loading = false,
                        user = userDeferred.await(),
                        venues = venuesDeferred.await().sortedByDescending { it.averageRating },
                        favorites = favoritesDeferred.await(),
                        unread = unreadDeferred.await(),
                    )
                }
            }.onSuccess {
                _state.value = it
            }.onFailure {
                _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it))
            }
        }
    }

    fun toggleFavorite(venueId: Int) {
        val wasFavorite = venueId in _state.value.favorites
        _state.value = _state.value.copy(
            favorites = if (wasFavorite) _state.value.favorites - venueId else _state.value.favorites + venueId,
        )
        viewModelScope.launch {
            runCatching { engagementRepository.setFavorite(venueId, !wasFavorite) }
                .onFailure {
                    _state.value = _state.value.copy(
                        favorites = if (wasFavorite) _state.value.favorites + venueId else _state.value.favorites - venueId,
                    )
                }
        }
    }
}
