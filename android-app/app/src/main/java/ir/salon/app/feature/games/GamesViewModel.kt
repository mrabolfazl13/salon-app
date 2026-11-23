package ir.salon.app.feature.games

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.GameDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GamesState(
    val loading: Boolean = true,
    val myOnly: Boolean = false,
    val games: List<GameDto> = emptyList(),
    val error: AppError? = null,
    val message: String? = null,
)

@HiltViewModel
class GamesViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(GamesState())
    val state: StateFlow<GamesState> = _state

    init {
        refresh()
    }

    fun setMyOnly(value: Boolean) {
        _state.value = _state.value.copy(myOnly = value)
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                if (_state.value.myOnly) repository.myGames() else repository.games()
            }.onSuccess {
                _state.value = _state.value.copy(loading = false, games = it)
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun join(game: GameDto) {
        viewModelScope.launch {
            runCatching { repository.joinGame(game.id) }
                .onSuccess {
                    _state.value = _state.value.copy(message = it.message)
                    refresh()
                }
                .onFailure {
                    _state.value = _state.value.copy(error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }
}

data class GameDetailState(
    val loading: Boolean = true,
    val game: GameDto? = null,
    val participants: List<ir.salon.app.data.api.GameParticipantDto> = emptyList(),
    val error: AppError? = null,
    val actionLoading: Boolean = false,
    val message: String? = null,
)

@HiltViewModel
class GameDetailViewModel @Inject constructor(
    savedStateHandle: androidx.lifecycle.SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val gameId: Int = checkNotNull(savedStateHandle["gameId"])

    private val _state = MutableStateFlow(GameDetailState())
    val state: StateFlow<GameDetailState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { repository.game(gameId) to repository.gameParticipants(gameId) }
                .onSuccess { (game, participants) ->
                    _state.value = _state.value.copy(
                        loading = false,
                        game = game,
                        participants = participants,
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        loading = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun join() {
        action { repository.joinGame(gameId) }
    }

    fun leave() {
        action { repository.leaveGame(gameId) }
    }

    private fun action(block: suspend () -> ir.salon.app.data.api.GameActionDto) {
        if (_state.value.actionLoading) return
        _state.value = _state.value.copy(actionLoading = true, message = null)
        viewModelScope.launch {
            runCatching { block() }
                .onSuccess {
                    _state.value = _state.value.copy(actionLoading = false, message = it.message)
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        actionLoading = false,
                        error = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }
}
