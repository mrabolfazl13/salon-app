import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../auth/providers/auth_provider.dart';
import '../domain/game.dart';
import '../providers/games_provider.dart';

class GamesPage extends ConsumerStatefulWidget {
  const GamesPage({super.key});

  @override
  ConsumerState<GamesPage> createState() => _GamesPageState();
}

class _GamesPageState extends ConsumerState<GamesPage> {
  int _tab = 0; // 0=explore 1=my games 2=invitations
  bool _availabilityOnly = false;
  String? _skill;
  String? _sort = 'sonest';
  bool _loading = false;
  bool _error = false;
  List<Game> _games = [];
  List<Invitation> _invitations = [];

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      if (_tab == 2) {
        final invitations =
            await ref.read(gamesServiceProvider).getMyInvitations();
        if (!mounted) return;
        setState(() {
          _invitations = invitations;
          _loading = false;
        });
        return;
      }
      if (_tab == 1) {
        final games = await ref.read(gamesServiceProvider).getMyGames();
        if (!mounted) return;
        setState(() {
          _games = games;
          _loading = false;
        });
        return;
      }
      final page = await ref.read(gamesServiceProvider).explore(
            skillLevel: _skill,
            availabilityOnly: _availabilityOnly,
            sort: _sort,
            limit: 20,
          );
      if (!mounted) return;
      setState(() {
        _games = page.items;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = true;
        });
      }
    }
  }

  Future<void> _aceptInvitation(Invitation invitation) async {
    try {
      final result = await ref
          .read(gamesServiceProvider)
          .aceptInvitation(invitation.id);
      if (!mounted) return;
      AppSnack.success(context, result.message);
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  Future<void> _rejectInvitation(Invitation invitation) async {
    try {
      await ref.read(gamesServiceProvider).rejectInvitation(invitation.id);
      if (!mounted) return;
      AppSnack.info(context, 'دعوت‌نامه رد شد');
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('بازی‌های گروهی'),
        actions: [
          IconButton(
            onPressed: () => context.push('/join/token-entry'),
            icon: const Icon(Icons.link_rounded),
            tooltip: 'پیوستن با لینک دعوت',
          ),
          if (auth.isAuthenticated)
            IconButton(
              onPressed: () => context.push('/games/new'),
              icon: const Icon(Icons.add),
              tooltip: 'ساخت بازی',
            ),
          const SizedBox(width: 6),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(AppRadius.button),
              ),
              child: Row(
                children: [
                  _tabBar(0, 'کشف بازی‌ها'),
                  _tabBar(1, 'بازی‌های من'),
                  if (auth.isAuthenticated) _tabBar(2, 'دعوت‌نامه‌ها'),
                ],
              ),
            ),
          ),
          if (_tab == 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _sort,
                      decoration: const InputDecoration(
                        labelText: 'ترتیب',
                        isDense: true,
                      ),
                      items: GameSort.values
                          .map(
                            (s) => DropdownMenuItem(
                              value: s.wire,
                              child: Text(
                                s.labelFa,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        setState(() => _sort = v);
                        _load();
                      },
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _skill,
                      decoration: const InputDecoration(
                        labelText: 'سطح',
                        isDense: true,
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('همه')),
                        ...SkillLevel.values.map(
                          (s) => DropdownMenuItem(
                            value: s.wire,
                            child: Text(
                              s.labelFa,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ),
                      ],
                      onChanged: (v) {
                        setState(() => _skill = v);
                        _load();
                      },
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  FilterChip(
                    label: const Text(
                      'ظرفیت دارد',
                      style: TextStyle(fontFamily: 'Vazirmatn', fontSize: 11),
                    ),
                    selected: _availabilityOnly,
                    onSelected: (v) {
                      setState(() => _availabilityOnly = v);
                      _load();
                    },
                  ),
                ],
              ),
            ),
          const SizedBox(height: AppSpacing.sm),
          Expanded(
            child: _loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: ListTileSkeleton(count: 4, height: 150),
                  )
                : _error
                    ? ErrorState(
                        title: 'در دریافت بازی‌ها خطایی رخ داد.',
                        onRetry: _load,
                      )
                    : _tab == 2
                        ? _invitationsList()
                        : _gamesList(),
          ),
        ],
      ),
    );
  }

  Widget _tabBar(int index, String label) {
    final active = _tab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _tab = index);
          _load();
        },
        child: AnimatedContainer(
          duration: AppDurations.fast,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: active ? AppColors.gradientPrimary : null,
            borderRadius: BorderRadius.circular(AppRadius.chip),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: active ? Colors.white : null,
            ),
          ),
        ),
      ),
    );
  }

  Widget _gamesList() {
    if (_games.isEmpty) {
      return EmptyState(
        emoji: '🎮',
        title: _tab == 1 ? 'هنوز بازی‌ای ندارید' : 'بازی‌ای یافت نشد',
        description: _tab == 1
            ? 'با رزرو یک سانس، بازی گروهی بسازید و دوستانتان را دعوت کنید.'
            : 'فیلترها را تغییر دهید یا بعداً بررسی کنید.',
        actionLabel: _tab == 1 ? 'رزرو سالن' : null,
        onAction: _tab == 1 ? () => context.push('/venues') : null,
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.xxxl,
        ),
        itemCount: _games.length,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.lg),
        itemBuilder: (context, index) => GameCard(
          game: _games[index],
          onTap: () => context.push('/games/${_games[index].id}'),
        ),
      ),
    );
  }

  Widget _invitationsList() {
    if (_invitations.isEmpty) {
      return const EmptyState(
        emoji: '📨',
        title: 'دعوت‌نامه‌ای ندارید',
        description: 'دعوت‌نامه‌های بازی گروهی شما اینجا نمایش داده می‌شود.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.xl),
      itemCount: _invitations.length,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        final inv = _invitations[index];
        return Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(AppRadius.image),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.tile),
                  color: AppColors.secondary.withValues(alpha: 0.1),
                ),
                child: const Icon(Icons.mark_email_unread_outlined,
                    size: 19, color: AppColors.secondary),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      inv.gameName ?? 'بازی #${inv.gameId}',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    Text(
                      'از ${inv.invitedUserName ?? 'کاربر'} — ${timeAgo(inv.createdAt)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _aceptInvitation(inv),
                icon: const Icon(Icons.check_circle_rounded,
                    color: AppColors.success),
                tooltip: 'پذیرش',
              ),
              IconButton(
                onPressed: () => _rejectInvitation(inv),
                icon: const Icon(Icons.cancel_rounded, color: AppColors.error),
                tooltip: 'رد',
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Shared game card widget (used by explore/my-games lists).
class GameCard extends StatelessWidget {
  const GameCard({super.key, required this.game, required this.onTap});

  final Game game;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final remaining = game.remaining;
    final statusColor = switch (game.status) {
      'open' => AppColors.success,
      'full' => AppColors.warning,
      'started' => AppColors.info,
      'completed' => AppColors.secondary,
      'cancelled' => AppColors.error,
      _ => AppColors.lightTextMuted,
    };
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.tile),
                    gradient: const LinearGradient(
                      colors: [
                        AppColors.gradientPrimarySoftTop,
                        AppColors.gradientPrimarySoftBottom,
                      ],
                    ),
                  ),
                  child: Center(
                    child: Text(
                      sportEmoji(game.sport),
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        game.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined,
                              size: 14, color: AppColors.primary),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              game.venueName ?? '—',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Text(
                  gameStatusLabel(game.status),
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                const Icon(Icons.access_time_rounded,
                    size: 15, color: AppColors.primary),
                const SizedBox(width: 5),
                Text(
                  formatGameDateTime(game.slotDate, game.startTime),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Spacer(),
                Text(
                  '${formatFaNumber(game.currentPlayers)}/${formatFaNumber(game.maxPlayers)}',
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                _miniChip(
                  game.skillLevel.labelFa,
                  AppColors.primary,
                ),
                const SizedBox(width: 6),
                _miniChip(game.visibility.labelFa, AppColors.lightTextMuted),
                const SizedBox(width: 6),
                _miniChip(game.paymentMode.labelFa, AppColors.lightTextMuted),
                const Spacer(),
                Text(
                  game.isFreeOrUnknown
                      ? 'رایگان'
                      : '${formatPriceOnly(game.pricePerPlayer!)} تومان / نفر',
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: game.isFreeOrUnknown
                        ? AppColors.successDark
                        : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                if (game.myParticipantStatus == 'acepted')
                  _miniChip('عضو هستید', AppColors.success)
                else if (game.myParticipantStatus == 'pending')
                  _miniChip('در انتظار تأیید', AppColors.warningDeep)
                else if (game.myParticipantStatus == 'invited')
                  _miniChip('دعوت‌نامه دارید', AppColors.primary)
                else if (game.myWaitlistPosition != null)
                  _miniChip(
                    'رتبه انتظار ${formatFaNumber(game.myWaitlistPosition!)}',
                    AppColors.warningDeep,
                  ),
                const Spacer(),
                Text(
                  remaining > 0
                      ? '${formatFaNumber(remaining)} جای خالی'
                      : 'تکمیل — لیست انتظار',
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color:
                        remaining > 0 ? AppColors.successDark : AppColors.warningDeep,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniChip(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      );
}
