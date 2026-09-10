import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/venue_widgets.dart';

class VenueFilters {
  const VenueFilters({
    this.category,
    this.sportQuery,
    this.minPrice,
    this.maxPrice,
    this.amenities = const [],
    this.verifiedOnly = false,
  });

  final String? category;
  final String? sportQuery;
  final int? minPrice;
  final int? maxPrice;
  final List<String> amenities;
  final bool verifiedOnly;

  int get activecount =>
      (sportQuery != null ? 1 : 0) +
      (minPrice != null || maxPrice != null ? 1 : 0) +
      (verifiedOnly ? 1 : 0) +
      amenities.length;

  VenueFilters copyWith({
    String? Function()? category,
    String? Function()? sportQuery,
    int? Function()? minPrice,
    int? Function()? maxPrice,
    List<String>? amenities,
    bool? verifiedOnly,
  }) =>
      VenueFilters(
        category: category != null ? category() : this.category,
        sportQuery: sportQuery != null ? sportQuery() : this.sportQuery,
        minPrice: minPrice != null ? minPrice() : this.minPrice,
        maxPrice: maxPrice != null ? maxPrice() : this.maxPrice,
        amenities: amenities ?? this.amenities,
        verifiedOnly: verifiedOnly ?? this.verifiedOnly,
      );
}

/// Filter bottom sheet: sport chips, price range, amenities, verified switch.
Future<VenueFilters?> showFilterSheet(
  BuildContext context, {
  required VenueFilters current,
  required int priceCeiling,
  required List<String> amenityOptions,
}) {
  return showAppSheet<VenueFilters>(
    context: context,
    builder: (context) => _FilterSheet(
      initial: current,
      priceCeiling: priceCeiling,
      amenityOptions: amenityOptions,
    ),
  );
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({
    required this.initial,
    required this.priceCeiling,
    required this.amenityOptions,
  });

  final VenueFilters initial;
  final int priceCeiling;
  final List<String> amenityOptions;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late VenueFilters _draft = widget.initial;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'فیلترها (${formatFaNumber(_draft.activecount)})',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.watch),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('نوع ورزش', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: AppSpacing.md),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: sports.map((sport) {
                      final selected = _draft.sportQuery == sport.query ||
                          (sport.query == null &&
                              _draft.category == sport.category);
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            if (selected) {
                              _draft = _draft.copyWith(
                                sportQuery: () => null,
                                category: () => null,
                              );
                            } else {
                              _draft = _draft.copyWith(
                                sportQuery: () => sport.query,
                                category: () => sport.category,
                              );
                            }
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary.withValues(alpha: 0.1)
                                : Colors.transparent,
                            borderRadius:
                                BorderRadius.circular(AppRadius.chip),
                            border: Border.all(
                              color: selected
                                  ? AppColors.primary
                                  : Theme.of(context).dividerColor,
                            ),
                          ),
                          child: Text(
                            '${sport.emoji} ${sport.label}',
                            style: TextStyle(
                              fontFamily: 'Vazirmatn',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: selected
                                  ? AppColors.primary
                                  : Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.color,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text('محدوده قیمت',
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: AppSpacing.sm),
                  RangeSlider(
                    values: RangeValues(
                      (_draft.minPrice ?? 0).toDouble(),
                      (_draft.maxPrice ?? widget.priceCeiling).toDouble(),
                    ),
                    min: 0,
                    max: widget.priceCeiling.toDouble(),
                    divisions: 20,
                    labels: RangeLabels(
                      formatPriceCompact(_draft.minPrice ?? 0),
                      formatPriceCompact(_draft.maxPrice ?? widget.priceCeiling),
                    ),
                    onChanged: (values) {
                      setState(() {
                        _draft = _draft.copyWith(
                          minPrice: () => values.start.round() <= 0
                              ? null
                              : values.start.round(),
                          maxPrice: () =>
                              values.end.round() >= widget.priceCeiling
                                  ? null
                                  : values.end.round(),
                        );
                      });
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text('امکانات', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: AppSpacing.md),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.amenityOptions.map((amenity) {
                      final selected = _draft.amenities.contains(amenity);
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _draft = _draft.copyWith(
                              amenities: selected
                                  ? _draft.amenities
                                      .where((a) => a != amenity)
                                      .toList()
                                  : [..._draft.amenities, amenity],
                            );
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary.withValues(alpha: 0.1)
                                : Colors.transparent,
                            borderRadius:
                                BorderRadius.circular(AppRadius.chip),
                            border: Border.all(
                              color: selected
                                  ? AppColors.primary
                                  : Theme.of(context).dividerColor,
                            ),
                          ),
                          child: Text(
                            amenity,
                            style: TextStyle(
                              fontFamily: 'Vazirmatn',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: selected
                                  ? AppColors.primary
                                  : Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.color,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _draft.verifiedOnly,
                    onChanged: (v) => setState(
                      () => _draft = _draft.copyWith(verifiedOnly: v),
                    ),
                    secondary: const Icon(Icons.verified_outlined,
                        color: AppColors.successDark),
                    title: const Text(
                      'فقط سالن‌های تأیید شده',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),
          ),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: AppGradientButton(
                  label: 'اعمال فیلتر',
                  onPressed: () => Navigator.of(context).pop(_draft),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppOutlineButton(
                  label: 'پاک کردن',
                  onPressed: () {
                    setState(() => _draft = const VenueFilters());
                    Navigator.of(context).pop(_draft);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
