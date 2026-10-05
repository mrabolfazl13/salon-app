import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ContractsScreen extends ConsumerWidget {
  const ContractsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contracts = [
      {'id': '1', 'title': 'قرارداد سالن المپیک', 'date': '۱۴۰۳/۰۸/۰۱', 'status': 'فعال'},
      {'id': '2', 'title': 'قرارداد باشگاه قهرمان', 'date': '۱۴۰۳/۰۷/۱۵', 'status': 'منقضی'},
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('قراردادها', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildContractCard(context, contracts[index]),
                childCount: contracts.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContractCard(BuildContext context, Map<String, dynamic> contract) {
    return InkWell(
      onTap: () => context.push('/contracts/${contract['id']}'),
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
          borderRadius: AppRadius.cardBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(contract['title'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: (contract['status'] == 'فعال' ? AppColors.success : AppColors.warning).withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text(
                    contract['status'],
                    style: AppTypography.caption.copyWith(
                      color: contract['status'] == 'فعال' ? AppColors.success : AppColors.warning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: AppColors.blue),
                const SizedBox(width: AppSpacing.xs),
                Text(contract['date'], style: AppTypography.caption),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
