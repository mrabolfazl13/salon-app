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

class GameDetailScreen extends ConsumerStatefulWidget {
  final String gameId;

  const GameDetailScreen({super.key, required this.gameId});

  @override
  ConsumerState<GameDetailScreen> createState() => _GameDetailScreenState();
}

class _GameDetailScreenState extends ConsumerState<GameDetailScreen> {
  Map<String, dynamic>? _game;
  List<dynamic> _participants = [];
  bool _loading = true;
  String? _error;
  bool _acting = false;

  static const _skillLabels = <String, String>{
    'beginner': 'مبتدی',
    'intermediate': 'متوسط',
    'advanced': 'پیشرفته',
    'pro': 'حرفه‌ای',
  };

  static const _statusLabels = <String, String>{
    'open': 'در حال جذب بازیکن',
    'full': 'تکمیل ظرفیت',
    'started': 'شروع شده',
    'completed': 'به پایان رسیده',
    'cancelled': 'لغو شده',
    'draft': 'پیش‌نویس',
  };

  static const _visibilityLabels = <String, String>{
    'public': 'عمومی — پیوستن آزاد',
    'public_approval': 'عمومی — با تأیید برگزارکننده',
    'private': 'خصوصی — فقط دعوت‌شده‌ها',
  };

  static const _paymentModeLabels = <String, String>{
    'split_payment': 'تقسیم هزینه بین بازیکنان',
    'organizer_pays': 'برگزارکننده می‌پردازد',
    'free': 'رایگان',
  };

  static const _participantStatusLabels = <String, String>{
    'accepted': 'تأیید شده',
    'joined': 'حاضر',
    'pending': 'در انتظار تأیید',
    'invited': 'دعوت‌شده',
    'left': 'خارج شده',
    'rejected': 'رد شده',
    'removed': 'حذف شده',
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
      final results = await Future.wait([
        GameService.getGame(widget.gameId),
        GameService.getParticipants(widget.gameId),
      ]);
      if (!mounted) return;
      setState(() {
        _game = results[0] as Map<String, dynamic>;
        _participants = results[1] as List<dynamic>;
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

  bool get _isOrganizer => _game?['my_role']?.toString() == 'organizer';
  bool get _isMember {
    final s = _game?['my_participant_status']?.toString();
    return s != null && s != 'left' && s != 'rejected' && s != 'removed';
  }

  Future<void> _join() async {
    setState(() => _acting = true);
    try {
      final result = await GameService.joinGame(widget.gameId);
      if (!mounted) return;
      final message = (result['message'] ?? 'انجام شد').toString();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('خروج از بازی'),
        content: const Text('آیا از خروج از این بازی مطمئن هستید؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('خروج'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _acting = true);
    try {
      await GameService.leaveGame(widget.gameId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('از بازی خارج شدید'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _cancelGame() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو بازی'),
        content: const Text(
            'با لغو بازی، سهم همه بازیکنان استرداد و لینک‌های دعوت باطل می‌شود. مطمئن هستید؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('لغو بازی'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _acting = true);
    try {
      await GameService.cancelGame(widget.gameId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('بازی لغو شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              : _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    final game = _game!;
    final status = game['status']?.toString() ?? 'open';
    final slotDate = game['slot_date']?.toString();
    final startTime = game['start_time']?.toString();
    final duration = (game['duration'] as num?)?.toInt();
    final pricePerPlayer = (game['price_per_player'] as num?);
    final current = (game['current_players'] as num?)?.toInt() ?? 0;
    final maxPlayers = (game['max_players'] as num?)?.toInt() ?? 0;
    final canAct = !_acting && status != 'cancelled' && status != 'completed';

    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                ),
                child: const Center(
                  child: Icon(Icons.sports_soccer, size: 48, color: Colors.white),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(game['name']?.toString() ?? 'بازی',
                            style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                        decoration: BoxDecoration(
                          color: status == 'cancelled'
                              ? AppColors.error.withOpacity(0.1)
                              : AppColors.success.withOpacity(0.1),
                          borderRadius: AppRadius.chipBorderRadius,
                        ),
                        child: Text(
                          _statusLabels[status] ?? status,
                          style: AppTypography.caption.copyWith(
                            fontWeight: FontWeight.w600,
                            color: status == 'cancelled' ? AppColors.error : AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (game['description'] != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(game['description'].toString(),
                        style: AppTypography.bodyMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7))),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  _buildInfoCard(context, 'اطلاعات بازی', [
                    if (slotDate != null)
                      ['تاریخ', JalaliDate.formatIsoDate(slotDate)],
                    if (startTime != null)
                      [
                        'ساعت',
                        duration != null
                            ? '${FaFormat.time(startTime)} تا ${FaFormat.slotEndTime(startTime, duration)}'
                            : FaFormat.time(startTime),
                      ],
                    if (duration != null) ['مدت', '${FaFormat.faNum(duration)} دقیقه'],
                    if (game['venue_name'] != null)
                      ['سالن', game['venue_name'].toString()],
                    if (game['venue_address'] != null)
                      ['آدرس', game['venue_address'].toString()],
                    ['سطح', _skillLabels[game['skill_level']] ?? game['skill_level']?.toString() ?? '—'],
                    ['نوع بازی', _visibilityLabels[game['visibility']] ?? game['visibility']?.toString() ?? '—'],
                    ['حالت پرداخت', _paymentModeLabels[game['payment_mode']] ?? game['payment_mode']?.toString() ?? '—'],
                    if (game['organizer_name'] != null)
                      ['برگزارکننده', game['organizer_name'].toString()],
                  ]),
                  const SizedBox(height: AppSpacing.md),
                  _buildInfoCard(context, 'ظرفیت و هزینه', [
                    ['بازیکنان', '${FaFormat.faNum(current)} از ${FaFormat.faNum(maxPlayers)} نفر'],
                    if (game['total_price'] != null)
                      ['هزینه کل زمین', FaFormat.toman((game['total_price'] as num).toInt())],
                    if (pricePerPlayer != null)
                      ['سهم هر نفر', FaFormat.toman(pricePerPlayer.toInt())],
                    if ((game['my_waitlist_position'] as num?) != null)
                      ['جایگاه در لیست انتظار', FaFormat.faNum(game['my_waitlist_position'] as num)],
                  ]),
                  const SizedBox(height: AppSpacing.md),
                  _buildParticipantsCard(context),
                  const SizedBox(height: AppSpacing.xl),
                  if (canAct && !_isMember)
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _acting ? null : _join,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorderRadius),
                        ),
                        child: _acting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('درخواست پیوستن',
                                style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    )
                  else if (canAct && _isMember && !_isOrganizer)
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton(
                        onPressed: _acting ? null : _leave,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorderRadius),
                        ),
                        child: const Text('خروج از بازی',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    )
                  else if (canAct && _isOrganizer && status == 'open')
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton(
                        onPressed: _acting ? null : _cancelGame,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorderRadius),
                        ),
                        child: const Text('لغو بازی',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  const SizedBox(height: AppSpacing.xl),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String title, List<List<String>> items) {
    return Container(
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
          Text(title, style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item[0],
                        style: AppTypography.bodyMedium.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(
                      child: Text(item[1],
                          textAlign: TextAlign.end,
                          style: AppTypography.bodyMedium
                              .copyWith(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildParticipantsCard(BuildContext context) {
    final active =
        _participants.where((p) => !['left', 'removed', 'rejected'].contains(p['status'])).toList();
    return Container(
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
          Text('بازیکنان',
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          if (active.isEmpty)
            Text('هنوز کسی به بازی نپیوسته',
                style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)))
          else
            ...active.map((p) {
              final role = p['role']?.toString();
              final status = p['status']?.toString();
              final name = p['full_name']?.toString() ?? '';
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: AppColors.blue.withOpacity(0.1),
                      child: Text(
                        name.isNotEmpty ? name.substring(0, 1) : '؟',
                        style: AppTypography.caption
                            .copyWith(color: AppColors.blue, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(name.isNotEmpty ? name : 'بازیکن',
                          style: AppTypography.bodyMedium),
                    ),
                    if (role == 'organizer')
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.amber.withOpacity(0.15),
                          borderRadius: AppRadius.chipBorderRadius,
                        ),
                        child: Text('برگزارکننده',
                            style: AppTypography.caption.copyWith(
                                color: AppColors.amber,
                                fontWeight: FontWeight.w600)),
                      )
                    else if (status != null && status != 'accepted')
                      Text(
                        _participantStatusLabels[status] ?? status,
                        style: AppTypography.caption.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                      ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
