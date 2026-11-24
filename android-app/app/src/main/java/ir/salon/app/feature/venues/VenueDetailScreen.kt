package ir.salon.app.feature.venues

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Stadium
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.HorizontalDivider
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
    var showConfirm by remember { mutableStateOf(false) }

    /** دکمهٔ شیشه‌ای روی گالری — قرینهٔ glassIconButton وب */
    @Composable
    fun GlassIconButton(onClick: () -> Unit, content: @Composable () -> Unit) {
        Surface(
            onClick = onClick,
            shape = androidx.compose.foundation.shape.CircleShape,
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.88f),
            shadowElevation = 4.dp,
            modifier = Modifier.size(MinTouchTarget),
        ) {
            Box(contentAlignment = Alignment.Center) { content() }
        }
    }

    androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxSize()) {
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
                        .verticalScroll(rememberScrollState()),
                ) {
                    // ── گالری تمام‌عرض با snap + دکمه‌های شیشه‌ای روی تصویر ──
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp),
                    ) {
                        val gallery = venue.images.map { ir.salon.core.network.MediaUrl.full(it) }
                            .filter { it.isNotBlank() }
                        if (gallery.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Brush.linearGradient(extra.gradientDeep)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    Icons.Filled.Stadium,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.35f),
                                    modifier = Modifier.size(48.dp),
                                )
                            }
                        } else {
                            val pagerState = rememberPagerState(pageCount = { gallery.size })
                            HorizontalPager(
                                state = pagerState,
                                modifier = Modifier.fillMaxSize(),
                            ) { page ->
                                AsyncImage(
                                    model = gallery[page],
                                    contentDescription = venue.name + " — تصویر " +
                                        ir.salon.core.common.PersianText.toPersianDigits((page + 1).toString()),
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                )
                            }
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        0f to Color.Transparent,
                                        0.55f to Color.Transparent,
                                        1f to Color.Black.copy(alpha = 0.6f),
                                    ),
                                ),
                        )

                        // دکمه‌های شیشه‌ای — بازگشت + قلب
                        Row(
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(horizontal = 12.dp, vertical = 12.dp)
                                .fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            GlassIconButton(onClick = onBack) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = stringResource(R.string.cd_back),
                                    tint = MaterialTheme.colorScheme.onSurface,
                                )
                            }
                            if (isAuthenticated) {
                                GlassIconButton(onClick = socialViewModel::toggleFavorite) {
                                    Icon(
                                        if (social.favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                        contentDescription = if (social.favorite) "حذف از علاقه‌مندی" else "افزودن به علاقه‌مندی",
                                        tint = if (social.favorite) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.size(20.dp),
                                    )
                                }
                            }
                        }

                        // چیپ‌های روی تصویر — تأیید + دسته‌بندی
                        Row(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color(0xCC065F46),
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Icon(
                                        Icons.Filled.Verified,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Spacer(Modifier.size(4.dp))
                                    Text(
                                        "تأیید شده",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White,
                                    )
                                }
                            }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.Black.copy(alpha = 0.45f),
                            ) {
                                Text(
                                    venue.category,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                )
                            }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .padding(bottom = 120.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {

                    AnimatedVisibility(
                        visibleState = MutableTransitionState(false).apply { targetState = true },
                        enter = fadeIn(tween(320)) + slideInVertically(tween(380)) { it / 8 },
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                venue.name,
                                style = MaterialTheme.typography.headlineSmall,
                                modifier = Modifier.semantics { heading() },
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Filled.Star,
                                        contentDescription = null,
                                        tint = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                                        modifier = Modifier.size(16.dp),
                                    )
                                    Text(
                                        PersianText.toPersianDigits("%.1f".format(venue.averageRating)) +
                                            " (" + PersianText.toPersianDigits(venue.totalReviews.toString()) + ")",
                                        style = MaterialTheme.typography.labelMedium,
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Filled.Place,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(15.dp),
                                    )
                                    Text(
                                        venue.address,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                                    )
                                }
                            }
                        }
                    }

                    if (venue.description?.isNotBlank() == true) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.55f),
                            ),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Text(
                                    "دربارهٔ سالن",
                                    style = MaterialTheme.typography.titleSmall,
                                )
                                Text(
                                    venue.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }

                    if (venue.amenities.isNotEmpty()) {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(venue.amenities) { amenity ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f),
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    ) {
                                        Icon(
                                            Icons.Filled.CheckCircle,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSecondaryContainer,
                                            modifier = Modifier.size(14.dp),
                                        )
                                        Text(
                                            amenity,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                        )
                                    }
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
                                    ir.salon.app.feature.booking.SlotRows(
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

    // دیالوگ تأیید رزرو — از CTA چسبان پایین باز می‌شود
    val selectedSlot = booking.selectedSlot
    if (showConfirm && selectedSlot != null && state.venue != null) {
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
            onDismiss = {
                showConfirm = false
                bookingViewModel.dismissResult()
            },
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

    // ── نوار CTA چسبان پایین — قرینهٔ BookingSummary وب ──
    val ctaSlot = booking.selectedSlot
    if (state.venue != null && state.venue!!.category != "gym") {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .fillMaxSize(),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.98f)),
            ) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.7f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        if (ctaSlot != null) {
                            Text(
                                PersianText.formatPrice(
                                    ((ctaSlot.dealPrice ?: ctaSlot.currentPrice)).toLong(),
                                ),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary,
                            )
                            Text(
                                "امروز — " + faTime(ctaSlot.startTime) + " تا " +
                                    ir.salon.app.feature.booking.slotEndTime(ctaSlot),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        } else {
                            Text(
                                "سانسی انتخاب نشده",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Button(
                        onClick = { showConfirm = true },
                        enabled = ctaSlot != null && !booking.creating,
                        shape = RoundedCornerShape(14.dp),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                            contentColor = androidx.compose.ui.graphics.Color(0xFF1C1917),
                        ),
                        modifier = Modifier
                            .width(140.dp)
                            .height(48.dp),
                    ) {
                        Text(
                            "رزرو سانس",
                            fontWeight = androidx.compose.ui.text.font.FontWeight.ExtraBold,
                        )
                    }
                }
            }
        }
    }
}
}
