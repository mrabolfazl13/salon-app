import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class ManagerTeamsScreen extends ConsumerWidget {
  const ManagerTeamsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teams = [
      {'id': '1', 'name': 'تیم ستارگان', 'members': 12, 'status': 'فعال'},
      {'id': '2', 'name': 'تیم قهرمانان', 'members': 10, 'status': 'غیرفعال'},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('مدیریت تیم‌ها')),
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
      child: Row(
        children: [
          CircleAvatar(radius: 25, backgroundColor: AppColors.blue.withOpacity(0.1), child: const Icon(Icons.groups, color: AppColors.blue)),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(team['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                Text('${team['members']} عضو', style: AppTypography.caption),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
            decoration: BoxDecoration(
              color: (team['status'] == 'فعال' ? AppColors.success : AppColors.error).withOpacity(0.1),
              borderRadius: AppRadius.chipBorderRadius,
            ),
            child: Text(team['status'], style: AppTypography.caption.copyWith(
              color: team['status'] == 'فعال' ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w600,
            )),
          ),
        ],
      ),
    );
  }
}
