package ir.salon.app.feature.teams

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.TeamDto
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.InfoRow
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen

private val teamRoleLabels = mapOf(
    "captain" to "کاپیتان",
    "admin" to "مدیر",
    "member" to "عضو",
)

@Composable
fun TeamsScreen(
    onBack: () -> Unit,
    onTeamClick: (Int) -> Unit,
    viewModel: TeamsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showCreate by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    LaunchedEffect(state.createSuccess) {
        if (state.createSuccess) {
            showCreate = false
            viewModel.clearCreateError()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(
            title = "تیم‌ها",
            onBack = onBack,
            action = {
                FloatingActionButton(
                    onClick = { showCreate = true },
                    modifier = Modifier.size(MinTouchTarget),
                ) { Icon(Icons.Filled.Add, contentDescription = "ساخت تیم") }
            },
        )
        TabRow(selectedTabIndex = if (state.tab == TeamsTab.MINE) 0 else 1) {
            Tab(selected = state.tab == TeamsTab.MINE, onClick = { viewModel.setTab(TeamsTab.MINE) }, text = { Text("تیم‌های من") })
            Tab(selected = state.tab == TeamsTab.DISCOVER, onClick = { viewModel.setTab(TeamsTab.DISCOVER) }, text = { Text("کشف تیم‌ها") })
        }

        if (state.tab == TeamsTab.DISCOVER) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = state.query,
                    onValueChange = viewModel::onQueryChange,
                    placeholder = { Text("جستجوی تیم…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { viewModel.search() }),
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(8.dp))
                Button(onClick = viewModel::search, modifier = Modifier.height(MinTouchTarget)) {
                    Text("جستجو")
                }
            }
        }

        when {
            state.loading -> SkeletonScreen(rows = 4)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::refresh)
            state.current.isEmpty() -> EmptyState(
                icon = Icons.Filled.Groups,
                title = if (state.tab == TeamsTab.MINE) "تیمی ندارید" else "تیمی یافت نشد",
                description = if (state.tab == TeamsTab.MINE) "یک تیم بسازید یا به تیم‌های دیگر بپیوندید" else "عبارت جستجو را تغییر دهید",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.current, key = { it.id }) { team ->
                    TeamCard(
                        team = team,
                        onClick = { onTeamClick(team.id) },
                        onJoin = { viewModel.join(team) },
                        showJoin = state.tab == TeamsTab.DISCOVER,
                    )
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)

    if (showCreate) {
        CreateTeamDialog(
            creating = state.creating,
            error = state.createError?.uiMessage(),
            onDismiss = {
                showCreate = false
                viewModel.clearCreateError()
            },
            onCreate = { name, description, sport, visibility ->
                viewModel.create(name, description, sport, visibility)
            },
        )
    }
}

@Composable
private fun TeamCard(team: TeamDto, onClick: () -> Unit, onJoin: () -> Unit, showJoin: Boolean) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(team.name, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (team.isOfficial) {
                    Icon(Icons.Filled.Verified, contentDescription = "تیم رسمی", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                }
            }
            Text(
                "${team.sport} • ${PersianText.toPersianDigits(team.memberCount.toString())} عضو" +
                    if (team.quota > 0) " از ${PersianText.toPersianDigits(team.quota.toString())}" else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            team.description?.takeIf { it.isNotBlank() }?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, maxLines = 2)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "کاپیتان: ${team.captainName ?: "—"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
                team.myRole?.let {
                    Text(teamRoleLabels[it] ?: it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
            if (showJoin && team.myRole == null) {
                OutlinedButton(
                    onClick = onJoin,
                    enabled = !team.hasOpenJoinRequest,
                    modifier = Modifier.height(MinTouchTarget),
                ) { Text(if (team.hasOpenJoinRequest) "درخواست ثبت شده" else "درخواست عضویت") }
            }
        }
    }
}

@Composable
private fun CreateTeamDialog(
    creating: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onCreate: (String, String, String, String) -> Unit,
) {
    var name by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var sport by rememberSaveable { mutableStateOf("futsal") }
    var visibility by rememberSaveable { mutableStateOf("public") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("ساخت تیم") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("نام تیم") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("توضیحات (اختیاری)") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = sport,
                    onValueChange = { sport = it },
                    label = { Text("رشته ورزشی") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { visibility = "public" }, enabled = visibility != "public") { Text("عمومی") }
                    OutlinedButton(onClick = { visibility = "private" }, enabled = visibility != "private") { Text("خصوصی") }
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            TextButton(onClick = { onCreate(name, description, sport, visibility) }, enabled = !creating) {
                Text(if (creating) "در حال ساخت…" else "ساخت")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("انصراف") } },
    )
}

@Composable
fun TeamDetailScreen(
    onBack: () -> Unit,
    viewModel: TeamDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var messageText by rememberSaveable { mutableStateOf("") }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "جزئیات تیم", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null && state.team == null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::load)
            state.team != null -> {
                val team = state.team!!
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(team.name, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                        if (team.isOfficial) {
                            Icon(Icons.Filled.Verified, contentDescription = "تیم رسمی", tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            InfoRow("کاپیتان", team.captainName ?: "—")
                            InfoRow("رشته", team.sport)
                            InfoRow("اعضا", "${PersianText.toPersianDigits(team.memberCount.toString())} نفر")
                            InfoRow("نقش من", teamRoleLabels[team.myRole] ?: "غیرعضو")
                            team.description?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
                        }
                    }

                    if (team.myRole == null) {
                        Button(
                            onClick = viewModel::join,
                            enabled = !state.actionLoading,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text(if (state.actionLoading) "در حال ارسال…" else "درخواست عضویت") }
                    } else if (team.myRole != "captain") {
                        OutlinedButton(
                            onClick = viewModel::leave,
                            enabled = !state.actionLoading,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("خروج از تیم") }
                    }

                    Text("اعضا", style = MaterialTheme.typography.titleMedium)
                    state.members.forEach { member ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(member.fullName ?: "عضو", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                            Text(teamRoleLabels[member.role] ?: member.role, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    if (team.myRole != null) {
                        Text("گفتگوی تیم", style = MaterialTheme.typography.titleMedium)
                        state.messages.takeLast(20).forEach { message ->
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(message.fullName ?: "عضو", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                Text(message.content, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = messageText,
                                onValueChange = { messageText = it },
                                placeholder = { Text("پیام…") },
                                modifier = Modifier.weight(1f),
                                maxLines = 3,
                            )
                            IconButton(
                                onClick = {
                                    viewModel.sendMessage(messageText)
                                    messageText = ""
                                },
                                enabled = messageText.isNotBlank() && !state.sending,
                                modifier = Modifier.size(MinTouchTarget),
                            ) { Icon(Icons.Filled.Send, contentDescription = "ارسال پیام") }
                        }
                    }

                    state.error?.let {
                        Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)
}
