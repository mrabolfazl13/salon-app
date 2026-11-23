package ir.salon.app.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.NotificationDto
import ir.salon.app.data.repository.AuthRepository
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.app.data.ws.NotificationSocket
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsState(
    val loading: Boolean = true,
    val items: List<NotificationDto> = emptyList(),
    val unread: Int = 0,
    val unreadOnly: Boolean = false,
    val error: AppError? = null,
    val liveMessage: String? = null,
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val engagementRepository: EngagementRepository,
    private val authRepository: AuthRepository,
    private val socket: NotificationSocket,
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsState())
    val state: StateFlow<NotificationsState> = _state

    init {
        refresh()
        viewModelScope.launch {
            val user = runCatching { authRepository.currentUser() }.getOrNull()
            if (user != null) socket.start(user.id)
        }
        viewModelScope.launch {
            socket.events.collect { event ->
                _state.value = _state.value.copy(
                    liveMessage = "${event.title} — ${event.message}",
                )
                refresh(silent = true)
            }
        }
    }

    fun refresh(silent: Boolean = false) {
        if (!silent) _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val items = engagementRepository.notifications(_state.value.unreadOnly)
                items to engagementRepository.unreadCount()
            }.onSuccess { (items, unread) ->
                _state.value = _state.value.copy(
                    loading = false,
                    items = items,
                    unread = unread,
                    error = null,
                )
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun setUnreadOnly(value: Boolean) {
        _state.value = _state.value.copy(unreadOnly = value)
        refresh()
    }

    fun markRead(item: NotificationDto) {
        if (item.isRead) return
        viewModelScope.launch {
            runCatching { engagementRepository.markRead(item.id) }
                .onSuccess { refresh(silent = true) }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }

    fun markAllRead() {
        viewModelScope.launch {
            runCatching { engagementRepository.markAllRead() }
                .onSuccess { refresh(silent = true) }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeLiveMessage() {
        _state.value = _state.value.copy(liveMessage = null)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    override fun onCleared() {
        socket.stop()
        super.onCleared()
    }
}
