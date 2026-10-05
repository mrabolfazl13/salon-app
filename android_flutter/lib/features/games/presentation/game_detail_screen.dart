import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class GameDetailScreen extends ConsumerWidget {
  final String gameId;

  const GameDetailScreen({super.key, required this.gameId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 150,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                ),
                child: const Center(
                  child: Icon(Icons.sports_soccer, size: 48, color: Colors.white),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('بازی دوستانه', style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.xl),
                  
                  _buildInfoCard(context, 'اطلاعات بازی', [
                    ['تاریخ', 'امروز ۱۸:۰۰'],
                    ['مکان', 'سالن المپیک'],
                    ['سطح', 'متوسط'],
                    ['بازیکنان', '۸/۱۰ نفر'],
                  ]),
                  const SizedBox(height: AppSpacing.md),
                  
                  _buildInfoCard(context, 'سازنده', [
                    ['نام', 'علی احمدی'],
                    ['تلفن', '۰۹۱۲۳۴۵۶۷۸۹'],
                  ]),
                  const SizedBox(height: AppSpacing.xl),
                  
                  AppButton(text: 'درخواست پیوستن', onPressed: () {}, gradient: true),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String title, List<List<String>> items) {
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
