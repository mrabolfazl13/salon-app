import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/venue_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class VenuesScreen extends StatefulWidget {
  const VenuesScreen({super.key});

  @override
  State<VenuesScreen> createState() => _VenuesScreenState();
}

class _VenuesScreenState extends State<VenuesScreen> {
  final _searchController = TextEditingController();
  String? _selectedCategory; // null = همه
  bool _loading = true;
  String? _error;
  List<dynamic> _venues = [];

  static const _categories = <String?, String>{null: 'همه', 'futsal': 'فوتسال', 'gym': 'باشگاه'};

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
      final venues = await VenueService.getVenues(
        search: _searchController.text,
        category: _selectedCategory,
      );
      if (!mounted) return;
      setState(() {
        _venues = venues;
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
      appBar: AppBar(
        title: const Text('سالن‌ها'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _load(),
                  decoration: InputDecoration(
                    hintText: 'جستجوی سالن...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 20),
                            onPressed: () {
                              _searchController.clear();
                              _load();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkSurface
                        : Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: AppRadius.mediumBorderRadius,
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.entries.map((entry) {
                      final isSelected = entry.key == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: FilterChip(
                          label: Text(entry.value),
                          selected: isSelected,
                          onSelected: (_) {
                            setState(() => _selectedCategory = entry.key);
                            _load();
                          },
                          backgroundColor: Theme.of(context).brightness ==
                                  Brightness.dark
                              ? AppColors.darkSurface
                              : Colors.grey[100],
                          selectedColor: AppColors.blue.withOpacity(0.15),
                          checkmarkColor: AppColors.blue,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AppColors.blue
                                : Theme.of(context).colorScheme.onSurface,
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.w400,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                            side: BorderSide(
                              color: isSelected
                                  ? AppColors.blue
                                  : Theme.of(context).dividerColor,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: AppSpacing.md),
                            ElevatedButton(onPressed: _load, child: const Text('تلاش مجدد')),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: _venues.isEmpty
                            ? ListView(
                                children: const [
                                  SizedBox(height: 120),
                                  Center(child: Text('سالنی یافت نشد')),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(AppSpacing.md),
                                itemCount: _venues.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: AppSpacing.md),
                                itemBuilder: (context, index) {
                                  final venue =
                                      _venues[index] as Map<String, dynamic>;
                                  return _VenueCard(venue: venue);
                                },
                              ),
                      ),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNavBar(currentIndex: 1),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _VenueCard extends StatelessWidget {
  final Map<String, dynamic> venue;

  const _VenueCard({required this.venue});

  @override
  Widget build(BuildContext context) {
    final name = (venue['name'] ?? '').toString();
    final address = (venue['address'] ?? '').toString();
    final rating = (venue['average_rating'] as num?) ?? 0.0;
    final totalReviews = (venue['total_reviews'] as num?) ?? 0;
    final price = (venue['price'] as num?) ?? (venue['default_slot_price'] as num?) ?? 0;
    final isVerified = venue['is_verified'] == true;
    final imageUrl = VenueMedia.firstUrl(venue['images']);
    final amenities = VenueMedia.parseList(venue['amenities']).take(3).toList();

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.cardBorderRadius,
        side: BorderSide(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: InkWell(
        onTap: () => context.push('/venues/${venue['id']}'),
        borderRadius: AppRadius.cardBorderRadius,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  height: 160,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.blue.withOpacity(0.3),
                        AppColors.navy.withOpacity(0.5),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(AppRadius.card),
                    ),
                  ),
                  child: imageUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(AppRadius.card),
                          ),
                          child: CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => const Center(
                              child: Icon(Icons.sports_soccer,
                                  size: 64, color: Colors.white30),
                            ),
                          ),
                        )
                      : Center(
                          child: Icon(
                            Icons.sports_soccer,
                            size: 64,
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                ),
                if (isVerified)
                  Positioned(
                    bottom: 8,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.verified, size: 14, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            'تایید شده',
                            style: AppTypography.caption.copyWith(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.star,
                          size: 14,
                          color: AppColors.amber,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (totalReviews > 0) ...[
                          const SizedBox(width: 2),
                          Text(
                            '(${FaFormat.faNum(totalReviews)})',
                            style: TextStyle(
                                fontSize: 10, color: Colors.grey.shade600),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),

            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: AppTypography.h6.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),

                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.5),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          address,
                          style: AppTypography.bodyMedium.copyWith(
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
                  if (amenities.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: 6,
                      children: amenities
                          .map(
                            (tag) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.blue.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                tag,
                                style: AppTypography.caption.copyWith(
                                  color: AppColors.blue,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.sm),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'شروع قیمت از',
                            style: AppTypography.caption.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.5),
                            ),
                          ),
                          Text(
                            FaFormat.price(price),
                            style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: () =>
                            context.push('/venues/${venue['id']}'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blue,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: 10,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: AppRadius.buttonBorderRadius,
                          ),
                        ),
                        child: const Text('مشاهده'),
                      ),
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
