import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class TeamDiscoverScreen extends ConsumerWidget {
  const TeamDiscoverScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teams = [
      {'id': '1', 'name': 'تیم البرز', 'members': 8, 'level': 'حرفه‌ای', 'location': 'تهران'},
      {'id': '2', 'name': 'تیم پارس', 'members': 10, 'level': 'متوسط', 'location': 'اصفهان'},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('یافتن تیم')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: teams.length,
        itemBuilder: (context, index) => _buildTeamCard(context, teams[index]),
      ),
    );
  }

  Widget _buildTeamCard(BuildContext context, Map<String, dynamic> team) {
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
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                  borderRadius: AppRadius.imageBorderRadius,
                ),
                child: const Icon(Icons.groups, color: Colors.white),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(team['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                    Text('${team['members']} عضو • ${team['level']}', style: AppTypography.caption),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              const Icon(Icons.location_on, size: 14, color: AppColors.amber),
              const SizedBox(width: AppSpacing.xs),
              Text(team['location'], style: AppTypography.caption),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(text: 'درخواست عضویت', onPressed: () {}, outlined: true),
        ],
      ),
    );
  }
}
