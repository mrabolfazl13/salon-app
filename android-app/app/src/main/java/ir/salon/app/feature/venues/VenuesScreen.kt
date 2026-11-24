package ir.salon.app.feature.venues

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.EmptyState
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SalonCategory
import ir.salon.core.designsystem.component.SalonCategoryRow
import ir.salon.core.designsystem.component.SalonSearchBar
import ir.salon.core.designsystem.component.SalonSectionHeader
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.component.salonPressScale
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.core.model.Venue

/**
 * کارت سالن — بازطراحی موبایل‌فرست مطابق VenueCard وب:
 * تصویر بزرگ ۱۶:۱۰، قلب روی تصویر، امتیاز، آدرس، چیپ امکانات و فوتر قیمت/رزرو.
 */
@Composable
fun VenueCard(
    venue: Venue,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    onBook: (() -> Unit)? = null,
    isFavorite: Boolean? = null,
    onFavoriteClick: (() -> Unit)? = null,
) {
    val extra = LocalSalonExtra.current
    val book = onBook ?: onClick

    val cardInteraction = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    Card(
        onClick = onClick,
        interactionSource = cardInteraction,
        modifier = modifier
            .fillMaxWidth()
            .salonPressScale(cardInteraction),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.55f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp, pressedElevation = 1.dp),
    ) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().height(156.dp)) {
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
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.ExtraBold,
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

                if (venue.isVerified) {
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
                        modifier = Modifier.padding(10.dp).align(Alignment.TopStart),
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Icon(
                                Icons.Filled.Verified,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(14.dp),
                            )
                            Text(
                                "تأییدشده",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }

                if (isFavorite != null && onFavoriteClick != null) {
                    Surface(
                        onClick = onFavoriteClick,
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
                        modifier = Modifier.padding(8.dp).size(MinTouchTarget).align(Alignment.TopEnd),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                contentDescription = if (isFavorite) "حذف از علاقه‌مندی" else "افزودن به علاقه‌مندی",
                                tint = if (isFavorite) Color(0xFFE11D48) else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                }
            }

            Column(
                modifier = Modifier.padding(start = 12.dp, end = 12.dp, top = 10.dp, bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        venue.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    Spacer(Modifier.width(8.dp))
                    Icon(
                        Icons.Filled.Star,
                        contentDescription = null,
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(15.dp),
                    )
                    Text(
                        PersianText.toPersianDigits("%.1f".format(venue.averageRating)),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    if (venue.totalReviews > 0) {
                        Text(
                            " (" + PersianText.toPersianDigits(venue.totalReviews.toString()) + ")",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.Place,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(15.dp),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        venue.address,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }

                if (venue.amenities.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        venue.amenities.take(2).forEach { amenity ->
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.8f),
                            ) {
                                Text(
                                    amenity,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                        .widthIn(max = 110.dp),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                        if (venue.amenities.size > 2) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.surfaceVariant,
                            ) {
                                Text(
                                    "+" + PersianText.toPersianDigits((venue.amenities.size - 2).toString()),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.55f))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "شروع از",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            PersianText.formatPrice(venue.price.toLong()),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    val bookInteraction = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                    Box(
                        modifier = Modifier
                            .height(MinTouchTarget)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Brush.linearGradient(extra.gradientEnergy))
                            .salonPressScale(bookInteraction)
                            .clickable(
                                interactionSource = bookInteraction,
                                indication = null,
                                role = Role.Button,
                                onClickLabel = "رزرو ${venue.name}",
                                onClick = book,
                            )
                            .padding(horizontal = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp),
                        ) {
                            Icon(
                                Icons.Filled.CalendarMonth,
                                contentDescription = null,
                                tint = Color(0xFF1C1917),
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                "رزرو",
                                style = MaterialTheme.typography.labelLarge,
                                color = Color(0xFF1C1917),
                                fontWeight = FontWeight.ExtraBold,
                            )
                        }
                    }
                }
            }
        }
    }
}

private val venueCategories = listOf(
    SalonCategory(null, "همه"),
    SalonCategory("futsal", "فوتسال"),
    SalonCategory("gym", "بدنسازی"),
    SalonCategory("football", "فوتبال"),
    SalonCategory("volleyball", "والیبال"),
    SalonCategory("basketball", "بسکتبال"),
)

/** جستجوی سالن — قرینهٔ صفحهٔ Search وب: جستجوی چسبان + دسته‌بندی + نتایج کارتی */
@Composable
fun VenuesScreen(
    onVenueClick: (Int) -> Unit,
    isAuthenticated: Boolean = false,
    viewModel: VenuesViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val selectedCategory by viewModel.category.collectAsStateWithLifecycle()
    val favorites by viewModel.favorites.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) viewModel.refreshFavorites()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                "جستجوی سالن",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.semantics { heading() },
            )
            SalonSearchBar(
                value = query,
                onValueChange = {
                    query = it
                    viewModel.onQueryChange(it)
                },
                onSubmit = { viewModel.refresh(force = true) },
            )
            SalonCategoryRow(
                categories = venueCategories,
                selected = selectedCategory,
                onSelect = viewModel::onCategoryChange,
            )
        }

        when (val s = state) {
            VenuesUiState.Loading -> SkeletonScreen(rows = 4)
            is VenuesUiState.Error -> ErrorState(
                message = s.error.uiMessage(),
                onRetry = { viewModel.refresh(force = true) },
            )
            is VenuesUiState.Empty -> EmptyState(
                icon = Icons.Filled.Search,
                title = if (s.query.isBlank()) "سالنی پیدا نشد" else "سالنی با «${s.query}» پیدا نشد",
                description = "اسم دیگری را امتحان کنید یا دسته‌بندی را تغییر دهید.",
                actionLabel = if (selectedCategory != null) "حذف فیلتر دسته‌بندی" else null,
                onAction = if (selectedCategory != null) {
                    { viewModel.onCategoryChange(null) }
                } else {
                    null
                },
            )
            is VenuesUiState.Ready -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 4.dp,
                    bottom = 24.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Text(
                        PersianText.toPersianDigits(s.venues.size.toString()) + " سالن پیدا شد",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                items(s.venues, key = { it.id }) { venue ->
                    VenueCard(
                        venue = venue,
                        onClick = { onVenueClick(venue.id) },
                        onBook = { onVenueClick(venue.id) },
                        isFavorite = if (isAuthenticated) venue.id in favorites else null,
                        onFavoriteClick = if (isAuthenticated) {
                            { viewModel.toggleFavorite(venue.id) }
                        } else {
                            null
                        },
                    )
                }
            }
        }
    }
}
