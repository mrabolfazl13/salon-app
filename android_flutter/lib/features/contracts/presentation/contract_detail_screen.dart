import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ContractDetailScreen extends ConsumerWidget {
  final String contractId;

  const ContractDetailScreen({super.key, required this.contractId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text('جزئیات قرارداد')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('قرارداد #$contractId', style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: AppSpacing.xl),
            _buildDetailCard(context, 'اطلاعات کلی', [
              ['عنوان', 'قرارداد سالن المپیک'],
              ['تاریخ شروع', '۱۴۰۳/۰۸/۰۱'],
              ['تاریخ پایان', '۱۴۰۴/۰۸/۰۱'],
              ['وضعیت', 'فعال'],
            ]),
            const SizedBox(height: AppSpacing.md),
            _buildDetailCard(context, 'شرایط مالی', [
              ['مبلغ کل', '۱۲,۰۰۰,۰۰۰ تومان'],
              ['پرداختی', '۶,۰۰۰,۰۰۰ تومان'],
              ['باقیمانده', '۶,۰۰۰,۰۰۰ تومان'],
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(BuildContext context, String title, List<List<String>> items) {
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
          Text(title, style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(item[0], style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                Text(item[1], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }
}
