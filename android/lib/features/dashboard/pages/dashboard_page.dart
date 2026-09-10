import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../auth/providers/auth_provider.dart';
import '../../bookings/domain/booking.dart';
import '../../bookings/providers/bookings_provider.dart';
import '../../contracts/providers/contracts_provider.dart';
import '../../memberships/domain/membership.dart';
import '../../memberships/providers/memberships_provider.dart';

/// User dashboard: stats, quick actions, recent bookings, memberships.
class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  List<Booking> _bookings = [];
  List<MembershipPurchase> _memberships = [];
  int _contractscount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      ref.read(bookingsServiceProvider).getAll().catchError((_) => <Booking>[]),
      ref
          .read(membershipsServiceProvider)
          .getMyPurchases()
          .catchError((_) => <MembershipPurchase>[]),
      ref
          .read(contractsServiceProvider)
          .getAll()
          .then((c) => c.length)
          .catchError((_) => 0),
    ]);
    if (!mounted) return;
    setState(() {
      _bookings = results[0] as List<Booking>;
      _memberships = results[1] as List<MembershipPurchase>;
      _contractscount = results[2] as int;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final upcoming =
        _bookings.where((b) => b.status == 'confirmed').take(3).toList();
    final activeMemberships =
        _memberships.where((m) => m.status == 'paid').toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('داشبورد ${user != null ? user.fullName.split(' ').first : ''}'),
      ),
      body: _loading
          ? const SingleChildScrollView(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: ListTileSkeleton(count: 3, height: 100),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.xl),
                children: [
                  Row(
                    children: [
                      _statCard(
                        formatFaNumber(_bookings.where((b) => b.status == 'confirmed').length),
                        'رزرو فعال',
                        Icons.event_available_rounded,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      _statCard(
                        formatFaNumber(_bookings.where((b) => b.status == 'completed').length),
                        'بازی انجام‌شده',
                        Icons.sports_soccer_rounded,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      _statCard(
                        formatFaNumber(_contractscount),
                        'قرارداد',
                        Icons.description_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const SectionHeader(title: 'دسترسی سریع'),
                  Row(
                    children: [
                      _quickAction(
                        'رزرو سالن',
                        Icons.stadium_outlined,
                        () => context.push('/venues'),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      _quickAction(
                        'قراردادها',
                        Icons.description_outlined,
                        () => context.push('/contracts'),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      _quickAction(
                        'بازی گروهی',
                        Icons.sports_esports_outlined,
                        () => context.push('/games'),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      _quickAction(
                        'رقابت‌ها',
                        Icons.emoji_events_outlined,
                        () => context.push('/competitions'),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  SectionHeader(
                    title: 'رزروهای پیش رو',
                    actionLabel: 'همه',
                    onAction: () => context.push('/bookings'),
                  ),
                  if (upcoming.isEmpty)
                    EmptyState(
                      emoji: '📅',
                      title: 'رزرو فعالی ندارید',
                      description: 'برای بازی بعدی‌تان سالن رزرو کنید.',
                      actionLabel: 'رزرو سالن',
                      onAction: () => context.push('/venues'),
                    )
                  else
                    ...upcoming.map(
                      (b) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppRadius.image),
                            side: BorderSide(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                          tileColor: Theme.of(context).cardTheme.color,
                          leading: const Icon(Icons.event_rounded,
                              color: AppColors.primary),
                          title: Text(
                            b.venueName ?? 'سالن #${b.slotId}',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          subtitle: Text(
                            b.slotDate != null
                                ? '${formatDateNumeric(b.slotDate)} — ${formatTimeFa(b.startTime)}'
                                : '—',
                          ),
                          trailing: StatusChip(b.status, compact: true),
                          onTap: () => context.push('/bookings/${b.id}'),
                        ),
                      ),
                    ),
                  const SizedBox(height: AppSpacing.xl),
                  const SectionHeader(title: 'اشتراک‌های من'),
                  if (activeMemberships.isEmpty)
                    const EmptyState(
                      emoji: '🎟️',
                      title: 'اشتراکی ندارید',
                      description:
                          'از صفحات باشگاه‌ها می‌توانید اشتراک جلسه‌ای یا ماهانه تهیه کنید.',
                    )
                  else
                    ...activeMemberships.map(
                      (m) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppRadius.image),
                            side: BorderSide(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                          tileColor: Theme.of(context).cardTheme.color,
                          leading: const Icon(Icons.card_membership_rounded,
                              color: AppColors.secondary),
                          title: Text(
                            m.planTitle ?? 'اشتراک',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          subtitle: Text(
                            m.expiresAt != null
                                ? 'اعتبار تا ${formatDate(m.expiresAt)}'
                                : m.typeLabelFa,
                          ),
                          trailing: m.sessionsRemaining != null
                              ? Text(
                                  '${formatFaNumber(m.sessionsRemaining!)} جلسه',
                                  style: Theme.of(context).textTheme.titleSmall,
                                )
                              : const StatusChip('active', compact: true),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _statCard(String value, String label, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickAction(String label, IconData icon, VoidCallback onTap) {
    return Expanded(
      child: Material(
        color: AppColors.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(AppRadius.image),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.image),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              children: [
                Icon(icon, size: 20, color: AppColors.primary),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
