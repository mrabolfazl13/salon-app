import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/competition_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class CompetitionsScreen extends ConsumerStatefulWidget {
  const CompetitionsScreen({super.key});

  @override
  ConsumerState<CompetitionsScreen> createState() => _CompetitionsScreenState();
}

class _CompetitionsScreenState extends ConsumerState<CompetitionsScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _items = [];

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
      final items = await CompetitionService.getActive();
      if (!mounted) return;
      setState(() {
        _items = items;
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
            title: Text(
              'رقابت‌های داغ',
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700),
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
                    : _items.isEmpty
                        ? SliverFillRemaining(
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.emoji_events_outlined,
                                    size: 64,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withOpacity(0.3),
                                  ),
                                  const SizedBox(height: AppSpacing.md),
                                  Text(
                                    'رقابت فعالی جریان ندارد',
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
                              (context, index) => _buildCard(
                                context,
                                _items[index] as Map<String, dynamic>,
                              ),
                              childCount: _items.length,
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(BuildContext context, Map<String, dynamic> item) {
    final venueName = (item['venue_name'] ?? 'سالن').toString();
    final date = (item['date'] ?? '').toString();
    final startTime = (item['start_time'] ?? '').toString();
    final currentPrice = (item['current_price'] as num?) ?? 0;
    final bestPrice = (item['best_price'] as num?) ?? 0;
    final bidCount = (item['bid_count'] as num?) ?? 0;
    final expiresAt = (item['expires_at'] ?? '').toString();
    final venueId = item['venue_id'];

    return InkWell(
      onTap: venueId == null ? null : () => context.push('/venues/$venueId'),
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.amber, AppColors.amberDark],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
          borderRadius: AppRadius.cardBorderRadius,
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
                        fontWeight: FontWeight.w700, color: AppColors.amberInk),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.gavel, size: 14, color: AppColors.amberDark),
                      const SizedBox(width: 4),
                      Text(
                        '${FaFormat.faNum(bidCount)} پیشنهاد',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.amberDark,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(Icons.calendar_today,
                    size: 14, color: AppColors.amberInk),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '${JalaliDate.formatIsoDate(date)} — ${FaFormat.time(startTime)}',
                  style: AppTypography.bodyMedium
                      .copyWith(color: AppColors.amberInk),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'قیمت سانس: ${FaFormat.price(currentPrice)}',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.amberInk.withOpacity(0.8)),
                    ),
                    Text(
                      'بهترین پیشنهاد: ${FaFormat.price(bestPrice)}',
                      style: AppTypography.bodyLarge.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.amberInk,
                      ),
                    ),
                  ],
                ),
                if (expiresAt.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: AppColors.amberInk.withOpacity(0.15),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Text(
                      'مهلت: ${JalaliDate.formatIsoDateTime(expiresAt)}',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.amberInk),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
