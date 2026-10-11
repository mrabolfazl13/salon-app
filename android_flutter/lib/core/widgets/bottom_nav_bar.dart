import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme/app_typography.dart';
import '../state/auth_provider.dart';

class _NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String href;

  const _NavItem(this.label, {required this.icon, required this.activeIcon, required this.href});
}

/// هم‌تراز با BottomNavigation.tsx نسخه Tauri — آیتم‌ها بر اساس نقش کاربر
List<_NavItem> _itemsForRole(String? role) {
  const home = _NavItem('خانه', icon: Icons.home_outlined, activeIcon: Icons.home, href: '/');
  const search = _NavItem('جستجو', icon: Icons.search_outlined, activeIcon: Icons.search, href: '/search');
  const bookings = _NavItem('رزروها', icon: Icons.calendar_today_outlined, activeIcon: Icons.calendar_today, href: '/bookings');
  const teams = _NavItem('تیم‌ها', icon: Icons.groups_outlined, activeIcon: Icons.groups, href: '/teams');
  const competitions = _NavItem('رقابت‌ها', icon: Icons.emoji_events_outlined, activeIcon: Icons.emoji_events, href: '/competitions');
  const favorites = _NavItem('علاقه‌مندی', icon: Icons.favorite_border, activeIcon: Icons.favorite, href: '/favorites');
  const profile = _NavItem('پروفایل', icon: Icons.person_outline, activeIcon: Icons.person, href: '/profile');
  const managerDashboard = _NavItem('داشبورد', icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, href: '/manager');
  const adminDashboard = _NavItem('داشبورد', icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, href: '/admin');
  const users = _NavItem('کاربران', icon: Icons.people_alt_outlined, activeIcon: Icons.people_alt, href: '/admin/users');
  const finance = _NavItem('امور مالی', icon: Icons.payments_outlined, activeIcon: Icons.payments, href: '/manager/finance');

  if (role == null) return [home, search, favorites, profile];

  switch (role) {
    case 'super_admin':
      return [home, adminDashboard, competitions, users, profile];
    case 'venue_manager':
    case 'club_admin':
      return [home, managerDashboard, competitions, finance, profile];
    default:
      return [home, search, teams, bookings, profile];
  }
}

class AppBottomNavBar extends ConsumerWidget {
  const AppBottomNavBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;
    final items = _itemsForRole(user?.role);

    String location = '/';
    try {
      location = GoRouterState.of(context).uri.toString();
    } catch (_) {}

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
    final inactiveColor = isDark ? const Color(0xFF8B98AB) : const Color(0xFF64748B);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xF20B1220) : const Color(0xF0FFFFFF),
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: [
              for (final item in items)
                Expanded(
                  child: _NavItemWidget(
                    item: item,
                    active: _isActive(location, item.href),
                    activeColor: activeColor,
                    inactiveColor: inactiveColor,
                    isDark: isDark,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  bool _isActive(String location, String href) {
    if (href == '/') return location == '/';
    return location == href || location.startsWith('$href/');
  }
}

class _NavItemWidget extends StatelessWidget {
  final _NavItem item;
  final bool active;
  final Color activeColor;
  final Color inactiveColor;
  final bool isDark;

  const _NavItemWidget({
    required this.item,
    required this.active,
    required this.activeColor,
    required this.inactiveColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final color = active ? activeColor : inactiveColor;

    return InkWell(
      onTap: () => context.go(item.href),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 46,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              gradient: active
                  ? LinearGradient(
                      colors: isDark
                          ? [const Color(0x2EFBBF24), const Color(0x2EF97316)]
                          : [const Color(0x29F59E0B), const Color(0x29F97316)],
                    )
                  : null,
            ),
            child: Icon(active ? item.activeIcon : item.icon, size: 22, color: color),
          ),
          const SizedBox(height: 3),
          Text(
            item.label,
            style: AppTypography.caption.copyWith(
              fontSize: 12,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
              color: color,
            ),
            maxLines: 1,
          ),
        ],
      ),
    );
  }
}
