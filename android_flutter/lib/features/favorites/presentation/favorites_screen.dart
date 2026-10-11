import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/venue_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _favorites = [];

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
      final favorites = await VenueService.getFavorites();
      if (!mounted) return;
      setState(() {
        _favorites = favorites;
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

  Future<void> _removeFavorite(Map<String, dynamic> venue) async {
    final venueId = venue['id'].toString();
    try {
      await VenueService.removeFromFavorites(venueId);
      if (!mounted) return;
      setState(() => _favorites.removeWhere((v) => v['id'].toString() == venueId));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('از علاقه‌مندی‌ها حذف شد'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطا: $e'), behavior: SnackBarBehavior.floating),
      );
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
              'علاقه‌مندی‌ها',
              style: AppTypography.h6.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          if (_loading)
            const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: AppSpacing.md),
                  ElevatedButton(onPressed: _load, child: const Text('تلاش مجدد')),
                ],
              ),
            )
          else if (_favorites.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.favorite_border,
                      size: 64,
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'هنوز موردی به علاقه‌مندی‌ها اضافه نشده',
                      style: AppTypography.bodyMedium.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/venues'),
                      icon: const Icon(Icons.search),
                      label: const Text('جستجوی سالن'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.xl,
                          vertical: AppSpacing.md,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: AppRadius.buttonBorderRadius,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final venue = _favorites[index] as Map<String, dynamic>;
                    return _buildFavoriteCard(context, venue);
                  },
                  childCount: _favorites.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFavoriteCard(BuildContext context, Map<String, dynamic> venue) {
    final name = (venue['name'] ?? '').toString();
    final address = (venue['address'] ?? '').toString();
    final price = (venue['price'] as num?) ?? (venue['default_slot_price'] as num?) ?? 0;
    final rating = (venue['average_rating'] as num?) ?? 0.0;
    final category = (venue['category'] ?? '').toString() == 'gym' ? 'باشگاه' : 'فوتسال';

    return Dismissible(
      key: Key(venue['id'].toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: AppRadius.cardBorderRadius,
        ),
        child: const Icon(
          Icons.delete_outline,
          color: Colors.white,
          size: 28,
        ),
      ),
      onDismissed: (_) => _removeFavorite(venue),
      child: InkWell(
        onTap: () => context.push('/venues/${venue['id']}'),
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
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.navy, AppColors.blue],
                  ),
                  borderRadius: AppRadius.imageBorderRadius,
                ),
                child: const Icon(
                  Icons.sports_soccer,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 14, color: AppColors.amber),
                        const SizedBox(width: AppSpacing.xs),
                        Expanded(
                          child: Text(
                            address,
                            style: AppTypography.caption.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.6),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm,
                            vertical: AppSpacing.xs,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.blue.withOpacity(0.1),
                            borderRadius: AppRadius.chipBorderRadius,
                          ),
                          child: Text(
                            category,
                            style: AppTypography.caption.copyWith(
                              color: AppColors.blue,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        const Icon(Icons.star, size: 14, color: AppColors.amber),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          rating.toStringAsFixed(1),
                          style: AppTypography.caption,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    FaFormat.toman(price),
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.blue,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  IconButton(
                    icon: const Icon(Icons.favorite, color: AppColors.error, size: 20),
                    onPressed: () => _removeFavorite(venue),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
