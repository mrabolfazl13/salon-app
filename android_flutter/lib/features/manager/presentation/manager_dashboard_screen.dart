import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerDashboardScreen extends ConsumerWidget {
  const ManagerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('داشبورد مدیر', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
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
                      _buildStatCard(context, 'درآمد ماه', '۱۵M ت', Icons.payments, AppColors.success),
                      _buildStatCard(context, 'رزروها', '۴۵', Icons.calendar_today, AppColors.blue),
                      _buildStatCard(context, 'بازیکنان', '۱۲۰', Icons.people, AppColors.amber),
                      _buildStatCard(context, 'رضایت', '۹۵٪', Icons.star, AppColors.info),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  
                  Text('مدیریت سریع', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.md),
                  
                  _buildQuickAction(context, 'قیمت‌گذاری', Icons.price_check, () => context.push('/manager/pricing')),
                  _buildQuickAction(context, 'قراردادها', Icons.description, () => context.push('/manager/contracts')),
                  _buildQuickAction(context, 'تیم‌ها', Icons.groups, () => context.push('/manager/teams')),
                  _buildQuickAction(context, 'مشتریان', Icons.people_alt, () => context.push('/manager/crm')),
                  _buildQuickAction(context, 'چک‌این', Icons.check_circle, () => context.push('/manager/checkin')),
                  _buildQuickAction(context, 'مالی', Icons.account_balance_wallet, () => context.push('/manager/finance')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 28, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: AppTypography.h5.copyWith(fontWeight: FontWeight.w800)),
              Text(title, style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.mediumBorderRadius,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
          borderRadius: AppRadius.mediumBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(color: AppColors.blue.withOpacity(0.1), borderRadius: AppRadius.smallBorderRadius),
              child: Icon(icon, size: 20, color: AppColors.blue),
            ),
            const SizedBox(width: AppSpacing.md),
            Text(label, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
            const Spacer(),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}
