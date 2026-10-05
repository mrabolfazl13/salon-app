import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = [
      {'id': '1', 'name': 'علی احمدی', 'phone': '۰۹۱۲۳۴۵۶۷۸۹', 'role': 'کاربر', 'status': 'فعال'},
      {'id': '2', 'name': 'محمد رضایی', 'phone': '۰۹۱۹۸۷۶۵۴۳۲', 'role': 'مدیر سالن', 'status': 'فعال'},
      {'id': '3', 'name': 'حسن محمدی', 'phone': '۰۹۳۵۱۲۳۴۵۶۷', 'role': 'کاربر', 'status': 'غیرفعال'},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('مدیریت کاربران')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: users.length,
        itemBuilder: (context, index) => _buildUserCard(context, users[index]),
      ),
    );
  }

  Widget _buildUserCard(BuildContext context, Map<String, dynamic> user) {
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
                Text(user['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                Text('${user['phone']} • ${user['role']}', style: AppTypography.caption),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
            decoration: BoxDecoration(
              color: (user['status'] == 'فعال' ? AppColors.success : AppColors.error).withOpacity(0.1),
              borderRadius: AppRadius.chipBorderRadius,
            ),
            child: Text(user['status'], style: AppTypography.caption.copyWith(
              color: user['status'] == 'فعال' ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w600,
            )),
          ),
        ],
      ),
    );
  }
}
