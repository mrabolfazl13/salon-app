import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/admin/pages/admin_dashboard_page.dart';
import '../../features/admin/pages/admin_users_page.dart';
import '../../features/admin/pages/admin_venues_page.dart';
import '../../features/auth/pages/forgot_password_page.dart';
import '../../features/auth/pages/login_page.dart';
import '../../features/auth/pages/register_page.dart';
import '../../features/auth/pages/verify_email_page.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/bookings/pages/booking_detail_page.dart';
import '../../features/bookings/pages/bookings_page.dart';
import '../../features/competitions/pages/competitions_page.dart';
import '../../features/contracts/pages/contract_detail_page.dart';
import '../../features/contracts/pages/contracts_page.dart';
import '../../features/dashboard/pages/dashboard_page.dart';
import '../../features/dashboard/pages/manager_dashboard_page.dart';
import '../../features/favorites/pages/favorites_page.dart';
import '../../features/games/pages/game_create_page.dart';
import '../../features/games/pages/game_detail_page.dart';
import '../../features/games/pages/games_page.dart';
import '../../features/games/pages/join_by_token_page.dart';
import '../../features/home/pages/home_page.dart';
import '../../features/notifications/pages/notifications_page.dart';
import '../../features/profile/pages/profile_page.dart';
import '../../features/search/pages/search_page.dart';
import '../../features/venues/pages/venue_detail_page.dart';
import '../../features/venues/pages/venues_page.dart';
import 'app_shell.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

String? _guard(GoRouterState state, AuthState auth) {
  final path = state.matchedLocation;
  final publicPaths = {
    '/',
    '/search',
    '/venues',
    '/venues/:id',
    '/games',
    '/games/:id',
    '/join/:token',
    '/login',
    '/register',
    '/forgot-password',
    '/verify',
  };
  final isPublic = publicPaths.any(
    (p) => path == p || path.startsWith('$p/'),
  );

  if (auth.phase == AuthPhase.loading) return null;

  if (!auth.isAuthenticated && !isPublic) {
    return '/login?from=${Uri.encodeComponent(path)}';
  }
  if (auth.isAuthenticated && (path == '/login' || path == '/register')) {
    return auth.isManager ? '/manager-dashboard' : '/venues';
  }
  return null;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  final router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    debugLogDiagnostics: false,
    refreshListenable: _AuthRefreshListenable(ref),
    redirect: (context, state) => _guard(state, auth),
    errorBuilder: (context, state) => const _NotFoundPage(),
    routes: [
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'home',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => const SearchPage(),
          ),
          GoRoute(
            path: '/venues',
            builder: (context, state) {
              final category = state.uri.queryParameters['category'];
              final search = state.uri.queryParameters['search'];
              return VenuesPage(
                initialCategory: category,
                initialSearch: search,
              );
            },
          ),
          GoRoute(
            path: '/venues/:id',
            builder: (context, state) => VenueDetailPage(
              id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/bookings',
            builder: (context, state) => const BookingsPage(),
          ),
          GoRoute(
            path: '/bookings/:id',
            parentNavigatorKey: _shellNavigatorKey,
            builder: (context, state) => BookingDetailPage(
              id: state.pathParameters['id'] ?? '',
            ),
          ),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesPage(),
          ),
          GoRoute(
            path: '/contracts',
            builder: (context, state) => const ContractsPage(),
          ),
          GoRoute(
            path: '/contracts/:id',
            builder: (context, state) => ContractDetailPage(
              id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/competitions',
            builder: (context, state) => const CompetitionsPage(),
          ),
          GoRoute(
            path: '/games',
            builder: (context, state) => const GamesPage(),
          ),
          GoRoute(
            path: '/games/:id',
            builder: (context, state) => GameDetailPage(
              id: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            ),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsPage(),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: '/manager-dashboard',
            builder: (context, state) => const ManagerDashboardPage(),
          ),
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminDashboardPage(),
          ),
          GoRoute(
            path: '/admin/users',
            builder: (context, state) => const AdminUsersPage(),
          ),
          GoRoute(
            path: '/admin/venues',
            builder: (context, state) => const AdminVenuesPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginPage(
          from: state.uri.queryParameters['from'],
        ),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/verify',
        builder: (context, state) => VerifyEmailPage(
          initialPhone: state.uri.queryParameters['phone'],
        ),
      ),
      GoRoute(
        path: '/games/new',
        builder: (context, state) => const GameCreatePage(),
      ),
      GoRoute(
        path: '/join/:token',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => JoinByTokenPage(
          token: state.pathParameters['token'] ?? '',
        ),
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen(authProvider, (_, _) {
      notifyListeners();
    });
  }
}

class _NotFoundPage extends StatelessWidget {
  const _NotFoundPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          '۴۰۴ — صفحه یافت نشد',
          style: Theme.of(context).textTheme.titleLarge,
        ),
      ),
    );
  }
}
