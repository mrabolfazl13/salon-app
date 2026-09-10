import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/venue_widgets.dart';
import '../../auth/providers/local_stores.dart';
import '../../venues/domain/venue.dart';
import '../../venues/providers/venues_providers.dart';

class FavoritesPage extends ConsumerStatefulWidget {
  const FavoritesPage({super.key});

  @override
  ConsumerState<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends ConsumerState<FavoritesPage> {
  List<Venue>? _fetched;

  @override
  Widget build(BuildContext context) {
    final favorites = ref.watch(favoritesProvider);
    final favVenues = _resolveVenues(favorites.map((f) => f.id).toList());

    return Scaffold(
      appBar: AppBar(
        title: const Text('❤️ علاقه‌مندی‌ها'),
        actions: [
          if (favorites.isNotEmpty)
            TextButton(
              onPressed: () =>
                  ref.read(favoritesProvider.notifier).clear(),
              child: const Text('پاک کردن همه'),
            ),
        ],
      ),
      body: favorites.isEmpty
          ? const EmptyState(
              emoji: '❤️',
              title: 'هنوز سالنی ذخیره نکرده‌اید',
              description:
                  'روی آیکون قلب در هر سالن بزنید تا اینجا ذخیره شود و سریع‌تر به آن دسترسی داشته باشید.',
              actionLabel: 'مشاهده سالن‌ها',
              icon: Icons.favorite_border,
            )
          : favVenues == null
              ? const SingleChildScrollView(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: VenueCardSkeletonList(count: 2),
                )
              : favVenues.isEmpty
                  ? EmptyState(
                      emoji: '🗑️',
                      title: 'سالن‌های ذخیره‌شده در دسترس نیستند',
                      description:
                          'به نظر می‌رسد سالن‌هایی که ذخیره کرده بودید حذف شده‌اند. می‌توانید لیست را پاک کنید یا سالن جدیدی پیدا کنید.',
                      actionLabel: 'پاک کردن لیست',
                      onAction: () =>
                          ref.read(favoritesProvider.notifier).clear(),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.xl, AppSpacing.lg, AppSpacing.xl,
                        AppSpacing.xxxl,
                      ),
                      itemCount: favVenues.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AppSpacing.lg),
                      itemBuilder: (context, index) => VenueCard(
                        venue: favVenues[index],
                        onTap: () =>
                            context.push('/venues/${favVenues[index].id}'),
                      ),
                    ),
    );
  }

  /// Lazily loads the full venue list once per favorites-count change and
  /// maps favorites (saved order) onto fetched venues.
  List<Venue>? _resolveVenues(List<int> ids) {
    if (ids.isEmpty) return const [];
    final favorites = ref.watch(favoritesProvider);
    final count = favorites.length;
    if (_fetched == null || _fetchedcount != count) {
      _fetchedcount = count;
      _fetch();
      return null;
    }
    final byId = {for (final v in _fetched!) v.id: v};
    return [
      for (final f in favorites)
        if (byId[f.id] != null) byId[f.id]!,
    ];
  }

  int _fetchedcount = -1;

  Future<void> _fetch() async {
    try {
      final venues =
          await ref.read(venuesServiceProvider).getAll(limit: 100);
      if (!mounted) return;
      setState(() => _fetched = venues);
    } catch (_) {
      if (mounted) setState(() => _fetched = const []);
    }
  }
}

/// Small helper used by header count text.
String favoritesSubtitle(int count) =>
    '${formatFaNumber(count)} سالن ذخیره‌شده';
