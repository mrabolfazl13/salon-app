import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Auth screens
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/verify_email_screen.dart';

// Main screens
import '../../features/home/presentation/home_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/favorites/presentation/favorites_screen.dart';
import '../../features/venues/presentation/venues_screen.dart';
import '../../features/venues/presentation/venue_detail_screen.dart';
import '../../features/bookings/presentation/bookings_screen.dart';
import '../../features/bookings/presentation/booking_detail_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';

// Feature screens
import '../../features/competitions/presentation/competitions_screen.dart';
import '../../features/contracts/presentation/contracts_screen.dart';
import '../../features/contracts/presentation/contract_detail_screen.dart';
import '../../features/deals/presentation/deals_screen.dart';
import '../../features/games/presentation/games_explore_screen.dart';
import '../../features/games/presentation/game_detail_screen.dart';
import '../../features/games/presentation/game_create_screen.dart';
import '../../features/teams/presentation/teams_screen.dart';
import '../../features/teams/presentation/team_discover_screen.dart';
import '../../features/teams/presentation/team_detail_screen.dart';
import '../../features/quiz/presentation/quiz_screen.dart';
import '../../features/waitlist/presentation/waitlist_screen.dart';

// Manager screens
import '../../features/manager/presentation/manager_dashboard_screen.dart';
import '../../features/manager/presentation/manager_pricing_screen.dart';
import '../../features/manager/presentation/manager_contracts_screen.dart';
import '../../features/manager/presentation/manager_teams_screen.dart';
import '../../features/manager/presentation/manager_crm_screen.dart';
import '../../features/manager/presentation/manager_checkin_screen.dart';
import '../../features/manager/presentation/manager_finance_screen.dart';

// Admin screens
import '../../features/admin/presentation/admin_dashboard_screen.dart';
import '../../features/admin/presentation/admin_users_screen.dart';
import '../../features/admin/presentation/admin_venues_screen.dart';

// Storage for route guards
import '../../core/storage/token_storage.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) async {
      final isAuthenticated = await TokenStorage.isAuthenticated();
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/verify';

      // If trying to access protected route without auth, redirect to login
      if (!isAuthenticated && !isAuthRoute && state.matchedLocation != '/') {
        return '/login';
      }

      // If authenticated and trying to access auth routes, redirect to dashboard
      if (isAuthenticated && isAuthRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      // Public routes
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),

      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/verify',
        builder: (context, state) => const VerifyEmailScreen(),
      ),

      // Search & Discovery
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const FavoritesScreen(),
      ),

      // Venues
      GoRoute(
        path: '/venues',
        builder: (context, state) => const VenuesScreen(),
      ),
      GoRoute(
        path: '/venues/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return VenueDetailScreen(venueId: id);
        },
      ),

      // Bookings (protected by redirect)
      GoRoute(
        path: '/bookings',
        builder: (context, state) => const BookingsScreen(),
      ),

      // Profile & Dashboard (protected by redirect)
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),

      // Booking detail
      GoRoute(
        path: '/bookings/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return BookingDetailScreen(bookingId: id);
        },
      ),

      // Competitions
      GoRoute(
        path: '/competitions',
        builder: (context, state) => const CompetitionsScreen(),
      ),

      // Contracts
      GoRoute(
        path: '/contracts',
        builder: (context, state) => const ContractsScreen(),
      ),
      GoRoute(
        path: '/contracts/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ContractDetailScreen(contractId: id);
        },
      ),

      // Deals
      GoRoute(
        path: '/deals',
        builder: (context, state) => const DealsScreen(),
      ),

      // Games
      GoRoute(
        path: '/games',
        builder: (context, state) => const GamesExploreScreen(),
      ),
      GoRoute(
        path: '/games/create',
        builder: (context, state) => const GameCreateScreen(),
      ),
      GoRoute(
        path: '/games/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return GameDetailScreen(gameId: id);
        },
      ),

      // Teams
      GoRoute(
        path: '/teams',
        builder: (context, state) => const TeamsScreen(),
      ),
      GoRoute(
        path: '/teams/discover',
        builder: (context, state) => const TeamDiscoverScreen(),
      ),
      GoRoute(
        path: '/teams/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return TeamDetailScreen(teamId: id);
        },
      ),

      // Quiz
      GoRoute(
        path: '/quiz',
        builder: (context, state) => const QuizScreen(),
      ),

      // Manager routes
      GoRoute(
        path: '/manager',
        builder: (context, state) => const ManagerDashboardScreen(),
      ),
      GoRoute(
        path: '/manager/pricing',
        builder: (context, state) => const ManagerPricingScreen(),
      ),
      GoRoute(
        path: '/manager/contracts',
        builder: (context, state) => const ManagerContractsScreen(),
      ),
      GoRoute(
        path: '/manager/teams',
        builder: (context, state) => const ManagerTeamsScreen(),
      ),
      GoRoute(
        path: '/manager/crm',
        builder: (context, state) => const ManagerCrmScreen(),
      ),
      GoRoute(
        path: '/manager/checkin',
        builder: (context, state) => const ManagerCheckinScreen(),
      ),
      GoRoute(
        path: '/manager/finance',
        builder: (context, state) => const ManagerFinanceScreen(),
      ),

      // Admin routes
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/venues',
        builder: (context, state) => const AdminVenuesScreen(),
      ),
      GoRoute(
        path: '/waitlist',
        builder: (context, state) => const WaitlistScreen(),
      ),
    ],
  );
});
