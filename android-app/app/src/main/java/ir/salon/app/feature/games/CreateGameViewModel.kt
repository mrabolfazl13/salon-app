package ir.salon.app.feature.games

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.CreateGameRequest
import ir.salon.app.data.api.GameDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CreateGameState(
    val name: String = "",
    val description: String = "",
    val sport: String = "football",
    val maxPlayers: String = "10",
    val skillLevel: String = "intermediate",
    val visibility: String = "public",
    val paymentMode: String = "split_payment",
    val submitting: Boolean = false,
    val error: AppError? = null,
    val created: GameDto? = null,
)

@HiltViewModel
class CreateGameViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val bookingId: Int = checkNotNull(savedStateHandle["bookingId"])

    private val _state = MutableStateFlow(CreateGameState())
    val state: StateFlow<CreateGameState> = _state

    fun onName(value: String) = update { copy(name = value, error = null) }
    fun onDescription(value: String) = update { copy(description = value) }
    fun onSport(value: String) = update { copy(sport = value) }
    fun onMaxPlayers(value: String) = update { copy(maxPlayers = value.filter { it.isDigit() }) }
    fun onSkill(value: String) = update { copy(skillLevel = value) }
    fun onVisibility(value: String) = update { copy(visibility = value) }
    fun onPaymentMode(value: String) = update { copy(paymentMode = value) }

    fun submit() {
        val s = _state.value
        val players = s.maxPlayers.toIntOrNull() ?: 0
        val error = when {
            s.name.trim().length < 3 -> "نام بازی باید حداقل ۳ کاراکتر باشد"
            players !in 2..100 -> "ظرفیت باید بین ۲ تا ۱۰۰ نفر باشد"
            else -> null
        }
        if (error != null) {
            _state.value = s.copy(error = AppError.Unknown(error))
            return
        }
        _state.value = s.copy(submitting = true, error = null)
        viewModelScope.launch {
            runCatching {
                repository.createGame(
                    CreateGameRequest(
                        bookingId = bookingId,
                        name = s.name.trim(),
                        description = s.description.trim().takeIf { it.isNotBlank() },
                        sport = s.sport,
                        maxPlayers = players,
                        skillLevel = s.skillLevel,
                        visibility = s.visibility,
                        paymentMode = s.paymentMode,
                    ),
                )
            }.onSuccess {
                _state.value = _state.value.copy(submitting = false, created = it)
            }.onFailure {
                _state.value = _state.value.copy(submitting = false, error = AppErrorMapper.from(it))
            }
        }
    }

    private fun update(block: CreateGameState.() -> CreateGameState) {
        _state.value = _state.value.block()
    }
}
