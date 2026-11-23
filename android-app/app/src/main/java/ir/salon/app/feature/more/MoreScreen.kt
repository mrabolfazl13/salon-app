package ir.salon.app.feature.more

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SportsSoccer
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import ir.salon.core.designsystem.component.FeatureHeader
import ir.salon.core.designsystem.component.MinTouchTarget

@Composable
fun MoreScreen(
    isAuthenticated: Boolean,
    isManager: Boolean,
    isAdmin: Boolean,
    onOpenBookings: () -> Unit,
    onOpenFavorites: () -> Unit,
    onOpenDeals: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenTeams: () -> Unit,
    onOpenGames: () -> Unit,
    onOpenTournaments: () -> Unit,
    onOpenContracts: () -> Unit,
    onOpenManager: () -> Unit,
    onOpenAdmin: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        FeatureHeader(title = "بیشتر")
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (isAuthenticated) {
                SectionCard("حساب من") {
                    MoreLink("پروفایل و امتیاز وفاداری", Icons.Filled.Person, onOpenProfile)
                    MoreLink("رزروهای من", Icons.Filled.CalendarMonth, onOpenBookings)
                    MoreLink("اعلان‌ها", Icons.Filled.Notifications, onOpenNotifications)
                }
            }

            SectionCard("سالن و رزرو") {
                MoreLink("سالن‌های موردعلاقه", Icons.Filled.Favorite, onOpenFavorites, enabled = isAuthenticated)
                MoreLink("دیل‌های لحظه آخری", Icons.Filled.LocalOffer, onOpenDeals, enabled = isAuthenticated)
            }

            SectionCard("ورزش و رقابت") {
                MoreLink("بازی‌های گروهی", Icons.Filled.SportsSoccer, onOpenGames, enabled = isAuthenticated)
                MoreLink("تیم‌ها", Icons.Filled.Groups, onOpenTeams, enabled = isAuthenticated)
                MoreLink("تورنمنت‌ها", Icons.Filled.EmojiEvents, onOpenTournaments, enabled = isAuthenticated)
                MoreLink("قراردادهای من", Icons.Filled.Description, onOpenContracts, enabled = isAuthenticated)
            }

            if (isManager) {
                SectionCard("مدیریت") {
                    MoreLink("پنل مدیریت سالن", Icons.Filled.Storefront, onOpenManager)
                }
            }
            if (isAdmin) {
                SectionCard("مدیریت کل") {
                    MoreLink("پنل مدیر کل", Icons.Filled.AdminPanelSettings, onOpenAdmin)
                }
            }

            Text(
                "نسخهٔ کاتلین — سالن",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp),
            )
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(4.dp))
            content()
        }
    }
}

@Composable
private fun MoreLink(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit = {},
    enabled: Boolean = true,
) {
    androidx.compose.material3.TextButton(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        Text(label, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
        Text("›")
    }
}
