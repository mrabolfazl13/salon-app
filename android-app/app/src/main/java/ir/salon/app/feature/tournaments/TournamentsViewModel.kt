package ir.salon.app.feature.tournaments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.BracketDto
import ir.salon.app.data.api.TeamDto
import ir.salon.app.data.api.TournamentDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TournamentsState(
    val loading: Boolean = true,
    val mine: Boolean = false,
    val items: List<TournamentDto> = emptyList(),
    val error: AppError? = null,
)

@HiltViewModel
class TournamentsViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(TournamentsState())
    val state: StateFlow<TournamentsState> = _state

    init {
        refresh()
    }

    fun setMine(value: Boolean) {
        _state.value = _state.value.copy(mine = value)
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching { repository.tournaments(mine = _state.value.mine) }
                .onSuccess { _state.value = _state.value.copy(loading = false, items = it) }
                .onFailure { _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it)) }
        }
    }
}

data class TournamentDetailState(
    val loading: Boolean = true,
    val tournament: TournamentDto? = null,
    val bracket: BracketDto? = null,
    val myTeams: List<TeamDto> = emptyList(),
    val error: AppError? = null,
    val registering: Boolean = false,
    val message: String? = null,
)

@HiltViewModel
class TournamentDetailViewModel @Inject constructor(
    savedStateHandle: androidx.lifecycle.SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val tournamentId: Int = checkNotNull(savedStateHandle["tournamentId"])

    private val _state = MutableStateFlow(TournamentDetailState())
    val state: StateFlow<TournamentDetailState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val tournament = repository.tournament(tournamentId)
                val bracket = runCatching { repository.bracket(tournamentId) }.getOrNull()
                val teams = runCatching { repository.myTeams() }.getOrDefault(emptyList())
                Triple(tournament, bracket, teams)
            }.onSuccess { (tournament, bracket, teams) ->
                _state.value = _state.value.copy(
                    loading = false,
                    tournament = tournament,
                    bracket = bracket,
                    myTeams = teams,
                )
            }.onFailure {
                _state.value = _state.value.copy(loading = false, error = AppErrorMapper.from(it))
            }
        }
    }

    fun register(teamId: Int) {
        if (_state.value.registering) return
        _state.value = _state.value.copy(registering = true, message = null)
        viewModelScope.launch {
            runCatching { repository.registerTeam(tournamentId, teamId) }
                .onSuccess {
                    _state.value = _state.value.copy(registering = false, message = it)
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(registering = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }
}
