package ir.salon.app.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.LoyaltyDto
import ir.salon.app.data.repository.AuthRepository
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import ir.salon.core.model.User
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileState(
    val loading: Boolean = true,
    val user: User? = null,
    val fullName: String = "",
    val savingProfile: Boolean = false,
    val savingPassword: Boolean = false,
    val loyalty: LoyaltyDto? = null,
    val favoriteCount: Int = 0,
    val dealSubscription: Boolean = false,
    val updatingSubscription: Boolean = false,
    val creatingReset: Boolean = false,
    val resetMessage: String? = null,
    val error: AppError? = null,
    val toast: String? = null,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val engagementRepository: EngagementRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            val user = runCatching { authRepository.currentUser() }.getOrNull()
            _state.value = _state.value.copy(
                loading = false,
                user = user,
                fullName = user?.fullName.orEmpty(),
                error = if (user == null) AppError.Network("اطلاعات حساب دریافت نشد") else null,
            )
            if (user == null) return@launch

            val loyalty = async { runCatching { engagementRepository.loyalty() }.getOrNull() }
            val favorites = async { runCatching { engagementRepository.favoriteIds() }.getOrNull() }
            val subscription = async { runCatching { engagementRepository.dealSubscription() }.getOrNull() }
            _state.value = _state.value.copy(
                loyalty = loyalty.await(),
                favoriteCount = favorites.await()?.size ?: 0,
                dealSubscription = subscription.await() ?: false,
            )
        }
    }

    fun onNameChange(value: String) {
        _state.value = _state.value.copy(fullName = value, error = null)
    }

    fun saveProfile(onSaved: (User) -> Unit) {
        val name = _state.value.fullName.trim()
        if (name.length < 3) {
            _state.value = _state.value.copy(error = AppError.Unknown("نام باید حداقل ۳ کاراکتر باشد"))
            return
        }
        _state.value = _state.value.copy(savingProfile = true, error = null)
        viewModelScope.launch {
            runCatching { authRepository.updateProfile(name) }
                .onSuccess { user ->
                    _state.value = _state.value.copy(
                        savingProfile = false,
                        user = user,
                        fullName = user.fullName.orEmpty(),
                        toast = "پروفایل با موفقیت ذخیره شد",
                    )
                    onSaved(user)
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        savingProfile = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun changePassword(oldPassword: String, newPassword: String, confirm: String) {
        val message = when {
            oldPassword.isBlank() -> "رمز فعلی را وارد کنید"
            newPassword.length < 6 -> "رمز جدید باید حداقل ۶ کاراکتر باشد"
            newPassword != confirm -> "رمز جدید و تکرار آن مطابق نیست"
            else -> null
        }
        if (message != null) {
            _state.value = _state.value.copy(error = AppError.Unknown(message))
            return
        }
        _state.value = _state.value.copy(savingPassword = true, error = null)
        viewModelScope.launch {
            runCatching { engagementRepository.changePassword(oldPassword, newPassword) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        savingPassword = false,
                        toast = "رمز عبور تغییر کرد",
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        savingPassword = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun setDealSubscription(enabled: Boolean) {
        _state.value = _state.value.copy(updatingSubscription = true)
        viewModelScope.launch {
            runCatching { engagementRepository.setDealSubscription(enabled) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        updatingSubscription = false,
                        dealSubscription = it,
                        toast = if (it) "اعلان دیل‌ها روشن شد" else "اعلان دیل‌ها خاموش شد",
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        updatingSubscription = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun requestReset(phone: String) {
        if (phone.isBlank()) {
            _state.value = _state.value.copy(error = AppError.Unknown("شماره موبایل را وارد کنید"))
            return
        }
        _state.value = _state.value.copy(creatingReset = true, resetMessage = null)
        viewModelScope.launch {
            runCatching { engagementRepository.forgotPassword(phone) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        creatingReset = false,
                        resetMessage = it.devCode?.let { code -> "کد بازیابی: $code" }
                            ?: it.message.ifBlank { "اگر حساب وجود داشته باشد، کد ارسال می‌شود." },
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        creatingReset = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun resetPassword(phone: String, code: String, newPassword: String) {
        when {
            phone.isBlank() -> {
                _state.value = _state.value.copy(error = AppError.Unknown("شماره موبایل را وارد کنید"))
                return
            }
            code.isBlank() -> {
                _state.value = _state.value.copy(error = AppError.Unknown("کد بازیابی را وارد کنید"))
                return
            }
            newPassword.length < 6 -> {
                _state.value = _state.value.copy(error = AppError.Unknown("رمز جدید باید حداقل ۶ کاراکتر باشد"))
                return
            }
        }
        _state.value = _state.value.copy(creatingReset = true, resetMessage = null)
        viewModelScope.launch {
            runCatching { engagementRepository.resetPassword(phone, code, newPassword) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        creatingReset = false,
                        resetMessage = null,
                        toast = "رمز عبور بازنشانی شد — اکنون وارد شوید",
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        creatingReset = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun consumeToast() {
        _state.value = _state.value.copy(toast = null)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
