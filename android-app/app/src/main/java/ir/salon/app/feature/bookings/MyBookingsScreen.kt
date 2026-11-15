package ir.salon.app.feature.bookings

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.feature.booking.faTime
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.core.common.JalaliUtil
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.StatusChip
import ir.salon.core.common.StatusLabels
import ir.salon.app.R
import java.time.LocalDate

/** تاریخ ISO → جلالی فارسی کوتاه */
fun faDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val p = iso.split("-")
    if (p.size < 3) return iso
    val j = JalaliUtil.toJalali(p[0].toInt(), p[1].toInt(), p[2].take(2).toInt())
    return PersianText.toPersianDigits("${j.jd} ${JalaliUtil.monthNames[j.jm - 1]} ${j.jy}")
}

/** لیست رزروهای من — قرینهٔ pages/bookings/Bookings.tsx با تب‌ها و دکمهٔ تماس */
@Composable
fun MyBookingsScreen(
    onBookingClick: (Int) -> Unit,
    viewModel: MyBookingsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableStateOf(BookingsTab.ALL) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            stringResource(R.string.nav_bookings),
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() },
        )
        Spacer(Modifier.height(12.dp))

        val tabs = listOf(
            BookingsTab.ALL to stringResource(R.string.bookings_tab_all),
            BookingsTab.PENDING to stringResource(R.string.bookings_tab_pending),
            BookingsTab.CONFIRMED to stringResource(R.string.bookings_tab_confirmed),
            BookingsTab.CANCELLED to stringResource(R.string.bookings_tab_cancelled),
        )
        TabRow(selectedTabIndex = tabs.indexOfFirst { it.first == tab }) {
            tabs.forEach { (value, label) ->
                Tab(
                    selected = tab == value,
                    onClick = { tab = value },
                    text = { Text(label) },
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        when {
            state.loading -> SkeletonScreen(rows = 4)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::refresh)
            else -> {
                val filtered = state.rows.filter { row ->
                    when (tab) {
                        BookingsTab.ALL -> true
                        BookingsTab.PENDING -> row.status == "pending"
                        BookingsTab.CONFIRMED -> row.status == "confirmed"
                        BookingsTab.CANCELLED -> row.status == "cancelled"
                        BookingsTab.COMPLETED -> row.status == "completed"
                    }
                }
                if (filtered.isEmpty()) {
                    ir.salon.core.designsystem.component.EmptyState(
                        icon = Icons.Filled.CalendarMonth,
                        title = stringResource(R.string.bookings_empty),
                        description = stringResource(R.string.bookings_empty_desc),
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(filtered, key = { it.id }) { row ->
                            BookingRowCard(
                                row = row,
                                onClick = { if (!row.isPendingRedis) onBookingClick(row.id.toInt()) },
                                onCancel = { viewModel.cancel(row) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BookingRowCard(row: BookingRow, onClick: () -> Unit, onCancel: () -> Unit) {
    val context = LocalContext.current
    val label = StatusLabels.bookingOf(row.status)
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    row.venueName ?: "سالن",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                )
                StatusChip(text = label.text, tone = label.tone)
            }
            Text(
                if (row.slotDate != null && row.startTime != null) {
                    "${faDate(row.slotDate)} — ${faTime(row.startTime)} تا ${ir.salon.app.feature.booking.endTimeOf(row.startTime, row.duration)}"
                } else {
                    ""
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                PersianText.formatPrice(row.paymentAmount.toLong()),
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // تماس — قاعدهٔ فاز MVP
                row.venuePhone?.let { phone ->
                    OutlinedButton(
                        onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) },
                        modifier = Modifier.height(MinTouchTarget),
                    ) {
                        Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(stringResource(R.string.call_venue_short))
                    }
                }
                if ((row.status == "pending" || row.status == "confirmed") && !row.isPendingRedis) {
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.height(MinTouchTarget),
                    ) {
                        Text(stringResource(R.string.bookings_cancel))
                    }
                }
            }
        }
    }
}
