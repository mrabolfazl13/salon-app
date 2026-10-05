import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class AdminVenuesScreen extends ConsumerWidget {
  const AdminVenuesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final venues = [
      {'id': '1', 'name': 'سالن فوتسال المپیک', 'location': 'تهران', 'status': 'فعال', 'bookings': 45},
      {'id': '2', 'name': 'باشگاه ورزشی قهرمان', 'location': 'اصفهان', 'status': 'در انتظار تأیید', 'bookings': 0},
    ];

    return Scaffold(
      appBar: AppBar(title: Text('مدیریت سالن‌ها')),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: venues.length,
        itemBuilder: (context, index) => _buildVenueCard(context, venues[index]),
      ),
    );
  }

  Widget _buildVenueCard(BuildContext context, Map<String, dynamic> venue) {
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
                child: const Icon(Icons.store, color: Colors.white),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(venue['name'], style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                    Text(venue['location'], style: AppTypography.caption),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: (venue['status'] == 'فعال' ? AppColors.success : AppColors.warning).withOpacity(0.1),
                  borderRadius: AppRadius.chipBorderRadius,
                ),
                child: Text(venue['status'], style: AppTypography.caption.copyWith(
                  color: venue['status'] == 'فعال' ? AppColors.success : AppColors.warning,
                  fontWeight: FontWeight.w600,
                )),
              ),
              Text('${venue['bookings']} رزرو', style: AppTypography.caption.copyWith(color: AppColors.blue)),
            ],
          ),
        ],
      ),
    );
  }
}
