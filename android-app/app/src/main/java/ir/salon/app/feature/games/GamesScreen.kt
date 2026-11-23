package ir.salon.app.feature.games

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.GameDto
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.app.feature.booking.faTime
import ir.salon.app.feature.bookings.faDate
import ir.salon.core.common.PersianText
import ir.salon.core.common.StatusLabels
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.InfoRow
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.StatusChip

private val skillLabels = mapOf(
    "beginner" to "مبتدی",
    "intermediate" to "متوسط",
    "advanced" to "پیشرفته",
    "pro" to "حرفه‌ای",
)

private val gameStatusLabels = mapOf(
    "draft" to "پیش‌نویس",
    "open" to "باز",
    "full" to "پر",
    "started" to "شروع شده",
    "completed" to "تمام شده",
    "cancelled" to "لغو شده",
)

private fun gameStatusTone(status: String): StatusLabels.Tone = when (status) {
    "open" -> StatusLabels.Tone.POSITIVE
    "full", "started" -> StatusLabels.Tone.INFO
    "completed" -> StatusLabels.Tone.NEUTRAL
    "cancelled" -> StatusLabels.Tone.NEGATIVE
    else -> StatusLabels.Tone.NEUTRAL
}

@Composable
fun GamesScreen(
    onBack: () -> Unit,
    onGameClick: (Int) -> Unit,
    viewModel: GamesViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "بازی‌های گروهی", onBack = onBack)
        TabRow(selectedTabIndex = if (state.myOnly) 1 else 0) {
            Tab(selected = !state.myOnly, onClick = { viewModel.setMyOnly(false) }, text = { Text("کشف بازی‌ها") })
            Tab(selected = state.myOnly, onClick = { viewModel.setMyOnly(true) }, text = { Text("بازی‌های من") })
        }

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::refresh)
            state.games.isEmpty() -> EmptyState(
                icon = Icons.Filled.Groups,
                title = "بازی‌ای یافت نشد",
                description = if (state.myOnly) "هنوز در بازی‌ای شرکت نکرده‌اید" else "بازی عمومی فعالی وجود ندارد",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.games, key = { it.id }) { game ->
                    GameCard(game = game, onClick = { onGameClick(game.id) }, modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)
}

@Composable
fun GameCard(game: GameDto, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Card(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(game.name, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                StatusChip(
                    text = gameStatusLabels[game.status] ?: game.status,
                    tone = gameStatusTone(game.status),
                )
            }
            Text(
                "${game.sport} • ${skillLabels[game.skillLevel] ?: game.skillLevel}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (game.venueName != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Place, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(4.dp))
                    Text(game.venueName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (game.slotDate != null && game.startTime != null) {
                Text(
                    "${faDate(game.slotDate)} — ${faTime(game.startTime)} تا ${endTimeOf(game.startTime, game.duration)}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "${PersianText.toPersianDigits(game.currentPlayers.toString())} از ${PersianText.toPersianDigits(game.maxPlayers.toString())} بازیکن",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
                game.pricePerPlayer?.let {
                    Text(
                        "${PersianText.formatPrice(it.toLong())} / نفر",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }
    }
}

@Composable
fun GameDetailScreen(
    onBack: () -> Unit,
    viewModel: GameDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "جزئیات بازی", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null && state.game == null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::load,
            )
            state.game != null -> {
                val game = state.game!!
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(game.name, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                        StatusChip(gameStatusLabels[game.status] ?: game.status, gameStatusTone(game.status))
                    }
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            InfoRow("میزبان", game.organizerName ?: "—")
                            InfoRow("سالن", game.venueName ?: "—")
                            InfoRow("سطح", skillLabels[game.skillLevel] ?: game.skillLevel)
                            InfoRow(
                                "زمان",
                                if (game.slotDate != null) "${faDate(game.slotDate)} — ${faTime(game.startTime)}" else "—",
                            )
                            InfoRow(
                                "ظرفیت",
                                "${PersianText.toPersianDigits(game.currentPlayers.toString())} از ${PersianText.toPersianDigits(game.maxPlayers.toString())}",
                            )
                            game.pricePerPlayer?.let { InfoRow("سهم هر نفر", PersianText.formatPrice(it.toLong())) }
                            game.description?.takeIf { it.isNotBlank() }?.let {
                                Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    val joined = game.myParticipantStatus == "accepted"
                    if (joined) {
                        OutlinedButton(
                            onClick = viewModel::leave,
                            enabled = !state.actionLoading,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("خروج از بازی") }
                    } else {
                        Button(
                            onClick = viewModel::join,
                            enabled = !state.actionLoading && game.status == "open",
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Text(
                                when {
                                    state.actionLoading -> "در حال ثبت…"
                                    game.status != "open" -> "ظرفیت تکمیل است"
                                    else -> "پیوستن به بازی"
                                },
                            )
                        }
                    }

                    Text("بازیکنان", style = MaterialTheme.typography.titleMedium)
                    if (state.participants.isEmpty()) {
                        Text("هنوز بازیکنی نپیوسته است", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        state.participants.filter { it.status == "accepted" }.forEach { participant ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(participant.fullName ?: "بازیکن", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                                Text(
                                    if (participant.role == "organizer") "برگزارکننده" else "عضو",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
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
