import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'all';
  double _minPrice = 0;
  double _maxPrice = 1000000;
  bool _showFilters = false;

  // Mock data
  final List<Map<String, dynamic>> _venues = [
    {
      'id': '1',
      'name': 'سالن فوتسال المپیک',
      'location': 'تهران، خیابان ولیعصر',
      'price': 250000,
      'rating': 4.8,
      'category': 'futsal',
    },
    {
      'id': '2',
      'name': 'باشگاه ورزشی قهرمان',
      'location': 'تهران، میدان ونک',
      'price': 300000,
      'rating': 4.6,
      'category': 'gym',
    },
    {
      'id': '3',
      'name': 'سالن چندمنظوره ستاره',
      'location': 'تهران، سعادت‌آباد',
      'price': 200000,
      'rating': 4.9,
      'category': 'futsal',
    },
  ];

  List<Map<String, dynamic>> get _filteredVenues {
    return _venues.where((venue) {
      if (_selectedCategory != 'all' && venue['category'] != _selectedCategory) {
        return false;
      }
      if (venue['price'] < _minPrice || venue['price'] > _maxPrice) {
        return false;
      }
      if (_searchController.text.isNotEmpty &&
          !venue['name'].toString().contains(_searchController.text)) {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with Search
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text(
              'جستجو',
              style: AppTypography.h6.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  _showFilters ? Icons.filter_list : Icons.filter_list_outlined,
                ),
                onPressed: () {
                  setState(() => _showFilters = !_showFilters);
                },
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(70),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  decoration: InputDecoration(
                    hintText: 'جستجوی سالن، بازیکن، تیم...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              setState(() => _searchController.clear());
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
                  onChanged: (_) => setState(() {}),
                ),
              ),
            ),
          ),

          // Filters panel
          if (_showFilters)
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(AppSpacing.lg),
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
                        Text(
                          'فیلترها',
                          style: AppTypography.h6.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _selectedCategory = 'all';
                              _minPrice = 0;
                              _maxPrice = 1000000;
                            });
                          },
                          child: const Text('پاک کردن'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Category filter
                    Text(
                      'دسته‌بندی',
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        _buildFilterChip('همه', 'all'),
                        _buildFilterChip('فوتسال', 'futsal'),
                        _buildFilterChip('باشگاه', 'gym'),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Price range
                    Text(
                      'محدوده قیمت',
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    RangeSlider(
                      values: RangeValues(_minPrice, _maxPrice),
                      min: 0,
                      max: 1000000,
                      divisions: 20,
                      labels: RangeLabels(
                        '${_formatPrice(_minPrice.toInt())}',
                        '${_formatPrice(_maxPrice.toInt())}',
                      ),
                      onChanged: (values) {
                        setState(() {
                          _minPrice = values.start;
                          _maxPrice = values.end;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),

          // Results
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: _filteredVenues.isEmpty
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
                            'نتیجه‌ای یافت نشد',
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
                        final venue = _filteredVenues[index];
                        return _buildVenueCard(context, venue);
                      },
                      childCount: _filteredVenues.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedCategory == value;
    return InkWell(
      onTap: () => setState(() => _selectedCategory = value),
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
                    venue['name'],
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
                          venue['location'],
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
                  '${_formatPrice(venue['price'])}',
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
                      venue['rating'].toString(),
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

  String _formatPrice(int price) {
    return '${(price / 1000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ت';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
