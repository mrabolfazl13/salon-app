package ir.salon.app.feature.venues

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.core.model.Venue
import ir.salon.app.R

/** کارت سالن — قرینهٔ VenueCard.tsx با گرادیان جایگزین تصویر ناموجود */
@Composable
fun VenueCard(venue: Venue, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val extra = LocalSalonExtra.current
    Card(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(112.dp),
        shape = MaterialTheme.shapes.large,
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(12.dp)),
            ) {
                val image = venue.images.firstOrNull()
                if (image.isNullOrBlank()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.linearGradient(extra.gradientTile)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            venue.name.take(1),
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                } else {
                    AsyncImage(
                        model = image,
                        contentDescription = venue.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
            Spacer(Modifier.size(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        venue.name,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    if (venue.isVerified) {
                        Icon(
                            Icons.Filled.Verified,
                            contentDescription = stringResource(R.string.venue_verified),
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    venue.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.Star,
                        contentDescription = null,
                        tint = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        PersianText.toPersianDigits("%.1f".format(venue.averageRating)),
                        style = MaterialTheme.typography.labelMedium,
                    )
                    Spacer(Modifier.size(8.dp))
                    Text(
                        PersianText.formatPrice(venue.price.toLong()),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }
    }
}

/** لیست سالن‌ها با جستجو — قرینهٔ pages/venues/Venues.tsx */
@Composable
fun VenuesScreen(
    onVenueClick: (Int) -> Unit,
    viewModel: VenuesViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            stringResource(R.string.venues_title),
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() },
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = query,
            onValueChange = {
                query = it
                viewModel.onQueryChange(it)
            },
            placeholder = { Text(stringResource(R.string.search_venues_hint)) },
            leadingIcon = {
                Icon(Icons.Filled.Search, contentDescription = stringResource(R.string.cd_search))
            },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))

        when (val s = state) {
            VenuesUiState.Loading -> SkeletonScreen()
            is VenuesUiState.Error -> ErrorState(
                message = s.error.uiMessage(),
                onRetry = { viewModel.refresh(force = true) },
            )
            is VenuesUiState.Empty -> EmptyState(
                icon = Icons.Filled.Search,
                title = stringResource(R.string.empty_venues),
                description = stringResource(R.string.empty_venues_desc),
            )
            is VenuesUiState.Ready -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(s.venues, key = { it.id }) { venue ->
                    VenueCard(venue = venue, onClick = { onVenueClick(venue.id) })
                }
            }
        }
    }
}
