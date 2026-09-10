import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../bookings/domain/booking.dart';
import '../../bookings/providers/bookings_provider.dart';
import '../../venues/domain/venue.dart';
import '../../venues/providers/venues_providers.dart';

/// Manager dashboard: venue selection, pending bookings, bookings list,
/// slot generation.
class ManagerDashboardPage extends ConsumerStatefulWidget {
  const ManagerDashboardPage({super.key});

  @override
  ConsumerState<ManagerDashboardPage> createState() =>
      _ManagerDashboardPageState();
}

class _ManagerDashboardPageState extends ConsumerState<ManagerDashboardPage> {
  List<Venue> _venues = [];
  int? _selectedVenueId;
  List<Booking> _pending = [];
  List<Booking> _bookings = [];
  bool _loading = true;
  bool _notManager = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final venues = await ref.read(venuesServiceProvider).getMyVenues();
      if (!mounted) return;
      if (venues.isEmpty) {
        setState(() {
          _venues = [];
          _pending = [];
          _bookings = [];
          _loading = false;
        });
        return;
      }
      setState(() {
        _venues = venues;
        _selectedVenueId ??= venues.first.id;
      });
      await _loadVenueData();
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isForbidden) {
        setState(() {
          _notManager = true;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadVenueData() async {
    final venueId = _selectedVenueId;
    if (venueId == null) return;
    final service = ref.read(bookingsServiceProvider);
    final results = await Future.wait([
      service.getVenuePending(venueId).catchError((_) => <Booking>[]),
      service
          .getVenueBookings(venueId,
              startDate: isoDate(DateTime.now()),
              endDate: isoDate(DateTime.now().add(const Duration(days: 7))))
          .catchError((_) => <Booking>[]),
    ]);
    if (!mounted) return;
    setState(() {
      _pending = results[0];
      _bookings = results[1];
      _loading = false;
    });
  }

  Future<void> _confirmPending(Booking booking) async {
    try {
      await ref
          .read(bookingsServiceProvider)
          .confirmPending(booking.idString);
      if (!mounted) return;
      AppSnack.success(context, 'رزرو تایید شد ✅');
      _loadVenueData();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  Future<void> _rejectPending(Booking booking) async {
    try {
      await ref
          .read(bookingsServiceProvider)
          .rejectPending(booking.idString);
      if (!mounted) return;
      AppSnack.info(context, 'رزرو رد شد');
      _loadVenueData();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  Future<void> _generateSlots() async {
    final venueId = _selectedVenueId;
    if (venueId == null) return;
    try {
      await ref
          .read(venueSlotsServiceProvider)
          .generateForDate(venueId, isoDate(DateTime.now()));
      if (!mounted) return;
      AppSnack.success(context, 'سانس‌های امروز تولید شدند');
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_notManager) {
      return Scaffold(
        appBar: AppBar(title: const Text('داشبورد مدیریت')),
        body: const ErrorState(
          title: 'شما دسترسی مدیریتی ندارید',
          description: 'این بخش مخصوص مدیران سالن است.',
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('داشبورد مدیریت'),
        actions: [
          IconButton(
            onPressed: _generateSlots,
            icon: const Icon(Icons.auto_awesome_rounded),
            tooltip: 'تولید سانس امروز',
          ),
        ],
      ),
      body: _loading
          ? const SingleChildScrollView(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: ListTileSkeleton(count: 3, height: 90),
            )
          : _venues.isEmpty
              ? EmptyState(
                  emoji: '🏟️',
                  title: 'هنوز سالنی ندارید',
                  description:
                      'برای مدیریت سانس‌ها و رزروها، ابتدا سالن خود را ثبت کنید.',
                  actionLabel: 'ثبت سالن',
                  onAction: () => context.push('/competitions'),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    children: [
                      DropdownButtonFormField<int>(
                        initialValue: _selectedVenueId,
                        decoration: const InputDecoration(labelText: 'سالن'),
                        items: _venues
                            .map(
                              (v) => DropdownMenuItem(
                                value: v.id,
                                child: Text(
                                  v.name,
                                  style:
                                      Theme.of(context).textTheme.bodyMedium,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (v) {
                          setState(() {
                            _selectedVenueId = v;
                            _loading = true;
                          });
                          _loadVenueData();
                        },
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      SectionHeader(
                        title:
                            '⏳ رزروهای در انتظار تایید (${formatFaNumber(_pending.length)})',
                      ),
                      if (_pending.isEmpty)
                        const Text(
                          'رزرو در انتظاری وجود ندارد',
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 12.5,
                          ),
                        )
                      else
                        ..._pending.map(
                          (b) => Padding(
                            padding:
                                const EdgeInsets.only(bottom: AppSpacing.md),
                            child: ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.image),
                                side: BorderSide(
                                  color: Theme.of(context).dividerColor,
                                ),
                              ),
                              tileColor: Theme.of(context).cardTheme.color,
                              leading: const Icon(Icons.hourglass_top_rounded,
                                  color: AppColors.warningDeep),
                              title: Text(
                                b.venueName ?? 'رزرو #${b.idString.substring(0, 8)}',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              subtitle: Text(
                                b.slotDate != null
                                    ? '${formatDateNumeric(b.slotDate)} — ${formatTimeFa(b.startTime)} • ${formatPrice(b.paymentAmount)}'
                                    : '—',
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.check_circle_rounded,
                                        color: AppColors.success),
                                    onPressed: () => _confirmPending(b),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.cancel_rounded,
                                        color: AppColors.error),
                                    onPressed: () => _rejectPending(b),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(height: AppSpacing.xl),
                      SectionHeader(
                        title: '📅 رزروهای ۷ روز آینده (${formatFaNumber(_bookings.length)})',
                      ),
                      if (_bookings.isEmpty)
                        const Text(
                          'رزروی در این بازه ثبت نشده است',
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 12.5,
                          ),
                        )
                      else
                        ..._bookings.map(
                          (b) => Padding(
                            padding:
                                const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: ListTile(
                              dense: true,
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.image),
                                side: BorderSide(
                                  color: Theme.of(context).dividerColor,
                                ),
                              ),
                              title: Text(
                                '${formatDateNumeric(b.slotDate)} — ${formatTimeFa(b.startTime)}',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              subtitle: Text(formatPrice(b.paymentAmount)),
                              trailing: StatusChip(b.status, compact: true),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
