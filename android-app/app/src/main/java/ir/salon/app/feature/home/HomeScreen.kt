package ir.salon.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.SportsSoccer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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
import ir.salon.app.feature.venues.VenueCard
import ir.salon.core.designsystem.component.ErrorState
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SalonCountBadge
import ir.salon.core.designsystem.component.SalonQuickTile
import ir.salon.core.designsystem.component.SalonSearchBar
import ir.salon.core.designsystem.component.SalonSectionHeader
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.core.model.User

private data class HomeAction(
    val label: String,
    val description: String,
    val icon: ImageVector,
    val gradient: List<Color>,
    val requiresAuth: Boolean,
    val onClick: () -> Unit,
)

/** صفحهٔ خانه — قرینهٔ UserDashboard وب: سلام + جستجو + دسترسی سریع + محبوب‌ترین سالن‌ها */
@Composable
fun HomeScreen(
    sessionUser: User?,
    onSearch: () -> Unit,
    onVenueClick: (Int) -> Unit,
    onBookings: () -> Unit,
    onFavorites: () -> Unit,
    onTeams: () -> Unit,
    onGames: () -> Unit,
    onTournaments: () -> Unit,
    onMore: () -> Unit,
    onNotifications: () -> Unit,
    onProfile: () -> Unit,
    onLogin: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && !state.loading) {
                viewModel.refresh(silent = state.venues.isNotEmpty())
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
    val user = sessionUser ?: state.user
    val extra = LocalSalonExtra.current
    val authenticated = sessionUser != null

    val actions = listOf(
        HomeAction("رزروهای من", "فعال و گذشته", Icons.Filled.CalendarMonth,
            listOf(Color(0xFF3B82F6), Color(0xFF2563EB)), true, onBookings),
        HomeAction("جستجوی سالن", "نزدیک تو", Icons.Filled.Place,
            listOf(Color(0xFF10B981), Color(0xFF059669)), false, onSearch),
        HomeAction("علاقه‌مندی‌ها", "سالن‌های ذخیره‌شده", Icons.Filled.Favorite,
            listOf(Color(0xFFF43F5E), Color(0xFFE11D48)), true, onFavorites),
        HomeAction("تیم‌ها", "ساخت و عضویت", Icons.Filled.Groups,
            listOf(Color(0xFF8B5CF6), Color(0xFF7C3AED)), true, onTeams),
        HomeAction("بازی‌های گروهی", "هم‌تیمی پیدا کن", Icons.Filled.SportsSoccer,
            listOf(Color(0xFFF59E0B), Color(0xFFF97316)), true, onGames),
        HomeAction("تورنمنت‌ها", "براکت و ثبت‌نام", Icons.Filled.EmojiEvents,
            listOf(Color(0xFF06B6D4), Color(0xFF0891B2)), true, onTournaments),
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        if (authenticated) {
                            val name = user?.fullName?.substringBefore(' ')?.takeIf { it.isNotBlank() } ?: "همراه"
                            "سلام $name 👋"
                        } else {
                            "سلام 👋"
                        },
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        "امروز کجا می‌خوای بازی کنی؟",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (authenticated) {
                    Box(contentAlignment = Alignment.TopEnd) {
                        IconButton(onClick = onNotifications, modifier = Modifier.size(MinTouchTarget)) {
                            Icon(
                                Icons.Filled.Notifications,
                                contentDescription = "اعلان‌ها",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Box(modifier = Modifier.padding(top = 4.dp, end = 2.dp)) {
                            SalonCountBadge(state.unread)
                        }
                    }
                    Spacer(Modifier.size(4.dp))
                    Box(
                        modifier = Modifier
                            .size(MinTouchTarget)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(extra.gradientEnergy))
                            .clickable(
                                role = Role.Button,
                                onClickLabel = "پروفایل",
                                onClick = onProfile,
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            (user?.fullName?.firstOrNull() ?: 'ک').toString(),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF1C1917),
                        )
                    }
                } else {
                    IconButton(onClick = onLogin, modifier = Modifier.size(MinTouchTarget)) {
                        Icon(Icons.Filled.Login, contentDescription = "ورود", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        item {
            SalonSearchBar(
                value = "",
                onValueChange = {},
                readOnly = true,
                onClick = onSearch,
                placeholder = "جستجوی سریع سالن…",
            )
        }

        if (!authenticated) {
            item {
                Card(shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Brush.linearGradient(extra.gradientDeep))
                            .padding(20.dp),
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "سالن بعدی‌ات را همین حالا رزرو کن",
                                style = MaterialTheme.typography.titleLarge,
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                            )
                            Text(
                                "فوتسال، بدنسازی و زمین‌های ورزشی نزدیک خودت را ببین و بدون تماس تلفنی رزرو کن.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFDBEAFE),
                            )
                            Spacer(Modifier.height(4.dp))
                            Button(
                                onClick = onLogin,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = extra.gradientEnergy.first(),
                                    contentColor = Color(0xFF1C1917),
                                ),
                                modifier = Modifier.height(MinTouchTarget),
                            ) {
                                Text("ورود / ثبت‌نام", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        item { SalonSectionHeader(title = "دسترسی سریع") }

        items(actions.chunked(2)) { rowActions ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                rowActions.forEach { action ->
                    SalonQuickTile(
                        label = action.label,
                        description = action.description,
                        icon = action.icon,
                        gradient = action.gradient,
                        onClick = { if (action.requiresAuth && !authenticated) onLogin() else action.onClick() },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (rowActions.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        item {
            SalonSectionHeader(
                title = "محبوب‌ترین سالن‌ها",
                actionLabel = "مشاهده همه",
                onAction = onSearch,
            )
        }

        when {
            state.loading -> item {
                Box(Modifier.fillMaxWidth().height(300.dp)) {
                    SkeletonScreen(rows = 3)
                }
            }
            state.error != null -> item {
                ErrorState(
                    message = state.error!!.uiMessage(),
                    onRetry = viewModel::refresh,
                    modifier = Modifier.height(280.dp),
                )
            }
            state.venues.isEmpty() -> item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        "هنوز سالنی ثبت نشده است.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
            else -> items(state.venues.take(6), key = { it.id }) { venue ->
                VenueCard(
                    venue = venue,
                    onClick = { onVenueClick(venue.id) },
                    onBook = { onVenueClick(venue.id) },
                    isFavorite = if (authenticated) venue.id in state.favorites else null,
                    onFavoriteClick = if (authenticated) {
                        { viewModel.toggleFavorite(venue.id) }
                    } else {
                        null
                    },
                )
            }
        }

        item {
            Surface(
                onClick = onMore,
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "همهٔ امکانات: قرارداد، دیل، وفاداری و بیشتر",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        "بیشتر ›",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}
