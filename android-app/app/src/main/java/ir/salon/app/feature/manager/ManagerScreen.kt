package ir.salon.app.feature.manager

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
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
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.ManagerContractRowDto
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.app.feature.booking.faTime
import ir.salon.app.feature.bookings.faDate
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen

@Composable
fun ManagerScreen(
    onBack: () -> Unit,
    viewModel: ManagerViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var rejectRow by remember { mutableStateOf<ManagerContractRowDto?>(null) }
    var rejectReason by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "پنل مدیریت سالن", onBack = onBack)
        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null && state.venues.isEmpty() -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::load,
            )
            state.venues.isEmpty() -> EmptyState(
                icon = Icons.Filled.CalendarMonth,
                title = "سالنی ندارید",
                description = "برای مدیریت، ابتدا سالن ثبت کنید",
            )
            else -> Column(
                modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("سالن", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    state.venues.forEach { venue ->
                        FilterChip(
                            selected = state.selectedVenueId == venue.id,
                            onClick = { viewModel.selectVenue(venue.id) },
                            label = { Text(venue.name) },
                        )
                    }
                }

                Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("چک‌این رزرو (QR)", style = MaterialTheme.typography.titleSmall)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = state.checkInCode,
                                onValueChange = viewModel::onCheckInCodeChange,
                                placeholder = { Text("کد چک‌این را وارد کنید") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                            )
                            Spacer(Modifier.width(8.dp))
                            Button(
                                onClick = viewModel::verifyCheckIn,
                                enabled = !state.checkInLoading && state.checkInCode.isNotBlank(),
                                modifier = Modifier.height(MinTouchTarget),
                            ) { Text(if (state.checkInLoading) "…" else "تأیید") }
                        }
                        state.checkInMessage?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "رزروهای در انتظار تأیید (${PersianText.toPersianDigits(state.pending.size.toString())})",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedButton(
                        onClick = { viewModel.loadPending() },
                        modifier = Modifier.height(MinTouchTarget),
                    ) { Text("به‌روزرسانی") }
                }

                if (state.pendingLoading) {
                    SkeletonScreen(rows = 2)
                } else if (state.pending.isEmpty()) {
                    Text(
                        "رزرو در انتظاری وجود ندارد",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    state.pending.forEach { pending ->
                        PendingCard(
                            pending = pending,
                            busy = state.actionId == pending.id,
                            onConfirm = { viewModel.confirm(pending) },
                            onReject = { viewModel.reject(pending) },
                        )
                    }
                }

                state.error?.let {
                    Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                state.finance?.let { finance ->
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("خلاصه مالی امروز", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "درآمد امروز: ${PersianText.formatPrice(finance.todayRevenue.toLong())}",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(
                                "درآمد ماه: ${PersianText.formatPrice(finance.monthRevenue.toLong())}",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(
                                "مطالبات باز: ${PersianText.formatPrice(finance.openReceivables.toLong())}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            Text(
                                "رزرو امروز: ${PersianText.toPersianDigits(finance.bookingsToday.toString())} • اشغال: ${PersianText.toPersianDigits(finance.occupancyToday.toString())}٪ • قرارداد فعال: ${PersianText.toPersianDigits(finance.activeContracts.toString())}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }

                Text(
                    "درخواست‌های قرارداد (${PersianText.toPersianDigits(state.contractRows.size.toString())})",
                    style = MaterialTheme.typography.titleMedium,
                )
                if (state.contractsLoading) {
                    SkeletonScreen(rows = 2)
                } else if (state.contractRows.isEmpty()) {
                    Text(
                        "درخواست قراردادی در انتظار نیست",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    state.contractRows.forEach { row ->
                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                Text(
                                    row.userFullName ?: "کاربر" ,
                                    style = MaterialTheme.typography.titleSmall,
                                )
                                Text(
                                    "${row.venueName} • ${faDate(row.contract.startDate)} تا ${faDate(row.contract.endDate)}",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Text(
                                    "هر سانس: ${PersianText.formatPrice(row.contract.discountedPrice.toLong())} • باقی‌مانده: ${PersianText.formatPrice(row.outstandingAmount.toLong())}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { viewModel.approveContract(row) },
                                        modifier = Modifier.weight(1f).height(MinTouchTarget),
                                    ) { Text("تأیید") }
                                    OutlinedButton(
                                        onClick = { rejectRow = row },
                                        modifier = Modifier.weight(1f).height(MinTouchTarget),
                                    ) { Text("رد") }
                                }
                            }
                        }
                    }
                }

                Text(
                    "مشتریان سالن (${PersianText.toPersianDigits(state.customers.size.toString())})",
                    style = MaterialTheme.typography.titleMedium,
                )
                state.customers.take(15).forEach { customer ->
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(customer.fullName ?: "مشتری", style = MaterialTheme.typography.bodyMedium)
                            Text(
                                "${PersianText.toPersianDigits(customer.bookingsCount.toString())} رزرو • ${PersianText.formatPrice(customer.totalSpend.toLong())}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        if (customer.isVip) {
                            Text("VIP", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                        }
                    }
                }
            }
        }
    }
    SnackbarHost(hostState = snackbar)

    val row = rejectRow
    if (row != null) {
        AlertDialog(
            onDismissRequest = { rejectRow = null },
            title = { Text("رد درخواست قرارداد") },
            text = {
                OutlinedTextField(
                    value = rejectReason,
                    onValueChange = { rejectReason = it },
                    label = { Text("دلیل رد") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.rejectContract(row, rejectReason)
                    rejectRow = null
                    rejectReason = ""
                }) { Text("رد") }
            },
            dismissButton = { TextButton(onClick = { rejectRow = null }) { Text("انصراف") } },
        )
    }
}

@Composable
private fun PendingCard(
    pending: PendingBookingDto,
    busy: Boolean,
    onConfirm: () -> Unit,
    onReject: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(pending.venueName ?: "سالن", style = MaterialTheme.typography.titleSmall)
            Text(
                "${faDate(pending.slotDate)} — ${faTime(pending.startTime)} تا ${endTimeOf(pending.startTime, pending.duration)}",
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                PersianText.formatPrice(pending.paymentAmount.toLong()),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            pending.couponCode?.let {
                Text("کوپن: ${PersianText.normalize(it)}", style = MaterialTheme.typography.labelSmall)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onConfirm,
                    enabled = !busy,
                    modifier = Modifier.weight(1f).height(MinTouchTarget),
                ) { Text(if (busy) "…" else "تأیید") }
                OutlinedButton(
                    onClick = onReject,
                    enabled = !busy,
                    modifier = Modifier.weight(1f).height(MinTouchTarget),
                ) { Text("رد") }
            }
        }
    }
}
