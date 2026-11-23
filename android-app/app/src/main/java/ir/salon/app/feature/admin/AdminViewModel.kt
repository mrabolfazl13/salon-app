package ir.salon.app.feature.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.AdminUserDto
import ir.salon.app.data.api.AdminUsersStatsDto
import ir.salon.app.data.api.AdminVenuesStatsDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.Venue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminState(
    val loading: Boolean = true,
    val usersStats: AdminUsersStatsDto? = null,
    val venuesStats: AdminVenuesStatsDto? = null,
    val users: List<AdminUserDto> = emptyList(),
    val pendingVenues: List<Venue> = emptyList(),
    val pendingManagers: List<AdminUserDto> = emptyList(),
    val error: AppError? = null,
    val message: String? = null,
    val verifyingId: Int? = null,
)

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(AdminState())
    val state: StateFlow<AdminState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val usersStats = repository.adminUsersStats()
                val venuesStats = repository.adminVenuesStats()
                val users = runCatching { repository.adminUsers() }.getOrDefault(emptyList())
                val pending = runCatching { repository.pendingVenues() }.getOrDefault(emptyList())
                val managers = runCatching { repository.pendingManagers() }.getOrDefault(emptyList())
                Quad(usersStats, venuesStats, users, pending).let { it to managers }
            }.onSuccess { (quad, managers) ->
                val (usersStats, venuesStats, users, pending) = quad
                _state.value = _state.value.copy(
                    loading = false,
                    usersStats = usersStats,
                    venuesStats = venuesStats,
                    users = users,
                    pendingVenues = pending,
                    pendingManagers = managers,
                )
            }.onFailure {
                _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it))
            }
        }
    }

    fun verifyVenue(venue: Venue) {
        if (_state.value.verifyingId != null) return
        _state.value = _state.value.copy(verifyingId = venue.id)
        viewModelScope.launch {
            runCatching { repository.verifyVenue(venue.id) }
                .onSuccess {
                    _state.value = _state.value.copy(verifyingId = null, message = "سالن تأیید شد")
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(verifyingId = null, error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }

    fun approveUser(user: AdminUserDto) {
        viewModelScope.launch {
            runCatching { repository.approveUser(user.id) }
                .onSuccess {
                    _state.value = _state.value.copy(message = "حساب تأیید شد")
                    load()
                }
                .onFailure { _state.value = _state.value.copy(error = AppErrorMapper.from(it)) }
        }
    }

    fun rejectUser(user: AdminUserDto) {
        viewModelScope.launch {
            runCatching { repository.rejectUser(user.id) }
                .onSuccess {
                    _state.value = _state.value.copy(message = "حساب رد شد")
                    load()
                }
                .onFailure { _state.value = _state.value.copy(error = AppErrorMapper.from(it)) }
        }
    }
}

private data class Quad<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
