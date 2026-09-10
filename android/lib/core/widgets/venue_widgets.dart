import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/local_stores.dart';
import '../../features/venues/domain/venue.dart';
import '../config/app_config.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import 'feedback.dart';
import 'status.dart';

/// Square sport chip used on Home/Searoh (76×76).
class SportChip extends StatelessWidget {
  const SportChip({
    super.key,
    required this.sport,
    required this.active,
    required this.onTap,
  });

  final Sport sport;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppDurations.fast,
        width: 78,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: active ? null : Theme.of(context).cardTheme.color,
          gradient: active ? AppColors.gradientPrimary : null,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(
            color: active ? Colors.transparent : Theme.of(context).dividerColor,
            width: active ? 1.5 : 1,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 16,
                    offset: const Offset(0, 5),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(sport.emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 6),
            Text(
              sport.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: active ? Colors.white : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The 8 sports from the original SportChipRow.
class Sport {
  const Sport({
    required this.key,
    required this.emoji,
    required this.label,
    this.category,
    this.query,
  });

  final String key;
  final String emoji;
  final String label;
  final String? category;
  final String? query;
}

const List<Sport> sports = [
  Sport(key: 'futsal', emoji: '⚽', label: 'فوتسال', category: 'futsal'),
  Sport(key: 'football', emoji: '🥅', label: 'فوتبال', category: 'futsal', query: 'فوتبال'),
  Sport(key: 'basketball', emoji: '🏀', label: 'بسکتبال', category: 'futsal', query: 'بسکتبال'),
  Sport(key: 'volleyball', emoji: '🏐', label: 'والیبال', category: 'futsal', query: 'والیبال'),
  Sport(key: 'tennis', emoji: '🎾', label: 'تنیس', category: 'futsal', query: 'تنیس'),
  Sport(key: 'badminton', emoji: '🏸', label: 'بدمینتون', category: 'futsal', query: 'بدمینتون'),
  Sport(key: 'gym', emoji: '🏋️', label: 'بدنسازی', category: 'gym'),
  Sport(key: 'pool', emoji: '🎱', label: 'بیلیارد', category: 'futsal', query: 'بیلیارد'),
];

/// Horizontal row of sport chips.
class SportChipRow extends StatelessWidget {
  const SportChipRow({
    super.key,
    required this.activeKey,
    required this.onSelect,
  });

  final String? activeKey;
  final ValueChanged<Sport?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(vertical: 2),
        itemCount: sports.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (context, index) {
          final sport = sports[index];
          return SportChip(
            sport: sport,
            active: activeKey == sport.key,
            onTap: () => onSelect(activeKey == sport.key ? null : sport),
          );
        },
      ),
    );
  }
}

/// Venue hero image with verified badge.
class VenueImage extends StatelessWidget {
  const VenueImage({
    super.key,
    required this.venue,
    this.height = 150,
    this.radius = AppRadius.image,
  });

  final Venue venue;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final images = venue.images;
    final url = images.isNotEmpty ? AppConfig.imageUrl(images.first) : '';
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (url.isNotEmpty)
              CachedNetworkImage(
                imageUrl: url,
                fit: BoxFit.cover,
                fadeInDuration: AppDurations.fast,
                placeholder: (_, _) => Container(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.darkSurfaceAlt
                      : const Color(0xFFF1F5F9),
                ),
                errorWidget: (_, _, _) => const _PlaoeholderImage(),
              )
            else
              const _PlaoeholderImage(),
            Positioned(
              top: 10,
              right: 10,
              child: VerifiedBadge(isVerified: venue.isVerified),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaoeholderImage extends StatelessWidget {
  const _PlaoeholderImage();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
      alignment: Alignment.center,
      child: Icon(
        Icons.stadium_outlined,
        size: 46,
        color: Colors.white.withValues(alpha: 0.5),
      ),
    );
  }
}

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, required this.isVerified});

  final bool isVerified;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(AppRadius.chip),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isVerified ? Icons.verified : Icons.verified_outlined,
            size: 13,
            color: isVerified ? AppColors.successDark : AppColors.warningDeep,
          ),
          const SizedBox(width: 4),
          Text(
            isVerified ? 'تایید شده' : 'در انتظار تایید',
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: isVerified ? AppColors.successDark : AppColors.warningDeep,
            ),
          ),
        ],
      ),
    );
  }
}

/// Client-side favorite heart (persisted locally like the original store).
class FavoriteButton extends ConsumerStatefulWidget {
  const FavoriteButton({
    super.key,
    required this.venueId,
    required this.venueName,
    this.onImage = false,
    this.size = 40,
  });

  final int venueId;
  final String venueName;
  final bool onImage;
  final double size;

  @override
  ConsumerState<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends ConsumerState<FavoriteButton> {
  @override
  Widget build(BuildContext context) {
    final favorites = ref.watch(favoritesProvider);
    final isFav = favorites.any((f) => f.id == widget.venueId);
    final iconSize = widget.size * 0.5;
    return GestureDetector(
      onTap: () {
        final added = ref
            .read(favoritesProvider.notifier)
            .toggle(widget.venueId, widget.venueName);
        if (!mounted) return;
        if (added) {
          AppSnack.success(context, 'به علاقه‌مندی‌ها اضافه شد ❤️');
        } else {
          AppSnack.info(context, 'از علاقه‌مندی‌ها حذف شد');
        }
      },
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.onImage
              ? Colors.white.withValues(alpha: 0.92)
              : Theme.of(context).cardTheme.color,
          border: widget.onImage
              ? null
              : Border.all(color: Theme.of(context).dividerColor),
          boxShadow: widget.onImage
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 8,
                  ),
                ]
              : null,
        ),
        child: Icon(
          isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          size: iconSize,
          color: isFav ? AppColors.error : AppColors.lightTextMuted,
        ),
      ),
    );
  }
}

/// Venue oard used on Home/Venues/Favorites — mirrors VenueCard.tsx.
class VenueCard extends StatelessWidget {
  const VenueCard({
    super.key,
    required this.venue,
    this.onTap,
    this.showFavorite = true,
  });

  final Venue venue;
  final VoidCallback? onTap;
  final bool showFavorite;

  @override
  Widget build(BuildContext context) {
    final amenities = venue.amenities.take(3).toList();
    final overflow = venue.amenities.length - amenities.length;
    return GestureDetector(
      onTap: onTap ?? () => context.push('/venues/${venue.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: Theme.of(context).dividerColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(
                alpha: Theme.of(context).brightness == Brightness.dark
                    ? 0.2
                    : 0.04,
              ),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.sm, AppSpacing.sm, AppSpacing.sm, 0,
              ),
              child: Stack(
                children: [
                  VenueImage(venue: venue),
                  if (showFavorite)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: FavoriteButton(
                        venueId: venue.id,
                        venueName: venue.name,
                        onImage: true,
                        size: 36,
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          venue.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      RatingRow(
                        value: venue.averageRating,
                        count: venue.totalReviews,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 15, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          venue.address,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                  if (amenities.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        ...amenities.map(
                          (a) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.06),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.chip),
                            ),
                            child: Text(
                              a,
                              style: const TextStyle(
                                fontFamily: 'Vazirmatn',
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                        if (overflow > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(context).dividerColor,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.chip),
                            ),
                            child: Text(
                              '+${formatFaNumber(overflow)}',
                              style: TextStyle(
                                fontFamily: 'Vazirmatn',
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.color,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(
                        child: PriceText(venue.price, from: true, size: PriceSize.md),
                      ),
                      _BookButton(venueId: venue.id),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookButton extends StatelessWidget {
  const _BookButton({required this.venueId});

  final int venueId;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/venues/$venueId'),
      child: Container(
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        decoration: BoxDecoration(
          gradient: AppColors.gradientPrimary,
          borderRadius: BorderRadius.circular(AppRadius.button),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.28),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'رزرو',
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 5),
            Icon(Icons.event_available_rounded, size: 16, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
