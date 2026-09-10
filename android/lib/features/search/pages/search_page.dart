import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../../core/widgets/venue_widgets.dart';
import '../../auth/providers/local_stores.dart';
import '../../venues/domain/venue.dart';
import '../../venues/providers/venues_providers.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _controller = TextEditingController();
  Timer? _debounce;
  List<Venue> _results = [];
  String? _submitted;
  bool _loading = false;
  bool _error = false;
  static const _popular = ['فوتسال', 'بدنسازی', 'چمن مصنوعی', 'سرپوشیده', 'قوم'];

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _search(value));
    setState(() {});
  }

  Future<void> _search([String? forced]) async {
    final query = (forced ?? _controller.text).trim();
    if (query.isEmpty) {
      setState(() {
        _results = [];
        _submitted = null;
        _loading = false;
        _error = false;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final results = await ref
          .read(venuesServiceProvider)
          .getAll(search: query, limit: 20);
      if (!mounted) return;
      setState(() {
        _results = results;
        _submitted = query;
        _loading = false;
      });
      ref.read(searchHistoryProvider.notifier).add(query);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _results = [];
        _loading = false;
        _error = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(searchHistoryProvider);
    final recent = history.where((q) => q != _controller.text.trim()).toList();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: AppSearchBar(
          controller: _controller,
          autofocus: true,
          hint: 'نام سالن یا محله را بنویسید…',
          onChanged: _onChanged,
          onSubmitted: (_) => _search(),
        ),
        leading: IconButton(
          onPressed: () {
            if (_controller.text.isNotEmpty) {
              _controller.clear();
              _search('');
            } else {
              context.pop();
            }
          },
          icon: const Icon(Icons.arrow_forward_rounded),
        ),
      ),
      body: _controller.text.trim().isEmpty
          ? _landing(recent)
          : _resultsView(),
    );
  }

  Widget _landing(List<String> recent) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        if (recent.isNotEmpty) ...[
          SectionHeader(
            title: 'جستجوهای اخیر',
            actionLabel: 'پاک کردن',
            onAction: () =>
                ref.read(searchHistoryProvider.notifier).clear(),
          ),
          ...recent.map(
            (q) => ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(Icons.history,
                  size: 20, color: Theme.of(context).textTheme.bodySmall?.color),
              title: Text(q, style: Theme.of(context).textTheme.bodyMedium),
              trailing: IconButton(
                icon: const Icon(Icons.watch, size: 17),
                onPressed: () =>
                    ref.read(searchHistoryProvider.notifier).remove(q),
              ),
              onTap: () {
                _controller.text = q;
                _search(q);
              },
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
        const SectionHeader(title: 'جستجوهای محبوب'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _popular
              .map(
                (q) => GestureDetector(
                  onTap: () {
                    _controller.text = q;
                    _search(q);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardTheme.color,
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: Theme.of(context).dividerColor,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.search,
                            size: 15, color: AppColors.lightTextMuted),
                        const SizedBox(width: 5),
                        Text(q, style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: AppSpacing.xl),
        const SectionHeader(title: 'دسته‌بندی‌ها'),
        SportChipRow(
          activeKey: null,
          onSelect: (sport) {
            if (sport == null) return;
            _controller.text = sport.query ?? sport.label;
            _search(sport.query ?? sport.label);
          },
        ),
      ],
    );
  }

  Widget _resultsView() {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: ListTileSkeleton(count: 3, height: 76),
      );
    }
    if (_error) {
      return ErrorState(
        title: 'جستجو ممکن نشد',
        description: 'لطفاً اتصال خود را بررسی کنید.',
        onRetry: _search,
      );
    }
    if (_results.isEmpty) {
      return EmptyState(
        emoji: '🔍',
        title: 'سالنی با «${_submitted ?? _controller.text.trim()}» پیدا نشد',
        description: 'اسم دیگری را امتحان کنید یا در دسته‌بندی‌ها بگردید.',
        actionLabel: 'مشاهده همه سالن‌ها',
        onAction: () => context.push('/venues'),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        Text(
          '${formatFaNumber(_results.length)} نتیجه برای «${_submitted ?? ""}»',
          style: Theme.of(context).textTheme.labelMedium,
        ),
        const SizedBox(height: AppSpacing.lg),
        ..._results.map(
          (v) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: _SearchResultRow(
              venue: v,
              onTap: () => context.push('/venues/${v.id}'),
            ),
          ),
        ),
      ],
    );
  }
}

class _SearchResultRow extends StatelessWidget {
  const _SearchResultRow({required this.venue, required this.onTap});

  final Venue venue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.tile),
                child: VenueImage(venue: venue, height: 64, radius: 12),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    venue.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  RatingRow(value: venue.averageRating, count: venue.totalReviews),
                  const SizedBox(height: 4),
                  PriceText(venue.price, from: true, size: PriceSize.sm),
                ],
              ),
            ),
            FavoriteButton(venueId: venue.id, venueName: venue.name, size: 36),
          ],
        ),
      ),
    );
  }
}
