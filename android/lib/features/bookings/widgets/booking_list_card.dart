import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/status.dart';
import '../domain/booking.dart';

/// Card representation of a booking (desktop table → mobile card).
class BookingListCard extends StatelessWidget {
  const BookingListCard({
    super.key,
    required this.booking,
    required this.isPaid,
    required this.isRefunded,
    this.onPay,
    this.onDetails,
    this.onCancel,
  });

  final Booking booking;
  final bool isPaid;
  final bool isRefunded;
  final VoidCallback? onPay;
  final VoidCallback? onDetails;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.tile),
                  color: AppColors.primary.withValues(alpha: 0.1),
                ),
                child: const Icon(Icons.stadium_outlined,
                    color: AppColors.primary, size: 21),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.venueName ?? 'سالن #${booking.slotId}',
                      style: Theme.of(context).textTheme.titleSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      booking.slotDate != null
                          ? '${formatDate(booking.slotDate)} — ${formatTimeFa(booking.startTime)}'
                          : formatDateTime(booking.bookedAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              if (booking.isPendingRedis)
                const StatusChip('pending')
              else
                StatusChip(booking.status),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'مبلغ',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    Text(
                      formatPrice(booking.paymentAmount),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ],
                ),
              ),
              if (isPaid)
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.success, size: 18)
              else if (isRefunded)
                const Icon(Icons.restore_rounded,
                    color: AppColors.info, size: 18),
              const SizedBox(width: AppSpacing.sm),
              if (onPay != null)
                GestureDetector(
                  onTap: onPay,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: BorderRadius.circular(AppRadius.chip),
                    ),
                    child: const Text(
                      'پرداخت',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              if (onDetails != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onDetails,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.chip),
                      border: Border.all(
                        color: Theme.of(context).dividerColor,
                      ),
                    ),
                    child: Text(
                      'جزئیات',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                      ),
                    ),
                  ),
                ),
              ],
              if (onCancel != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onCancel,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.chip),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.4),
                      ),
                    ),
                    child: const Text(
                      'لغو',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
