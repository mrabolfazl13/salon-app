import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerFinanceScreen extends ConsumerWidget {
  const ManagerFinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text('کنسول مالی')),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryCard(context),
                  const SizedBox(height: AppSpacing.md),
                  _buildTransactionsCard(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue]),
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('خلاصه مالی', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('درآمد ماه', '۱۵M ت', Colors.white),
              _buildStatItem('هزینه‌ها', '۸M ت', Colors.white.withOpacity(0.8)),
              _buildStatItem('سود خالص', '۷M ت', AppColors.success),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: AppTypography.h5.copyWith(fontWeight: FontWeight.w800, color: color)),
        const SizedBox(height: AppSpacing.xs),
        Text(label, style: AppTypography.caption.copyWith(color: color.withOpacity(0.8))),
      ],
    );
  }

  Widget _buildTransactionsCard(BuildContext context) {
    final transactions = [
      {'title': 'رزرو سالن المپیک', 'amount': 350000, 'date': 'امروز', 'type': 'income'},
      {'title': 'هزینه نگهداری', 'amount': 120000, 'date': 'دیروز', 'type': 'expense'},
    ];

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('تراکنش‌های اخیر', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          ...transactions.map((t) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((t['title'] ?? '').toString(), style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                      Text((t['date'] ?? '').toString(), style: AppTypography.caption),
                    ],
                  ),
                ),
                Text(
                  '${t['type'] == 'income' ? '+' : '-'}${_formatPrice(t['amount'])}',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    color: t['type'] == 'income' ? AppColors.success : AppColors.error,
                  ),
                ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ت';
  }
}
