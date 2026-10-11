import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/booking_service.dart';
import '../../../core/network/loyalty_service.dart';
import '../../../core/network/review_service.dart';
import '../../../core/network/venue_service.dart';
import '../../../core/state/auth_provider.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

/// پارتی کامل با نسخه موبایل Tauri (React): گالری، امتیاز، امکانات، درباره،
/// انتخابگر ۱۴ روز شمسی، کارت اسلات بر اساس وضعیت، تماس، نظرات، نوار رزرو چسبان.
class VenueDetailScreen extends ConsumerStatefulWidget {
  final String venueId;

  const VenueDetailScreen({super.key, required this.venueId});

  @override
  ConsumerState<VenueDetailScreen> createState() => _VenueDetailScreenState();
}

class _VenueDetailScreenState extends ConsumerState<VenueDetailScreen> {
  static const _statusHints = {
    'booked': 'رزرو شده',
    'blocked': 'مسدود',
    'reserved': 'رزرو قرارداد',
  };

  Map<String, dynamic>? _venue;
  List<dynamic> _slots = [];
  List<dynamic> _reviews = [];
  List<dynamic> _plans = [];
  bool _loading = true;
  String? _error;

  late String _selectedDateIso;
  String? _selectedSlotId;
  bool _isFavorite = false;
  int? _loyaltyBalance;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDateIso = _iso(now);
    _load();
  }

  String _iso(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  List<DateTime> get _dateWindow {
    final today = DateTime.now();
    return List.generate(14, (i) => DateTime(today.year, today.month, today.day + i));
  }

  bool get _isLoggedIn => ref.read(isAuthenticatedProvider);

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final window = _dateWindow;
      final results = await Future.wait([
        VenueService.getVenue(widget.venueId),
        VenueService.getVenueSlotsRange(
          widget.venueId,
          startDate: _iso(window.first),
          endDate: _iso(window.last),
        ),
        ReviewService.getVenueReviews(widget.venueId),
        if (_isLoggedIn) VenueService.isFavorite(widget.venueId) else Future.value(false),
        if (_isLoggedIn) LoyaltyService.getMy() else Future.value(null),
      ]);

      final plans = (results[0] as Map<String, dynamic>)['category'] == 'gym'
          ? await VenueService.getMembershipPlans(widget.venueId)
          : <dynamic>[];

      if (!mounted) return;
      setState(() {
        _venue = results[0] as Map<String, dynamic>;
        _slots = results[1] as List<dynamic>;
        _reviews = results[2] as List<dynamic>;
        _isFavorite = results[3] as bool;
        final loyalty = results[4] as Map<String, dynamic>?;
        _loyaltyBalance = loyalty?['balance'] as int?;
        _plans = plans;
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

  Future<void> _toggleFavorite() async {
    if (!_isLoggedIn) {
      context.push('/login');
      return;
    }
    try {
      if (_isFavorite) {
        await VenueService.removeFromFavorites(widget.venueId);
      } else {
        await VenueService.addToFavorites(widget.venueId);
      }
      if (!mounted) return;
      setState(() => _isFavorite = !_isFavorite);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_isFavorite ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد'),
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  List<dynamic> get _slotsForSelectedDate {
    final daySlots = _slots.where((s) {
      final d = (s['slot_date'] ?? '').toString();
      return d.substring(0, 10) == _selectedDateIso;
    }).toList();
    daySlots.sort((a, b) =>
        (a['start_time'] ?? '').toString().compareTo((b['start_time'] ?? '').toString()));
    return daySlots;
  }

  Map<String, dynamic>? get _selectedSlot {
    if (_selectedSlotId == null) return null;
    for (final s in _slotsForSelectedDate) {
      if (s['id'].toString() == _selectedSlotId) return s as Map<String, dynamic>;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                        child: Text(_error!, textAlign: TextAlign.center),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ElevatedButton(onPressed: _load, child: const Text('تلاش مجدد')),
                    ],
                  ),
                )
              : _buildContent(),
      bottomNavigationBar: _venue == null ? null : _buildBookingBar(),
    );
  }

  Widget _buildContent() {
    final venue = _venue!;
    final name = (venue['name'] ?? '').toString();
    final address = (venue['address'] ?? '').toString();
    final rating = (venue['average_rating'] as num?) ?? 0.0;
    final totalReviews = (venue['total_reviews'] as num?) ?? 0;
    final amenities = VenueMedia.parseList(venue['amenities']);
    final description = (venue['description'] ?? '').toString();
    final phone = (venue['phone'] ?? '').toString();
    final isVerified = venue['is_verified'] == true;
    final isGym = venue['category'] == 'gym';

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHero(isVerified),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
                        ),
                      ),
                      const Icon(Icons.star, size: 20, color: AppColors.amber),
                      const SizedBox(width: 4),
                      Text(
                        '${FaFormat.faNum(rating)} (${FaFormat.faNum(totalReviews)})',
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 16, color: AppColors.darkTextSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          address,
                          style: AppTypography.bodyMedium
                              .copyWith(color: AppColors.darkTextSecondary),
                        ),
                      ),
                    ],
                  ),
                  if (amenities.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: amenities
                          .map((a) => Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.amber.withOpacity(0.1),
                                  borderRadius: AppRadius.chipBorderRadius,
                                ),
                                child: Text(
                                  a,
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.amberDark,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
                  ],
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.lg),
                    Container(
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
                          Text('درباره سالن',
                              style: AppTypography.h6
                                  .copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: AppSpacing.sm),
                          Text(description,
                              style: AppTypography.bodyMedium
                                  .copyWith(height: 1.8)),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xl),

                  if (isGym) ...[
                    Text('پلن‌های عضویت',
                        style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: AppSpacing.md),
                    if (_plans.isEmpty)
                      const Text('پلنی برای این باشگاه ثبت نشده است')
                    else
                      ..._plans.map((p) => _buildPlanCard(p as Map<String, dynamic>)),
                  ] else ...[
                    _buildDateSelector(),
                    const SizedBox(height: AppSpacing.lg),
                    Text('انتخاب ساعت',
                        style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: AppSpacing.md),
                    _buildSlotGrid(),
                  ],

                  if (phone.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xl),
                    _buildContactCard(phone),
                  ],

                  const SizedBox(height: AppSpacing.xl),
                  Text('نظرات کاربران',
                      style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.md),
                  if (_reviews.isEmpty)
                    Text('هنوز نظری ثبت نشده است',
                        style: AppTypography.bodyMedium
                            .copyWith(color: AppColors.darkTextSecondary))
                  else
                    ..._reviews.map((r) => _buildReviewCard(r as Map<String, dynamic>)),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------- Hero ----------

  Widget _buildHero(bool isVerified) {
    final images = VenueMedia.parseList(_venue!['images']);
    return SizedBox(
      height: 260,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (images.isNotEmpty)
            PageView.builder(
              itemCount: images.length,
              itemBuilder: (context, i) => CachedNetworkImage(
                imageUrl: VenueMedia.fullUrl(images[i]),
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => _heroFallback(),
              ),
            )
          else
            _heroFallback(),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black38, Colors.transparent, Colors.black26],
                stops: [0, 0.4, 1],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _HeroButton(
                    icon: Icons.arrow_back,
                    onTap: () => Navigator.maybePop(context),
                  ),
                  _HeroButton(
                    icon: _isFavorite ? Icons.favorite : Icons.favorite_border,
                    color: _isFavorite ? AppColors.error : Colors.white,
                    onTap: _toggleFavorite,
                  ),
                ],
              ),
            ),
          ),
          if (isVerified)
            Positioned(
              bottom: 12,
              right: AppSpacing.lg,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.9),
                  borderRadius: AppRadius.chipBorderRadius,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text('تایید شده',
                        style: AppTypography.caption.copyWith(color: Colors.white)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _heroFallback() => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.pitch, AppColors.navy],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: const Center(
          child: Icon(Icons.stadium, size: 72, color: Colors.white24),
        ),
      );

  // ---------- Date selector ----------

  Widget _buildDateSelector() {
    return SizedBox(
      height: 84,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _dateWindow.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final date = _dateWindow[i];
          final iso = _iso(date);
          final isSelected = iso == _selectedDateIso;
          return InkWell(
            onTap: () => setState(() {
              _selectedDateIso = iso;
              final sel = _selectedSlot;
              if (sel == null) _selectedSlotId = null;
            }),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: 62,
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [AppColors.amber, Color(0xFFEA580C)])
                    : null,
                color: isSelected
                    ? null
                    : Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkSurface
                        : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? Colors.transparent
                      : Theme.of(context).dividerColor,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    i == 0 ? 'امروز' : FaFormat.weekday(date),
                    style: AppTypography.caption.copyWith(
                      color: isSelected ? AppColors.amberInk : AppColors.darkTextSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    FaFormat.jalaliDay(date),
                    style: AppTypography.h5.copyWith(
                      fontWeight: FontWeight.w800,
                      color: isSelected ? AppColors.amberInk : null,
                    ),
                  ),
                  Text(
                    FaFormat.jalaliMonth(date),
                    style: AppTypography.caption.copyWith(
                      color: isSelected
                          ? AppColors.amberInk.withOpacity(0.8)
                          : AppColors.darkTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ---------- Slots ----------

  Widget _buildSlotGrid() {
    final slots = _slotsForSelectedDate;
    if (slots.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkSurface
              : Colors.white,
          borderRadius: AppRadius.cardBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Icon(Icons.event_busy,
                size: 40,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
            const SizedBox(height: AppSpacing.sm),
            Text('اسلاتی یافت نشد',
                style: AppTypography.bodyMedium
                    .copyWith(color: AppColors.darkTextSecondary)),
          ],
        ),
      );
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.9,
      ),
      itemCount: slots.length,
      itemBuilder: (context, i) => _buildSlotCard(slots[i] as Map<String, dynamic>),
    );
  }

  Widget _buildSlotCard(Map<String, dynamic> slot) {
    final status = (slot['status'] ?? 'available').toString();
    final hint = _statusHints[status];
    final isBidable = status == 'in_competition';
    final isAvailable = status == 'available' || isBidable;
    final isSelected = _selectedSlotId == slot['id'].toString();
    final price = (slot['current_price'] as num?) ?? (slot['base_price'] as num?) ?? 0;
    final startTime = (slot['start_time'] ?? '').toString();
    final duration = (slot['duration'] as num?)?.toInt() ?? 0;

    return InkWell(
      onTap: isAvailable
          ? () {
              if (isBidable) {
                _showBidDialog(slot);
              } else {
                setState(() => _selectedSlotId = slot['id'].toString());
              }
            }
          : null,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          gradient: isSelected
              ? const LinearGradient(colors: [AppColors.amber, Color(0xFFEA580C)])
              : null,
          color: isSelected
              ? null
              : !isAvailable
                  ? Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkBackground
                      : Colors.grey.shade100
                  : Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkSurface
                      : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : !isAvailable
                    ? Colors.transparent
                    : Theme.of(context).dividerColor,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  FaFormat.time(startTime),
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w800,
                    color: isSelected
                        ? AppColors.amberInk
                        : !isAvailable
                            ? Theme.of(context).colorScheme.onSurface.withOpacity(0.4)
                            : null,
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle, size: 18, color: AppColors.amberInk)
                else if (!isAvailable)
                  Icon(
                    status == 'booked' ? Icons.do_not_disturb_on : Icons.block,
                    size: 16,
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              hint ?? '${FaFormat.faNum(duration)} دقیقه',
              style: AppTypography.caption.copyWith(
                color: isSelected
                    ? AppColors.amberInk.withOpacity(0.8)
                    : !isAvailable
                        ? Theme.of(context).colorScheme.onSurface.withOpacity(0.35)
                        : AppColors.darkTextSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (isBidable)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.blue.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'رقابت با بقیه',
                      style: AppTypography.caption.copyWith(
                          fontSize: 10, color: AppColors.blue),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Text(
                  FaFormat.price(price),
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isSelected
                        ? AppColors.amberInk
                        : !isAvailable
                            ? Theme.of(context).colorScheme.onSurface.withOpacity(0.35)
                            : AppColors.success,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------- Membership plans (gym) ----------

  Widget _buildPlanCard(Map<String, dynamic> plan) {
    final title = (plan['title'] ?? plan['name'] ?? '').toString();
    final price = (plan['price'] as num?) ?? 0;
    final durationDays = (plan['duration_days'] as num?) ?? 0;
    final description = (plan['description'] ?? '').toString();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: AppColors.amber.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AppTypography.bodyLarge
                        .copyWith(fontWeight: FontWeight.w700)),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(description,
                      style: AppTypography.caption
                          .copyWith(color: AppColors.darkTextSecondary)),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(FaFormat.price(price),
                  style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w700, color: AppColors.amberDark)),
              Text('${FaFormat.faNum(durationDays)} روزه',
                  style: AppTypography.caption
                      .copyWith(color: AppColors.darkTextSecondary)),
            ],
          ),
        ],
      ),
    );
  }

  // ---------- Contact ----------

  Widget _buildContactCard(String phone) {
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              borderRadius: AppRadius.smallBorderRadius,
            ),
            child: const Icon(Icons.phone, size: 20, color: AppColors.success),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('تماس با سالن',
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(FaFormat.digits(phone),
                    style: AppTypography.caption
                        .copyWith(color: AppColors.darkTextSecondary)),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: () => launchUrl(Uri.parse('tel:$phone'),
                mode: LaunchMode.externalApplication),
            icon: const Icon(Icons.call, size: 18),
            label: const Text('تماس'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: AppRadius.buttonBorderRadius),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Reviews ----------

  Widget _buildReviewCard(Map<String, dynamic> review) {
    String userName = 'کاربر';
    final userField = review['user'];
    if (userField is Map) {
      userName = (userField['full_name'] ?? userName).toString();
    } else if (review['user_name'] != null) {
      userName = review['user_name'].toString();
    }
    final rating = (review['rating'] as num?) ?? 0;
    final comment = (review['comment'] ?? '').toString();
    final createdAt = (review['created_at'] ?? '').toString();
    return Container(
      width: double.infinity,
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
              Text(userName,
                  style: AppTypography.bodyMedium
                      .copyWith(fontWeight: FontWeight.w600)),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < rating ? Icons.star : Icons.star_border,
                    size: 14,
                    color: AppColors.amber,
                  ),
                ),
              ),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(comment, style: AppTypography.bodyMedium.copyWith(height: 1.7)),
          ],
          const SizedBox(height: AppSpacing.xs),
          Text(
            JalaliDate.formatIsoDate(createdAt),
            style: AppTypography.caption
                .copyWith(color: AppColors.darkTextSecondary),
          ),
        ],
      ),
    );
  }

  // ---------- Booking bar ----------

  Widget _buildBookingBar() {
    final isGym = _venue?['category'] == 'gym';
    final slot = _selectedSlot;
    final price = (slot?['current_price'] as num?) ?? (slot?['base_price'] as num?) ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.md,
        bottom: MediaQuery.of(context).padding.bottom + AppSpacing.md,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isGym)
                  Text('عضویت باشگاه',
                      style: AppTypography.bodyLarge
                          .copyWith(fontWeight: FontWeight.w700))
                else if (slot != null) ...[
                  Text(FaFormat.price(price),
                      style: AppTypography.h6
                          .copyWith(fontWeight: FontWeight.w800)),
                  Text(
                    '${FaFormat.time((slot['start_time'] ?? '').toString())} — ${FaFormat.slotEndTime((slot['start_time'] ?? '').toString(), (slot['duration'] as num?)?.toInt() ?? 0)}',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.darkTextSecondary),
                  ),
                ] else
                  Text('سانسی انتخاب نشده',
                      style: AppTypography.bodyMedium
                          .copyWith(color: AppColors.darkTextSecondary)),
              ],
            ),
          ),
          if (!isGym)
            SizedBox(
              width: 150,
              height: 48,
              child: ElevatedButton(
                onPressed: slot == null ? null : _openBookingSheet,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.amber,
                  foregroundColor: AppColors.amberInk,
                  disabledBackgroundColor: AppColors.amber.withOpacity(0.4),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorderRadius),
                ),
                child: Text('رزرو سانس',
                    style: AppTypography.bodyLarge
                        .copyWith(fontWeight: FontWeight.w700)),
              ),
            ),
        ],
      ),
    );
  }

  // ---------- Booking sheet ----------

  void _openBookingSheet() {
    if (!_isLoggedIn) {
      context.push('/login');
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _BookingSheet(
        venue: _venue!,
        slot: _selectedSlot!,
        loyaltyBalance: _loyaltyBalance,
      ),
    ).then((createdBooking) {
      if (createdBooking is Map<String, dynamic> && mounted) {
        context.push('/bookings/${createdBooking['id']}');
      }
    });
  }

  // ---------- Competition bid ----------

  void _showBidDialog(Map<String, dynamic> slot) {
    final user = ref.read(authProvider).value;
    if (user?.role != 'venue_manager' && user?.role != 'super_admin') {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('رقابت قیمت فقط برای مدیران سالن فعال است'),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    final currentPrice = (slot['current_price'] as num?) ?? (slot['base_price'] as num?) ?? 0;
    final suggested = ((currentPrice * 0.9) ~/ 1000) * 1000;
    final controller = TextEditingController(text: suggested.toString());
    bool submitting = false;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('مزایده برای این سانس'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'قیمت فعلی: ${FaFormat.price(currentPrice)} — پیشنهاد باید کمتر باشد',
                style: AppTypography.bodyMedium
                    .copyWith(color: AppColors.darkTextSecondary),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'قیمت پیشنهادی (ریال)',
                  border: OutlineInputBorder(
                      borderRadius: AppRadius.mediumBorderRadius),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('انصراف'),
            ),
            ElevatedButton(
              onPressed: submitting
                  ? null
                  : () async {
                      final amount = int.tryParse(controller.text
                          .replaceAll(RegExp(r'[^0-9]'), ''));
                      if (amount == null || amount <= 0 || amount >= currentPrice) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content:
                              Text('مبلغ باید کمتر از ${FaFormat.price(currentPrice)} باشد'),
                          backgroundColor: AppColors.error,
                          behavior: SnackBarBehavior.floating,
                        ));
                        return;
                      }
                      setDialogState(() => submitting = true);
                      try {
                        await ApiClient.instance.post(
                          '/competitions/${slot['id']}/bid',
                          data: {'offered_price': amount},
                        );
                        if (!mounted) return;
                        Navigator.pop(dialogContext);
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('پیشنهاد شما ثبت شد'),
                          backgroundColor: AppColors.success,
                          behavior: SnackBarBehavior.floating,
                        ));
                        _load();
                      } catch (e) {
                        if (!mounted) return;
                        setDialogState(() => submitting = false);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text('خطا: $e'),
                          backgroundColor: AppColors.error,
                          behavior: SnackBarBehavior.floating,
                        ));
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.amber,
                foregroundColor: AppColors.amberInk,
              ),
              child: submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('ثبت پیشنهاد'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------- Hero round button ----------

class _HeroButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _HeroButton({required this.icon, this.color = Colors.white, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black26,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 22, color: color),
        ),
      ),
    );
  }
}

// ---------- Booking confirm sheet ----------

class _BookingSheet extends StatefulWidget {
  final Map<String, dynamic> venue;
  final Map<String, dynamic> slot;
  final int? loyaltyBalance;

  const _BookingSheet({
    required this.venue,
    required this.slot,
    required this.loyaltyBalance,
  });

  @override
  State<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends State<_BookingSheet> {
  final _discountController = TextEditingController();
  bool _useLoyalty = false;
  bool _submitting = false;
  Map<String, dynamic>? _result;

  bool get _canUseLoyalty => (widget.loyaltyBalance ?? 0) > 0;

  @override
  Widget build(BuildContext context) {
    final slot = widget.slot;
    final startTime = (slot['start_time'] ?? '').toString();
    final duration = (slot['duration'] as num?)?.toInt() ?? 0;
    final price = (slot['current_price'] as num?) ?? (slot['base_price'] as num?) ?? 0;
    final slotDate = (slot['slot_date'] ?? '').toString();

    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkBackground
              : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: _result != null
            ? _buildResult()
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Theme.of(context).dividerColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text('تأیید رزرو',
                      style: AppTypography.h5.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: AppSpacing.md),
                  _row('سالن', (widget.venue['name'] ?? '').toString()),
                  _row('تاریخ', JalaliDate.formatIsoDate(slotDate)),
                  _row('ساعت',
                      '${FaFormat.time(startTime)} — ${FaFormat.slotEndTime(startTime, duration)}'),
                  _row('مبلغ', FaFormat.price(price)),
                  const Divider(height: AppSpacing.xl),
                  TextField(
                    controller: _discountController,
                    decoration: InputDecoration(
                      labelText: 'کد تخفیف (اختیاری)',
                      border: OutlineInputBorder(
                          borderRadius: AppRadius.mediumBorderRadius),
                    ),
                  ),
                  if (_canUseLoyalty) ...[
                    const SizedBox(height: AppSpacing.md),
                    CheckboxListTile(
                      value: _useLoyalty,
                      onChanged: (v) => setState(() => _useLoyalty = v ?? false),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      title: Text(
                        'استفاده از امتیاز باشگاه مشتریان',
                        style: AppTypography.bodyMedium,
                      ),
                      subtitle: Text(
                        'موجودی: ${FaFormat.faNum(widget.loyaltyBalance!)} — تا ۵۰٪ تخفیف',
                        style: AppTypography.caption
                            .copyWith(color: AppColors.darkTextSecondary),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'مبلغ نهایی پس از اعمال تخفیف، در سرور محاسبه می‌شود.',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.darkTextSecondary),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.amber,
                        foregroundColor: AppColors.amberInk,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: AppRadius.buttonBorderRadius),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : Text('ثبت رزرو',
                              style: AppTypography.bodyLarge
                                  .copyWith(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: AppTypography.bodyMedium
                    .copyWith(color: AppColors.darkTextSecondary)),
            Text(value,
                style: AppTypography.bodyMedium
                    .copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      );

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final result = await BookingService.createBooking(
        slotId: widget.slot['id'].toString(),
        discountCode: _discountController.text.trim(),
        useLoyaltyPoints: _useLoyalty,
      );
      if (!mounted) return;
      setState(() {
        _result = result;
        _submitting = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      final friendly = e.statusCode == 403
          ? 'برای رزرو، ابتدا شماره موبایل خود را تأیید کنید'
          : (e.message.isNotEmpty ? e.message : 'ثبت رزرو انجام نشد');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(friendly),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Widget _buildResult() {
    final paymentAmount = (_result?['payment_amount'] as num?) ?? 0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: AppSpacing.md),
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: const BoxDecoration(
            color: AppColors.success, shape: BoxShape.circle),
          child: const Icon(Icons.check, size: 40, color: Colors.white),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('رزرو ثبت شد',
            style: AppTypography.h5.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: AppSpacing.sm),
        Text('در انتظار تأیید مدیر سالن',
            style: AppTypography.bodyMedium
                .copyWith(color: AppColors.darkTextSecondary)),
        const SizedBox(height: AppSpacing.sm),
        Text('قابل پرداخت: ${FaFormat.price(paymentAmount)}',
            style: AppTypography.bodyLarge
                .copyWith(fontWeight: FontWeight.w700, color: AppColors.success)),
        const SizedBox(height: AppSpacing.xl),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context, _result),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.amber,
              foregroundColor: AppColors.amberInk,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: AppRadius.buttonBorderRadius),
            ),
            child: Text('مشاهده رزرو',
                style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
      ],
    );
  }

  @override
  void dispose() {
    _discountController.dispose();
    super.dispose();
  }
}
