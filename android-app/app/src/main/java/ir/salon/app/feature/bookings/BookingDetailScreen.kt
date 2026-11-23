package ir.salon.app.feature.bookings

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.app.feature.booking.faTime
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.StatusChip
import ir.salon.core.common.StatusLabels
import ir.salon.app.R

/** جزئیات رزرو — قرینهٔ pages/bookings/BookingDetail.tsx (اطلاعات + تماس + لغو) */
@Composable
fun BookingDetailScreen(
    onBack: () -> Unit,
    onCreateGame: (Int) -> Unit,
    viewModel: BookingDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    Column(modifier = Modifier.fillMaxSize()) {
        IconButton(onClick = onBack, modifier = Modifier.size(MinTouchTarget).padding(4.dp)) {
            Icon(Icons.Filled.ArrowBack, contentDescription = stringResource(R.string.cd_back))
        }

        when {
            state.loading -> SkeletonScreen(rows = 4)
            state.error != null -> ErrorState(message = state.error!!.uiMessage(), onRetry = viewModel::load)
            else -> {
                val booking = state.booking!!
                val label = StatusLabels.bookingOf(booking.status)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            booking.venueName ?: "سالن",
                            style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier
                                .weight(1f)
                                .semantics { heading() },
                        )
                        StatusChip(text = label.text, tone = label.tone)
                    }

                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            DetailRow(stringResource(R.string.booking_date), faDate(booking.slotDate))
                            DetailRow(
                                stringResource(R.string.booking_time),
                                if (booking.startTime != null) {
                                    "${faTime(booking.startTime)} تا ${endTimeOf(booking.startTime, booking.duration)}"
                                } else {
                                    "—"
                                },
                            )
                            DetailRow(
                                stringResource(R.string.booking_amount),
                                PersianText.formatPrice(booking.paymentAmount.toLong()),
                            )
                            if (booking.couponCode != null) {
                                DetailRow(
                                    stringResource(R.string.booking_coupon),
                                    PersianText.normalize(booking.couponCode),
                                )
                            }
                            DetailRow(
                                stringResource(R.string.booking_payment_mode),
                                ir.salon.core.common.StatusLabels.paymentMode[booking.paymentMode]?.text ?: "—",
                            )
                            booking.payment?.let { payment ->
                                DetailRow(
                                    "وضعیت پرداخت",
                                    when (payment.status) {
                                        "paid" -> "پرداخت‌شده"
                                        "pending" -> "در انتظار پرداخت"
                                        "failed" -> "ناموفق"
                                        "refunded" -> "بازگشت وجه"
                                        else -> payment.status
                                    },
                                )
                                payment.cardPan?.let { DetailRow("کارت", it) }
                                payment.transactionId?.let { DetailRow("کد تراکنش", it) }
                            }
                        }
                    }

                    // ریز قیمت سمت سرور
                    if (booking.pricingBreakdown.isNotEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(stringResource(R.string.booking_breakdown), style = MaterialTheme.typography.titleSmall)
                                booking.pricingBreakdown.forEach { step ->
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(ir.salon.app.feature.booking.StepLabels.of(step.step), style = MaterialTheme.typography.bodySmall)
                                        Text(PersianText.formatPrice(step.amount.toLong()), style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                        }
                    }

                    booking.venuePhone?.let { phone ->
                        Button(
                            onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(stringResource(R.string.call_venue) + " — " + PersianText.toPersianDigits(phone))
                        }
                    }

                    if (booking.status == "pending" || booking.status == "confirmed") {
                        Button(
                            onClick = viewModel::cancel,
                            enabled = !state.cancelling,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Text(stringResource(R.string.bookings_cancel))
                        }
                    }
                    if (booking.status == "confirmed" && booking.payment?.status != "paid") {
                        Button(
                            onClick = viewModel::pay,
                            enabled = !state.paying,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Text(if (state.paying) "در حال اتصال به درگاه…" else "پرداخت آنلاین")
                        }
                    }
                    if (booking.status == "confirmed") {
                        OutlinedButton(
                            onClick = { onCreateGame(booking.id) },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("ساخت بازی گروهی از این رزرو") }
                    }
                    if (state.paymentDone) {
                        Text("پرداخت با موفقیت انجام شد", color = MaterialTheme.colorScheme.primary)
                    }
                    state.paymentError?.let {
                        Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    if (state.cancelled) {
                        Text(stringResource(R.string.booking_cancelled_done), color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}
