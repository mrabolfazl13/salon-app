package ir.salon.app.feature.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget

@Composable
fun CreateGameScreen(
    onBack: () -> Unit,
    onCreated: (Int) -> Unit,
    viewModel: CreateGameViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.created?.id) {
        state.created?.let { onCreated(it.id) }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "ساخت بازی گروهی", onBack = onBack)
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = state.name,
                onValueChange = viewModel::onName,
                label = { Text("نام بازی") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.description,
                onValueChange = viewModel::onDescription,
                label = { Text("توضیحات (اختیاری)") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.sport,
                onValueChange = viewModel::onSport,
                label = { Text("رشته ورزشی") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.maxPlayers,
                onValueChange = viewModel::onMaxPlayers,
                label = { Text("حداکثر بازیکن") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Text("سطح", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("beginner" to "مبتدی", "intermediate" to "متوسط", "advanced" to "پیشرفته", "pro" to "حرفه‌ای").forEach {
                    FilterChip(
                        selected = state.skillLevel == it.first,
                        onClick = { viewModel.onSkill(it.first) },
                        label = { Text(it.second) },
                    )
                }
            }
            Text("نوع بازی", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("public" to "عمومی", "public_approval" to "با تأیید", "private" to "خصوصی").forEach {
                    FilterChip(
                        selected = state.visibility == it.first,
                        onClick = { viewModel.onVisibility(it.first) },
                        label = { Text(it.second) },
                    )
                }
            }
            Text("پرداخت", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(
                    "split_payment" to "تقسیم بین بازیکنان",
                    "organizer_pays" to "برگزارکننده",
                    "free" to "رایگان",
                ).forEach {
                    FilterChip(
                        selected = state.paymentMode == it.first,
                        onClick = { viewModel.onPaymentMode(it.first) },
                        label = { Text(it.second) },
                    )
                }
            }
            state.error?.let {
                Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            Button(
                onClick = viewModel::submit,
                enabled = !state.submitting,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text(if (state.submitting) "در حال ساخت…" else "ساخت بازی") }
        }
    }
}
