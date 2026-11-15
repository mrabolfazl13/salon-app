package ir.salon.app.feature.venues

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.app.R

/** جزئیات سالن (M1: اطلاعات + تماس؛ رزرو در M2 به همین صفحه اضافه می‌شود) */
@Composable
fun VenueDetailScreen(
    onBack: () -> Unit,
    viewModel: VenueDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val extra = LocalSalonExtra.current

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.size(MinTouchTarget),
            ) {
                Icon(
                    Icons.Filled.ArrowBack,
                    contentDescription = stringResource(R.string.cd_back),
                )
            }
        }

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = viewModel::load,
            )
            state.venue != null -> {
                val venue = state.venue!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(RoundedCornerShape(24.dp)),
                    ) {
                        val image = venue.images.firstOrNull()
                        if (image.isNullOrBlank()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Brush.linearGradient(extra.gradientDeep)),
                            )
                        } else {
                            AsyncImage(
                                model = image,
                                contentDescription = venue.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize(),
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            venue.name,
                            style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier
                                .weight(1f)
                                .semantics { heading() },
                        )
                        if (venue.isVerified) {
                            Icon(
                                Icons.Filled.Verified,
                                contentDescription = stringResource(R.string.venue_verified),
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.Star,
                            contentDescription = null,
                            tint = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                            modifier = Modifier.size(18.dp),
                        )
                        Text(
                            PersianText.toPersianDigits("%.1f".format(venue.averageRating)) +
                                " (" + PersianText.toPersianDigits(venue.totalReviews.toString()) + ")",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }

                    Text(
                        venue.description.orEmpty(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    if (venue.amenities.isNotEmpty()) {
                        Text(
                            venue.amenities.joinToString(" • "),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    // قیمت از پایین‌ترین سانس — قرینهٔ get_venue_min_price
                    if (venue.price > 0) {
                        Text(
                            PersianText.formatPrice(venue.price.toLong()),
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }

                    // دکمهٔ تماس — قاعدهٔ فاز MVP: تماس خارج از برنامه
                    venue.phone?.let { phone ->
                        Button(
                            onClick = {
                                context.startActivity(
                                    Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")),
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                        ) {
                            Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.size(8.dp))
                            Text(stringResource(R.string.call_venue) + " — " + PersianText.toPersianDigits(phone))
                        }
                    }
                }
            }
        }
    }
}
