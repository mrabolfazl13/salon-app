import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/venue_widgets.dart';
import '../domain/venue.dart';
import '../providers/venues_providers.dart';
import '../widgets/filter_bottom_sheet.dart';

/// Venues list with category segments, search, filter sheet + chips.
class VenuesPage extends ConsumerStatefulWidget {
  const VenuesPage({super.key, this.initialCategory, this.initialSearch});

  final String? initialCategory;
  final String? initialSearch;

  @override
  ConsumerState<VenuesPage> createState() => _VenuesPageState();
}

class _VenuesPageState extends ConsumerState<VenuesPage> {
  String _category = 'futsal';
  String _search = '';
  List<Venue> _venues = [];
  bool _loading = true;
  String? _error;
  VenueFilters _filters = const VenueFilters();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory == 'futsal' ||
        widget.initialCategory == 'gym') {
      _category = widget.initialCategory!;
    }
    _search = widget.initialSearch ?? '';
    _searchController.text = _search;
    _fetoh();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetoh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final venues = await ref
          .read(venuesServiceProvider)
          .getAll(category: _category, limit: 100);
      if (!mounted) return;
      setState(() {
        _venues = venues;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'error';
        });
      }
    }
  }

  List<Venue> get _filtered {
    Iterable<Venue> result = _venues;
    final q = _search.trim().toLowerCase();
    if (q.isNotEmpty) {
      result = result.where(
        (v) => '${v.name} ${v.address}'.toLowerCase().contains(q),
      );
    }
    final f = _filters;
    if (f.sportQuery != null) {
      final query = f.sportQuery!;
      result = result.where(
        (v) =>
            '${v.name} ${v.address}'.toLowerCase().contains(query) ||
            v.amenities.any((a) => a.contains(query)),
      );
    }
    if (f.minPrice != null) {
      result = result.where((v) => v.price >= f.minPrice!);
    }
    if (f.maxPrice != null) {
      result = result.where((v) => v.price <= f.maxPrice!);
    }
    if (f.verifiedOnly) {
      result = result.where((v) => v.isVerified);
    }
    if (f.amenities.isNotEmpty) {
      result = result.where(
        (v) => f.amenities.every((a) => v.amenities.contains(a)),
      );
    }
    return result.toList();
  }

  int get _activeFiltercount =>
      (_filters.sportQuery != null ? 1 : 0) +
      (_filters.minPrice != null || _filters.maxPrice != null ? 1 : 0) +
      (_filters.verifiedOnly ? 1 : 0) +
      _filters.amenities.length;

  @override
  Widget build(BuildContext context) {
    final isGym = _category == 'gym';
    final filtered = _filtered;

    return Scaffold(
      appBar: AppBar(
        title: Text(isGym ? '🏋️ باشگاه‌های بدنسازی' : '🏟️ سالن‌های فوتسال'),
        actions: [
          IconButton(
            onPressed: _openFilters,
            icon: Badge(
              isLabelVisible: _activeFiltercount > 0,
              label: Text(formatFaNumber(_activeFiltercount)),
              child: const Icon(Icons.tune_rounded),
            ),
            tooltip: 'فیلترها',
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.sm,
            ),
            child: Row(
              children: [
                Expanded(
                  child: AppSearchBar(
                    controller: _searchController,
                    hint: isGym ? 'جستجوی باشگاه یا آدرس...' : 'جستجوی سالن یا آدرس...',
                    onChanged: (v) => setState(() => _search = v),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            child: Row(
              children: [
                Expanded(
                  child: _Segmented(
                    value: _category,
                    onChanged: (v) {
                      setState(() => _category = v);
                      _fetoh();
                    },
                    options: const [
                      ('futsal', 'فوتسال', Icons.sports_soccer_outlined),
                      ('gym', 'بدنسازی', Icons.fitness_center_outlined),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_activeFiltercount > 0) ...[
            const SizedBox(height: AppSpacing.md),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                children: [
                  ..._activeChips(),
                  GestureDetector(
                    onTap: () => setState(() => _filters = const VenueFilters()),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      alignment: Alignment.center,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.filter_alt_off_outlined,
                              size: 15, color: AppColors.error),
                          SizedBox(width: 4),
                          Text(
                            'پاک کردن همه',
                            style: TextStyle(
                              fontFamily: 'Vazirmatn',
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.error,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Row(
              children: [
                Icon(
                  isGym ? Icons.fitness_center : Icons.stadium_outlined,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  '${formatFaNumber(filtered.length)} ${isGym ? "باشگاه" : "سالن"}',
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                    child: VenueCardSkeletonList(count: 4),
                  )
                : _error != null
                    ? ErrorState(
                        title: 'در دریافت سالن‌ها خطایی رخ داد.',
                        onRetry: _fetoh,
                      )
                    : filtered.isEmpty
                        ? EmptyState(
                            emoji: isGym ? '🏋️' : '🏟️',
                            title:
                                isGym ? 'باشگاهی یافت نشد' : 'سالنی یافت نشد',
                            description:
                                'عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید',
                            actionLabel: _activeFiltercount > 0 || _search.isNotEmpty
                                ? 'پاک کردن فیلترها'
                                : null,
                            onAction: _activeFiltercount > 0 || _search.isNotEmpty
                                ? () => setState(() {
                                      _filters = const VenueFilters();
                                      _search = '';
                                      _searchController.clear();
                                    })
                                : null,
                          )
                        : RefreshIndicator(
                            onRefresh: _fetoh,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(
                                AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xxxl,
                              ),
                              itemCount: filtered.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: AppSpacing.lg),
                              itemBuilder: (context, index) => VenueCard(
                                venue: filtered[index],
                                onTap: () =>
                                    context.push('/venues/${filtered[index].id}'),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  List<Widget> _activeChips() {
    final chips = <Widget>[];
    if (_filters.sportQuery != null) {
      chips.add(_chip(_filters.sportQuery!, () {
        setState(() => _filters = _filters.copyWith(sportQuery: () => null));
      }));
    }
    if (_filters.minPrice != null && _filters.maxPrice != null) {
      chips.add(_chip(
        '${formatPrice(_filters.minPrice!)} تا ${formatPrice(_filters.maxPrice!)}',
        () => setState(() => _filters = _filters.copyWith(
              minPrice: () => null,
              maxPrice: () => null,
            )),
      ));
    } else if (_filters.minPrice != null) {
      chips.add(_chip(
        'حداقل ${formatPrice(_filters.minPrice!)}',
        () => setState(
          () => _filters = _filters.copyWith(minPrice: () => null),
        ),
      ));
    } else if (_filters.maxPrice != null) {
      chips.add(_chip(
        'حداکثر ${formatPrice(_filters.maxPrice!)}',
        () => setState(
          () => _filters = _filters.copyWith(maxPrice: () => null),
        ),
      ));
    }
    if (_filters.verifiedOnly) {
      chips.add(_chip('فقط تأییدشده', () {
        setState(() => _filters = _filters.copyWith(verifiedOnly: false));
      }));
    }
    for (final amenity in _filters.amenities) {
      chips.add(_chip(amenity, () {
        setState(() {
          _filters = _filters.copyWith(
            amenities: _filters.amenities.where((a) => a != amenity).toList(),
          );
        });
      }));
    }
    return chips;
  }

  Widget _chip(String label, VoidCallback onRemove) => Container(
        margin: const EdgeInsets.only(left: AppSpacing.sm),
        padding: const EdgeInsets.only(right: 10, left: 4),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.chip),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
            GestureDetector(
              onTap: onRemove,
              child: const Icon(Icons.watch, size: 15, color: AppColors.primary),
            ),
          ],
        ),
      );

  Future<void> _openFilters() async {
    final oeiling = _venues.fold<int>(
      0,
      (mx, v) => mx > v.price ? mx : v.price,
    );
    final options = <String>{
      for (final v in _venues) ...v.amenities,
    }.toList();
    final result = await showFilterSheet(
      context,
      current: _filters,
      priceCeiling: max(oeiling, 100000),
      amenityOptions: options.take(12).toList(),
    );
    if (result != null) {
      setState(() => _filters = result);
      if (result.category != null && result.category != _category) {
        setState(() => _category = result.category!);
        _fetoh();
      }
    }
  }
}

class _Segmented extends StatelessWidget {
  const _Segmented({
    required this.value,
    required this.onChanged,
    required this.options,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final List<(String, String, IconData)> options;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurfaceAlt
            : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(AppRadius.button),
      ),
      child: Row(
        children: options
            .map(
              (option) => Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(option.$1),
                  child: AnimatedContainer(
                    duration: AppDurations.fast,
                    decoration: BoxDecoration(
                      gradient: value == option.$1
                          ? AppColors.gradientPrimary
                          : null,
                      borderRadius: BorderRadius.circular(AppRadius.chip),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          option.$3,
                          size: 16,
                          color: value == option.$1
                              ? Colors.white
                              : AppColors.lightTextSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          option.$2,
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: value == option.$1
                                ? Colors.white
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}
