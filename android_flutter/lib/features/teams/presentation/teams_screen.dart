import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class TeamsScreen extends ConsumerWidget {
  const TeamsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teams = [
      {'id': '1', 'name': 'تیم ستارگان', 'members': 12, 'wins': 8, 'losses': 2},
      {'id': '2', 'name': 'تیم قهرمانان', 'members': 10, 'wins': 6, 'losses': 4},
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('تیم‌های من', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
            actions: [
              IconButton(icon: const Icon(Icons.search), onPressed: () => context.push('/teams/discover')),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildTeamCard(context, teams[index]),
                childCount: teams.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamCard(BuildContext context, Map<String, dynamic> team) {
    return InkWell(
      onTap: () => context.push('/teams/${team['id']}'),
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
          borderRadius: AppRadius.cardBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                borderRadius: AppRadius.imageBorderRadius,
              ),
              child: const Icon(Icons.groups, color: Colors.white, size: 28),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(team['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      Text('${team['members']} عضو', style: AppTypography.caption),
                      const SizedBox(width: AppSpacing.sm),
                      const Icon(Icons.emoji_events, size: 14, color: AppColors.amber),
                      const SizedBox(width: AppSpacing.xs),
                      Text('${team['wins']} برد', style: AppTypography.caption),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}
