import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../bookings/domain/booking.dart';
import '../../bookings/providers/bookings_provider.dart';
import '../domain/game.dart';
import '../providers/games_provider.dart';

/// Create a group game on top of one of the user's confirmed bookings.
class GameCreatePage extends ConsumerStatefulWidget {
  const GameCreatePage({super.key});

  @override
  ConsumerState<GameCreatePage> createState() => _GameCreatePageState();
}

class _GameCreatePageState extends ConsumerState<GameCreatePage> {
  List<Booking> _eligible = [];
  Booking? _selectedBooking;
  bool _loadingBookings = true;

  final _name = TextEditingController();
  final _description = TextEditingController();
  final _maxPlayers = TextEditingController(text: '8');
  SkillLevel _skill = SkillLevel.intermediate;
  GameVisibility _visibility = GameVisibility.public;
  PaymentMode _paymentMode = PaymentMode.splitPayment;
  final String _sport = 'futsal';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadEligibleBookings();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _maxPlayers.dispose();
    super.dispose();
  }

  Future<void> _loadEligibleBookings() async {
    try {
      final bookings = await ref.read(bookingsServiceProvider).getAll();
      if (!mounted) return;
      setState(() {
        _eligible = bookings
            .where((b) => b.status == 'confirmed' && !b.isPendingRedis)
            .toList();
        _selectedBooking = _eligible.isNotEmpty ? _eligible.first : null;
        _loadingBookings = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingBookings = false);
    }
  }

  Future<void> _submit() async {
    final nameError = Validators.groupName(_name.text);
    if (nameError != null) {
      AppSnack.error(context, nameError);
      return;
    }
    final maxPlayers = int.tryParse(_maxPlayers.text) ?? 0;
    if (maxPlayers < 2) {
      AppSnack.error(context, 'حداقل بازیکنان ۲ نفر است.');
      return;
    }
    if (maxPlayers > 100) {
      AppSnack.error(context, 'حداکثر بازیکنان ۱۰۰ نفر است.');
      return;
    }
    if (_selectedBooking == null) {
      AppSnack.error(context, 'برای ساخت بازی، یک رزرو تأییدشده لازم است.');
      return;
    }
    setState(() => _saving = true);
    try {
      final game = await ref.read(gamesServiceProvider).create(
            bookingId: _selectedBooking!.id as int,
            name: _name.text.trim(),
            description: _description.text.trim(),
            sport: _sport,
            maxPlayers: maxPlayers,
            skillLevel: _skill.wire,
            visibility: _visibility.wire,
            paymentMode: _paymentMode.wire,
          );
      if (!mounted) return;
      AppSnack.success(context, 'بازی ساخته شد 🎉');
      context.pushReplacement('/games/${game.id}');
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطایی رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ساخت بازی گروهی')),
      body: _loadingBookings
          ? const SingleChildScrollView(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: ListTileSkeleton(count: 3, height: 80),
            )
          : _eligible.isEmpty
              ? EmptyState(
                  emoji: '📅',
                  title: 'رزرو تأییدشده‌ای ندارید',
                  description:
                      'برای ساخت بازی گروهی ابتدا باید یک سانس رزرو کنید. بازی روی رزرو شما ساخته می‌شود.',
                  actionLabel: 'رزرو سالن',
                  onAction: () => context.push('/venues'),
                )
              : ListView(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  children: [
                    // Base booking info
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(AppRadius.image),
                        border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.event_available_rounded,
                                  color: AppColors.successDark, size: 18),
                              const SizedBox(width: 6),
                              Text(
                                'رزرو پایه‌ی بازی',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                      color: AppColors.successDark,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          DropdownButtonFormField<Booking>(
                            initialValue: _selectedBooking,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              labelText: 'انتخاب رزرو',
                            ),
                            items: _eligible
                                .map(
                                  (b) => DropdownMenuItem(
                                    value: b,
                                    child: Text(
                                      '${b.venueName ?? "سالن #${b.slotId}"} — ${formatDateNumeric(b.slotDate)} ${formatTimeFa(b.startTime)}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (b) =>
                                setState(() => _selectedBooking = b),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppTextField(
                      controller: _name,
                      label: 'نام بازی',
                      hint: 'مثلاً فوتسال پنجشنبه‌ها',
                      maxLength: 100,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _description,
                      label: 'توضیحات (اختیاری)',
                      maxLines: 3,
                      maxLength: 1000,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _maxPlayers,
                      label: 'حداکثر بازیکنان',
                      keyboardType: TextInputType.number,
                      ltr: true,
                      suffix: const Padding(
                        padding: EdgeInsets.only(left: 12),
                        child: Text('نفر'),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _dropdown<SkillLevel>(
                      'سطح بازی',
                      _skill,
                      SkillLevel.values,
                      (s) => s.labelFa,
                      (v) => setState(() => _skill = v!),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _dropdown<GameVisibility>(
                      'نوع دسترسی',
                      _visibility,
                      GameVisibility.values,
                      (v) => v.labelFa,
                      (v) => setState(() => _visibility = v!),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'خصوصی: فقط با لینک دعوت یا دعوت مستقیم - عمومی با تأیید: نیازمند تأیید مدیر - عمومی: پیوستن آزاد',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _dropdown<PaymentMode>(
                      'نحوه پرداخت',
                      _paymentMode,
                      PaymentMode.values,
                      (v) => v.labelFa,
                      (v) => setState(() => _paymentMode = v!),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'در حالت سهمی، هزینه‌ی رزرو بین بازیکنان تقسیم می‌شود.',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    AppGradientButton(
                      label: 'ساخت بازی',
                      icon: Icons.sports_soccer_rounded,
                      loading: _saving,
                      onPressed: _submit,
                    ),
                  ],
                ),
    );
  }

  Widget _dropdown<T>(
    String label,
    T value,
    List<T> items,
    String Function(T) text,
    ValueChanged<T?> onChanged,
  ) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: items
          .map(
            (item) => DropdownMenuItem(
              value: item,
              child: Text(
                text(item),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          )
          .toList(),
      onChanged: onChanged,
    );
  }
}
