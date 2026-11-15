package ir.salon.app.ui.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.AuthRepository
import ir.salon.core.datastore.SessionStore
import ir.salon.core.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** وضعیت نشست سراسری — دروازهٔ ناوبری نقش‌محور */
data class SessionState(
    val initialized: Boolean = false,
    val user: User? = null,
) {
    val isAuthenticated: Boolean get() = user != null
    val isManager: Boolean get() = user?.role in setOf("venue_manager", "club_admin")
    val isAdmin: Boolean get() = user?.role == "super_admin"
}

@HiltViewModel
class SessionViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow(SessionState())
    val state: StateFlow<SessionState> = _state

    init {
        viewModelScope.launch {
            // توکن موجود → نشست برقرار؛ در غیر این صورت مهمان
            val hasToken = sessionStore.currentAccessToken() != null
            if (hasToken) {
                _state.value = SessionState(initialized = true, user = authRepository.currentUser())
            } else {
                _state.value = SessionState(initialized = true, user = null)
            }
        }
    }

    fun onLoggedIn(user: User) {
        _state.value = SessionState(initialized = true, user = user)
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            _state.value = SessionState(initialized = true, user = null)
            onDone()
        }
    }
}
