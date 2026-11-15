package ir.salon.app.feature.booking

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import ir.salon.app.R
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.MinTouchTarget

/**
 * دیالوگ موفقیت ثبت رزرو — قرینهٔ bookingResult: پیام انتظار تأیید سالن‌دار + تماس.
 */
@Composable
fun BookingSuccessDialog(
    pending: PendingBookingDto,
    venuePhone: String?,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        title = { Text(stringResource(R.string.booking_success_title)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    stringResource(R.string.booking_success_message),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Text(
                    PersianText.formatPrice(pending.paymentAmount.toLong()),
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
                venuePhone?.let { phone ->
                    OutlinedButton(
                        onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) },
                        modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                    ) {
                        Icon(Icons.Filled.Call, contentDescription = null)
                        Text(" " + stringResource(R.string.call_venue) + " — " + PersianText.toPersianDigits(phone))
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, modifier = Modifier.height(48.dp)) {
                Text(stringResource(R.string.booking_success_close))
            }
        },
    )
}
