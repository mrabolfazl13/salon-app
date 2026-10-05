import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class GamesExploreScreen extends ConsumerWidget {
  const GamesExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final games = [
      {'id': '1', 'title': 'بازی دوستانه', 'date': 'امروز ۱۸:۰۰', 'venue': 'سالن المپیک', 'players': '۸/۱۰', 'level': 'متوسط'},
      {'id': '2', 'title': 'مسابقه تیمی', 'date': 'فردا ۲۰:۰۰', 'venue': 'باشگاه قهرمان', 'players': '۶/۱۲', 'level': 'حرفه‌ای'},
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('بازی‌ها', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => context.push('/games/create'),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildGameCard(context, games[index]),
                childCount: games.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGameCard(BuildContext context, Map<String, dynamic> game) {
    return InkWell(
      onTap: () => context.push('/games/${game['id']}'),
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
                Expanded(child: Text(game['title'], style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: AppColors.blue.withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text(
                    game['level'],
                    style: AppTypography.caption.copyWith(color: AppColors.blue, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            _buildInfoRow(Icons.calendar_today, game['date']),
            _buildInfoRow(Icons.location_on, game['venue']),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(Icons.people, size: 16, color: AppColors.blue),
                const SizedBox(width: AppSpacing.xs),
                Text(game['players'], style: AppTypography.bodyMedium),
                const Spacer(),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorderRadius),
                  ),
                  child: const Text('پیوستن'),
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
          Icon(icon, size: 16, color: AppColors.amber),
          const SizedBox(width: AppSpacing.xs),
          Text(text, style: AppTypography.bodyMedium),
        ],
      ),
    );
  }
}
