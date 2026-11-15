package ir.salon.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.R
import ir.salon.app.feature.auth.LoginScreen
import ir.salon.app.feature.auth.RegisterScreen
import ir.salon.app.feature.venues.VenueDetailScreen
import ir.salon.app.feature.venues.VenuesScreen
import ir.salon.app.ui.session.SessionState
import ir.salon.app.ui.session.SessionViewModel

/** مسیرهای ناوبری — مبنای role-gating */
object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val VENUES = "venues"
    const val VENUE_DETAIL = "venues/{venueId}"
    const val PROFILE = "profile"

    fun venueDetail(id: Int) = "venues/$id"
}

/** ناوبری پایین نقش‌محور — قرینهٔ BottomNavigation وب (فقط در صفحات سطح بالا) */
@Composable
fun SalonNavGraph(sessionViewModel: SessionViewModel) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val session by sessionViewModel.state.collectAsStateWithLifecycle()

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (currentRoute in setOf(Routes.VENUES, Routes.LOGIN)) {
                NavigationBar {
                    // M1: سالن‌ها + پروفایل (پروفایل در M3 کامل می‌شود؛ مهمان → ورود)
                    val items = buildList {
                        add(BottomNavItem.VENUES)
                        add(if (session.isAuthenticated) BottomNavItem.PROFILE else BottomNavItem.LOGIN)
                    }
                    items.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(item.icon, contentDescription = stringResource(item.labelRes))
                            },
                            label = { Text(stringResource(item.labelRes)) },
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.VENUES,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.LOGIN) {
                LoginScreen(
                    onLoggedIn = { navController.navigate(Routes.VENUES) { popUpTo(Routes.LOGIN) { inclusive = true } } },
                    onGoRegister = { navController.navigate(Routes.REGISTER) },
                )
            }
            composable(Routes.REGISTER) {
                RegisterScreen(
                    onRegistered = { navController.navigate(Routes.VENUES) { popUpTo(Routes.REGISTER) { inclusive = true } } },
                    onGoLogin = { navController.popBackStack() },
                )
            }
            composable(Routes.VENUES) {
                VenuesScreen(onVenueClick = { id -> navController.navigate(Routes.venueDetail(id)) })
            }
            composable(Routes.VENUE_DETAIL, arguments = listOf(navArgument("venueId") {
                type = androidx.navigation.NavType.IntType
            })) {
                VenueDetailScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.PROFILE) {
                // جایگاه موقت M1 — در M3 پروفایل کامل جایگزین می‌شود
                ir.salon.core.designsystem.component.EmptyState(
                    icon = androidx.compose.material.icons.Icons.Filled.Person,
                    title = stringResource(R.string.nav_profile),
                    description = "این بخش در فاز M3 تکمیل می‌شود",
                )
            }
        }
    }
}

enum class BottomNavItem(val route: String, val labelRes: Int, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    VENUES(Routes.VENUES, R.string.nav_venues, Icons.Filled.Place),
    LOGIN(Routes.LOGIN, R.string.nav_profile, Icons.Filled.Person),
    PROFILE(Routes.PROFILE, R.string.nav_profile, Icons.Filled.Person),
}
