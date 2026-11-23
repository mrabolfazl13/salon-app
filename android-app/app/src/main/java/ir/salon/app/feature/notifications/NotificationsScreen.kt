package ir.salon.app.feature.notifications

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.R
import ir.salon.app.feature.bookings.faDate
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen

@Composable
fun NotificationsScreen(
    onBack: () -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var unreadOnly by rememberSaveable { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.liveMessage) {
        state.liveMessage?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeLiveMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(
            title = "اعلان‌ها",
            onBack = onBack,
            action = {
                if (state.unread > 0) {
                    TextButton(onClick = viewModel::markAllRead) { Text("خواندن همه") }
                }
            },
        )

        TabRow(
            selectedTabIndex = if (unreadOnly) 1 else 0,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.secondary,
        ) {
            Tab(
                selected = !unreadOnly,
                onClick = { unreadOnly = false; viewModel.setUnreadOnly(false) },
                text = { Text("همه") },
                selectedContentColor = MaterialTheme.colorScheme.onSecondaryContainer,
                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Tab(
                selected = unreadOnly,
                onClick = { unreadOnly = true; viewModel.setUnreadOnly(true) },
                text = { Text("خوانده‌نشده (${PersianText.toPersianDigits(state.unread.toString())})") },
                selectedContentColor = MaterialTheme.colorScheme.onSecondaryContainer,
                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = { viewModel.refresh() },
            )
            state.items.isEmpty() -> EmptyState(
                icon = Icons.Filled.Notifications,
                title = "اعلانی ندارید",
                description = "اعلان‌های رزرو، قرارداد و تخفیف‌ها اینجا نمایش داده می‌شوند",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 16.dp, end = 16.dp, top = 12.dp, bottom = 24.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items, key = { it.id }) { item ->
                    Card(
                        onClick = { viewModel.markRead(item) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.large,
                        colors = CardDefaults.cardColors(
                            containerColor = if (item.isRead) {
                                MaterialTheme.colorScheme.surface
                            } else {
                                MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.35f)
                            },
                        ),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (!item.isRead) {
                                    Text(
                                        "●",
                                        color = MaterialTheme.colorScheme.primary,
                                        style = MaterialTheme.typography.titleMedium,
                                    )
                                    Spacer(Modifier.width(6.dp))
                                }
                                Text(
                                    item.title,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = if (item.isRead) androidx.compose.ui.text.font.FontWeight.SemiBold
                                    else androidx.compose.ui.text.font.FontWeight.ExtraBold,
                                    modifier = Modifier.weight(1f),
                                )
                            }
                            Text(
                                item.message,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            item.createdAt?.let {
                                Text(
                                    faDate(it.take(10)),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(8.dp)) }
            }
        }
    }
    SnackbarHost(hostState = snackbar)
}
