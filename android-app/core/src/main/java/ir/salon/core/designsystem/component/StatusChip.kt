package ir.salon.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.unit.dp
import ir.salon.core.common.StatusLabels
import ir.salon.core.designsystem.theme.SalonColors

private data class ChipColors(val bg: Color, val inkLight: Color, val inkDark: Color)

private val POSITIVE = ChipColors(Color(0x2610B981), Color(0xFF047857), Color(0xFF6EE7B7))
private val NEGATIVE = ChipColors(Color(0x26EF4444), Color(0xFFB91C1C), Color(0xFFFCA5A5))
private val INFO = ChipColors(Color(0x262563EB), SalonColors.PrimaryBlue, SalonColors.PrimaryBlueLight)
private val NEUTRAL = ChipColors(Color(0x1494A3B8), Color(0xFF475569), Color(0xFF94A3B8))

/**
 * چیپ وضعیت tinted — قرینهٔ چیپ‌های وب؛ ink برای هر دو مود با کنتراست تنظیم‌شده.
 */
@Composable
fun StatusChip(text: String, tone: StatusLabels.Tone, modifier: Modifier = Modifier) {
    val chip = when (tone) {
        StatusLabels.Tone.POSITIVE -> POSITIVE
        StatusLabels.Tone.NEGATIVE -> NEGATIVE
        StatusLabels.Tone.INFO -> INFO
        StatusLabels.Tone.NEUTRAL -> NEUTRAL
    }
    val dark = MaterialTheme.colorScheme.background.luminance() < 0.5f
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        color = if (dark) chip.inkDark else chip.inkLight,
        modifier = modifier
            .background(chip.bg, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    )
}
