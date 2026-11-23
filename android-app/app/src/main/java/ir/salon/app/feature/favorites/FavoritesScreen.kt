package ir.salon.app.feature.favorites

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.feature.venues.VenueCard
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.SkeletonScreen

@Composable
fun FavoritesScreen(
    onBack: () -> Unit,
    onVenueClick: (Int) -> Unit,
    viewModel: FavoritesViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "علاقه‌مندی‌ها", onBack = onBack)

        when {
            state.loading -> SkeletonScreen(rows = 4)
            state.error != null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::refresh,
            )
            state.venues.isEmpty() -> EmptyState(
                icon = Icons.Filled.Favorite,
                title = "لیست علاقه‌مندی خالی است",
                description = "از صفحهٔ سالن‌ها، سالن‌های محبوب خود را نشان کنید",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.venues, key = { it.id }) { venue ->
                    VenueCard(
                        venue = venue,
                        onClick = { onVenueClick(venue.id) },
                        onBook = { onVenueClick(venue.id) },
                        isFavorite = true,
                        onFavoriteClick = { viewModel.remove(venue.id) },
                    )
                }
            }
        }
    }
}
