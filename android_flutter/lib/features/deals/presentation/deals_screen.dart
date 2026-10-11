import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/deal_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class DealsScreen extends ConsumerStatefulWidget {
  const DealsScreen({super.key});

  @override
  ConsumerState<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends ConsumerState<DealsScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _deals = [];

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
      final deals = await DealService.getAvailableDeals();
      if (!mounted) return;
      setState(() {
        _deals = deals;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('پیشنهادات ویژه',
                style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
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
                    : _deals.isEmpty
                        ? SliverFillRemaining(
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.local_offer_outlined,
                                    size: 64,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withOpacity(0.3),
                                  ),
                                  const SizedBox(height: AppSpacing.md),
                                  Text(
                                    'تخفیف فعالی موجود نیست',
                                    style: AppTypography.h6.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildDealCard(
                                  context, _deals[index] as Map<String, dynamic>),
                              childCount: _deals.length,
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildDealCard(BuildContext context, Map<String, dynamic> deal) {
    final venueName = (deal['venue_name'] ?? 'سالن').toString();
    final discountPercent = (deal['discount_percent'] as num?) ?? 0;
    final originalPrice = (deal['original_price'] as num?) ?? 0;
    final dealPrice = (deal['deal_price'] as num?) ?? 0;
    final slotDate = (deal['slot_date'] ?? '').toString();
    final startTime = (deal['start_time'] ?? '').toString();
    final expiresAt = (deal['deal_expires_at'] ?? '').toString();
    final venueId = deal['venue_id'];

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.amber, AppColors.amberDark]),
        borderRadius: AppRadius.cardBorderRadius,
      ),
      child: Stack(
        children: [
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
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
                          color: Colors.white,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppRadius.chipBorderRadius,
                      ),
                      child: Text(
                        '${FaFormat.faNum(discountPercent)}٪ تخفیف',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.amberDark,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: Colors.white),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      '${JalaliDate.formatIsoDate(slotDate)} — ${FaFormat.time(startTime)}',
                      style: AppTypography.bodyMedium
                          .copyWith(color: Colors.white.withOpacity(0.9)),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Text(
                      FaFormat.price(originalPrice),
                      style: AppTypography.caption.copyWith(
                        color: Colors.white.withOpacity(0.7),
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      FaFormat.price(dealPrice),
                      style: AppTypography.bodyLarge.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                if (expiresAt.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 14, color: Colors.white),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        'مهلت: ${JalaliDate.formatIsoDateTime(expiresAt)}',
                        style: AppTypography.caption
                            .copyWith(color: Colors.white.withOpacity(0.8)),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  text: 'رزرو این سانس',
                  onPressed: venueId == null
                      ? null
                      : () => context.push('/venues/$venueId'),
                  gradient: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
