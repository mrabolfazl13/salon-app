import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/admin_service.dart';
import '../../../core/utils/fa_format.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  Map<String, dynamic>? _userStats;
  Map<String, dynamic>? _venueStats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        AdminService.getUserStats(),
        AdminService.getVenueStats(),
      ]);
      if (!mounted) return;
      setState(() {
        _userStats = results[0] as Map<String, dynamic>;
        _venueStats = results[1] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(
                            onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: CustomScrollView(
                    slivers: [
                      SliverAppBar(
                        floating: true,
                        pinned: true,
                        title: Text('داشبورد ادمین',
                            style: AppTypography.h6
                                .copyWith(fontWeight: FontWeight.w700)),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              GridView.count(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisCount: 2,
                                mainAxisSpacing: AppSpacing.md,
                                crossAxisSpacing: AppSpacing.md,
                                childAspectRatio: 1.3,
                                children: [
                                  _statCard(context, 'کل کاربران',
                                      FaFormat.faNum(
                                          (_userStats?['total_users'] as num?)?.toInt() ?? 0),
                                      Icons.people, AppColors.blue),
                                  _statCard(context, 'کاربران فعال',
                                      FaFormat.faNum(
                                          (_userStats?['active_users'] as num?)?.toInt() ?? 0),
                                      Icons.person, AppColors.success),
                                  _statCard(context, 'کل سالن‌ها',
                                      FaFormat.faNum(
                                          (_venueStats?['total_venues'] as num?)?.toInt() ?? 0),
                                      Icons.store, AppColors.amber),
                                  _statCard(context, 'سالن تأییدشده',
                                      FaFormat.faNum(
                                          (_venueStats?['verified_venues'] as num?)?.toInt() ?? 0),
                                      Icons.verified, AppColors.info),
                                ],
                              ),
                              if (((_venueStats?['pending_venues'] as num?)?.toInt() ?? 0) >
                                  0) ...[
                                const SizedBox(height: AppSpacing.md),
                                InkWell(
                                  onTap: () => context.push('/admin/venues'),
                                  borderRadius: AppRadius.cardBorderRadius,
                                  child: Container(
                                    padding: const EdgeInsets.all(AppSpacing.md),
                                    decoration: BoxDecoration(
                                      color: AppColors.warning.withOpacity(0.1),
                                      borderRadius: AppRadius.cardBorderRadius,
                                      border: Border.all(
                                          color: AppColors.warning.withOpacity(0.4)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.pending_outlined,
                                            color: AppColors.warning),
                                        const SizedBox(width: AppSpacing.md),
                                        Expanded(
                                          child: Text(
                                            '${FaFormat.faNum((_venueStats?['pending_venues'] as num?)?.toInt() ?? 0)} سالن در انتظار تأیید است',
                                            style: AppTypography.bodyMedium.copyWith(
                                                color: AppColors.warning,
                                                fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                        const Icon(Icons.chevron_left,
                                            color: AppColors.warning),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                              const SizedBox(height: AppSpacing.xl),
                              Text('مدیریت سیستم',
                                  style: AppTypography.h6
                                      .copyWith(fontWeight: FontWeight.w700)),
                              const SizedBox(height: AppSpacing.md),
                              _quickAction(context, 'مدیریت کاربران', Icons.people_alt,
                                  () => context.push('/admin/users')),
                              _quickAction(context, 'سالن‌های در انتظار تأیید',
                                  Icons.store_mall_directory,
                                  () => context.push('/admin/venues')),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _statCard(BuildContext context, String title, String value,
      IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 26, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: AppTypography.h5.copyWith(fontWeight: FontWeight.w800)),
              Text(title, style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }

  Widget _quickAction(
      BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.mediumBorderRadius,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkSurface
              : Colors.white,
          borderRadius: AppRadius.mediumBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                  color: AppColors.blue.withOpacity(0.1),
                  borderRadius: AppRadius.smallBorderRadius),
              child: Icon(icon, size: 20, color: AppColors.blue),
            ),
            const SizedBox(width: AppSpacing.md),
            Text(label,
                style:
                    AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
            const Spacer(),
            const Icon(Icons.chevron_left),
          ],
        ),
      ),
    );
  }
}
