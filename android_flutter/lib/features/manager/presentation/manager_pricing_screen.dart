import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerPricingScreen extends ConsumerStatefulWidget {
  const ManagerPricingScreen({super.key});

  @override
  ConsumerState<ManagerPricingScreen> createState() => _ManagerPricingScreenState();
}

class _ManagerPricingScreenState extends ConsumerState<ManagerPricingScreen> {
  final List<Map<String, dynamic>> _pricingRules = [
    {'id': '1', 'name': 'تعرفه عادی', 'price': 250000, 'time': '۸:۰۰ - ۱۶:۰۰'},
    {'id': '2', 'name': 'تعرفه اوج', 'price': 350000, 'time': '۱۶:۰۰ - ۲۲:۰۰'},
    {'id': '3', 'name': 'تعطیلات', 'price': 400000, 'time': 'تمام روز'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('مدیریت قیمت‌گذاری')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: _pricingRules.length,
        itemBuilder: (context, index) => _buildPricingCard(context, _pricingRules[index]),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: const Text('قاعده جدید'),
        backgroundColor: AppColors.blue,
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context, Map<String, dynamic> rule) {
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
              Expanded(child: Text(rule['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700))),
              PopupMenuButton<String>(
                onSelected: (value) {},
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'edit', child: Text('ویرایش')),
                  const PopupMenuItem(value: 'delete', child: Text('حذف')),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: AppColors.amber),
              const SizedBox(width: AppSpacing.xs),
              Text(rule['time'], style: AppTypography.bodyMedium),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('${_formatPrice(rule['price'])}', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700, color: AppColors.success)),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} تومان';
  }
}
