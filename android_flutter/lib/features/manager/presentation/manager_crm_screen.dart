import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerCrmScreen extends ConsumerWidget {
  const ManagerCrmScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customers = [
      {'id': '1', 'name': 'علی احمدی', 'phone': '۰۹۱۲۳۴۵۶۷۸۹', 'bookings': 15},
      {'id': '2', 'name': 'محمد رضایی', 'phone': '۰۹۱۹۸۷۶۵۴۳۲', 'bookings': 8},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('مدیریت مشتریان')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: customers.length,
        itemBuilder: (context, index) => _buildCustomerCard(context, customers[index]),
      ),
    );
  }

  Widget _buildCustomerCard(BuildContext context, Map<String, dynamic> customer) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          CircleAvatar(radius: 25, backgroundColor: AppColors.blue.withOpacity(0.1), child: const Icon(Icons.person, color: AppColors.blue)),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(customer['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                Text(customer['phone'], style: AppTypography.caption),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${customer['bookings']} رزرو', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.blue)),
            ],
          ),
        ],
      ),
    );
  }
}
