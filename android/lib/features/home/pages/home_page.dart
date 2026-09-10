import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../../core/widgets/venue_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/providers/local_stores.dart';
import '../../home/data/home_repository.dart';
import '../../home/data/sports_service.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../venues/domain/venue.dart';

final homeRepositoryProvider =
    Provider<HomeRepository>((ref) => HomeRepository(ref.read(apiClientProvider)));
final sportsServiceProvider =
    Provider<SportsService>((ref) => SportsService());

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  List<Venue> _venues = [];
  bool _venuesLoading = true;
  List<Venue> _nearby = [];
  bool _nearbyLoading = true;

  MatchesBundle _matches = const MatchesBundle();
  List<NewsItem> _news = [];
  bool _sportsLoading = true;
  String _matchTab = 'live';

  @override
  void initState() {
    super.initState();
    _loadVenues();
    _loadSports();
  }

  Future<void> _loadVenues() async {
    setState(() {
      _venuesLoading = true;
      _nearbyLoading = true;
    });
    try {
      final venues =
          await ref.read(homeRepositoryProvider).getVenues(limit: 48);
      if (!mounted) return;
      setState(() {
        _venues = venues;
        _venuesLoading = false;
        _nearby = venues.take(3).toList();
        _nearbyLoading = false;
      });
      _tryNearby();
    } catch (_) {
      if (mounted) {
        setState(() {
          _venuesLoading = false;
          _nearbyLoading = false;
        });
      }
    }
  }

  Future<void> _tryNearby() async {
    try {
      final pos = await ref.read(homeRepositoryProvider).currentPosition();
      if (!mounted || pos == null) return;
      final nearby = await ref.read(homeRepositoryProvider).getVenues(
            latitude: pos.latitude,
            longitude: pos.longitude,
            radius: 15,
            limit: 6,
          );
      if (!mounted || nearby.isEmpty) return;
      setState(() => _nearby = nearby.take(3).toList());
    } catch (_) {
      // Silent fallback (original behavior).
    }
  }

  Future<void> _loadSports() async {
    final service = ref.read(sportsServiceProvider);
    final results = await Future.wait([
      service.getAllMatches(),
      service.getSportsNews(),
    ]);
    if (!mounted) return;
    setState(() {
      _matches = results[0] as MatchesBundle;
      _news = results[1] as List<NewsItem>;
      _sportsLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final viewed = ref.watch(recentlyViewedProvider);
    final recentVenues = viewed
        .map((v) => _venues.where((x) => x.id == v.id).firstOrNull)
        .whereType<Venue>()
        .toList();
    final popular = [..._venues]
      ..sort((a, b) => (b.averageRating ?? 0).compareTo(a.averageRating ?? 0));
    final popularTop = popular.take(3).toList();

    return Scaffold(
      appBar: AppBar(
        title: user != null && user.fullName.isNotEmpty
            ? Text('سلام ${user.fullName.split(' ').first} 👋')
            : Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.sports_soccer_rounded,
                      color: Colors.white,
                      size: 19,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  const Text('فوتسال'),
                ],
              ),
        actions: const [
          _HomeActions(),
          SizedBox(width: 6),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _loadVenues();
          await _loadSports();
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.xxxl,
          ),
          children: [
            GestureDetector(
              onTap: () => context.push('/search'),
              child: const AbsorbPointer(
                child: AppSearchBar(hint: 'جستجوی سالن، محله یا ورزش…'),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const SectionHeader(
              title: 'ورزش‌های محبوب',
              subtitle: 'زودتر برو سراغ بازی',
            ),
            SportChipRow(
              activeKey: null,
              onSelect: (sport) {
                if (sport == null) return;
                final params = <String, String>{
                  if (sport.category != null) 'category': sport.category!,
                  if (sport.query != null) 'search': sport.query!,
                };
                final query = Uri(
                  queryParameters: params.isEmpty ? null : params,
                ).toString();
                context.push('/venues$query');
              },
            ),
            const SizedBox(height: AppSpacing.xl),
            _CtaBanner(isAuthenticated: user != null),
            const SizedBox(height: AppSpacing.xxl),
            SectionHeader(
              title: 'سالن‌های نزدیک شما',
              actionLabel: 'مشاهده همه',
              onAction: () => context.push('/venues'),
            ),
            if (_nearbyLoading)
              const VenueCardSkeletonList(count: 2)
            else if (_nearby.isEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xl),
                child: Text(
                  'سالنی در نزدیکی شما پیدا نشد.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              )
            else
              _venuecolumn(_nearby),
            const SizedBox(height: AppSpacing.xxl),
            SectionHeader(
              title: 'محبوب‌ترین سالن‌ها',
              subtitle: 'بر اساس امتیاز کاربران',
              actionLabel: 'همه',
              onAction: () => context.push('/venues'),
            ),
            if (_venuesLoading)
              const VenueCardSkeletonList(count: 3)
            else if (popularTop.isEmpty)
              const EmptyState(
                emoji: '🏟️',
                title: 'سالنی ثبت نشده است',
                description: 'هنوز سالنی در سیستم ثبت نشده است.',
              )
            else
              _venuecolumn(popularTop),
            if (recentVenues.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xxl),
              const SectionHeader(title: 'اخیراً دیده‌شده'),
              SizedBox(
                height: 170,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: recentVenues.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(width: AppSpacing.md),
                  itemBuilder: (context, index) {
                    final v = recentVenues[index];
                    return _RecentVenueTile(venue: v);
                  },
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.xxl),
            const SectionHeader(
              title: 'نتایج زنده فوتبال',
              subtitle: 'به‌روزرسانی خودکار با کشیدن صفحه به پایین',
            ),
            _LiveScoresCard(
              matches: _matches,
              loading: _sportsLoading,
              activeTab: _matchTab,
              onTabChanged: (tab) => setState(() => _matchTab = tab),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const SectionHeader(title: 'اخبار ورزشی'),
            if (_sportsLoading)
              const ListTileSkeleton(height: 150, count: 2)
            else if (_news.isEmpty)
              const EmptyState(emoji: '📰', title: 'اخباری یافت نشد')
            else
              SizedBox(
                height: 175,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _news.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(width: AppSpacing.md),
                  itemBuilder: (context, index) => _NewsCard(item: _news[index]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _venuecolumn(List<Venue> venues) => Column(
        children: venues
            .map(
              (v) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                child: VenueCard(
                  venue: v,
                  onTap: () => context.push('/venues/${v.id}'),
                ),
              ),
            )
            .toList(),
      );
}

class _HomeActions extends ConsumerWidget {
  const _HomeActions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.isAuthenticated) {
      final unread = ref.watch(
        notificationsProvider.select((s) => s.unreadCount),
      );
      return IconButton(
        onPressed: () => context.push('/notifications'),
        icon: Badge(
          isLabelVisible: unread > 0,
          label: Text(formatFaNumber(unread)),
          child: const Icon(Icons.notifications_none_rounded, size: 25),
        ),
      );
    }
    return Row(
      children: [
        TextButton(
          onPressed: () => context.push('/login'),
          child: const Text('ورود'),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 6),
          child: AppGradientButton(
            label: 'ثبت‌نام',
            onPressed: () => context.push('/register'),
            width: 84,
            height: 40,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

class _CtaBanner extends StatelessWidget {
  const _CtaBanner({required this.isAuthenticated});

  final bool isAuthenticated;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(isAuthenticated ? '/venues' : '/register'),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          gradient: AppColors.gradientHero,
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isAuthenticated
                  ? 'همین حالا سانس رزرو کن ⚡'
                  : 'همین حالا رایگان شروع کن ⚡',
              style: const TextStyle(
                fontFamily: 'Vazirmatn',
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              isAuthenticated
                  ? 'بهترین سالن‌ها با بهترین قیمت، چند لحظه‌ای'
                  : 'ثبت‌نام کن و در کمتر از یک دقیقه سالن رزرو کن',
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(AppRadius.button),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isAuthenticated ? 'مشاهده سالن‌ها' : 'شروع رایگان',
                    style: const TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontWeight: FontWeight.w800,
                      fontSize: 12.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_back_rounded,
                      size: 15, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentVenueTile extends StatelessWidget {
  const _RecentVenueTile({required this.venue});

  final Venue venue;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/venues/${venue.id}'),
      child: Container(
        width: 210,
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            VenueImage(venue: venue, height: 100, radius: 0),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    venue.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    venue.address,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
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

class _LiveScoresCard extends StatelessWidget {
  const _LiveScoresCard({
    required this.matches,
    required this.loading,
    required this.activeTab,
    required this.onTabChanged,
  });

  final MatchesBundle matches;
  final bool loading;
  final String activeTab;
  final ValueChanged<String> onTabChanged;

  @override
  Widget build(BuildContext context) {
    final list = switch (activeTab) {
      'live' => matches.live,
      'upcoming' => matches.upcoming,
      _ => matches.finished,
    };
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
            child: Row(
              children: [
                const Icon(Icons.sports_soccer_rounded,
                    color: Colors.white, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'نتایج',
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF87171),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'زنده',
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          Container(
            color: Colors.transparent,
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _tab(context, 'live', 'زنده'),
                  _tab(context, 'upcoming', 'آینده'),
                  _tab(context, 'finished', 'پایان'),
                ],
              ),
            ),
          ),
          if (loading)
            const Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: ListTileSkeleton(count: 2, height: 64),
            )
          else if (list.isEmpty)
            const EmptyState(emoji: '⚽', title: 'مسابقه‌ای یافت نشد')
          else
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md, 0, AppSpacing.md, AppSpacing.md,
              ),
              child: Column(
                children: list
                    .map(
                      (m) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: _MatchRow(match: m),
                      ),
                    )
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _tab(BuildContext context, String id, String label) {
    final active = id == activeTab;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTabChanged(id),
        child: AnimatedContainer(
          duration: AppDurations.fast,
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: active ? AppColors.primary : Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _MatchRow extends StatelessWidget {
  const _MatchRow({required this.match});

  final LiveMatch match;

  @override
  Widget build(BuildContext context) {
    final isLive = match.status == 'live';
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurfaceAlt
            : const Color(0x08152342),
        borderRadius: BorderRadius.circular(AppRadius.image),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Theme.of(context).dividerColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  match.league,
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ),
              const Spacer(),
              if (isLive)
                Text(
                  "${toPersianDigits(match.minute.toString())}'",
                  style: const TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.error,
                  ),
                )
              else
                Text(
                  match.time ?? '',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  match.homeTeam,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  '${toPersianDigits(match.homeScore.toString())} - '
                  '${toPersianDigits(match.awayScore.toString())}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: isLive ? AppColors.primary : null,
                        fontWeight: FontWeight.w900,
                      ),
                ),
              ),
              Expanded(
                child: Text(
                  match.awayTeam,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.left,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NewsCard extends StatelessWidget {
  const _NewsCard({required this.item});

  final NewsItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 230,
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 76,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.gradientPrimarySoftTop,
                  AppColors.gradientPrimarySoftBottom,
                ],
              ),
            ),
            alignment: Alignment.center,
            child: Icon(
              item.isLive ? Icons.live_tv_rounded : Icons.newspaper_rounded,
              color: AppColors.primary,
              size: 30,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(height: 1.6),
                ),
                const SizedBox(height: 6),
                Text(
                  item.date != null
                      ? formatDateNumeric(item.date)
                      : item.category,
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
