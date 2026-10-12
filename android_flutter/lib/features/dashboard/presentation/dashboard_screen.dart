import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/booking_service.dart';
import '../../../core/state/auth_provider.dart';
import '../../../core/utils/fa_format.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  List<dynamic>? _bookings;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _bookings = null;
    });
    try {
      final list = await BookingService.getBookings();
      if (!mounted) return;
      setState(() => _bookings = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'دریافت رزروها ناموفق بود');
    }
  }

  String _statusLabel(String status) {
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

  Color _statusColor(String status) {
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
        return AppColors.info;
    }
  }

  String _price(num amount) {
    final s = amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 1);
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      final rem = s.length - i;
      buf.write(s[i]);
      if (rem > 1 && rem % 3 == 1 && s[i] != '-') buf.write(',');
    }
    return '${buf.toString()} تومان';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState is AsyncData ? authState.value : null;

    final bookings = _bookings;
    final total = bookings?.length ?? 0;
    final active = bookings
            ?.where((b) => ['pending', 'confirmed'].contains((b['status'] ?? '').toString()))
            .length ??
        0;
    final cancelled =
        bookings?.where((b) => (b['status'] ?? '').toString() == 'cancelled').length ?? 0;
    final paid = bookings?.fold<num>(
          0,
          (sum, b) => ((b['status'] ?? '').toString() == 'cancelled')
              ? sum
              : sum + ((b['payment_amount'] as num?) ?? 0),
        ) ??
        0;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'سلام${user?.fullName != null ? '، ${user!.fullName.split(' ').first}' : ''} 👋',
                          style: AppTypography.h5.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'به داشبورد سیستم رزرو سالن فوتسال خوش آمدید',
                          style: AppTypography.bodyMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.blue.withOpacity(0.1),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.person_outline,
                          size: 18,
                          color: AppColors.blue,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          user?.role == 'venue_manager'
                              ? 'مدیر سالن'
                              : user?.role == 'club_admin'
                                  ? 'مدیر باشگاه'
                                  : user?.role == 'super_admin'
                                      ? 'مدیر سیستم'
                                      : 'کاربر',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.blue,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl),

              // Stats Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.md,
                crossAxisSpacing: AppSpacing.md,
                childAspectRatio: 1.4,
                children: [
                  _buildStatCard(
                    context,
                    title: 'کل رزروها',
                    value: bookings == null ? '…' : '$total',
                    icon: Icons.event_note,
                    color: AppColors.blue,
                  ),
                  _buildStatCard(
                    context,
                    title: 'رزروهای فعال',
                    value: bookings == null ? '…' : '$active',
                    icon: Icons.check_circle_outline,
                    color: AppColors.success,
                  ),
                  _buildStatCard(
                    context,
                    title: 'جمع پرداختی',
                    value: bookings == null ? '…' : _price(paid),
                    icon: Icons.payments_outlined,
                    color: AppColors.warning,
                  ),
                  _buildStatCard(
                    context,
                    title: 'لغو شده',
                    value: bookings == null ? '…' : '$cancelled',
                    icon: Icons.cancel_outlined,
                    color: AppColors.error,
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl),

              // Quick Actions
              Text(
                'دسترسی سریع',
                style: AppTypography.h6.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              Wrap(
                spacing: AppSpacing.md,
                runSpacing: AppSpacing.md,
                children: [
                  _buildQuickAction(
                    context,
                    icon: Icons.storefront,
                    label: 'رزرو جدید',
                    onTap: () => context.push('/venues'),
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.emoji_events_outlined,
                    label: 'رقابت‌ها',
                    onTap: () => context.push('/competitions'),
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.description_outlined,
                    label: 'قراردادها',
                    onTap: () => context.push('/contracts'),
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.person_outline,
                    label: 'پروفایل',
                    onTap: () => context.push('/profile'),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl),

              // Recent Bookings
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'رزروهای اخیر',
                    style: AppTypography.h6.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/bookings'),
                    child: const Text('مشاهده همه'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              if (bookings == null && _error == null)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_error != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      children: [
                        Text(_error!),
                        const SizedBox(height: AppSpacing.sm),
                        TextButton(onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              else if (bookings!.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      children: [
                        Icon(Icons.event_busy,
                            size: 40,
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'هنوز رزروی ندارید — اولین سانس خود را رزرو کنید',
                          style: AppTypography.bodyMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(
                          onPressed: () => context.push('/venues'),
                          child: const Text('مشاهده سالن‌ها'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...bookings
                    .take(3)
                    .map((b) => _buildBookingItem(context, b as Map<String, dynamic>)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  title,
                  style: AppTypography.caption.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(AppSpacing.xs),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: AppRadius.smallBorderRadius,
                ),
                child: Icon(icon, size: 18, color: color),
              ),
            ],
          ),
          Text(
            value,
            style: AppTypography.h6.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.mediumBorderRadius,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkSurface
              : Colors.grey[50],
          borderRadius: AppRadius.mediumBorderRadius,
          border: Border.all(
            color: Theme.of(context).dividerColor,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: AppColors.blue),
            const SizedBox(width: AppSpacing.xs),
            Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingItem(BuildContext context, Map<String, dynamic> booking) {
    final status = (booking['status'] ?? '').toString();
    final venueName = (booking['venue_name'] ?? 'سالن').toString();
    final persianDate = (booking['slot_date_persian'] ?? '').toString();
    final startTime = (booking['start_time'] ?? '').toString();
    final duration = (booking['duration'] as num?)?.toInt() ?? 0;
    final timeRange = startTime.isEmpty
        ? ''
        : '${FaFormat.time(startTime)} — ${FaFormat.slotEndTime(startTime, duration)}';
    final color = _statusColor(status);

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
          border: Border.all(
            color: Theme.of(context).dividerColor,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.blue.withOpacity(0.1),
                borderRadius: AppRadius.imageBorderRadius,
              ),
              child: const Icon(
                Icons.sports_soccer,
                color: AppColors.blue,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    venueName,
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '${persianDate.isNotEmpty ? '$persianDate - ' : ''}$timeRange',
                    style: AppTypography.caption.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xs,
              ),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: AppRadius.chipBorderRadius,
              ),
              child: Text(
                _statusLabel(status),
                style: AppTypography.caption.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
