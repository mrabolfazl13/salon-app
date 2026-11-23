package ir.salon.app.feature.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
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
 */
@Composable
fun SlotGrid(
    slots: List<Slot>,
    selectedSlotId: Int?,
    onSelect: (Slot) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = modifier.height(((slots.size / 3 + 1) * 122).dp),
        userScrollEnabled = false,
    ) {
        items(slots, key = { it.id }) { slot ->
            val label = StatusLabels.slotOf(slot.status)
            val clickable = slot.status == "available" || slot.status == "in_competition"
            val selected = slot.id == selectedSlotId
            val dealPrice = slot.dealPrice
            val effectivePrice: Int = if (slot.isDeal && dealPrice != null) dealPrice else slot.currentPrice
            val description = "سانس ${faTime(slot.startTime)}، ${PersianText.formatPrice(effectivePrice.toLong())}، ${label.text}"

            Column(
                modifier = Modifier
                    .height(112.dp)
                    .background(
                        when {
                            selected -> MaterialTheme.colorScheme.secondaryContainer
                            slot.status == "reserved" -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        RoundedCornerShape(14.dp),
                    )
                    .border(
                        width = if (selected) 2.dp else 1.dp,
                        color = if (selected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.outline,
                        shape = RoundedCornerShape(14.dp),
                    )
                    .then(
                        if (clickable) {
                            Modifier.semantics { contentDescription = description }
                                .clickable { onSelect(slot) }
                        } else {
                            Modifier.semantics { contentDescription = description + " — غیرقابل رزرو" }
                        },
                    )
                    .padding(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    faTime(slot.startTime),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    slotEndTime(slot),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    PersianText.formatPrice(effectivePrice.toLong()),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    // قراردادی‌ها خط‌خورده — قرینهٔ line-through وب
                    textDecoration = if (slot.status == "reserved") androidx.compose.ui.text.style.TextDecoration.LineThrough else null,
                )
                if (slot.isDeal && dealPrice != null && dealPrice < slot.currentPrice) {
                    Text(
                        "دیل • ${PersianText.formatPrice(slot.currentPrice.toLong())}",
                        style = MaterialTheme.typography.labelSmall,
                        color = SalonColors.Emerald,
                        textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough,
                        maxLines = 1,
                    )
                } else {
                    StatusChip(text = label.text, tone = label.tone)
                }
            }
        }
    }
}
