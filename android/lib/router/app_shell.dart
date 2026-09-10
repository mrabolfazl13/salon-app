import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/utils/formatters.dart';
import '../features/notifications/providers/notifications_provider.dart';

/// App shell: content + Material 3 NavigationBar on phones, and the
/// notification bell as a persistent coverlay. Dashboard/admin routes hide
/// the bottom bar (mirrors the original hidden-prefixes list).
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final hideNav = _hideBottomNav(location);
    return Scaffold(
      body: Column(
        children: [
          Expanded(child: widget.child),
        ],
      ),
      bottomNavigationBar: hideNav
          ? null
          : NavigationBar(
              selectedIndex: _selectedIndex(location),
              onDestinationSelected: _onDestinationSelected,
              destinations: [
                _navItem(Icons.home_outlined, Icons.home_rounded, 'خانه'),
                _navItem(Icons.search_outlined, Icons.search_rounded, 'جستجو'),
                _navItem(
                  Icons.event_available_outlined,
                  Icons.event_available_rounded,
                  'رزروها',
                ),
                _navItem(
                  Icons.favorite_border_rounded,
                  Icons.favorite_rounded,
                  'علاقه‌مندی',
                ),
                _navItem(
                  Icons.person_outline_rounded,
                  Icons.person_rounded,
                  'پروفایل',
                ),
              ],
            ),
    );
  }

  bool _hideBottomNav(String location) {
    const hiddenPrefixes = [
      '/login',
      '/register',
      '/forgot-password',
      '/verify',
      '/dashboard',
      '/manager-dashboard',
      '/admin',
      '/join',
      '/games/new',
    ];
    if (hiddenPrefixes.any((p) => location.startsWith(p))) return true;
    // booking detail: /bookings/<id>
    final segments = location.split('/').where((s) => s.isNotEmpty).toList();
    if (segments.length == 2 && segments[0] == 'bookings') {
      return int.tryParse(segments[1]) != null;
    }
    return false;
  }

  int _selectedIndex(String location) {
    if (location.startsWith('/search')) return 1;
    if (location.startsWith('/bookings')) return 2;
    if (location.startsWith('/favorites')) return 3;
    if (location.startsWith('/profile') ||
        location.startsWith('/notifications') ||
        location.startsWith('/competitions')) {
      return 4;
    }
    return 0;
  }

  void _onDestinationSelected(int index) {
    switch (index) {
      case 0:
        context.go('/');
      case 1:
        context.go('/search');
      case 2:
        context.go('/bookings');
      case 3:
        context.go('/favorites');
      case 4:
        context.go('/profile');
    }
  }
}

NavigationDestination _navItem(
  IconData outline,
  IconData filled,
  String label,
) =>
    NavigationDestination(
      icon: Icon(outline, size: 24),
      selectedIcon: Icon(filled, size: 24),
      label: label,
    );

/// Small top app bar used inside pages (title + optional bell).
class AppPageBar extends ConsumerWidget implements PreferredSizeWidget {
  const AppPageBar({
    super.key,
    required this.title,
    this.showBell = true,
    this.actions = const [],
    this.bottom,
  });

  final String title;
  final bool showBell;
  final List<Widget> actions;
  final PreferredSizeWidget? bottom;

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(
      notificationsProvider.select((s) => s.unreadCount),
    );
    return AppBar(
      title: Text(title),
      actions: [
        ...actions,
        if (showBell)
          _BellButton(unreadCount: unread),
        const SizedBox(width: 6),
      ],
      bottom: bottom,
    );
  }
}

class _BellButton extends ConsumerWidget {
  const _BellButton({required this.unreadCount});

  final int unreadCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      onPressed: () => context.push('/notifications'),
      icon: Badge(
        isLabelVisible: unreadCount > 0,
        label: Text(formatFaNumber(unreadCount)),
        child: const Icon(Icons.notifications_none_rounded, size: 25),
      ),
      tooltip: 'اعلان‌ها',
    );
  }
}
