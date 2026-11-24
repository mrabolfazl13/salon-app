package ir.salon.app.feature.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.LockClock
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.runtime.remember
import ir.salon.core.designsystem.component.salonPressScale
import ir.salon.core.designsystem.theme.LocalSalonExtra
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ir.salon.core.common.PersianText
import ir.salon.core.common.StatusLabels
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.StatusChip
import ir.salon.core.designsystem.theme.SalonColors
import ir.salon.core.model.Slot

/**
 * نوار انتخاب روز — قرینهٔ DateSelector.tsx با برچسب جلالی.
 */
@Composable
fun DateSelector(
    days: List<DayOption>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 4.dp),
    ) {
        items(days, key = { it.iso }) { day ->
            val selectedStyle = day.iso == selected
            Box(
                modifier = Modifier
                    .height(MinTouchTarget)
                    .background(
                        if (selectedStyle) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surface,
                        RoundedCornerShape(12.dp),
                    )
                    .border(
                        width = 1.dp,
                        color = if (selectedStyle) MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f)
                        else MaterialTheme.colorScheme.outline.copy(alpha = 0.7f),
                        shape = RoundedCornerShape(12.dp),
                    )
                    .clickable(
                        role = androidx.compose.ui.semantics.Role.Button,
                        onClickLabel = "انتخاب ${day.label}",
                        onClick = { onSelect(day.iso) },
                    )
                    .padding(horizontal = 14.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    day.label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selectedStyle) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = if (selectedStyle) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Medium,
                )
            }
        }
    }
}

/**
 * گرید سانس‌ها — قرینهٔ TimeSlotPicker.tsx: چیپ وضعیت فارسی، خط‌خوردگی قراردادی،
 * غیرقابل‌کلیک برای پر/مسدود/قراردادی، aria فارسی کامل (سانس + قیمت + وضعیت).
 * ردیف‌های ۳تایی ساده — بدون Lazy تو‌درتو داخل اسکرول عمودی صفحه.
 */
/** ردیف سانس — قرینهٔ TimeSlot.tsx وب: آیکون‌تایل، برچسب وضعیت، گرادیان انتخاب */
@Composable
fun SlotRow(
    slot: Slot,
    selected: Boolean,
    onSelect: (Slot) -> Unit,
    modifier: Modifier = Modifier,
) {
    val label = StatusLabels.slotOf(slot.status)
    val bidable = slot.status == "in_competition"
    val isReserved = slot.status == "reserved"
    val disabled = slot.status != "available" && !bidable
    val dealPrice = slot.dealPrice
    val effectivePrice: Int = if (slot.isDeal && dealPrice != null) dealPrice else slot.currentPrice
    val extra = LocalSalonExtra.current

    val bg = when {
        selected -> Brush.linearGradient(listOf(Color(0xFFFBBF24), Color(0xFFF97316)))
        bidable -> Brush.linearGradient(listOf(Color(0x14F59E0B), Color(0x0DF59E0B)))
        else -> Brush.linearGradient(listOf(MaterialTheme.colorScheme.surface, MaterialTheme.colorScheme.surface))
    }
    val borderColor = when {
        selected -> Color.Transparent
        bidable -> MaterialTheme.colorScheme.secondary.copy(alpha = 0.45f)
        else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.7f)
    }
    val ink = if (selected) Color(0xFF1C1917) else MaterialTheme.colorScheme.onSurface
    val subInk = when {
        selected -> Color(0xFF1C1917).copy(alpha = 0.75f)
        bidable -> MaterialTheme.colorScheme.onSecondaryContainer
        disabled -> MaterialTheme.colorScheme.onSurfaceVariant
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    val tileBg = when {
        selected -> Color(0x261C1917)
        bidable -> MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f)
        disabled -> MaterialTheme.colorScheme.surfaceVariant
        else -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
    }
    val tileInk = when {
        selected -> Color(0xFF1C1917)
        bidable -> MaterialTheme.colorScheme.onSecondaryContainer
        disabled -> MaterialTheme.colorScheme.onSurfaceVariant
        else -> MaterialTheme.colorScheme.primary
    }
    val tileIcon = when {
        isReserved -> Icons.Filled.LockClock
        bidable -> Icons.Filled.Gavel
        disabled -> Icons.Filled.LockClock
        else -> Icons.Filled.Schedule
    }
    val subLabel = when {
        bidable -> "در حال رقابت قیمت"
        isReserved -> "رزرو قرارداد"
        disabled -> label.text
        else -> PersianText.toPersianDigits((slot.duration ?: 90).toString()) + " دقیقه"
    }
    val description = "سانس ${faTime(slot.startTime)} تا ${slotEndTime(slot)}، " +
        PersianText.formatPrice(effectivePrice.toLong()) + "، " + subLabel

    val interaction = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp)
            .background(bg, RoundedCornerShape(14.dp))
            .border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
            .salonPressScale(interaction)
            .clickable(
                interactionSource = interaction,
                indication = null,
                enabled = !disabled,
                role = androidx.compose.ui.semantics.Role.Button,
                onClickLabel = "انتخاب سانس ${faTime(slot.startTime)}",
                onClick = { onSelect(slot) },
            )
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .semantics { contentDescription = if (disabled) description + " — غیرقابل رزرو" else description },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(tileBg, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(tileIcon, contentDescription = null, tint = tileInk, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                faTime(slot.startTime) + " – " + slotEndTime(slot),
                style = MaterialTheme.typography.titleSmall,
                color = ink,
            )
            Text(subLabel, style = MaterialTheme.typography.labelSmall, color = subInk)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                PersianText.formatPrice(effectivePrice.toLong()),
                style = MaterialTheme.typography.titleSmall,
                color = ink,
                fontWeight = FontWeight.ExtraBold,
            )
            if (slot.isDeal && dealPrice != null && dealPrice < slot.currentPrice) {
                Text(
                    PersianText.formatPrice(slot.currentPrice.toLong()),
                    style = MaterialTheme.typography.labelSmall,
                    color = subInk,
                    textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough,
                    maxLines = 1,
                )
            }
        }
    }
}

/** فهرست سانس‌های روز — قرینهٔ فهرست TimeSlot وب */
@Composable
fun SlotRows(
    slots: List<Slot>,
    selectedSlotId: Int?,
    onSelect: (Slot) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        slots.forEach { slot ->
            SlotRow(
                slot = slot,
                selected = slot.id == selectedSlotId,
                onSelect = onSelect,
            )
        }
    }
}
