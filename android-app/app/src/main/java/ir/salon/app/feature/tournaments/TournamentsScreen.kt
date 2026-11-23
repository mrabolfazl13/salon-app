package ir.salon.app.feature.tournaments

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.TournamentDto
import ir.salon.app.data.api.TournamentMatchDto
import ir.salon.core.common.PersianText
import ir.salon.core.common.StatusLabels
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.InfoRow
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.StatusChip

private fun tournamentStatus(status: String): StatusLabels.Label = when (status) {
    "draft" -> StatusLabels.Label("پیش‌نویس", StatusLabels.Tone.NEUTRAL)
    "registration" -> StatusLabels.Label("ثبت‌نام باز", StatusLabels.Tone.POSITIVE)
    "drawn" -> StatusLabels.Label("قرعه‌کشی‌شده", StatusLabels.Tone.INFO)
    "in_progress" -> StatusLabels.Label("در جریان", StatusLabels.Tone.INFO)
    "completed" -> StatusLabels.Label("پایان‌یافته", StatusLabels.Tone.NEUTRAL)
    "cancelled" -> StatusLabels.Label("لغو شده", StatusLabels.Tone.NEGATIVE)
    else -> StatusLabels.Label(status, StatusLabels.Tone.NEUTRAL)
}

private val formatLabels = mapOf(
    "single_elimination" to "تک‌حذفی",
    "double_elimination" to "دو‌حذفی",
    "round_robin" to "لیگ",
)

@Composable
fun TournamentsScreen(
    onBack: () -> Unit,
    onTournamentClick: (Int) -> Unit,
    viewModel: TournamentsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "تورنمنت‌ها", onBack = onBack)
        TabRow(selectedTabIndex = if (state.mine) 1 else 0) {
            Tab(selected = !state.mine, onClick = { viewModel.setMine(false) }, text = { Text("همه") })
            Tab(selected = state.mine, onClick = { viewModel.setMine(true) }, text = { Text("ساختهٔ من") })
        }

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::refresh)
            state.items.isEmpty() -> EmptyState(
                icon = Icons.Filled.EmojiEvents,
                title = "تورنمنتی نیست",
                description = if (state.mine) "هنوز تورنمنتی نساخته‌اید" else "تورنمنت فعالی ثبت نشده است",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items, key = { it.id }) { tournament ->
                    TournamentCard(tournament = tournament, onClick = { onTournamentClick(tournament.id) })
                }
            }
        }
    }
}

@Composable
private fun TournamentCard(tournament: TournamentDto, onClick: () -> Unit) {
    val label = tournamentStatus(tournament.status)
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(tournament.name, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                StatusChip(label.text, label.tone)
            }
            Text(
                "${tournament.sport} • ${formatLabels[tournament.format] ?: tournament.format}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row {
                Text(
                    "${PersianText.toPersianDigits(tournament.teamCount.toString())} تیم",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.weight(1f),
                )
                if (tournament.entryFee > 0) {
                    Text(
                        "ورودی: ${PersianText.formatPrice(tournament.entryFee.toLong())}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            tournament.winnerTeamName?.let {
                Text("قهرمان: $it", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}

@Composable
fun TournamentDetailScreen(
    onBack: () -> Unit,
    viewModel: TournamentDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showRegister by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "جزئیات تورنمنت", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null && state.tournament == null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::load,
            )
            state.tournament != null -> {
                val tournament = state.tournament!!
                val label = tournamentStatus(tournament.status)
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(tournament.name, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                        StatusChip(label.text, label.tone)
                    }
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            InfoRow("برگزارکننده", tournament.organizerName ?: "—")
                            InfoRow("فرمت", formatLabels[tournament.format] ?: tournament.format)
                            InfoRow("تعداد تیم", PersianText.toPersianDigits(tournament.teamCount.toString()))
                            if (tournament.entryFee > 0) {
                                InfoRow("ورودی", PersianText.formatPrice(tournament.entryFee.toLong()))
                            }
                            tournament.description?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
                        }
                    }

                    if (state.myTeams.isNotEmpty() && tournament.status in setOf("registration", "draft")) {
                        Button(
                            onClick = { showRegister = true },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("ثبت‌نام تیم") }
                    }

                    Text("تیم‌های شرکت‌کننده", style = MaterialTheme.typography.titleMedium)
                    val participants = state.bracket?.participants.orEmpty()
                    if (participants.isEmpty()) {
                        Text("هنوز تیمی ثبت‌نام نکرده است", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        participants.forEach { p ->
                            Text(
                                "${PersianText.toPersianDigits((participants.indexOf(p) + 1).toString())}. ${p.teamName ?: "تیم"}" +
                                    (p.seed?.let { " (سید ${PersianText.toPersianDigits(it.toString())})" } ?: ""),
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }

                    val rounds = state.bracket?.rounds.orEmpty()
                    if (rounds.isNotEmpty()) {
                        Text("جدول مسابقات", style = MaterialTheme.typography.titleMedium)
                        rounds.forEach { round ->
                            Text(round.name, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                            round.matches.forEach { match -> MatchRow(match) }
                            round.byeTeamName?.let {
                                Text("استراحت: $it", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Spacer(Modifier.height(6.dp))
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

    if (showRegister) {
        AlertDialog(
            onDismissRequest = { showRegister = false },
            title = { Text("انتخاب تیم") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    state.myTeams.forEach { team ->
                        OutlinedButton(
                            onClick = {
                                viewModel.register(team.id)
                                showRegister = false
                            },
                            modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                        ) { Text(team.name) }
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { showRegister = false }) { Text("انصراف") } },
        )
    }
}

@Composable
private fun MatchRow(match: TournamentMatchDto) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp), shape = MaterialTheme.shapes.small) {
        Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                match.teamAName ?: "—",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1f),
            )
            Text(
                "${match.scoreA ?: "-"} - ${match.scoreB ?: "-"}",
                style = MaterialTheme.typography.titleSmall,
            )
            Text(
                match.teamBName ?: "—",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1f),
                textAlign = androidx.compose.ui.text.style.TextAlign.End,
            )
        }
    }
}
