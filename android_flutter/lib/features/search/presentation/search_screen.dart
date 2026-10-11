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

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  String? _selectedCategory; // null = همه
  bool _loading = false;
  bool _touched = false;
  String? _error;
  List<dynamic> _venues = [];

  static const _categories = <String?, String>{null: 'همه', 'futsal': 'فوتسال', 'gym': 'باشگاه'};

  @override
  void initState() {
    super.initState();
    _search();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
      _touched = true;
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
      bottomNavigationBar: const AppBottomNavBar(),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text(
              'جستجو',
              style: AppTypography.h6.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(70),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(),
                  decoration: InputDecoration(
                    hintText: 'جستجوی سالن، بازیکن، تیم...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _search();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkSurface
                        : Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: AppRadius.buttonBorderRadius,
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Category filter
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: _categories.entries
                    .map((entry) => _buildFilterChip(entry.value, entry.key))
                    .toList(),
              ),
            ),
          ),

          // Results
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
                                onPressed: _search, child: const Text('تلاش مجدد')),
                          ],
                        ),
                      )
                    : _venues.isEmpty
                        ? SliverFillRemaining(
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.search_off,
                                    size: 64,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withOpacity(0.3),
                                  ),
                                  const SizedBox(height: AppSpacing.md),
                                  Text(
                                    _touched ? 'نتیجه‌ای یافت نشد' : 'جستجو کنید...',
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
                              (context, index) {
                                final venue =
                                    _venues[index] as Map<String, dynamic>;
                                return _buildVenueCard(context, venue);
                              },
                              childCount: _venues.length,
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? value) {
    final isSelected = _selectedCategory == value;
    return InkWell(
      onTap: () {
        setState(() => _selectedCategory = value);
        _search();
      },
      borderRadius: AppRadius.chipBorderRadius,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.blue
              : Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkSurface
                  : Colors.grey[100],
          borderRadius: AppRadius.chipBorderRadius,
          border: Border.all(
            color: isSelected ? AppColors.blue : Theme.of(context).dividerColor,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.bodyMedium.copyWith(
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected
                ? Colors.white
                : Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }

  Widget _buildVenueCard(BuildContext context, Map<String, dynamic> venue) {
    final name = (venue['name'] ?? '').toString();
    final address = (venue['address'] ?? '').toString();
    final price = (venue['price'] as num?) ?? (venue['default_slot_price'] as num?) ?? 0;
    final rating = (venue['average_rating'] as num?) ?? 0.0;

    return InkWell(
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
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.navy, AppColors.blue],
                ),
                borderRadius: AppRadius.imageBorderRadius,
              ),
              child: const Icon(
                Icons.sports_soccer,
                color: Colors.white,
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
                      fontWeight: FontWeight.w600,
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
                Row(
                  children: [
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
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
