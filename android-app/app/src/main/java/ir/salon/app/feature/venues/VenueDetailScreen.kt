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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import ir.salon.app.feature.booking.faTime
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.app.R

/** جزئیات سالن + جریان رزرو (M2): سانس‌ها، دیالوگ تأیید، تماس */
@Composable
fun VenueDetailScreen(
    onBack: () -> Unit,
    isAuthenticated: Boolean = false,
    detailViewModel: VenueDetailViewModel = hiltViewModel(),
    bookingViewModel: ir.salon.app.feature.booking.BookingFlowViewModel = hiltViewModel(),
    socialViewModel: VenueSocialViewModel = hiltViewModel(),
) {
    val state by detailViewModel.state.collectAsStateWithLifecycle()
    val booking by bookingViewModel.state.collectAsStateWithLifecycle()
    val social by socialViewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val extra = LocalSalonExtra.current
    var showContract by remember { mutableStateOf(false) }

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
            Spacer(Modifier.weight(1f))
            if (isAuthenticated) {
                IconButton(
                    onClick = socialViewModel::toggleFavorite,
                    enabled = !social.favoriteLoading,
                    modifier = Modifier.size(MinTouchTarget),
                ) {
                    Icon(
                        if (social.favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        contentDescription = if (social.favorite) "حذف از علاقه‌مندی" else "افزودن به علاقه‌مندی",
                        tint = if (social.favorite) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        when {
            state.loading -> SkeletonScreen(rows = 5)
            state.error != null -> ErrorState(
                message = state.error!!.uiMessage(),
                onRetry = detailViewModel::load,
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
                            .height(220.dp)
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
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f)),
                                    ),
                                ),
                        )
                        Row(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.95f),
                            ) {
                                Text(
                                    venue.category,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                )
                            }
                            if (venue.isVerified) {
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Icon(
                                            Icons.Filled.Verified,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(14.dp),
                                        )
                                        Spacer(Modifier.size(3.dp))
                                        Text(
                                            "تأییدشده",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                        )
                                    }
                                }
                            }
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
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(venue.amenities) { amenity ->
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                ) {
                                    Text(
                                        amenity,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    )
                                }
                            }
                        }
                    }

                    ir.salon.app.feature.venues.VenueSocialSection(
                        viewModel = socialViewModel,
                        isAuthenticated = isAuthenticated,
                    )

                    // قیمت از پایین‌ترین سانس — قرینهٔ get_venue_min_price
                    if (venue.price > 0) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.75f),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        "قیمت هر سانس از",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    )
                                    Text(
                                        PersianText.formatPrice(venue.price.toLong()),
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = androidx.compose.ui.text.font.FontWeight.ExtraBold,
                                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    )
                                }
                                Text(
                                    venue.category,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                )
                            }
                        }
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

                    OutlinedButton(
                        onClick = { showContract = true },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                    ) { Text("درخواست قرارداد بلندمدت") }

                    // ───────────── جریان رزرو (M2) ─────────────
                    if (venue.category != "gym") {
                        Text(
                            stringResource(R.string.booking_pick_slot),
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.semantics { heading() },
                        )
                        ir.salon.app.feature.booking.DateSelector(
                            days = booking.days,
                            selected = booking.selectedDate,
                            onSelect = bookingViewModel::selectDate,
                        )
                        when {
                            booking.loadingSlots -> ir.salon.core.designsystem.component.SkeletonScreen(rows = 3)
                            booking.slotsError != null -> Text(
                                booking.slotsError!!.uiMessage(),
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall,
                            )
                            else -> {
                                if (booking.slots.isEmpty()) {
                                    Text(
                                        stringResource(R.string.booking_no_slots),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                } else {
                                    ir.salon.app.feature.booking.SlotGrid(
                                        slots = booking.slots,
                                        selectedSlotId = booking.selectedSlot?.id,
                                        onSelect = bookingViewModel::selectSlot,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // دیالوگ تأیید رزرو
    val selectedSlot = booking.selectedSlot
    if (selectedSlot != null && state.venue != null) {
        ir.salon.app.feature.booking.BookingConfirmDialog(
            venueName = state.venue!!.name,
            venuePhone = state.venue!!.phone,
            slotSummary = "${faTime(selectedSlot.startTime)} تا ${ir.salon.app.feature.booking.slotEndTime(selectedSlot)} — " +
                stringResource(R.string.booking_slot_date) + " " + ir.salon.app.feature.bookings.faDate(booking.selectedDate),
            breakdown = emptyList(),
            payable = (selectedSlot.dealPrice ?: selectedSlot.currentPrice).toLong(),
            loading = booking.creating,
            error = booking.createError?.uiMessage(),
            onConfirm = { code, loyalty -> bookingViewModel.createBooking(code, loyalty) },
            onDismiss = bookingViewModel::dismissResult,
        )
    }

    // دیالوگ موفقیت — قرینهٔ bookingResult با دکمهٔ تماس
    val created = booking.created
    if (created != null && state.venue != null) {
        ir.salon.app.feature.booking.BookingSuccessDialog(
            pending = created,
            venuePhone = state.venue!!.phone,
            onDismiss = bookingViewModel::dismissResult,
        )
    }

    if (showContract) {
        ir.salon.app.feature.contracts.ContractRequestDialog(
            onDismiss = { showContract = false },
        )
    }
}
