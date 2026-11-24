package ir.salon.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
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
import ir.salon.app.feature.home.HomeScreen
import ir.salon.app.feature.venues.VenueDetailScreen
import ir.salon.app.feature.venues.VenuesScreen
import ir.salon.app.ui.session.SessionState
import ir.salon.app.ui.session.SessionViewModel

/** مسیرهای ناوبری — مبنای role-gating */
object Routes {
    const val HOME = "home"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val VENUES = "venues"
    const val VENUE_DETAIL = "venues/{venueId}"
    const val PROFILE = "profile"
    const val MORE = "more"
    const val FAVORITES = "favorites"
    const val DEALS = "deals"
    const val NOTIFICATIONS = "notifications"
    const val TEAMS = "teams"
    const val TEAM_DETAIL = "teams/{teamId}"
    const val GAMES = "games"
    const val GAME_DETAIL = "games/{gameId}"
    const val GAME_CREATE = "games/new/{bookingId}"
    const val TOURNAMENTS = "tournaments"
    const val TOURNAMENT_DETAIL = "tournaments/{tournamentId}"
    const val CONTRACTS = "contracts"
    const val CONTRACT_DETAIL = "contracts/{contractId}"
    const val MANAGER = "manager"
    const val ADMIN = "admin"
    const val MY_BOOKINGS = "bookings"
    const val BOOKING_DETAIL = "bookings/{bookingId}"

    fun venueDetail(id: Int) = "venues/$id"
    fun bookingDetail(id: Int) = "bookings/$id"
    fun teamDetail(id: Int) = "teams/$id"
    fun gameDetail(id: Int) = "games/$id"
    fun createGame(bookingId: Int) = "games/new/$bookingId"
    fun tournamentDetail(id: Int) = "tournaments/$id"
    fun contractDetail(id: Int) = "contracts/$id"
}

/** ناوبری پایین نقش‌محور — قرینهٔ BottomNavigation وب (فقط در صفحات سطح بالا) */
@Composable
fun SalonNavGraph(sessionViewModel: SessionViewModel) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val session by sessionViewModel.state.collectAsStateWithLifecycle()
    val themeViewModel: ir.salon.app.ui.theme.ThemeViewModel = hiltViewModel()
    val themeMode by themeViewModel.mode.collectAsStateWithLifecycle()

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            val barRoutes = setOf(
                Routes.HOME, Routes.VENUES, Routes.LOGIN, Routes.MY_BOOKINGS,
                Routes.MORE, Routes.PROFILE, Routes.TEAMS, Routes.FAVORITES,
            )
            if (currentRoute != null && currentRoute in barRoutes) {
                SalonBottomBar(
                    session = session,
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        val authOnly = setOf(
                            Routes.MY_BOOKINGS, Routes.FAVORITES, Routes.TEAMS,
                            Routes.PROFILE, Routes.MANAGER, Routes.ADMIN,
                        )
                        val target = if (!session.isAuthenticated && route in authOnly) Routes.LOGIN else route
                        navController.navigate(target) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(innerPadding),
            enterTransition = {
                androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(240)) +
                    androidx.compose.animation.slideInHorizontally(
                        animationSpec = androidx.compose.animation.core.tween(260),
                        initialOffsetX = { it / 8 },
                    )
            },
            exitTransition = { androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(160)) },
            popEnterTransition = { androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(240)) },
            popExitTransition = {
                androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(160)) +
                    androidx.compose.animation.slideOutHorizontally(
                        animationSpec = androidx.compose.animation.core.tween(220),
                        targetOffsetX = { it / 8 },
                    )
            },
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    themeMode = themeMode,
                    onToggleTheme = themeViewModel::cycle,
                    sessionUser = session.user,
                    onSearch = { navController.navigate(Routes.VENUES) },
                    onVenueClick = { id -> navController.navigate(Routes.venueDetail(id)) },
                    onBookings = {
                        if (session.isAuthenticated) navController.navigate(Routes.MY_BOOKINGS) else navController.navigate(Routes.LOGIN)
                    },
                    onFavorites = {
                        if (session.isAuthenticated) navController.navigate(Routes.FAVORITES) else navController.navigate(Routes.LOGIN)
                    },
                    onTeams = {
                        if (session.isAuthenticated) navController.navigate(Routes.TEAMS) else navController.navigate(Routes.LOGIN)
                    },
                    onGames = {
                        if (session.isAuthenticated) navController.navigate(Routes.GAMES) else navController.navigate(Routes.LOGIN)
                    },
                    onTournaments = {
                        if (session.isAuthenticated) navController.navigate(Routes.TOURNAMENTS) else navController.navigate(Routes.LOGIN)
                    },
                    onMore = { navController.navigate(Routes.MORE) },
                    onNotifications = {
                        if (session.isAuthenticated) navController.navigate(Routes.NOTIFICATIONS) else navController.navigate(Routes.LOGIN)
                    },
                    onProfile = {
                        if (session.isAuthenticated) navController.navigate(Routes.PROFILE) else navController.navigate(Routes.LOGIN)
                    },
                    onLogin = { navController.navigate(Routes.LOGIN) },
                )
            }
            composable(Routes.LOGIN) {
                LoginScreen(
                    onLoggedIn = { user ->
                        sessionViewModel.onLoggedIn(user)
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onGoRegister = { navController.navigate(Routes.REGISTER) },
                )
            }
            composable(Routes.REGISTER) {
                RegisterScreen(
                    onRegistered = { user ->
                        sessionViewModel.onLoggedIn(user)
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onGoLogin = { navController.popBackStack() },
                )
            }
            composable(Routes.VENUES) {
                VenuesScreen(
                    onVenueClick = { id -> navController.navigate(Routes.venueDetail(id)) },
                    isAuthenticated = session.isAuthenticated,
                )
            }
            composable(Routes.VENUE_DETAIL, arguments = listOf(navArgument("venueId") {
                type = androidx.navigation.NavType.IntType
            })) {
                VenueDetailScreen(
                    onBack = { navController.popBackStack() },
                    isAuthenticated = session.isAuthenticated,
                )
            }
            composable(Routes.MY_BOOKINGS) {
                ir.salon.app.feature.bookings.MyBookingsScreen(
                    onBookingClick = { id -> navController.navigate(Routes.bookingDetail(id)) },
                )
            }
            composable(Routes.BOOKING_DETAIL, arguments = listOf(navArgument("bookingId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.bookings.BookingDetailScreen(
                    onBack = { navController.popBackStack() },
                    onCreateGame = { bookingId -> navController.navigate(Routes.createGame(bookingId)) },
                )
            }
            composable(Routes.PROFILE) {
                ir.salon.app.feature.profile.ProfileScreen(
                    themeMode = themeMode,
                    onSetTheme = themeViewModel::setMode,
                    onBack = { navController.popBackStack() },
                    onOpenFavorites = { navController.navigate(Routes.FAVORITES) },
                    onOpenNotifications = { navController.navigate(Routes.NOTIFICATIONS) },
                    onOpenDeals = { navController.navigate(Routes.DEALS) },
                    onOpenBookings = { navController.navigate(Routes.MY_BOOKINGS) },
                    onOpenMore = { navController.navigate(Routes.MORE) },
                    onLoggedOut = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(navController.graph.findStartDestination().id) { inclusive = false }
                            launchSingleTop = true
                        }
                    },
                    onUserUpdated = { sessionViewModel.onLoggedIn(it) },
                    sessionViewModel = sessionViewModel,
                )
            }
            composable(Routes.MORE) {
                ir.salon.app.feature.more.MoreScreen(
                    isAuthenticated = session.isAuthenticated,
                    isManager = session.isManager,
                    isAdmin = session.isAdmin,
                    onOpenBookings = { navController.navigate(Routes.MY_BOOKINGS) },
                    onOpenFavorites = { navController.navigate(Routes.FAVORITES) },
                    onOpenDeals = { navController.navigate(Routes.DEALS) },
                    onOpenNotifications = { navController.navigate(Routes.NOTIFICATIONS) },
                    onOpenProfile = { navController.navigate(Routes.PROFILE) },
                    onOpenTeams = { navController.navigate(Routes.TEAMS) },
                    onOpenGames = { navController.navigate(Routes.GAMES) },
                    onOpenTournaments = { navController.navigate(Routes.TOURNAMENTS) },
                    onOpenContracts = { navController.navigate(Routes.CONTRACTS) },
                    onOpenManager = { navController.navigate(Routes.MANAGER) },
                    onOpenAdmin = { navController.navigate(Routes.ADMIN) },
                )
            }
            composable(Routes.TEAMS) {
                ir.salon.app.feature.teams.TeamsScreen(
                    onBack = { navController.popBackStack() },
                    onTeamClick = { id -> navController.navigate(Routes.teamDetail(id)) },
                )
            }
            composable(Routes.TEAM_DETAIL, arguments = listOf(navArgument("teamId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.teams.TeamDetailScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.GAMES) {
                ir.salon.app.feature.games.GamesScreen(
                    onBack = { navController.popBackStack() },
                    onGameClick = { id -> navController.navigate(Routes.gameDetail(id)) },
                )
            }
            composable(Routes.GAME_DETAIL, arguments = listOf(navArgument("gameId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.games.GameDetailScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.GAME_CREATE, arguments = listOf(navArgument("bookingId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.games.CreateGameScreen(
                    onBack = { navController.popBackStack() },
                    onCreated = { gameId ->
                        navController.navigate(Routes.gameDetail(gameId)) {
                            popUpTo(Routes.GAME_CREATE) { inclusive = true }
                        }
                    },
                )
            }
            composable(Routes.TOURNAMENTS) {
                ir.salon.app.feature.tournaments.TournamentsScreen(
                    onBack = { navController.popBackStack() },
                    onTournamentClick = { id -> navController.navigate(Routes.tournamentDetail(id)) },
                )
            }
            composable(Routes.TOURNAMENT_DETAIL, arguments = listOf(navArgument("tournamentId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.tournaments.TournamentDetailScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.CONTRACTS) {
                ir.salon.app.feature.contracts.ContractsScreen(
                    onBack = { navController.popBackStack() },
                    onContractClick = { id -> navController.navigate(Routes.contractDetail(id)) },
                )
            }
            composable(Routes.CONTRACT_DETAIL, arguments = listOf(navArgument("contractId") {
                type = androidx.navigation.NavType.IntType
            })) {
                ir.salon.app.feature.contracts.ContractDetailScreen(onBack = { navController.popBackStack() })
            }
            composable(Routes.MANAGER) {
                if (session.isManager) {
                    ir.salon.app.feature.manager.ManagerScreen(onBack = { navController.popBackStack() })
                } else {
                    ir.salon.core.designsystem.component.ErrorState(
                        message = "دسترسی به این بخش ندارید",
                        onRetry = { navController.popBackStack() },
                    )
                }
            }
            composable(Routes.ADMIN) {
                if (session.isAdmin) {
                    ir.salon.app.feature.admin.AdminScreen(onBack = { navController.popBackStack() })
                } else {
                    ir.salon.core.designsystem.component.ErrorState(
                        message = "دسترسی به این بخش ندارید",
                        onRetry = { navController.popBackStack() },
                    )
                }
            }
            composable(Routes.FAVORITES) {
                ir.salon.app.feature.favorites.FavoritesScreen(
                    onBack = { navController.popBackStack() },
                    onVenueClick = { id -> navController.navigate(Routes.venueDetail(id)) },
                )
            }
            composable(Routes.DEALS) {
                ir.salon.app.feature.deals.DealsScreen(
                    onBack = { navController.popBackStack() },
                    onVenueClick = { id -> navController.navigate(Routes.venueDetail(id)) },
                )
            }
            composable(Routes.NOTIFICATIONS) {
                ir.salon.app.feature.notifications.NotificationsScreen(
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}

@Composable
private fun SalonBottomBar(
    session: SessionState,
    currentRoute: String?,
    onNavigate: (String) -> Unit,
) {
    val items = buildList {
        add(BottomNavItem.HOME)
        add(BottomNavItem.VENUES)
        when {
            session.isAdmin -> add(BottomNavItem.ADMIN)
            session.isManager -> add(BottomNavItem.MANAGER)
            session.isAuthenticated -> add(BottomNavItem.TEAMS)
            else -> add(BottomNavItem.FAVORITES)
        }
        if (session.isAdmin || session.isManager || !session.isAuthenticated) {
            add(BottomNavItem.MORE)
        } else {
            add(BottomNavItem.BOOKINGS)
        }
        add(if (session.isAuthenticated) BottomNavItem.PROFILE else BottomNavItem.LOGIN)
    }
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.97f),
        tonalElevation = 0.dp,
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route ||
                (item == BottomNavItem.VENUES && currentRoute == Routes.VENUE_DETAIL)
            NavigationBarItem(
                selected = selected,
                onClick = { onNavigate(item.route) },
                icon = {
                    Icon(item.icon, contentDescription = stringResource(item.labelRes))
                },
                label = { Text(stringResource(item.labelRes)) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.onSecondaryContainer,
                    selectedTextColor = MaterialTheme.colorScheme.onSecondaryContainer,
                    indicatorColor = MaterialTheme.colorScheme.secondaryContainer,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                ),
            )
        }
    }
}

enum class BottomNavItem(val route: String, val labelRes: Int, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    HOME(Routes.HOME, R.string.nav_home, Icons.Filled.Home),
    VENUES(Routes.VENUES, R.string.nav_search, Icons.Filled.Search),
    TEAMS(Routes.TEAMS, R.string.nav_teams, Icons.Filled.Groups),
    BOOKINGS(Routes.MY_BOOKINGS, R.string.nav_bookings, Icons.Filled.CalendarMonth),
    FAVORITES(Routes.FAVORITES, R.string.nav_favorites, Icons.Filled.Favorite),
    MORE(Routes.MORE, R.string.nav_more, Icons.Filled.Menu),
    MANAGER(Routes.MANAGER, R.string.nav_manager, Icons.Filled.Storefront),
    ADMIN(Routes.ADMIN, R.string.nav_admin, Icons.Filled.AdminPanelSettings),
    LOGIN(Routes.LOGIN, R.string.nav_login, Icons.Filled.Login),
    PROFILE(Routes.PROFILE, R.string.nav_profile, Icons.Filled.Person),
}
