package ir.salon.app.feature.manager

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.data.api.ManagerContractRowDto
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.feature.booking.DayLabels
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.app.feature.booking.faTime
import ir.salon.app.feature.bookings.faDate
import ir.salon.core.common.PersianText
import ir.salon.core.common.StatusLabels
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SalonSectionHeader
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.StatusChip
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.core.model.Slot

/**
 * داشبورد مدیر سالن — چیدمان کارکردی: آمار روز، سانس‌ها (تولید یک‌ضربه)،
 * رزروهای در انتظار، چک‌این، قراردادها. بخش‌های غیرکارکردی (CRM) حذف شد.
 */
@Composable
fun ManagerScreen(
    onBack: (() -> Unit)?,
    viewModel: ManagerViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var rejectRow by remember { mutableStateOf<ManagerContractRowDto?>(null) }
    var rejectReason by rememberSaveable { mutableStateOf("") }
    val days = remember { DayLabels.build(7) }
    val extra = LocalSalonExtra.current

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(
            title = "داشبورد مدیریت",
            onBack = onBack,
        )
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
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                // سالن فعال
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.venues, key = { it.id }) { venue ->
                        FilterChip(
                            selected = state.selectedVenueId == venue.id,
                            onClick = { viewModel.selectVenue(venue.id) },
                            label = { Text(venue.name, style = MaterialTheme.typography.labelMedium) },
                            shape = RoundedCornerShape(50),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.secondaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onSecondaryContainer,
                            ),
                        )
                    }
                }

                // ── آمار امروز — چهار کاشی فشرده ──
                state.finance?.let { finance ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(
                            label = "درآمد امروز",
                            value = PersianText.formatPrice(finance.todayRevenue.toLong()),
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            label = "رزرو امروز",
                            value = PersianText.toPersianDigits(finance.bookingsToday.toString()),
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(
                            label = "اشغال امروز",
                            value = PersianText.toPersianDigits(
                                "%.0f".format(finance.occupancyToday),
                            ) + "٪",
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            label = "قرارداد فعال",
                            value = PersianText.toPersianDigits(finance.activeContracts.toString()),
                            modifier = Modifier.weight(1f),
                        )
                    }
                }

                // ── مدیریت سانس‌ها ──
                ManagerSlotsCard(
                    state = state,
                    days = days,
                    extra = extra,
                    onDateChange = viewModel::onSlotDateChange,
                    onGenerate = viewModel::generateSlots,
                    onToggleBlock = viewModel::toggleSlotBlocked,
                )

                // ── رزروهای در انتظار تأیید ──
                SalonSectionHeader(
                    title = "رزروهای در انتظار",
                    actionLabel = "به‌روزرسانی",
                    onAction = viewModel::loadPending,
                )
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

                // ── چک‌این حضوری ──
                Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Filled.QrCodeScanner,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                            )
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text("چک‌این رزرو", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "کد روی بلیت مشتری را وارد کنید",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = state.checkInCode,
                                onValueChange = viewModel::onCheckInCodeChange,
                                placeholder = { Text("کد چک‌این") },
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
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }
                }

                // ── درخواست‌های قرارداد ──
                SalonSectionHeader(title = "درخواست‌های قرارداد")
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
                        ContractRowCard(
                            row = row,
                            onApprove = { viewModel.approveContract(row) },
                            onReject = { rejectRow = row },
                        )
                    }
                }

                state.error?.let {
                    Text(
                        it.uiMessage(),
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Spacer(Modifier.height(12.dp))
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

/** کاشی آمار فشرده */
@Composable
private fun StatTile(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.55f),
        ),
        modifier = modifier.height(76.dp),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
            )
        }
    }
}

/** کارت مدیریت سانس‌ها — انتخاب روز، تولید یک‌ضربه، لیست سانس‌ها با مسدود/آزاد */
@Composable
private fun ManagerSlotsCard(
    state: ManagerState,
    days: List<ir.salon.app.feature.booking.DayOption>,
    extra: ir.salon.core.designsystem.theme.SalonExtraColors,
    onDateChange: (String) -> Unit,
    onGenerate: () -> Unit,
    onToggleBlock: (Slot) -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.55f),
        ),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            SalonSectionHeader(title = "سانس‌ها")

            // روزها
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(days, key = { it.iso }) { day ->
                    FilterChip(
                        selected = state.slotDate == day.iso,
                        onClick = { onDateChange(day.iso) },
                        label = { Text(day.label, style = MaterialTheme.typography.labelSmall) },
                        shape = RoundedCornerShape(50),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.secondaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onSecondaryContainer,
                        ),
                    )
                }
            }

            // تولید یک‌ضربه
            Button(
                onClick = onGenerate,
                enabled = !state.generating,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = extra.gradientEnergy.first(),
                    contentColor = Color(0xFF1C1917),
                ),
                modifier = Modifier.fillMaxWidth().height(50.dp),
            ) {
                Icon(Icons.Filled.AddCircle, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    if (state.generating) "در حال ساخت…" else "تولید خودکار سانس‌های این روز",
                    fontWeight = FontWeight.Bold,
                )
            }
            Text(
                "سانس‌های تداخل‌دار ساخته نمی‌شوند؛ قیمت هر سانس با موتور قیمت سرور محاسبه می‌شود.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

            when {
                state.slotsLoading -> SkeletonScreen(rows = 2)
                state.slots.isEmpty() -> Text(
                    "برای این روز سانسی ثبت نشده — با دکمهٔ بالا بسازید.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                else -> Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        PersianText.toPersianDigits(state.slots.size.toString()) + " سانس",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    state.slots.forEach { slot ->
                        val label = StatusLabels.slotOf(slot.status)
                        val isBlocked = slot.status == "blocked"
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    faTime(slot.startTime) + " تا " + endTimeOf(slot.startTime, slot.duration),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    PersianText.formatPrice(
                                        ((slot.dealPrice ?: slot.currentPrice)).toLong(),
                                    ),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                )
                            }
                            StatusChip(text = label.text, tone = label.tone)
                            Spacer(Modifier.width(4.dp))
                            TextButton(
                                onClick = { onToggleBlock(slot) },
                                enabled = state.busySlotId != slot.id,
                                modifier = Modifier.height(MinTouchTarget),
                            ) {
                                Text(
                                    when {
                                        state.busySlotId == slot.id -> "…"
                                        isBlocked -> "آزاد"
                                        else -> "مسدود"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (isBlocked) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.error,
                                )
                            }
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.35f))
                    }
                }
            }
        }
    }
}

@Composable
private fun ContractRowCard(row: ManagerContractRowDto, onApprove: () -> Unit, onReject: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            Text(row.userFullName ?: "کاربر", style = MaterialTheme.typography.titleSmall)
            Text(
                row.venueName + " • " + faDate(row.contract.startDate) + " تا " + faDate(row.contract.endDate),
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                "هر سانس: " + PersianText.formatPrice(row.contract.discountedPrice.toLong()) +
                    " • باقی‌مانده: " + PersianText.formatPrice(row.outstandingAmount.toLong()),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onApprove,
                    modifier = Modifier.weight(1f).height(MinTouchTarget),
                ) { Text("تأیید") }
                OutlinedButton(
                    onClick = onReject,
                    modifier = Modifier.weight(1f).height(MinTouchTarget),
                ) { Text("رد") }
            }
        }
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
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(pending.venueName ?: "سالن", style = MaterialTheme.typography.titleSmall)
            Text(
                faDate(pending.slotDate) + " — " + faTime(pending.startTime) + " تا " +
                    endTimeOf(pending.startTime, pending.duration),
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                PersianText.formatPrice(pending.paymentAmount.toLong()),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            pending.couponCode?.let {
                Text(
                    "کوپن: " + PersianText.normalize(it),
                    style = MaterialTheme.typography.labelSmall,
                )
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
