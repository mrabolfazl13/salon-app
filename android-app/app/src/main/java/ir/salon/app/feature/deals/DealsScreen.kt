package ir.salon.app.feature.deals

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.R
import ir.salon.app.data.api.DealItemDto
import ir.salon.app.feature.booking.faTime
import ir.salon.app.feature.booking.slotEndTime
import ir.salon.app.feature.bookings.faDate
import ir.salon.app.feature.booking.endTimeOf
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen

@Composable
fun DealsScreen(
    onBack: () -> Unit,
    onVenueClick: (Int) -> Unit,
    viewModel: DealsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "دیل‌های لحظه آخری", onBack = onBack)

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            DealSort.entries.forEach { sort ->
                FilterChip(
                    selected = state.sort == sort,
                    onClick = { viewModel.setSort(sort) },
                    label = { Text(sort.label, style = MaterialTheme.typography.labelMedium) },
                    shape = androidx.compose.foundation.shape.CircleShape,
                    colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.secondaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onSecondaryContainer,
                    ),
                )
            }
        }
        Spacer(Modifier.height(8.dp))

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::refresh,
            )
            state.items.isEmpty() -> EmptyState(
                icon = Icons.Filled.LocalOffer,
                title = "دیل فعالی نیست",
                description = "سانس‌های تخفیف‌دار سالن‌ها اینجا نمایش داده می‌شوند",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items, key = { it.slotId }) { deal ->
                    DealCard(deal = deal, onClick = { onVenueClick(deal.venueId) })
                }
            }
        }
    }
}

@Composable
private fun DealCard(deal: DealItemDto, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(deal.venueName, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                ) {
                    Text(
                        "${PersianText.toPersianDigits(deal.discountPercent.toString())}٪ تخفیف",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Place, contentDescription = null, modifier = Modifier.size(15.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.width(4.dp))
                Text(
                    "${faDate(deal.slotDate)} — ${faTime(deal.startTime)} تا ${endTimeOf(deal.startTime, deal.duration)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    PersianText.formatPrice(deal.dealPrice.toLong()),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    PersianText.formatPrice(deal.originalPrice.toLong()),
                    style = MaterialTheme.typography.bodySmall,
                    textDecoration = TextDecoration.LineThrough,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "${PersianText.formatPrice(deal.savings.toLong())} صرفه‌جویی",
                    style = MaterialTheme.typography.labelSmall,
                    color = ir.salon.core.designsystem.theme.SalonColors.Emerald,
                )
            }
        }
    }
}
