package ir.salon.app.feature.contracts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.ContractDto
import ir.salon.app.data.api.ContractPaymentDto
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

private fun contractStatus(status: String): StatusLabels.Label =
    StatusLabels.contract[status] ?: StatusLabels.Label(status, StatusLabels.Tone.NEUTRAL)

@Composable
fun ContractsScreen(
    onBack: () -> Unit,
    onContractClick: (Int) -> Unit,
    viewModel: ContractsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "قراردادهای من", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 4)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::refresh)
            state.items.isEmpty() -> EmptyState(
                icon = Icons.Filled.Description,
                title = "قراردادی ندارید",
                description = "قراردادهای بلندمدت سالن‌ها اینجا نمایش داده می‌شوند",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items, key = { it.id }) { contract ->
                    ContractCard(contract, onClick = { onContractClick(contract.id) })
                }
            }
        }
    }
}

@Composable
private fun ContractCard(contract: ContractDto, onClick: () -> Unit) {
    val label = contractStatus(contract.status)
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    contract.venueName ?: "سالن #${PersianText.toPersianDigits(contract.venueId.toString())}",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                )
                StatusChip(label.text, label.tone)
            }
            Text(
                "${faDate(contract.startDate)} تا ${faDate(contract.endDate)} — ${faTime(contract.startTime)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row {
                Text(
                    "${PersianText.formatPrice(contract.discountedPrice.toLong())} / سانس",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    "کل: ${PersianText.formatPrice(contract.totalAmount.toLong())}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
fun ContractDetailScreen(
    onBack: () -> Unit,
    viewModel: ContractDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showCancel by rememberSaveable { mutableStateOf(false) }
    var cancelReason by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "جزئیات قرارداد", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null && state.contract == null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::load,
            )
            state.contract != null -> {
                val contract = state.contract!!
                val label = contractStatus(contract.status)
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            contract.venueName ?: "قرارداد #${contract.id}",
                            style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier.weight(1f),
                        )
                        StatusChip(label.text, label.tone)
                    }
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            InfoRow("بازه", "${faDate(contract.startDate)} تا ${faDate(contract.endDate)}")
                            InfoRow("ساعت", faTime(contract.startTime) + " (${PersianText.toPersianDigits(contract.duration.toString())} دقیقه)")
                            InfoRow("قیمت هر سانس", PersianText.formatPrice(contract.discountedPrice.toLong()))
                            InfoRow("مبلغ کل", PersianText.formatPrice(contract.totalAmount.toLong()))
                            InfoRow("وضعیت پرداخت", contract.paymentStatus)
                            contract.cancellationPolicy?.let { InfoRow("شرایط لغو", it) }
                            contract.rejectReason?.let { InfoRow("دلیل رد", it) }
                        }
                    }

                    if (contract.sessions.isNotEmpty()) {
                        Text("سانس‌ها", style = MaterialTheme.typography.titleMedium)
                        contract.sessions.take(20).forEach { session ->
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "${faDate(session.sessionDate)} — ${faTime(session.startTime)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.weight(1f),
                                )
                                Text(
                                    when (session.status) {
                                        "completed" -> "انجام‌شده"
                                        "excluded" -> "حذف‌شده"
                                        "cancelled" -> "لغو‌شده"
                                        else -> "برنامه‌ریزی‌شده"
                                    },
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }

                    if (contract.payments.isNotEmpty()) {
                        Text("اقساط", style = MaterialTheme.typography.titleMedium)
                        contract.payments.forEach { payment ->
                            PaymentRow(
                                payment = payment,
                                paying = state.payingId == payment.id,
                                onPay = { viewModel.pay(payment.id) },
                            )
                        }
                    }

                    if (contract.status == "active" || contract.status == "pending") {
                        OutlinedButton(
                            onClick = { showCancel = true },
                            enabled = !state.cancelling,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("لغو قرارداد") }
                    }

                    state.error?.let {
                        Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)

    if (showCancel) {
        AlertDialog(
            onDismissRequest = { showCancel = false },
            title = { Text("لغو قرارداد") },
            text = {
                OutlinedTextField(
                    value = cancelReason,
                    onValueChange = { cancelReason = it },
                    label = { Text("دلیل لغو") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.cancel(cancelReason)
                        showCancel = false
                        cancelReason = ""
                    },
                    enabled = !state.cancelling,
                ) { Text("لغو قرارداد") }
            },
            dismissButton = { TextButton(onClick = { showCancel = false }) { Text("انصراف") } },
        )
    }
}

@Composable
private fun PaymentRow(payment: ContractPaymentDto, paying: Boolean, onPay: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(payment.label ?: "قسط ${payment.installmentNo ?: ""}", style = MaterialTheme.typography.bodyMedium)
                Text(
                    "سررسید: ${faDate(payment.dueDate)}" + if (payment.isOverdue) " — معوق" else "",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (payment.isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(PersianText.formatPrice(payment.amount.toLong()), style = MaterialTheme.typography.titleSmall)
            }
            when {
                payment.isPaid -> Text("پرداخت‌شده", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                payment.isVoided -> Text("باطل", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                else -> Button(
                    onClick = onPay,
                    enabled = !paying,
                    modifier = Modifier.height(MinTouchTarget),
                ) { Text(if (paying) "…" else "پرداخت") }
            }
        }
    }
}

private val weekDayLabels = listOf(
    "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه",
)

@Composable
fun ContractRequestDialog(
    viewModel: ContractRequestViewModel = hiltViewModel(),
    onDismiss: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var startDate by rememberSaveable { mutableStateOf("") }
    var endDate by rememberSaveable { mutableStateOf("") }
    var dayOfWeek by rememberSaveable { mutableStateOf(0) }
    var startTime by rememberSaveable { mutableStateOf("18:00") }
    var price by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }

    if (state.success) {
        AlertDialog(
            onDismissRequest = {
                viewModel.dismissResult()
                onDismiss()
            },
            title = { Text("درخواست ثبت شد") },
            text = { Text("درخواست قرارداد شما ثبت شد و پس از تأیید مدیر سالن فعال می‌شود.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.dismissResult()
                    onDismiss()
                }) { Text("باشه") }
            },
        )
        return
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("درخواست قرارداد بلندمدت") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("تاریخ شروع (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("تاریخ پایان (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text("روز هفته", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    weekDayLabels.take(4).forEachIndexed { index, label ->
                        FilterChip(
                            selected = dayOfWeek == index,
                            onClick = { dayOfWeek = index },
                            label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    weekDayLabels.drop(4).forEachIndexed { offset, label ->
                        val index = offset + 4
                        FilterChip(
                            selected = dayOfWeek == index,
                            onClick = { dayOfWeek = index },
                            label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                        )
                    }
                }
                OutlinedTextField(
                    value = startTime,
                    onValueChange = { startTime = it },
                    label = { Text("ساعت شروع (HH:MM)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it.filter { ch -> ch.isDigit() } },
                    label = { Text("قیمت پیشنهادی هر سانس (ریال)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
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
                state.error?.let {
                    Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    viewModel.submit(
                        startDate = startDate,
                        endDate = endDate,
                        dayOfWeek = dayOfWeek,
                        startTime = startTime,
                        pricePerSession = price.toIntOrNull() ?: 0,
                        description = description,
                    )
                },
                enabled = !state.submitting,
            ) { Text(if (state.submitting) "در حال ارسال…" else "ارسال درخواست") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("انصراف") }
        },
    )
}
