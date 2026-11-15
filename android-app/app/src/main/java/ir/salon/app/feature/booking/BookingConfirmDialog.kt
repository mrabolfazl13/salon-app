package ir.salon.app.feature.booking

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.app.R

/**
 * دیالوگ تأیید رزرو — قرینهٔ Confirmation Dialog در VenueDetail:
 * ریز قیمت سمت سرور، کد تخفیف، امتیاز وفاداری، و دکمهٔ تماس با سالن (قاعدهٔ MVP).
 */
@Composable
fun BookingConfirmDialog(
    venueName: String,
    venuePhone: String?,
    slotSummary: String,
    breakdown: List<ir.salon.app.data.api.PricingStepDto>,
    payable: Long,
    loading: Boolean,
    error: String?,
    onConfirm: (discountCode: String?, useLoyaltyPoints: Boolean) -> Unit,
    onDismiss: () -> Unit,
) {
    var discountCode by rememberSaveable { mutableStateOf("") }
    var useLoyalty by rememberSaveable { mutableStateOf(false) }
    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(stringResource(R.string.booking_confirm_title), style = MaterialTheme.typography.titleLarge)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(stringResource(R.string.booking_venue_label) + ": " + venueName, style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(R.string.booking_slot_label) + ": " + slotSummary, style = MaterialTheme.typography.bodyMedium)

                // ریز قیمت سمت سرور — قرینهٔ PricingBreakdown
                breakdown.forEach { step ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(StepLabels.of(step.step), style = MaterialTheme.typography.bodySmall)
                        Text(PersianText.formatPrice(step.amount.toLong()), style = MaterialTheme.typography.bodySmall)
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        stringResource(R.string.booking_payable),
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        PersianText.formatPrice(payable),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }

                OutlinedTextField(
                    value = discountCode,
                    onValueChange = { discountCode = it },
                    label = { Text(stringResource(R.string.booking_discount_label)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    androidx.compose.material3.Checkbox(checked = useLoyalty, onCheckedChange = { useLoyalty = it })
                    Text(stringResource(R.string.booking_loyalty_label), style = MaterialTheme.typography.bodySmall)
                }

                error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                // دکمهٔ تماس — قاعدهٔ فاز MVP: تأیید خارج از برنامه
                venuePhone?.let { phone ->
                    OutlinedButton(
                        onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(MinTouchTarget),
                    ) {
                        Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.call_venue) + " — " + PersianText.toPersianDigits(phone))
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(discountCode, useLoyalty) },
                enabled = !loading,
                modifier = Modifier.height(48.dp),
            ) {
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                } else {
                    Text(stringResource(R.string.booking_confirm_button))
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.height(MinTouchTarget)) {
                Text(stringResource(R.string.booking_cancel_button))
            }
        },
    )
}
