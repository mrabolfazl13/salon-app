import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../payments/widgets/booking_payment.dart';
import '../domain/booking.dart';
import '../providers/bookings_provider.dart';
import '../widgets/booking_list_card.dart';

class BookingsPage extends ConsumerStatefulWidget {
  const BookingsPage({super.key});

  @override
  ConsumerState<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends ConsumerState<BookingsPage> {
  BookingsFilter _filter = BookingsFilter.all;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(bookingsProvider.notifier).fetch(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bookingsProvider);
    final filtered = state.filtered(_filter);
    final paidIds = state.paidBookingIds;
    final refundedIds = state.refundedBookingIds;

    return Scaffold(
      appBar: AppBar(title: const Text('رزروهای من')),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              children: [
                _tab('all', 'همه'),
                _tab('confirmed', 'تایید شده'),
                _tab('pending', 'در انتظار'),
                _tab('cancelled', 'لغو شده'),
                _tab('completed', 'انجام شده'),
              ],
            ),
          ),
          Expanded(
            child: state.loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: ListTileSkeleton(count: 3, height: 96),
                  )
                : state.error
                    ? ErrorState(
                        title:
                            'در دریافت رزروها خطایی رخ داد. لطفاً دوباره تلاش کنید.',
                        onRetry: () =>
                            ref.read(bookingsProvider.notifier).fetch(),
                      )
                    : filtered.isEmpty
                        ? EmptyState(
                            emoji: '📅',
                            title: 'رزرویی یافت نشد',
                            description:
                                'هنوز رزروی در این بخش ندارید. یک سالن پیدا کنید و بازی بعدی‌تان را رزرو کنید.',
                            actionLabel: 'پیدا کردن سالن',
                            onAction: () => context.push('/venues'),
                          )
                        : RefreshIndicator(
                            onRefresh: () =>
                                ref.read(bookingsProvider.notifier).fetch(),
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(
                                AppSpacing.xl, AppSpacing.lg, AppSpacing.xl,
                                AppSpacing.xxxl,
                              ),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final booking = filtered[index];
                                return Padding(
                                  padding:
                                      const EdgeInsets.only(bottom: AppSpacing.lg),
                                    child: BookingListCard(
                                    booking: booking,
                                    isPaid: paidIds
                                        .contains(booking.id.toString()),
                                    isRefunded: refundedIds
                                        .contains(booking.id.toString()),
                                    onPay: booking.status == 'confirmed' &&
                                            !booking.isPendingRedis &&
                                            !paidIds
                                                .contains(booking.id.toString())
                                        ? () {
                                            showCardPaymentSheetForBooking(
                                              context,
                                              booking,
                                              () => ref
                                                  .read(bookingsProvider
                                                      .notifier)
                                                  .fetch(),
                                            );
                                          }
                                        : null,
                                    onDetails: booking.isPendingRedis
                                        ? null
                                        : () => context
                                            .push('/bookings/${booking.id}'),
                                    onCancel:
                                        (booking.status == 'confirmed' ||
                                                booking.status == 'pending')
                                            ? () => _cancelBooking(booking)
                                            : null,
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelBooking(Booking booking) async {
    final ok = await showAppConfirm(
      context,
      title: 'لغو رزرو',
      description: 'آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست.',
      confirmText: 'بله، لغو شود',
      cancelText: 'خیر',
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await ref.read(bookingsProvider.notifier).cancel(booking);
      if (!mounted) return;
      AppSnack.success(context, 'رزرو با موفقیت لغو شد!');
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در لغو رزرو');
    }
  }

  Widget _tab(String value, String label) {
    final active = _filter.name == value || (value == 'all' && _filter == BookingsFilter.all);
    return GestureDetector(
      onTap: () => setState(
        () => _filter = BookingsFilter.values.firstWhere((f) => f.name == value),
      ),
      child: Container(
        margin: const EdgeInsets.only(left: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.chip),
          border: Border.all(
            color: active
                ? AppColors.primary
                : Theme.of(context).dividerColor,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: active ? Colors.white : null,
          ),
        ),
      ),
    );
  }
}
