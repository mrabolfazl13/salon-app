package ir.salon.app.feature.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.InfoRow
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen

@Composable
fun AdminScreen(
    onBack: () -> Unit,
    viewModel: AdminViewModel = hiltViewModel(),
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
        FeatureHeader(title = "پنل مدیر کل", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::load)
            else -> Column(
                modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("آمار کاربران", style = MaterialTheme.typography.titleMedium)
                        InfoRow("کل کاربران", PersianText.toPersianDigits((state.usersStats?.totalUsers ?: 0).toString()))
                        InfoRow("فعال", PersianText.toPersianDigits((state.usersStats?.activeUsers ?: 0).toString()))
                        InfoRow("تأییدشده", PersianText.toPersianDigits((state.usersStats?.verifiedUsers ?: 0).toString()))
                    }
                }
                Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("آمار سالن‌ها", style = MaterialTheme.typography.titleMedium)
                        InfoRow("کل سالن‌ها", PersianText.toPersianDigits((state.venuesStats?.totalVenues ?: 0).toString()))
                        InfoRow("تأییدشده", PersianText.toPersianDigits((state.venuesStats?.verifiedVenues ?: 0).toString()))
                        InfoRow("در انتظار", PersianText.toPersianDigits((state.venuesStats?.pendingVenues ?: 0).toString()))
                    }
                }

                Text("سالن‌های در انتظار تأیید", style = MaterialTheme.typography.titleMedium)
                if (state.pendingVenues.isEmpty()) {
                    Text("سالنی در انتظار نیست", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    state.pendingVenues.forEach { venue ->
                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(venue.name, style = MaterialTheme.typography.titleSmall)
                                    Text(venue.address, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Button(
                                    onClick = { viewModel.verifyVenue(venue) },
                                    enabled = state.verifyingId == null,
                                    modifier = Modifier.height(MinTouchTarget),
                                ) { Text(if (state.verifyingId == venue.id) "…" else "تأیید") }
                            }
                        }
                    }
                }

                Text("مدیران در انتظار تأیید", style = MaterialTheme.typography.titleMedium)
                if (state.pendingManagers.isEmpty()) {
                    Text("مدیری در انتظار نیست", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    state.pendingManagers.forEach { user ->
                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(user.fullName ?: "مدیر", style = MaterialTheme.typography.titleSmall)
                                    Text(PersianText.toPersianDigits(user.phone), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Button(onClick = { viewModel.approveUser(user) }, modifier = Modifier.height(MinTouchTarget)) { Text("تأیید") }
                                Text(" ", style = MaterialTheme.typography.labelSmall)
                                androidx.compose.material3.OutlinedButton(onClick = { viewModel.rejectUser(user) }, modifier = Modifier.height(MinTouchTarget)) { Text("رد") }
                            }
                        }
                    }
                }

                Text("کاربران", style = MaterialTheme.typography.titleMedium)
                state.users.take(50).forEach { user ->
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(user.fullName ?: "کاربر", style = MaterialTheme.typography.bodyMedium)
                            Text(PersianText.toPersianDigits(user.phone), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(user.role, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)
}
