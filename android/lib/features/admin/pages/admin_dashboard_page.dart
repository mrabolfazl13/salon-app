import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/skeletons.dart';
import '../../admin/domain/admin.dart';
import '../providers/admin_provider.dart';

class AdminDashboardPage extends ConsumerWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('پنل ادمین')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          _AdminCard(
            icon: Icons.people_outline_rounded,
            title: 'مدیریت کاربران',
            subtitle: 'تایید مدیران، بررسی کاربران',
            onTap: () => context.push('/admin/users'),
          ),
          const SizedBox(height: AppSpacing.md),
          _AdminCard(
            icon: Icons.stadium_outlined,
            title: 'مدیریت سالن‌ها',
            subtitle: 'تایید سالن‌های در انتظار',
            onTap: () => context.push('/admin/venues'),
          ),
          const SizedBox(height: AppSpacing.xl),
          const _StatsSection(),
        ],
      ),
    );
  }
}

class _AdminCard extends StatelessWidget {
  const _AdminCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.image),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      tileColor: Theme.of(context).cardTheme.color,
      leading: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.tile),
          color: AppColors.primary.withValues(alpha: 0.1),
        ),
        child: Icon(icon, color: AppColors.primary),
      ),
      title: Text(title, style: Theme.of(context).textTheme.titleSmall),
      subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
      trailing: const Icon(Icons.chevron_left),
    );
  }
}

class _StatsSection extends ConsumerStatefulWidget {
  const _StatsSection();

  @override
  ConsumerState<_StatsSection> createState() => _StatsSectionState();
}

class _StatsSectionState extends ConsumerState<_StatsSection> {
  UserStats? _userStats;
  VenueStats? _venueStats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final userStats = await ref.read(adminServiceProvider).getUserStats();
      final venueStats = await ref.read(adminServiceProvider).getVenueStats();
      if (!mounted) return;
      setState(() {
        _userStats = userStats;
        _venueStats = venueStats;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const ListTileSkeleton(count: 2, height: 80);
    }
    final user = _userStats;
    final venue = _venueStats;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('آمار کلی', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            _stat(formatFaNumber(user?.totalUsers ?? 0), 'کاربر'),
            const SizedBox(width: AppSpacing.md),
            _stat(formatFaNumber(user?.verifiedUsers ?? 0), 'تاییدشده'),
            const SizedBox(width: AppSpacing.md),
            _stat(formatFaNumber(venue?.totalVenues ?? 0), 'سالن'),
            const SizedBox(width: AppSpacing.md),
            _stat(formatFaNumber(venue?.pendingVenues ?? 0), 'در انتظار'),
          ],
        ),
      ],
    );
  }

  Widget _stat(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Text(value, style: Theme.of(context).textTheme.titleMedium),
            Text(label, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}
