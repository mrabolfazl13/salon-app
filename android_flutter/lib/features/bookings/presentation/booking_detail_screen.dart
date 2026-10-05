import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({
    super.key,
    required this.bookingId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock data - will be replaced with API call
    final booking = {
      'id': bookingId,
      'venue': 'سالن فوتسال المپیک',
      'address': 'تهران، خیابان ولیعصر',
      'date': '۱۴۰۳/۰۸/۱۵',
      'time': '۱۸:۰۰ - ۱۹:۰۰',
      'status': 'confirmed',
      'price': 350000,
      'court': 'زمین شماره ۱',
      'players': 10,
      'paymentMethod': 'آنلاین',
      'createdAt': '۱۴۰۳/۰۸/۱۰',
    };

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.navy, AppColors.blue],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.sports_soccer,
                        size: 48,
                        color: Colors.white,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        booking['venue'],
                        style: AppTypography.h6.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status badge
                  _buildStatusBadge(context, (booking['status'] ?? '').toString()),
                  const SizedBox(height: AppSpacing.xl),

                  // Booking details card
                  _buildDetailCard(context, booking),
                  const SizedBox(height: AppSpacing.md),

                  // Venue info card
                  _buildVenueInfoCard(context, booking),
                  const SizedBox(height: AppSpacing.md),

                  // Payment info card
                  _buildPaymentCard(context, booking),
                  const SizedBox(height: AppSpacing.xl),

                  // Action buttons
                  if (booking['status'] == 'confirmed' || booking['status'] == 'pending')
                    Column(
                      children: [
                        AppButton(
                          text: 'لغو رزرو',
                          onPressed: () => _showCancelDialog(context, booking),
                          outlined: true,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        AppButton(
                          text: 'دریافت بلیط',
                          onPressed: () {},
                          gradient: true,
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context, String status) {
    Color color;
    String text;

    switch (status) {
      case 'confirmed':
        color = AppColors.success;
        text = 'تأیید شده';
        break;
      case 'pending':
        color = AppColors.warning;
        text = 'در انتظار تأیید';
        break;
      case 'completed':
        color = AppColors.info;
        text = 'تکمیل شده';
        break;
      case 'cancelled':
        color = AppColors.error;
        text = 'لغو شده';
        break;
      default:
        color = AppColors.blue;
        text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: AppRadius.chipBorderRadius,
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, size: 18, color: color),
          const SizedBox(width: AppSpacing.xs),
          Text(
            text,
            style: AppTypography.bodyMedium.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailCard(BuildContext context, Map<String, dynamic> booking) {
    return Container(
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
          Text(
            'جزئیات رزرو',
            style: AppTypography.h6.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const Divider(height: AppSpacing.xl),
          _buildDetailRow(context, 'کد رزرو', '#${booking['id']}'),
          _buildDetailRow(context, 'تاریخ', booking['date']),
          _buildDetailRow(context, 'ساعت', booking['time']),
          _buildDetailRow(context, 'زمین', booking['court']),
          _buildDetailRow(context, 'تعداد بازیکنان', '${booking['players']} نفر'),
        ],
      ),
    );
  }

  Widget _buildVenueInfoCard(BuildContext context, Map<String, dynamic> booking) {
    return Container(
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
          Text(
            'اطلاعات سالن',
            style: AppTypography.h6.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const Divider(height: AppSpacing.xl),
          Row(
            children: [
              const Icon(Icons.location_on, size: 18, color: AppColors.amber),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  booking['address'],
                  style: AppTypography.bodyMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.map, size: 18),
            label: const Text('مشاهده روی نقشه'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blue.withOpacity(0.1),
              foregroundColor: AppColors.blue,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: AppRadius.buttonBorderRadius,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard(BuildContext context, Map<String, dynamic> booking) {
    return Container(
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
          Text(
            'اطلاعات پرداخت',
            style: AppTypography.h6.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const Divider(height: AppSpacing.xl),
          _buildDetailRow(context, 'مبلغ', '${_formatPrice(booking['price'])}'),
          _buildDetailRow(context, 'روش پرداخت', booking['paymentMethod']),
          _buildDetailRow(context, 'تاریخ ثبت', booking['createdAt']),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.bodyMedium.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, Map<String, dynamic> booking) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو رزرو'),
        content: Text('آیا از لغو رزرو ${booking['venue']} مطمئن هستید؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Cancel booking logic
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('رزرو با موفقیت لغو شد'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('لغو رزرو'),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} تومان';
  }
}
