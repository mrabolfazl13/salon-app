import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  String _selectedFilter = 'all';

  // Mock data
  final List<Map<String, dynamic>> _bookings = [
    {
      'id': '1',
      'venue': 'سالن فوتسال المپیک',
      'date': '۱۴۰۳/۰۸/۱۵',
      'time': '۱۸:۰۰ - ۱۹:۰۰',
      'status': 'confirmed',
      'price': 350000,
      'court': 'زمین شماره ۱',
    },
    {
      'id': '2',
      'venue': 'مجموعه ورزشی آزادی',
      'date': '۱۴۰۳/۰۸/۲۰',
      'time': '۲۰:۰۰ - ۲۱:۰۰',
      'status': 'pending',
      'price': 450000,
      'court': 'زمین شماره ۳',
    },
    {
      'id': '3',
      'venue': 'سالن چندمنظوره انقلاب',
      'date': '۱۴۰۳/۰۸/۱۰',
      'time': '۱۶:۰۰ - ۱۷:۰۰',
      'status': 'completed',
      'price': 280000,
      'court': 'زمین شماره ۲',
    },
    {
      'id': '4',
      'venue': 'باشگاه ورزشی قهرمان',
      'date': '۱۴۰۳/۰۸/۰۵',
      'time': '۱۹:۰۰ - ۲۰:۰۰',
      'status': 'cancelled',
      'price': 300000,
      'court': 'زمین شماره ۱',
    },
  ];

  List<Map<String, dynamic>> get _filteredBookings {
    if (_selectedFilter == 'all') return _bookings;
    return _bookings.where((b) => b['status'] == _selectedFilter).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed':
        return AppColors.success;
      case 'pending':
        return AppColors.warning;
      case 'completed':
        return AppColors.info;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.blue;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'confirmed':
        return 'تأیید شده';
      case 'pending':
        return 'در انتظار';
      case 'completed':
        return 'تکمیل شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text(
              'رزروهای من',
              style: AppTypography.h6.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: () {},
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(60),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Row(
                  children: [
                    _buildFilterChip('همه', 'all'),
                    _buildFilterChip('فعال', 'confirmed'),
                    _buildFilterChip('در انتظار', 'pending'),
                    _buildFilterChip('تکمیل شده', 'completed'),
                    _buildFilterChip('لغو شده', 'cancelled'),
                  ],
                ),
              ),
            ),
          ),

          // Bookings list
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: _filteredBookings.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 64,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withOpacity(0.3),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            'رزروی یافت نشد',
                            style: AppTypography.h6.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          ElevatedButton(
                            onPressed: () => context.push('/venues'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.blue,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: AppRadius.buttonBorderRadius,
                              ),
                            ),
                            child: const Text('رزرو جدید'),
                          ),
                        ],
                      ),
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final booking = _filteredBookings[index];
                        return _buildBookingCard(context, booking);
                      },
                      childCount: _filteredBookings.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: AppSpacing.sm),
      child: InkWell(
        onTap: () => setState(() => _selectedFilter = value),
        borderRadius: AppRadius.chipBorderRadius,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.blue
                : Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkSurface
                    : Colors.grey[100],
            borderRadius: AppRadius.chipBorderRadius,
            border: Border.all(
              color: isSelected
                  ? AppColors.blue
                  : Theme.of(context).dividerColor,
            ),
          ),
          child: Text(
            label,
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              color: isSelected
                  ? Colors.white
                  : Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBookingCard(BuildContext context, Map<String, dynamic> booking) {
    final statusColor = _getStatusColor(booking['status']);

    return InkWell(
      onTap: () => context.push('/bookings/${booking['id']}'),
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
            // Header with venue name and status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    booking['venue'],
                    style: AppTypography.h6.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text(
                    _getStatusText(booking['status']),
                    style: AppTypography.caption.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),

            // Court info
            Row(
              children: [
                const Icon(
                  Icons.sports_soccer,
                  size: 16,
                  color: AppColors.blue,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  booking['court'],
                  style: AppTypography.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),

            // Date and time
            Row(
              children: [
                const Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: AppColors.amber,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '${booking['date']} • ${booking['time']}',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // Price and action button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_formatPrice(booking['price'])}',
                  style: AppTypography.h6.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
                if (booking['status'] == 'confirmed' || booking['status'] == 'pending')
                  TextButton(
                    onPressed: () {
                      // Cancel booking logic
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.error,
                    ),
                    child: const Text('لغو رزرو'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} تومان';
  }
}
