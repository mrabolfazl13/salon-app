import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../auth/providers/auth_provider.dart';
import '../../competitions/data/competition_service.dart';
import '../../slots/domain/slot.dart';
import '../../venues/domain/venue.dart';
import '../../venues/providers/venues_providers.dart';

final competitionsServiceProvider = Provider<CompetitionService>((ref) {
  return CompetitionService(ref.read(apiClientProvider));
});

class CompetitionSlotView {
  const CompetitionSlotView({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.currentPrice,
    required this.status,
  });

  final int id;
  final String startTime;
  final String endTime;
  final int duration;
  final int currentPrice;
  final String status;

  factory CompetitionSlotView.fromSlot(Slot slot) => CompetitionSlotView(
        id: slot.id,
        startTime: formatTimeRaw(slot.startTime),
        endTime: slotEndTime(slot.startTime, slot.duration),
        duration: slot.duration,
        currentPrice: slot.currentPrice,
        status: slot.status,
      );
}

/// Manager-only price competition page; regular users get an info screen.
class CompetitionsPage extends ConsumerStatefulWidget {
  const CompetitionsPage({super.key});

  @override
  ConsumerState<CompetitionsPage> createState() => _CompetitionsPageState();
}

class _CompetitionsPageState extends ConsumerState<CompetitionsPage> {
  List<Venue> _venues = [];
  int? _selectedVenueId;
  String _date = isoDate(DateTime.now());
  List<CompetitionSlotView> _slots = [];
  final Map<int, int?> _bestBids = {};
  bool _loadingVenues = true;
  bool _loadingSlots = false;

  @override
  void initState() {
    super.initState();
    _loadVenues();
  }

  Future<void> _loadVenues() async {
    try {
      final venues = await ref.read(venuesServiceProvider).getMyVenues();
      if (!mounted) return;
      setState(() {
        _venues = venues;
        _loadingVenues = false;
        _selectedVenueId = venues.isNotEmpty ? venues.first.id : null;
      });
      if (venues.isNotEmpty) _loadSlots();
    } catch (_) {
      if (mounted) setState(() => _loadingVenues = false);
    }
  }

  Future<void> _loadSlots() async {
    final venueId = _selectedVenueId;
    if (venueId == null) return;
    setState(() => _loadingSlots = true);
    try {
      final slots = await ref
          .read(venueSlotsServiceProvider)
          .getByVenueAndDate(venueId, _date);
      if (!mounted) return;
      setState(() {
        _slots = slots.map(CompetitionSlotView.fromSlot).toList();
        _loadingSlots = false;
      });
      for (final slot in _slots.where((s) => s.status == 'in_competition')) {
        try {
          final best =
              await ref.read(competitionsServiceProvider).getBestBid(slot.id);
          if (mounted) setState(() => _bestBids[slot.id] = best);
        } catch (_) {
          if (mounted) setState(() => _bestBids[slot.id] = null);
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingSlots = false;
          _slots = [];
        });
      }
    }
  }

  Future<void> _startCompetition(CompetitionSlotView slot) async {
    final preset = (slot.currentPrice * 0.9 / 1000).floor() * 1000;
    final controller = TextEditingController(
      text: preset > 0 ? preset.toString() : '',
    );
    final price = await showAppSheet<int>(
      context: context,
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'شروع رقابت قیمت',
              style: Theme.of(sheetContext).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'سانس ${formatTimeFa(slot.startTime)} - ${formatTimeFa(slot.endTime)}'
              '   •   قیمت فعلی: ${formatPrice(slot.currentPrice)}',
              style: Theme.of(sheetContext).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            AppTextField(
              controller: controller,
              label: 'قیمت پیشنهادی (تومان)',
              keyboardType: TextInputType.number,
              ltr: true,
            ),
            const SizedBox(height: 6),
            Text(
              'هرچه قیمت پیشنهادی کمتر باشد، شانس برنده شدن بیشتر است',
              style: Theme.of(sheetContext).textTheme.labelSmall,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppGradientButton(
              label: 'شروع رقابت',
              onPressed: () {
                final value = int.tryParse(digitsOnly(controller.text));
                if (value == null || value <= 0) {
                  AppSnack.error(sheetContext, 'قیمت پیشنهادی معتبر نیست');
                  return;
                }
                Navigator.of(sheetContext).pop(value);
              },
            ),
            TextButton(
              onPressed: () => Navigator.of(sheetContext).pop(),
              child: const Text('انصراف'),
            ),
          ],
        ),
      ),
    );
    if (price == null || !mounted) return;
    try {
      await ref.read(competitionsServiceProvider).start(
            slotId: slot.id,
            offeredPrice: price,
          );
      if (!mounted) return;
      AppSnack.success(context, 'رقابت قیمت با موفقیت شروع شد!');
      _loadSlots();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در شروع رقابت');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isManager = ref.watch(authProvider.select((s) => s.isManager));
    if (!isManager) {
      return Scaffold(
        appBar: AppBar(title: const Text('رقابت قیمت')),
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.emoji_events_outlined,
                    size: 56, color: AppColors.warning),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'رقابت قیمت',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'بخش رقابت قیمت مخصوص مدیران سالن است. مدیران می‌توانند برای سانس‌های آزاد سالن خود رقابت قیمت راه‌اندازی کنند تا با بهترین قیمت ممکن، سانس‌های خود را پر کنند.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 13,
                    height: 2,
                    color: Theme.of(context).textTheme.bodySmall?.color,
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                AppGradientButton(
                  label: 'مشاهده سالن‌ها',
                  onPressed: () => context.push('/venues'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('رقابت قیمت')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl, AppSpacing.md, AppSpacing.xl, 0,
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(AppRadius.image),
              ),
              child: const Text(
                'رقابت ۲۴ ساعت ادامه دارد و در پایان آن، کمترین قیمت پیشنهادی برنده می‌شود و قیمت سانس به همان میزان تنظیم خواهد شد.',
                style: TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontSize: 12,
                  height: 1.9,
                  color: AppColors.info,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: _loadingVenues
                      ? const ShimmerBox(height: 50)
                      : DropdownButtonFormField<int>(
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
                            setState(() => _selectedVenueId = v);
                            _loadSlots();
                          },
                        ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  flex: 2,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.button),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.parse(_date),
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 7)),
                        lastDate: DateTime.now().add(const Duration(days: 60)),
                        locale: const Locale('fa', 'IR'),
                      );
                      if (picked != null) {
                        setState(() => _date = isoDate(picked));
                        _loadSlots();
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'تاریخ'),
                      child: Text(
                        formatDateNumeric(_date),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _loadSlots,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loadingSlots
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: ListTileSkeleton(count: 3, height: 120),
                  )
                : _slots.isEmpty
                    ? EmptyState(
                        icon: Icons.event_busy_outlined,
                        title: 'سانسی برای این تاریخ ثبت نشده است',
                        description:
                            'از پنل مدیریت سالن‌ها، سانس‌های روز مورد نظر را تولید کنید',
                        actionLabel: 'مدیریت سالن‌ها',
                        onAction: () => context.push('/manager-dashboard'),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadSlots,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.xl, AppSpacing.sm, AppSpacing.xl,
                            AppSpacing.xxxl,
                          ),
                          itemCount: _slots.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: AppSpacing.md),
                          itemBuilder: (context, index) => _SlotCard(
                            slot: _slots[index],
                            bestBid: _bestBids[_slots[index].id],
                            onStart: _slots[index].status == 'available'
                                ? () => _startCompetition(_slots[index])
                                : null,
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _SlotCard extends StatelessWidget {
  const _SlotCard({
    required this.slot,
    required this.bestBid,
    required this.onStart,
  });

  final CompetitionSlotView slot;
  final int? bestBid;
  final VoidCallback? onStart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      '${formatTimeFa(slot.startTime)} - ${formatTimeFa(slot.endTime)}',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(width: 8),
                    StatusChip(slot.status),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'مدت: ${formatFaNumber(slot.duration)} دقیقه',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 6),
                Text(
                  'قیمت فعلی سانس',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                Text(
                  formatPrice(slot.currentPrice),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.successDark,
                      ),
                ),
                if (slot.status == 'in_competition') ...[
                  const SizedBox(height: 6),
                  Text(
                    'بهترین پیشنهاد',
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                  Text(
                    bestBid == null
                        ? 'هنوز پیشنهادی ثبت نشده'
                        : formatPrice(bestBid!),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.warningDeep,
                        ),
                  ),
                ],
              ],
            ),
          ),
          if (onStart != null)
            AppGradientButton(
              label: 'شروع رقابت',
              icon: Icons.gavel_rounded,
              width: 120,
              height: 44,
              fontSize: 12.5,
              onPressed: onStart,
            ),
        ],
      ),
    );
  }
}
