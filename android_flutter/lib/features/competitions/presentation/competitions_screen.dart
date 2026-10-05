import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class CompetitionsScreen extends ConsumerWidget {
  const CompetitionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock data
    final competitions = [
      {
        'id': '1',
        'name': 'جام فوتسال تابستانه',
        'venue': 'سالن المپیک',
        'date': '۱۴۰۳/۰۹/۰۱',
        'teams': 16,
        'status': 'ثبت‌نام باز',
        'prize': '۵,۰۰۰,۰۰۰ تومان',
      },
      {
        'id': '2',
        'name': 'لیگ برتر فوتسال',
        'venue': 'مجموعه آزادی',
        'date': '۱۴۰۳/۱۰/۱۵',
        'teams': 12,
        'status': 'در حال برگزاری',
        'prize': '۱۰,۰۰۰,۰۰۰ تومان',
      },
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text(
              'رقابت‌ها',
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () {},
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final comp = competitions[index];
                  return _buildCompetitionCard(context, comp);
                },
                childCount: competitions.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompetitionCard(BuildContext context, Map<String, dynamic> comp) {
    final isActive = comp['status'] == 'در حال برگزاری';
    
    return InkWell(
      onTap: () {},
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkSurface
              : Colors.white,
          borderRadius: AppRadius.cardBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    comp['name'],
                    style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: (isActive ? AppColors.success : AppColors.blue).withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text(
                    comp['status'],
                    style: AppTypography.caption.copyWith(
                      color: isActive ? AppColors.success : AppColors.blue,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            _buildInfoRow(Icons.location_on, comp['venue']),
            _buildInfoRow(Icons.calendar_today, comp['date']),
            _buildInfoRow(Icons.groups, '${comp['teams']} تیم'),
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'جایزه: ${comp['prize']}',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.amber,
                  ),
                ),
                if (!isActive)
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.sm,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: AppRadius.buttonBorderRadius,
                      ),
                    ),
                    child: const Text('ثبت‌نام'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.blue),
          const SizedBox(width: AppSpacing.xs),
          Text(text, style: AppTypography.bodyMedium),
        ],
      ),
    );
  }
}
