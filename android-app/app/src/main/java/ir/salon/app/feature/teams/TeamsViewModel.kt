package ir.salon.app.feature.teams

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.CreateTeamRequest
import ir.salon.app.data.api.TeamDto
import ir.salon.app.data.api.TeamMemberDto
import ir.salon.app.data.api.TeamMessageDto
import ir.salon.app.data.repository.MoreRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class TeamsTab { MINE, DISCOVER }

data class TeamsState(
    val loading: Boolean = true,
    val tab: TeamsTab = TeamsTab.MINE,
    val myTeams: List<TeamDto> = emptyList(),
    val discovered: List<TeamDto> = emptyList(),
    val query: String = "",
    val error: AppError? = null,
    val message: String? = null,
    val creating: Boolean = false,
    val createError: AppError? = null,
    val createSuccess: Boolean = false,
) {
    val current: List<TeamDto> get() = if (tab == TeamsTab.MINE) myTeams else discovered
}

@HiltViewModel
class TeamsViewModel @Inject constructor(
    private val repository: MoreRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(TeamsState())
    val state: StateFlow<TeamsState> = _state

    init {
        refresh()
    }

    fun setTab(tab: TeamsTab) {
        _state.value = _state.value.copy(tab = tab)
        if (tab == TeamsTab.DISCOVER && _state.value.discovered.isEmpty()) refresh()
    }

    fun onQueryChange(value: String) {
        _state.value = _state.value.copy(query = value)
    }

    fun search() {
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val mine = repository.myTeams()
                val discover = repository.discoverTeams(_state.value.query)
                mine to discover
            }.onSuccess { (mine, discover) ->
                _state.value = _state.value.copy(
                    loading = false,
                    myTeams = mine,
                    discovered = discover,
                )
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun create(name: String, description: String?, sport: String, visibility: String) {
        if (name.trim().length < 3) {
            _state.value = _state.value.copy(createError = AppError.Unknown("نام تیم باید حداقل ۳ کاراکتر باشد"))
            return
        }
        _state.value = _state.value.copy(creating = true, createError = null)
        viewModelScope.launch {
            runCatching {
                repository.createTeam(
                    CreateTeamRequest(
                        name = name.trim(),
                        description = description?.trim()?.takeIf { it.isNotBlank() },
                        sport = sport,
                        visibility = visibility,
                    ),
                )
            }.onSuccess {
                _state.value = _state.value.copy(
                    creating = false,
                    createSuccess = true,
                    message = "تیم ساخته شد",
                )
                refresh()
            }.onFailure {
                _state.value = _state.value.copy(
                    creating = false,
                    createError = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun join(team: TeamDto) {
        viewModelScope.launch {
            runCatching { repository.requestJoinTeam(team.id) }
                .onSuccess {
                    _state.value = _state.value.copy(message = it)
                    refresh()
                }
                .onFailure { _state.value = _state.value.copy(error = AppErrorMapper.from(it)) }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }

    fun clearCreateError() {
        _state.value = _state.value.copy(createError = null, createSuccess = false)
    }
}

data class TeamDetailState(
    val loading: Boolean = true,
    val team: TeamDto? = null,
    val members: List<TeamMemberDto> = emptyList(),
    val messages: List<TeamMessageDto> = emptyList(),
    val error: AppError? = null,
    val actionLoading: Boolean = false,
    val message: String? = null,
    val sending: Boolean = false,
)

@HiltViewModel
class TeamDetailViewModel @Inject constructor(
    savedStateHandle: androidx.lifecycle.SavedStateHandle,
    private val repository: MoreRepository,
) : ViewModel() {

    private val teamId: Int = checkNotNull(savedStateHandle["teamId"])

    private val _state = MutableStateFlow(TeamDetailState())
    val state: StateFlow<TeamDetailState> = _state

    init {
        load()
    }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            runCatching {
                val team = repository.team(teamId)
                val members = repository.teamMembers(teamId)
                val messages = runCatching { repository.teamMessages(teamId) }.getOrDefault(emptyList())
                Triple(team, members, messages)
            }.onSuccess { (team, members, messages) ->
                _state.value = _state.value.copy(
                    loading = false,
                    team = team,
                    members = members,
                    messages = messages,
                )
            }.onFailure {
                _state.value = _state.value.copy(
                    loading = false,
                    error = AppErrorMapper.from(it),
                )
            }
        }
    }

    fun join() {
        _state.value = _state.value.copy(actionLoading = true)
        viewModelScope.launch {
            runCatching { repository.requestJoinTeam(teamId) }
                .onSuccess {
                    _state.value = _state.value.copy(actionLoading = false, message = it)
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(actionLoading = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun leave() {
        _state.value = _state.value.copy(actionLoading = true)
        viewModelScope.launch {
            runCatching { repository.leaveTeam(teamId) }
                .onSuccess {
                    _state.value = _state.value.copy(actionLoading = false, message = "از تیم خارج شدید")
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(actionLoading = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun sendMessage(content: String) {
        if (content.isBlank() || _state.value.sending) return
        _state.value = _state.value.copy(sending = true)
        viewModelScope.launch {
            runCatching { repository.sendTeamMessage(teamId, content.trim()) }
                .onSuccess {
                    _state.value = _state.value.copy(sending = false)
                    val messages = runCatching { repository.teamMessages(teamId) }.getOrDefault(_state.value.messages)
                    _state.value = _state.value.copy(messages = messages)
                }
                .onFailure {
                    _state.value = _state.value.copy(sending = false, error = AppErrorMapper.from(it))
                }
        }
    }

    fun consumeMessage() {
        _state.value = _state.value.copy(message = null)
    }
}
