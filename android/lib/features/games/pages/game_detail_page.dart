import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../domain/game.dart';
import '../providers/games_provider.dart';

/// Game detail: participants, join requests, waitlist, invite links,
/// payments, and lifecycle actions (start/complete/cancel).
class GameDetailPage extends ConsumerStatefulWidget {
  const GameDetailPage({super.key, required this.id});

  final int id;

  @override
  ConsumerState<GameDetailPage> createState() => _GameDetailPageState();
}

class _GameDetailPageState extends ConsumerState<GameDetailPage> {
  Game? _game;
  List<Participant> _participants = [];
  List<JoinRequest> _requests = [];
  List<WaitlistEntry> _waitlist = [];
  List<InviteLink> _links = [];
  GamePaymentSummary? _payments;
  bool _loading = true;
  bool _notFound = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final service = ref.read(gamesServiceProvider);
      final game = await service.getById(widget.id);
      final results = await Future.wait([
        service.getParticipants(widget.id),
        service.getJoinRequests(widget.id).then((v) => v, onError: (_) => <JoinRequest>[]),
        service.getWaitlist(widget.id).then((v) => v, onError: (_) => <WaitlistEntry>[]),
        service.getInviteLinks(widget.id).then((v) => v, onError: (_) => <InviteLink>[]),
        service
            .getPaymentSummary(widget.id)
            .then<GamePaymentSummary?>((v) => v, onError: (_) => null),
      ]);
      if (!mounted) return;
      setState(() {
        _game = game;
        _participants = results[0] as List<Participant>;
        _requests = results[1] as List<JoinRequest>;
        _waitlist = results[2] as List<WaitlistEntry>;
        _links = results[3] as List<InviteLink>;
        _payments = results[4] as GamePaymentSummary?;
        _loading = false;
        _notFound = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _notFound = true;
        });
      }
    }
  }

  Future<void> _run(Future<void> Function() action, String success) async {
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      AppSnack.success(context, success);
      await _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'عملیات ناموفق بود');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const SingleChildScrollView(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: ListTileSkeleton(count: 3, height: 110),
        ),
      );
    }
    final game = _game;
    if (_notFound || game == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات بازی')),
        body: ErrorState(title: 'بازی مورد نظر یافت نشد.', onRetry: _load),
      );
    }

    final canManage = game.canManage;
    final canJoin = !game.isParticipant &&
        game.myParticipantStatus != 'pending' &&
        (game.status == 'open' || game.status == 'full');

    return Scaffold(
      appBar: AppBar(
        title: Text(game.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (canManage)
            IconButton(
              onPressed: _showManageSheet,
              icon: const Icon(Icons.settings_outlined),
            ),
        ],
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            children: [
              _header(game),
              const SizedBox(height: AppSpacing.lg),
              if (canJoin || game.myParticipantStatus == 'acepted' || game.myWaitlistPosition != null)
                _actionBar(game),
              const SizedBox(height: AppSpacing.lg),
              _participantsCard(game),
              if (canManage && _requests.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.lg),
                _requestsCard(game),
              ],
              if (canManage && _waitlist.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.lg),
                _waitlistCard(),
              ],
              if (_payments != null && game.paymentMode != PaymentMode.free) ...[
                const SizedBox(height: AppSpacing.lg),
                _paymentsCard(game),
              ],
              if (canManage) ...[
                const SizedBox(height: AppSpacing.lg),
                _inviteLinksCard(game),
              ],
              const SizedBox(height: AppSpacing.xxxl),
            ],
          ),
          if (_busy)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _header(Game game) {
    return Container(
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
                width: 48,
                height: 48,
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
                    style: const TextStyle(fontSize: 24),
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
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      'برگزارکننده: ${game.organizerName ?? '—'}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: AppSpacing.xl),
          _infoRow(Icons.event_rounded, formatGameDateTime(game.slotDate, game.startTime)),
          if (game.venueName != null)
            _infoRow(Icons.location_on_outlined, game.venueName!),
          _infoRow(
            Icons.groups_outlined,
            '${formatFaNumber(game.currentPlayers)} از ${formatFaNumber(game.maxPlayers)} بازیکن',
          ),
          _infoRow(Icons.signal_cellular_alt_rounded, game.skillLevel.labelFa),
          _infoRow(
            game.visibility == GameVisibility.private
                ? Icons.lock_outline_rounded
                : Icons.public_rounded,
            game.visibility.labelFa,
          ),
          _infoRow(Icons.payments_outlined, game.paymentMode.labelFa),
          if (game.description != null && game.description!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              game.description!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.9),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }

  Widget _actionBar(Game game) {
    if (game.myParticipantStatus == 'acepted') {
      return Row(
        children: [
          Expanded(
            child: AppOutlineButton(
              label: 'خروج از بازی',
              icon: Icons.logout_rounded,
              color: AppColors.error,
              onPressed: () => _run(
                () => ref.read(gamesServiceProvider).leave(game.id),
                'از بازی خارج شدید.',
              ),
            ),
          ),
          if (game.paymentMode == PaymentMode.splitPayment &&
              _payments != null &&
              !(_payments!.payments
                  .any((p) => p.status == 'paid' || p.userId == game.organizerId))) ...[
            const SizedBox(width: AppSpacing.md),
          ],
        ],
      );
    }
    if (game.myWaitlistPosition != null) {
      return AppOutlineButton(
        label: 'خروج از لیست انتظار (رتبه ${formatFaNumber(game.myWaitlistPosition!)})',
        onPressed: () => _run(
          () => ref.read(gamesServiceProvider).leaveWaitlist(game.id),
          'از لیست انتظار خارج شدید',
        ),
      );
    }
    return AppGradientButton(
      label: game.status == 'full' ? 'عضویت در لیست انتظار' : 'پیوستن به بازی',
      icon: Icons.group_add_rounded,
      onPressed: () async {
        try {
          if (game.status == 'full') {
            await ref.read(gamesServiceProvider).joinWaitlist(game.id);
            if (!mounted) return;
            AppSnack.success(context, 'به لیست انتظار اضافه شدید ⏳');
            _load();
          } else {
            final result =
                await ref.read(gamesServiceProvider).join(game.id);
            if (!mounted) return;
            AppSnack.success(context, result.message);
            _load();
          }
        } on ApiException catch (e) {
          if (mounted) AppSnack.error(context, e.message);
        }
      },
    );
  }

  Widget _participantsCard(Game game) {
    return _card(
      'بازیکنان (${formatFaNumber(_participants.length)})',
      _participants.isEmpty
          ? [const Text('هنوز بازیکنی عضو نشده است')]
          : _participants.map((p) {
              final isSelf = p.role == 'organizer';
              return ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor:
                      isSelf ? AppColors.secondary : AppColors.primary,
                  child: Text(
                    (p.fullName ?? '؟').characters.first,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 12),
                  ),
                ),
                title: Text(p.fullName ?? 'کاربر'),
                subtitle: Text(participantRoleLabel(p.role)),
                trailing: p.paymentStatus == 'paid'
                    ? const Icon(Icons.check_circle_rounded,
                        color: AppColors.success, size: 18)
                    : null,
              );
            }).toList(),
    );
  }

  Widget _requestsCard(Game game) {
    return _card(
      'درخواست‌های عضویت (${formatFaNumber(_requests.length)})',
      _requests.map((r) {
        return ListTile(
          contentPadding: EdgeInsets.zero,
          dense: true,
          leading: const Icon(Icons.person_add_outlined,
              color: AppColors.warningDeep),
          title: Text(r.fullName ?? 'کاربر'),
          subtitle: Text(timeAgo(r.createdAt)),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.check_circle_outline,
                    color: AppColors.success),
                onPressed: () => _run(
                  () => ref
                      .read(gamesServiceProvider)
                      .approveJoinRequest(game.id, r.id),
                  'درخواست تایید شد',
                ),
              ),
              IconButton(
                icon: const Icon(Icons.cancel_outlined, color: AppColors.error),
                onPressed: () => _run(
                  () =>
                      ref.read(gamesServiceProvider).rejectJoinRequest(game.id, r.id),
                  'درخواست رد شد',
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _waitlistCard() {
    return _card(
      'لیست انتظار (${formatFaNumber(_waitlist.length)})',
      _waitlist
          .map(
            (w) => ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Text(
                '#${formatFaNumber(w.position)}',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              title: Text('کاربر #${w.userId}'),
            ),
          )
          .toList(),
    );
  }

  Widget _paymentsCard(Game game) {
    final p = _payments!;
    return _card('تسویه حساب', [
      Row(
        children: [
          Expanded(
            child: Text(
              'پرداخت‌شده: ${formatFaNumber(p.paidcount)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: Text(
              'در انتظار: ${formatFaNumber(p.pendingcount)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Text(
            p.pricePerPlayer == null
                ? 'رایگان'
                : '${formatPriceOnly(p.pricePerPlayer!)} تومان / نفر',
            style: Theme.of(context).textTheme.titleSmall,
          ),
        ],
      ),
      if (game.isParticipant && p.pricePerPlayer != null) ...[
        const SizedBox(height: AppSpacing.md),
        AppGradientButton(
          label: 'پرداخت سهم من',
          icon: Icons.credit_card_rounded,
          height: 44,
          onPressed: () => _payMyShare(game),
        ),
      ],
    ]);
  }

  Future<void> _payMyShare(Game game) async {
    try {
      final me = _participants.firstWhere(
        (p) => p.userId == _game?.myRoleUserId(),
        orElse: () => _participants.first,
      );
      await ref
          .read(gamesServiceProvider)
          .payShare(game.id, me.id);
      if (!mounted) return;
      AppSnack.success(context, 'پرداخت سهم شما ثبت شد ✅');
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در پرداخت');
    }
  }

  Widget _inviteLinksCard(Game game) {
    return _card('لینک‌های دعوت', [
      ..._links.map(
        (link) => ListTile(
          contentPadding: EdgeInsets.zero,
          dense: true,
          leading: Icon(
            link.isActive ? Icons.link_rounded : Icons.link_off_rounded,
            color: link.isActive ? AppColors.primary : AppColors.lightTextMuted,
          ),
          title: Text(
            link.token,
            style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
            textDirection: TextDirection.ltr,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Text(
            '${formatFaNumber(link.usescount)} استفاده'
            '${link.maxUses != null ? " از ${formatFaNumber(link.maxUses!)}" : ""}',
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.share_outlined, size: 19),
                onPressed: () {
                  Share.share('به بازی «${game.name}» بپیوند: /join/${link.token}');
                },
              ),
              if (link.isActive) ...[
                IconButton(
                  icon: const Icon(Icons.refresh_rounded, size: 19),
                  onPressed: () => _run(
                    () => ref
                        .read(gamesServiceProvider)
                        .regenerateInviteLink(game.id, link.id),
                    'لینک جدید ساخته شد',
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.link_off_rounded,
                      size: 19, color: AppColors.error),
                  onPressed: () => _run(
                    () => ref
                        .read(gamesServiceProvider)
                        .disableInviteLink(game.id, link.id),
                    'لینک غیرفعال شد',
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      AppOutlineButton(
        label: 'ساخت لینک دعوت جدید',
        icon: Icons.add_link_rounded,
        onPressed: () => _run(
          () => ref.read(gamesServiceProvider).createInviteLink(game.id),
          'لینک دعوت ساخته شد',
        ),
      ),
    ]);
  }

  void _showManageSheet() {
    final game = _game!;
    showAppSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('مدیریت بازی', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSpacing.lg),
            if (game.status == 'open' || game.status == 'full')
              AppOutlineButton(
                label: 'شروع بازی',
                icon: Icons.play_arrow_rounded,
                onPressed: () {
                  Navigator.pop(context);
                  _run(() => ref.read(gamesServiceProvider).start(game.id),
                      'بازی شروع شد');
                },
              ),
            const SizedBox(height: AppSpacing.sm),
            if (game.status == 'started')
              AppOutlineButton(
                label: 'پایان بازی',
                icon: Icons.flag_rounded,
                onPressed: () {
                  Navigator.pop(context);
                  _run(() => ref.read(gamesServiceProvider).complete(game.id),
                      'بازی به پایان رسید');
                },
              ),
            const SizedBox(height: AppSpacing.sm),
            AppOutlineButton(
              label: 'لغو بازی',
              icon: Icons.cancel_outlined,
              color: AppColors.error,
              onPressed: () {
                Navigator.pop(context);
                _run(() => ref.read(gamesServiceProvider).cancel(game.id),
                    'بازی لغو شد');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _card(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: AppSpacing.md),
          ...children,
        ],
      ),
    );
  }
}

extension on Game? {
  int? myRoleUserId() => null;
}
