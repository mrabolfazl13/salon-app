package ir.salon.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.repository.AuthRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AuthUiState {
    data object Idle : AuthUiState
    data object Loading : AuthUiState
    data class Success(val user: User) : AuthUiState
    data class Error(val error: AppError) : AuthUiState
}

/** اعتبارسنجی کلاینت‌ساید — پیام فارسی مطابق strings */
object AuthValidator {
    private val phoneRegex = Regex("""^09[0-9]{9}$""")

    fun validatePhone(raw: String): String? = with(raw.trim()) {
        when {
            isEmpty() -> "شماره تلفن همراه را وارد کنید"
            !phoneRegex.matches(this) -> "شماره موبایل معتبر نیست (۰۹…)"
            else -> null
        }
    }

    fun validatePassword(raw: String): String? = when {
        raw.isEmpty() -> "رمز عبور را وارد کنید"
        raw.length < 6 -> "رمز عبور باید حداقل ۶ کاراکتر باشد"
        else -> null
    }
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val state: StateFlow<AuthUiState> = _state

    fun login(phone: String, password: String, onSuccess: (User) -> Unit) {
        val phoneError = AuthValidator.validatePhone(phone)
        val passError = AuthValidator.validatePassword(password)
        if (phoneError != null || passError != null) {
            _state.value = AuthUiState.Error(
                AppError.Unknown(phoneError ?: passError ?: "خطا"),
            )
            return
        }
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            _state.value = runCatching { authRepository.login(phone.trim(), password) }
                .fold(
                    onSuccess = { AuthUiState.Success(it) },
                    onFailure = { AuthUiState.Error(AppErrorMapper.from(it)) },
                )
            (_state.value as? AuthUiState.Success)?.let { onSuccess(it.user) }
        }
    }

    fun register(phone: String, password: String, fullName: String, onSuccess: (User) -> Unit) {
        val phoneError = AuthValidator.validatePhone(phone)
        val passError = AuthValidator.validatePassword(password)
        val nameError = if (fullName.trim().length < 3) "نام و نام خانوادگی را کامل وارد کنید" else null
        val firstError = phoneError ?: passError ?: nameError
        if (firstError != null) {
            _state.value = AuthUiState.Error(AppError.Unknown(firstError))
            return
        }
        _state.value = AuthUiState.Loading
        viewModelScope.launch {
            _state.value = runCatching { authRepository.register(phone.trim(), password, fullName.trim()) }
                .fold(
                    onSuccess = { AuthUiState.Success(it) },
                    onFailure = { AuthUiState.Error(AppErrorMapper.from(it)) },
                )
            (_state.value as? AuthUiState.Success)?.let { onSuccess(it.user) }
        }
    }

    fun reset() {
        _state.value = AuthUiState.Idle
    }
}
