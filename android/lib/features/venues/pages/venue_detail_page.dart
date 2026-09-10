import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../../core/widgets/venue_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/providers/local_stores.dart';
import '../../bookings/providers/bookings_provider.dart';
import '../../memberships/domain/membership.dart';
import '../../memberships/providers/memberships_provider.dart';
import '../../payments/widgets/card_payment_sheet.dart';
import '../data/slot_display.dart';
import '../domain/venue.dart';
import '../providers/venues_providers.dart';
import '../widgets/booking_summary_bar.dart';
import '../widgets/date_selector.dart';
import '../widgets/review_section.dart';
import '../widgets/time_slot_tile.dart';

/// Venue detail: hero gallery, amenities, date strip, slots (futsal) or
/// membership plans (gym), oontaot info and reviews.
class VenueDetailPage extends ConsumerStatefulWidget {
  const VenueDetailPage({super.key, required this.id});

  final int id;

  @override
  ConsumerState<VenueDetailPage> createState() => _VenueDetailPageState();
}

class _VenueDetailPageState extends ConsumerState<VenueDetailPage> {
  Venue? _venue;
  bool _loading = true;
  List<DisplaySlot> _slots = [];
  List<MembershipPlan> _plans = [];
  DisplaySlot? _selectedSlot;
  bool _booking = false;
  late final List<DateOption> _dates = buildDateOptions(14);
  late String _selectedDate = _dates.first.iso;

  @override
  void initState() {
    super.initState();
    _load();
    Future<void>.microtask(() {
      ref.read(recentlyViewedProvider.notifier).track;
    });
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final venue = await ref.read(venuesServiceProvider).getById(widget.id);
      if (!mounted) return;
      ref.read(recentlyViewedProvider.notifier).track(venue.id, venue.name);
      setState(() => _venue = venue);
      if (venue.isGym) {
        try {
          final plans =
              await ref.read(membershipsServiceProvider).getPlans(venue.id);
          if (mounted) setState(() => _plans = plans);
        } catch (_) {
          if (mounted) setState(() => _plans = []);
        }
      } else {
        await _loadSlots(venue);
      }
      if (mounted) setState(() => _loading = false);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      if (e.isNotFound) {
        setState(() => _venue = null);
      } else {
        AppSnack.error(context, e.message);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
        AppSnack.error(context, 'خطا در دریافت اطلاعات سالن');
      }
    }
  }

  Future<void> _loadSlots(Venue venue) async {
    try {
      final end = DateTime.now().add(const Duration(days: 13));
      final slots = await ref
          .read(venueSlotsServiceProvider)
          .getRange(venue.id, isoDate(DateTime.now()), isoDate(end));
      if (!mounted) return;
      setState(() {
        _slots = slots.map(displaySlotFrom).toList();
      });
    } catch (_) {
      if (mounted) setState(() => _slots = []);
    }
  }

  List<DisplaySlot> get _daySlots =>
      _slots.where((s) => s.date == _selectedDate).toList();

  DateOption get _selectedDateOption =>
      _dates.firstWhere((d) => d.iso == _selectedDate);

  String get _dateLabel {
    final d = _selectedDateOption;
    return d.isToday ? 'امروز' : '${d.weekday} ${d.day} ${d.month}';
  }

  Future<void> _confirmBooking() async {
    final slot = _selectedSlot;
    final venue = _venue;
    if (slot == null || venue == null) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      AppSnack.info(context, 'ابتدا وارد حساب خود شوید');
      context.push('/login?from=${Uri.encodeComponent('/venues/${venue.id}')}');
      return;
    }
    final ok = await showAppConfirm(
      context,
      title: 'تایید رزرو',
      description: 'سالن: ${venue.name}\n'
          'سانس: ${formatTimeFa(slot.startTime)} - ${formatTimeFa(slot.endTime)}\n'
          'قیمت: ${formatPrice(slot.price)}',
      confirmText: 'تایید رزرو',
    );
    if (!ok) return;
    setState(() => _booking = true);
    try {
      await ref.read(bookingsServiceProvider).create(slotId: slot.id);
      if (!mounted) return;
      AppSnack.success(
        context,
        'رزرو شما ثبت شد و در انتظار تایید مدیر سالن است ⏳',
      );
      setState(() => _selectedSlot = null);
      await _loadSlots(venue);
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در رزرو');
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const SingleChildScrollView(child: DetailSkeleton()),
      );
    }
    if (_venue == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات سالن')),
        body: ErrorState(
          title: 'سالن مورد نظر یافت نشد یا حذف شده است.',
          onRetry: _load,
        ),
      );
    }
    final venue = _venue!;
    final isGym = venue.isGym;
    final minPlanPrice =
        _plans.isEmpty ? null : _plans.map((p) => p.price).reduce(min);

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  expandedHeight: 250,
                  pinned: true,
                  stretch: true,
                  flexibleSpace: FlexibleSpaceBar(
                    background: _HeroGallery(venue: venue),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      Text(
                        venue.name,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          RatingRow(
                            value: venue.averageRating,
                            count: venue.totalReviews,
                            size: RatingSize.md,
                          ),
                          const SizedBox(width: AppSpacing.lg),
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.location_on_outlined,
                                    size: 16, color: AppColors.lightTextMuted),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    venue.address,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (venue.amenities.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.md),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: venue.amenities
                              .map(
                                (a) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.07),
                                    borderRadius: BorderRadius.circular(
                                      AppRadius.chip,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.check_circle_outline,
                                          size: 13, color: AppColors.primary),
                                      const SizedBox(width: 4),
                                      Text(
                                        a,
                                        style: const TextStyle(
                                          fontFamily: 'Vazirmatn',
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                      if (venue.description != null &&
                          venue.description!.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.lg),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardTheme.color,
                            borderRadius:
                                BorderRadius.circular(AppRadius.image),
                            border: Border.all(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'درباره سالن',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                venue.description!,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(height: 2, fontSize: 12.5),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.xl),
                      if (isGym)
                        _plansSection(minPlanPrice)
                      else ...[
                        const SectionHeader(
                          title: '📅 انتخاب تاریخ',
                          subtitle: '۱۴ روز آینده',
                        ),
                        DateSelector(
                          dates: _dates,
                          value: _selectedDate,
                          onChange: (iso) =>
                              setState(() => _selectedDate = iso),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        SectionHeader(
                          title: '🕐 سانس‌ها',
                          subtitle: _daySlots.isEmpty
                              ? _dateLabel
                              : '${formatFaNumber(_daySlots.length)} سانس در $_dateLabel',
                        ),
                        if (_daySlots.isEmpty)
                          const EmptyState(
                            emoji: '😴',
                            title: 'در این روز سانسی موجود نیست',
                            description:
                                'تاریخ دیگری را انتخاب کنید یا به روزهای بعد سر بزنید.',
                          )
                        else
                          ..._daySlots.map(
                            (s) => Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.md),
                              child: TimeSlotTile(
                                slot: s,
                                selected: _selectedSlot?.id == s.id,
                                onSelect: (slot) =>
                                    setState(() => _selectedSlot = slot),
                              ),
                            ),
                          ),
                      ],
                      const SizedBox(height: AppSpacing.xl),
                      _oontaotCard(venue),
                      const SizedBox(height: AppSpacing.xl),
                      ReviewSection(venueId: venue.id),
                      const SizedBox(height: AppSpacing.xxxl),
                    ]),
                  ),
                ),
              ],
            ),
          ),
          BookingSummaryBar(
            price: isGym
                ? minPlanPrice ?? venue.price
                : _selectedSlot?.price ?? venue.price,
            subtitle: isGym
                ? (_plans.isEmpty
                    ? 'پلن اشتراکی تعریف نشده'
                    : '${formatFaNumber(_plans.length)} پلن اشتراک موجود')
                : _selectedSlot != null
                    ? '$_dateLabel • ${formatTimeFa(_selectedSlot!.startTime)} - ${formatTimeFa(_selectedSlot!.endTime)}'
                    : 'هنوز سانسی انتخاب نشده است',
            ctaLabel: isGym
                ? (_plans.isEmpty ? 'پلنی موجود نیست' : 'خرید اشتراک')
                : (_selectedSlot != null ? 'رزرو سانس' : 'سانس را انتخاب کنید'),
            disabled: isGym ? _plans.isEmpty : _selectedSlot == null,
            loading: _booking,
            onAction: isGym ? () => _buyPlan(_plans.first) : _confirmBooking,
          ),
        ],
      ),
    );
  }

  Widget _plansSection(int? minPlanPrice) {
    if (_plans.isEmpty) {
      return const EmptyState(
        emoji: '🏋️',
        title: 'پلن اشتراکی تعریف نشده',
        description:
            'هنوز مدیر این باشگاه پلن اشتراکی ثبت نکرده است. برای اطلاع از قیمت‌ها تماس بگیرید.',
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: '🎟️ خرید اشتراک',
          subtitle: 'بدون نیاز به رزرو سانس',
        ),
        ..._plans.map(
          (p) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: _PlanCard(plan: p, onBuy: _buyPlan),
          ),
        ),
      ],
    );
  }

  Future<void> _buyPlan(MembershipPlan plan) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      AppSnack.info(context, 'ابتدا وارد حساب خود شوید');
      context.push('/login');
      return;
    }
    await showCardPaymentSheet(
      context,
      title: 'خرید اشتراک',
      summaryRows: [
        ('پلن', plan.title),
        if (plan.sessionscount != null)
          ('تعداد جلسات', '${formatFaNumber(plan.sessionscount!)} جلسه'),
        if (plan.durationDays != null)
          ('مدت اعتبار', '${formatFaNumber(plan.durationDays!)} روز'),
      ],
      amount: plan.price,
      onSuccess: (payment) {
        AppSnack.success(context, 'اشتراک شما با موفقیت فعال شد 🎉');
      },
      createInvoice: () async {
        final purchase = await ref
            .read(membershipsServiceProvider)
            .createPurchase(plan.id);
        return (
          id: purchase.id,
          amount: purchase.amount,
        );
      },
      pay: (id, oard) => ref
          .read(membershipsServiceProvider)
          .payPurchase(
            id,
            cardNumber: oard.cardNumber,
            cvv: oard.cvv,
            month: oard.month,
            year: oard.year,
          ),
    );
  }

  Widget _oontaotCard(Venue venue) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        children: [
          if (venue.phone != null && venue.phone!.isNotEmpty)
            ListTile(
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.tile),
                  color: AppColors.primary.withValues(alpha: 0.1),
                ),
                child: const Icon(Icons.phone_outlined,
                    size: 18, color: AppColors.primary),
              ),
              title: Text(
                venue.phone!,
                style: Theme.of(context).textTheme.titleSmall,
                textDirection: TextDirection.ltr,
              ),
              subtitle: const Text('شماره تماس سالن'),
              trailing: TextButton(
                onPressed: () {},
                child: const Text('تماس'),
              ),
            ),
          ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppRadius.tile),
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
              child: const Icon(Icons.location_on_outlined,
                  size: 18, color: AppColors.primary),
            ),
            title: Text(
              venue.address,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            subtitle: const Text('آدرس سالن'),
          ),
        ],
      ),
    );
  }
}

class _HeroGallery extends StatefulWidget {
  const _HeroGallery({required this.venue});

  final Venue venue;

  @override
  State<_HeroGallery> createState() => _HeroGalleryState();
}

class _HeroGalleryState extends State<_HeroGallery> {
  final _controller = PageController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.venue.images;
    final urls = images.map(AppConfig.imageUrl).toList();
    return Stack(
      fit: StackFit.expand,
      children: [
        if (urls.isEmpty)
          Container(
            decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
            child: const Icon(Icons.stadium_outlined,
                size: 70, color: Colors.white30),
          )
        else
          PageView.builder(
            controller: _controller,
            itemCount: urls.length,
            itemBuilder: (context, index) => _galleryImage(urls[index]),
          ),
        Positioned(
          top: MediaQuery.paddingOf(context).top + 6,
          right: AppSpacing.md,
          left: AppSpacing.md,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              AppIconButton(
                icon: Icons.arrow_forward_rounded,
                onPressed: () => context.pop(),
                background: Colors.white.withValues(alpha: 0.9),
              ),
              FavoriteButton(
                venueId: widget.venue.id,
                venueName: widget.venue.name,
                onImage: true,
                size: 44,
              ),
            ],
          ),
        ),
        Positioned(
          bottom: 12,
          right: 12,
          child: VerifiedBadge(isVerified: widget.venue.isVerified),
        ),
      ],
    );
  }
}

Widget _galleryImage(String url) => Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
        child: const Icon(Icons.stadium_outlined,
            size: 60, color: Colors.white30),
      ),
      loadingBuilder: (context, child, progress) =>
          progress == null ? child : Container(color: const Color(0xFFF1F5F9)),
    );

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.onBuy});

  final MembershipPlan plan;
  final ValueChanged<MembershipPlan> onBuy;

  @override
  Widget build(BuildContext context) {
    final colors = switch (plan.planType) {
      'session' => (AppColors.primary, const Color(0x120E9F6E)),
      'sessions_pack' => (AppColors.warningDeep, const Color(0x1AC27803)),
      _ => (AppColors.secondary, const Color(0x148B5CF6)),
    };
    final icon = switch (plan.planType) {
      'session' => Icons.flash_on_rounded,
      'sessions_pack' => Icons.layers_rounded,
      _ => Icons.calendar_month_rounded,
    };
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.tile),
              color: colors.$2,
            ),
            child: Icon(icon, size: 20, color: colors.$1),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(plan.title, style: Theme.of(context).textTheme.titleSmall),
                Text(
                  plan.typeLabelFa,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${formatPriceOnly(plan.price)} تومان',
                style: TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: colors.$1,
                ),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: () => onBuy(plan),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    gradient: AppColors.gradientPrimary,
                    borderRadius: BorderRadius.circular(AppRadius.chip),
                  ),
                  child: const Text(
                    'خرید',
                    style: TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
