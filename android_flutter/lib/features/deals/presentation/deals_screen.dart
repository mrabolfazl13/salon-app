import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class DealsScreen extends ConsumerWidget {
  const DealsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deals = [
      {'id': '1', 'title': 'تخفیف ویژه تابستانه', 'discount': '۳۰٪', 'venue': 'سالن المپیک', 'expiry': '۱۴۰۳/۰۹/۳۱'},
      {'id': '2', 'title': 'پکیج ۱۰ جلسه‌ای', 'discount': '۲۰٪', 'venue': 'باشگاه قهرمان', 'expiry': '۱۴۰۳/۱۲/۲۹'},
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('پیشنهادات ویژه', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildDealCard(context, deals[index]),
                childCount: deals.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDealCard(BuildContext context, Map<String, dynamic> deal) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.amber, AppColors.amberDark]),
        borderRadius: AppRadius.cardBorderRadius,
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        deal['title'],
                        style: AppTypography.h6.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppRadius.chipBorderRadius,
                      ),
                      child: Text(
                        deal['discount'],
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.amberDark,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  deal['venue'],
                  style: AppTypography.bodyMedium.copyWith(color: Colors.white.withOpacity(0.9)),
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 14, color: Colors.white),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'تا ${deal['expiry']}',
                      style: AppTypography.caption.copyWith(color: Colors.white.withOpacity(0.8)),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  text: 'استفاده از تخفیف',
                  onPressed: () {},
                  gradient: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
