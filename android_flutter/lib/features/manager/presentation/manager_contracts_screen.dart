import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerContractsScreen extends ConsumerWidget {
  const ManagerContractsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contracts = [
      {'id': '1', 'title': 'قرارداد سالن المپیک', 'status': 'فعال', 'amount': 12000000},
      {'id': '2', 'title': 'قرارداد باشگاه قهرمان', 'status': 'در انتظار', 'amount': 8000000},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('مدیریت قراردادها')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: contracts.length,
        itemBuilder: (context, index) => _buildContractCard(context, contracts[index]),
      ),
    );
  }

  Widget _buildContractCard(BuildContext context, Map<String, dynamic> contract) {
    return Container(
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
          const SizedBox(height: AppSpacing.sm),
          Text('${_formatPrice(contract['amount'])}', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700, color: AppColors.blue)),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} تومان';
  }
}
