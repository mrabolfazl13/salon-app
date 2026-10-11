import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/game_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class GamesExploreScreen extends ConsumerStatefulWidget {
  const GamesExploreScreen({super.key});

  @override
  ConsumerState<GamesExploreScreen> createState() => _GamesExploreScreenState();
}

class _GamesExploreScreenState extends ConsumerState<GamesExploreScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _games = [];
  String? _skillLevel;
  String _sort = 'soonest';

  static const _skills = <String?, String>{
    null: 'همه',
    'beginner': 'مبتدی',
    'intermediate': 'متوسط',
    'advanced': 'پیشرفته',
    'pro': 'حرفه‌ای',
  };

  static const _sorts = <String, String>{
    'soonest': 'نزدیک‌ترین',
    'cheapest': 'ارزان‌ترین',
    'most_available': 'بیشترین ظرفیت',
    'popular': 'محبوب‌ترین',
  };

  static const _skillLabels = <String, String>{
    'beginner': 'مبتدی',
    'intermediate': 'متوسط',
    'advanced': 'پیشرفته',
    'pro': 'حرفه‌ای',
  };

  static const _statusLabels = <String, String>{
    'open': 'در حال جذب',
    'full': 'تکمیل ظرفیت',
    'started': 'شروع شده',
    'completed': 'به پایان رسیده',
    'cancelled': 'لغو شده',
    'draft': 'پیش‌نویس',
  };

  static const _myStatusLabels = <String, String>{
    'accepted': 'عضو هستید',
    'pending': 'در انتظار تأیید',
    'invited': 'دعوت‌شده',
    'left': 'خارج شدید',
    'rejected': 'رد شده',
  };

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
      final games = await GameService.getGames(
        skillLevel: _skillLevel,
        sort: _sort,
      );
      if (!mounted) return;
      setState(() {
        _games = games;
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
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              pinned: true,
              title: Text('بازی‌ها',
                  style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
              actions: [
                IconButton(
                  icon: const Icon(Icons.add),
                  tooltip: 'ایجاد بازی جدید',
                  onPressed: () => context.push('/games/create'),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      children: _skills.entries
                          .map((e) => Padding(
                                padding: const EdgeInsets.only(left: AppSpacing.sm),
                                child: _FilterChip(
                                  label: e.value,
                                  selected: _skillLevel == e.key,
                                  onTap: () {
                                    setState(() => _skillLevel = e.key);
                                    _load();
                                  },
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 4),
                      children: _sorts.entries
                          .map((e) => Padding(
                                padding: const EdgeInsets.only(left: AppSpacing.sm),
                                child: _FilterChip(
                                  label: e.value,
                                  selected: _sort == e.key,
                                  onTap: () {
                                    setState(() => _sort = e.key);
                                    _load();
                                  },
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
                ),
              )
            else if (_games.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.sports_soccer,
                          size: 56, color: Colors.grey[400]),
                      const SizedBox(height: AppSpacing.md),
                      Text('هنوز بازی‌ای ثبت نشده',
                          style: AppTypography.bodyMedium),
                      const SizedBox(height: AppSpacing.md),
                      ElevatedButton(
                        onPressed: () => context.push('/games/create'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blue,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('ایجاد بازی جدید'),
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
                    (context, index) => _buildGameCard(context, _games[index]),
                    childCount: _games.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameCard(BuildContext context, Map<String, dynamic> game) {
    final skill = game['skill_level']?.toString();
    final status = game['status']?.toString();
    final myStatus = game['my_participant_status']?.toString();
    final slotDate = game['slot_date']?.toString();
    final startTime = game['start_time']?.toString();
    final duration = (game['duration'] as num?)?.toInt();
    final pricePerPlayer = (game['price_per_player'] as num?);
    final current = (game['current_players'] as num?)?.toInt() ?? 0;
    final maxPlayers = (game['max_players'] as num?)?.toInt() ?? 0;

    return InkWell(
      onTap: () => context.push('/games/${game['id']}'),
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(game['name']?.toString() ?? 'بازی',
                      style: AppTypography.h6
                          .copyWith(fontWeight: FontWeight.w700)),
                ),
                if (skill != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: AppColors.blue.withOpacity(0.1),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Text(
                      _skillLabels[skill] ?? skill,
                      style: AppTypography.caption
                          .copyWith(color: AppColors.blue, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                ],
                if (myStatus != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Text(
                      _myStatusLabels[myStatus] ?? myStatus,
                      style: AppTypography.caption.copyWith(
                          color: AppColors.success, fontWeight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            if (game['venue_name'] != null)
              _buildInfoRow(Icons.location_on, game['venue_name'].toString()),
            if (slotDate != null)
              _buildInfoRow(
                Icons.calendar_today,
                startTime != null
                    ? '${JalaliDate.formatIsoDate(slotDate)} — ${FaFormat.time(startTime)}'
                    : JalaliDate.formatIsoDate(slotDate),
              ),
            if (duration != null)
              _buildInfoRow(Icons.timer, '${FaFormat.faNum(duration)} دقیقه'),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(Icons.people, size: 16, color: AppColors.blue),
                const SizedBox(width: AppSpacing.xs),
                Text('${FaFormat.faNum(current)} از ${FaFormat.faNum(maxPlayers)} نفر',
                    style: AppTypography.bodyMedium),
                const Spacer(),
                if (pricePerPlayer != null)
                  Text(
                    '${FaFormat.toman(pricePerPlayer.toDouble().round())} هر نفر',
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w700, color: AppColors.amber),
                  ),
                if (status != null && status != 'open') ...[
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    _statusLabels[status] ?? status,
                    style: AppTypography.caption.copyWith(
                        color: status == 'cancelled'
                            ? AppColors.error
                            : Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.amber),
          const SizedBox(width: AppSpacing.xs),
          Expanded(child: Text(text, style: AppTypography.bodyMedium)),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.blue : Colors.transparent,
          borderRadius: AppRadius.chipBorderRadius,
          border: Border.all(
            color: selected ? AppColors.blue : Theme.of(context).dividerColor,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}
