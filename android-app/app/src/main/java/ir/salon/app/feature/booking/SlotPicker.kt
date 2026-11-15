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
                        if (selectedStyle) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        RoundedCornerShape(12.dp),
                    )
                    .clickable { onSelect(day.iso) }
                    .padding(horizontal = 14.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    day.label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selectedStyle) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
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
        modifier = modifier.height(((slots.size / 3 + 1) * 108).dp),
        userScrollEnabled = false,
    ) {
        items(slots, key = { it.id }) { slot ->
            val label = StatusLabels.slotOf(slot.status)
            val clickable = slot.status == "available" || slot.status == "in_competition"
            val selected = slot.id == selectedSlotId
            val description = "سانس ${faTime(slot.startTime)}، ${PersianText.formatPrice(slot.currentPrice.toLong())}، ${label.text}"

            Column(
                modifier = Modifier
                    .height(98.dp)
                    .background(
                        when {
                            selected -> MaterialTheme.colorScheme.primaryContainer
                            slot.status == "reserved" -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        RoundedCornerShape(14.dp),
                    )
                    .border(
                        width = if (selected) 2.dp else 1.dp,
                        color = if (selected) SalonColors.PrimaryBlue else MaterialTheme.colorScheme.outline,
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
                    PersianText.formatPrice(slot.currentPrice.toLong()),
                    style = MaterialTheme.typography.labelMedium,
                    color = SalonColors.PrimaryBlue,
                    // قراردادی‌ها خط‌خورده — قرینهٔ line-through وب
                    textDecoration = if (slot.status == "reserved") androidx.compose.ui.text.style.TextDecoration.LineThrough else null,
                )
                StatusChip(text = label.text, tone = label.tone)
            }
        }
    }
}
