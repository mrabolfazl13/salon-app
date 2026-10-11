import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/booking_service.dart';
import '../../../core/network/checkin_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/app_button.dart';

class BookingDetailScreen extends ConsumerStatefulWidget {
  final String bookingId;

  const BookingDetailScreen({
    super.key,
    required this.bookingId,
  });

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  Map<String, dynamic>? _booking;
  bool _loading = true;
  String? _error;
  bool _cancelling = false;

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
      final booking = await BookingService.getBooking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        _booking = booking;
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

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو رزرو'),
        content: const Text('آیا از لغو این رزرو مطمئن هستید؟'),
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
    setState(() => _cancelling = true);
    try {
      await BookingService.cancelBooking(widget.bookingId);
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
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  Future<void> _showTicket() async {
    try {
      final qr = await CheckinService.getQrCode(widget.bookingId);
      final code = (qr['check_in_code'] ?? '').toString();
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('بلیط ورود'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (code.isNotEmpty)
                QrImageView(data: code, size: 200)
              else
                const Text('کد ورود یافت نشد'),
              const SizedBox(height: AppSpacing.md),
              Text(
                FaFormat.digits(code),
                style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('بستن'),
            ),
          ],
        ),
      );
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
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات رزرو')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات رزرو')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                child: Text(_error ?? 'یافت نشد', textAlign: TextAlign.center),
              ),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(onPressed: _load, child: const Text('تلاش مجدد')),
            ],
          ),
        ),
      );
    }

    final booking = _booking!;
    final status = (booking['status'] ?? '').toString();
    final venueName = (booking['venue_name'] ?? 'سالن').toString();
    final slotDate = (booking['slot_date'] ?? '').toString();
    final startTime = (booking['start_time'] ?? '').toString();
    final duration = (booking['duration'] as num?)?.toInt() ?? 0;
    final paymentAmount = (booking['payment_amount'] as num?) ?? 0;
    final discountAmount = (booking['discount_amount'] as num?) ?? 0;
    final couponCode = (booking['coupon_code'] ?? '').toString();
    final loyaltyUsed = (booking['loyalty_points_used'] as num?) ?? 0;
    final bookedAt = (booking['booked_at'] ?? '').toString();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
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
                        venueName,
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

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatusBadge(status),
                  const SizedBox(height: AppSpacing.xl),

                  _buildDetailCard(
                    context,
                    'جزئیات رزرو',
                    [
                      _row('کد رزرو', '#${FaFormat.digits(widget.bookingId)}'),
                      if (slotDate.isNotEmpty)
                        _row('تاریخ', JalaliDate.formatIsoDate(slotDate)),
                      if (startTime.isNotEmpty)
                        _row('ساعت',
                            '${FaFormat.time(startTime)} — ${FaFormat.slotEndTime(startTime, duration)}'),
                      if (duration > 0)
                        _row('مدت', '${FaFormat.faNum(duration)} دقیقه'),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),

                  _buildDetailCard(
                    context,
                    'اطلاعات پرداخت',
                    [
                      _row('مبلغ نهایی', FaFormat.price(paymentAmount)),
                      if (discountAmount > 0)
                        _row('تخفیف', FaFormat.price(discountAmount)),
                      if (couponCode.isNotEmpty) _row('کد تخفیف', couponCode),
                      if (loyaltyUsed > 0)
                        _row('امتیاز استفاده‌شده', FaFormat.faNum(loyaltyUsed)),
                      if (bookedAt.isNotEmpty)
                        _row('تاریخ ثبت', JalaliDate.formatIsoDateTime(bookedAt)),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),

                  if (status == 'confirmed' || status == 'pending')
                    Column(
                      children: [
                        AppButton(
                          text: _cancelling ? 'در حال لغو...' : 'لغو رزرو',
                          onPressed: _cancelling ? null : _cancel,
                          outlined: true,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        AppButton(
                          text: 'دریافت بلیط',
                          onPressed: _showTicket,
                          gradient: true,
                        ),
                      ],
                    ),
                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = _getStatusColor(status);
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
            _getStatusText(status),
            style: AppTypography.bodyMedium.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailCard(
      BuildContext context, String title, List<Widget> rows) {
    return Container(
      width: double.infinity,
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
            title,
            style: AppTypography.h6.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const Divider(height: AppSpacing.xl),
          ...rows,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
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
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
