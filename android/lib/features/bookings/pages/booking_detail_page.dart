import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../domain/booking.dart';
import '../providers/bookings_provider.dart';

class BookingDetailPage extends ConsumerStatefulWidget {
  const BookingDetailPage({super.key, required this.id});

  final String id;

  @override
  ConsumerState<BookingDetailPage> createState() => _BookingDetailPageState();
}

class _BookingDetailPageState extends ConsumerState<BookingDetailPage> {
  Booking? _booking;
  bool _loading = true;
  bool _notFound = false;
  bool _cancelling = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final booking = await ref
          .read(bookingsServiceProvider)
          .getById(widget.id);
      if (!mounted) return;
      setState(() => _booking = booking);
    } catch (_) {
      if (mounted) setState(() => _notFound = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel() async {
    final booking = _booking;
    if (booking == null) return;
    final ok = await showAppConfirm(
      context,
      title: 'لغو رزرو',
      description: 'آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست.',
      confirmText: 'بله، لغو شود',
      cancelText: 'خیر، بازگشت',
      destructive: true,
    );
    if (!ok) return;
    setState(() => _cancelling = true);
    try {
      await ref.read(bookingsProvider.notifier).cancel(booking);
      if (!mounted) return;
      AppSnack.success(context, 'رزرو با موفقیت لغو شد!');
      context.go('/bookings');
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در لغو رزرو');
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات رزرو')),
        body: const SingleChildScrollView(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: ListTileSkeleton(count: 3, height: 120),
        ),
      );
    }
    final booking = _booking;
    if (_notFound || booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات رزرو')),
        body: ErrorState(
          title: 'رزرو مورد نظر یافت نشد یا دسترسی شما به آن محدود است.',
          onRetry: _load,
        ),
      );
    }

    final oanCanoel =
        booking.status == 'confirmed' || booking.status == 'pending';
    final payment = booking.payment;

    return Scaffold(
      appBar: AppBar(title: const Text('جزئیات رزرو')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          _headerCard(booking),
          const SizedBox(height: AppSpacing.lg),
          _infoCard(booking),
          if (payment != null) ...[
            const SizedBox(height: AppSpacing.lg),
            _paymentCard(payment),
          ],
          const SizedBox(height: AppSpacing.lg),
          _timelineCard(booking),
          const SizedBox(height: AppSpacing.lg),
          _actionsCard(booking, oanCanoel),
        ],
      ),
    );
  }

  Widget _headerCard(Booking booking) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.tile),
              color: AppColors.primary.withValues(alpha: 0.1),
            ),
            child: const Icon(Icons.stadium_outlined,
                color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.venueName ?? 'سالن #${booking.slotId}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  'رزرو #${booking.idString}'
                  '${booking.slotDate != null ? " — ${formatDate(booking.slotDate)}، ${formatTimeFa(booking.startTime)} تا ${formatTimeFa(slotEndTime(booking.startTime ?? "", booking.duration))}" : ""}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          StatusChip(booking.status),
        ],
      ),
    );
  }

  Widget _infoCard(Booking booking) {
    return _SectionCard(
      title: 'جزئیات رزرو',
      children: [
        _infoRow('مبلغ پرداختی', formatPrice(booking.paymentAmount), bold: true),
        _infoRow('تاریخ ثبت', formatDateTime(booking.bookedAt)),
        _infoRow('وضعیت', StatusChip(booking.status).asText()),
      ],
    );
  }

  Widget _paymentCard(Payment payment) {
    final meta = switch (payment.status) {
      'paid' => ('پرداخت شده', Icons.verified_outlined),
      'refunded' => ('بازگشت وجه', Icons.restore_rounded),
      'failed' => ('ناموفق', Icons.error_outline_rounded),
      _ => ('در انتظار پرداخت', Icons.schedule_rounded),
    };
    return _SectionCard(
      title: 'فاکتور پرداخت',
      trailing: StatusChip(payment.status),
      children: [
        _infoRow('مبلغ فاکتور', formatPrice(payment.amount)),
        if (payment.paidAt != null)
          _infoRow('زمان پرداخت', formatDateTime(payment.paidAt)),
        if (payment.cardPan != null)
          _infoRow('کارت', '**** ${payment.cardPan}', ltr: true),
        if (payment.transactionId != null)
          _infoRow('شناسه تراکنش', payment.transactionId!, ltr: true),
        const SizedBox(height: 4),
        Row(
          children: [
            Icon(meta.$2, size: 14, color: Theme.of(context).primaryColor),
            const SizedBox(width: 5),
            Text(meta.$1, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ],
    );
  }

  Widget _timelineCard(Booking booking) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dotDone = AppColors.success;
    final dotPending = isDark ? AppColors.darkTextMuted : const Color(0xFFCBD5E1);
    Widget step(bool done, String title, String time) => Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.only(top: 5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: done ? dotDone : dotPending,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleSmall),
                  Text(time, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        );
    return _SectionCard(
      title: 'خط زمانی',
      children: [
        step(true, 'رزرو ثبت شد', formatDateTime(booking.bookedAt)),
        const SizedBox(height: 10),
        step(
          booking.status == 'confirmed',
          booking.status == 'confirmed' ? 'تایید شد' : 'در انتظار تایید',
          booking.status == 'confirmed' ? formatDateTime(booking.bookedAt) : '—',
        ),
        const SizedBox(height: 10),
        step(
          false,
          'روز برگزاری',
          booking.slotDate != null
              ? '${formatDate(booking.slotDate)}، ${formatTimeFa(booking.startTime)}'
              : '—',
        ),
      ],
    );
  }

  Widget _actionsCard(Booking booking, bool oanCanoel) {
    return _SectionCard(
      title: 'عملیات',
      children: [
        Row(
          children: [
            if (oanCanoel)
              Expanded(
                child: AppOutlineButton(
                  label: 'لغو رزرو',
                  icon: Icons.cancel_outlined,
                  color: AppColors.error,
                  loading: _cancelling,
                  onPressed: _cancel,
                ),
              ),
            if (oanCanoel) const SizedBox(width: AppSpacing.md),
            Expanded(
              child: AppOutlineButton(
                label: 'به‌روزرسانی',
                icon: Icons.refresh_rounded,
                onPressed: _load,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value, {bool bold = false, bool ltr = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                  color: bold ? AppColors.primary : null,
                ),
            textDirection: ltr ? TextDirection.ltr : null,
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.children,
    this.trailing,
  });

  final String title;
  final List<Widget> children;
  final Widget? trailing;

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
              Expanded(
                child: Text(title, style: Theme.of(context).textTheme.titleSmall),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ...children,
        ],
      ),
    );
  }
}

extension _ChipText on StatusChip {
  String asText() => statusStyle(status, isDark: false).label;
}
