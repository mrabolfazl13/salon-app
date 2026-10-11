import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/booking_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  String _selectedFilter = 'all';
  bool _loading = true;
  String? _error;
  List<dynamic> _bookings = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final bookings = await BookingService.getBookings();
      if (!mounted) return;
      setState(() {
        _bookings = bookings;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<dynamic> get _filteredBookings {
    if (_selectedFilter == 'all') return _bookings;
    return _bookings
        .where((b) => (b['status'] ?? '').toString() == _selectedFilter)
        .toList();
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
        return 'در انتظار تأیید';
      case 'completed':
        return 'تکمیل شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  Future<void> _cancelBooking(Map<String, dynamic> booking) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو رزرو'),
        content: Text(
            'آیا از لغو رزرو ${booking['venue_name'] ?? ''} مطمئن هستید؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('لغو رزرو'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await BookingService.cancelBooking(booking['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('رزرو لغو شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text(
              'رزروهای من',
              style: AppTypography.h6.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(60),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Row(
                  children: [
                    _buildFilterChip('همه', 'all'),
                    _buildFilterChip('در انتظار', 'pending'),
                    _buildFilterChip('تأیید شده', 'confirmed'),
                    _buildFilterChip('تکمیل شده', 'completed'),
                    _buildFilterChip('لغو شده', 'cancelled'),
                  ],
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: _loading
                ? const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()))
                : _error != null
                    ? SliverFillRemaining(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: AppSpacing.md),
                            ElevatedButton(
                                onPressed: _load, child: const Text('تلاش مجدد')),
                          ],
                        ),
                      )
                    : _filteredBookings.isEmpty
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
                                final booking =
                                    _filteredBookings[index] as Map<String, dynamic>;
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
    final status = (booking['status'] ?? '').toString();
    final statusColor = _getStatusColor(status);
    final venueName = (booking['venue_name'] ?? 'سالن').toString();
    final persianDate = (booking['slot_date_persian'] ?? '').toString();
    final slotDate = (booking['slot_date'] ?? '').toString();
    final dateLabel = persianDate.isNotEmpty
        ? JalaliDate.formatIsoDate(slotDate)
        : slotDate;
    final startTime = (booking['start_time'] ?? '').toString();
    final duration = (booking['duration'] as num?)?.toInt() ?? 0;
    final timeLabel = startTime.isEmpty
        ? ''
        : '${FaFormat.time(startTime)} — ${FaFormat.slotEndTime(startTime, duration)}';
    final price = (booking['payment_amount'] as num?) ?? 0;

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    venueName,
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
                    _getStatusText(status),
                    style: AppTypography.caption.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),

            if (dateLabel.isNotEmpty) ...[
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: AppColors.amber,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    dateLabel,
                    style: AppTypography.bodyMedium.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
            ],

            Row(
              children: [
                const Icon(
                  Icons.schedule,
                  size: 16,
                  color: AppColors.blue,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  timeLabel,
                  style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  FaFormat.price(price),
                  style: AppTypography.h6.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
                if (status == 'pending' || status == 'confirmed')
                  TextButton(
                    onPressed: () => _cancelBooking(booking),
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
}
