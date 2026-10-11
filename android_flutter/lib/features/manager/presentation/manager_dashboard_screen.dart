import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';

class ManagerDashboardScreen extends ConsumerStatefulWidget {
  const ManagerDashboardScreen({super.key});

  @override
  ConsumerState<ManagerDashboardScreen> createState() =>
      _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState extends ConsumerState<ManagerDashboardScreen> {
  Map<String, dynamic>? _dashboard;
  List<dynamic> _pendingContracts = [];
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
        ManagerService.getFinanceDashboard(),
        ManagerService.getPendingContracts(),
      ]);
      if (!mounted) return;
      setState(() {
        _dashboard = results[0] as Map<String, dynamic>;
        _pendingContracts = results[1] as List<dynamic>;
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

  String _toman(num? v) => FaFormat.toman(v?.toInt() ?? 0);

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
                        title: Text('داشبورد مدیر',
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
                                  _statCard(context, 'درآمد امروز',
                                      _toman(_dashboard?['today_revenue']),
                                      Icons.payments, AppColors.success),
                                  _statCard(context, 'درآمد ماه',
                                      _toman(_dashboard?['month_revenue']),
                                      Icons.account_balance, AppColors.blue),
                                  _statCard(context, 'رزروهای امروز',
                                      FaFormat.faNum(
                                          (_dashboard?['bookings_today'] as num?)?.toInt() ?? 0),
                                      Icons.calendar_today, AppColors.amber),
                                  _statCard(context, 'مشتریان فعال',
                                      FaFormat.faNum(
                                          (_dashboard?['active_customers'] as num?)?.toInt() ?? 0),
                                      Icons.people, AppColors.info),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.md),
                              GridView.count(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisCount: 2,
                                mainAxisSpacing: AppSpacing.md,
                                crossAxisSpacing: AppSpacing.md,
                                childAspectRatio: 1.3,
                                children: [
                                  _statCard(context, 'قرارداد فعال',
                                      FaFormat.faNum(
                                          (_dashboard?['active_contracts'] as num?)?.toInt() ?? 0),
                                      Icons.description, AppColors.blue),
                                  _statCard(context, 'اشغال امروز',
                                      '${FaFormat.faNum((((_dashboard?['occupancy_today'] as num?) ?? 0) * 100).round())}٪',
                                      Icons.donut_large, AppColors.success),
                                ],
                              ),
                              if (_pendingContracts.isNotEmpty) ...[
                                const SizedBox(height: AppSpacing.lg),
                                InkWell(
                                  onTap: () => context.push('/manager/contracts'),
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
                                        const Icon(Icons.pending_actions,
                                            color: AppColors.warning),
                                        const SizedBox(width: AppSpacing.md),
                                        Expanded(
                                          child: Text(
                                            '${FaFormat.faNum(_pendingContracts.length)} درخواست قرارداد در انتظار تأیید شماست',
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
                              Text('مدیریت سریع',
                                  style: AppTypography.h6
                                      .copyWith(fontWeight: FontWeight.w700)),
                              const SizedBox(height: AppSpacing.md),
                              _quickAction(context, 'قیمت‌گذاری', Icons.price_check,
                                  () => context.push('/manager/pricing')),
                              _quickAction(context, 'قراردادها', Icons.description,
                                  () => context.push('/manager/contracts')),
                              _quickAction(context, 'تیم‌ها', Icons.groups,
                                  () => context.push('/manager/teams')),
                              _quickAction(context, 'مشتریان', Icons.people_alt,
                                  () => context.push('/manager/crm')),
                              _quickAction(context, 'چک‌این', Icons.check_circle,
                                  () => context.push('/manager/checkin')),
                              _quickAction(context, 'کنسول مالی',
                                  Icons.account_balance_wallet,
                                  () => context.push('/manager/finance')),
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
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.h6.copyWith(fontWeight: FontWeight.w800)),
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
