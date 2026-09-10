import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/states.dart';
import '../domain/game.dart';
import '../providers/games_provider.dart';

/// Join a game through an invite token (/join/:token deep link).
class JoinByTokenPage extends ConsumerStatefulWidget {
  const JoinByTokenPage({super.key, required this.token});

  final String token;

  @override
  ConsumerState<JoinByTokenPage> createState() => _JoinByTokenPageState();
}

class _JoinByTokenPageState extends ConsumerState<JoinByTokenPage> {
  TokenPreview? _preview;
  bool _loading = true;
  bool _joining = false;
  late String _token;
  final _tokenController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _token = widget.token == 'token-entry' ? '' : widget.token;
    _tokenController.text = _token;
    if (_token.isNotEmpty) _previewToken(_token);
  }

  Future<void> _previewToken(String token) async {
    setState(() => _loading = true);
    try {
      final preview = await ref.read(gamesServiceProvider).previewToken(token);
      if (!mounted) return;
      setState(() {
        _preview = preview;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _preview = const TokenPreview(valid: false, reason: 'INVITE_INVALID');
          _loading = false;
        });
      }
    }
  }

  Future<void> _join() async {
    setState(() => _joining = true);
    try {
      final result = await ref.read(gamesServiceProvider).joinByToken(_token);
      if (!mounted) return;
      AppSnack.success(context, result.message);
      context.pushReplacement('/games/${result.game.id}');
    } on ApiException catch (e) {
      if (!mounted) return;
      AppSnack.error(context, e.message);
      setState(() => _joining = false);
    } catch (_) {
      if (!mounted) return;
      AppSnack.error(context, 'خطا در پیوستن به بازی');
      setState(() => _joining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('پیوستن با لینک دعوت')),
      body: _token.isEmpty ? _entryForm() : _content(),
    );
  }

  Widget _entryForm() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppSpacing.xl),
          const Icon(Icons.link_rounded, size: 56, color: AppColors.primary),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'کد یا لینک دعوت را وارد کنید',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          AppTextField(
            controller: _tokenController,
            label: 'کد دعوت',
            hint: 'مثلاً abc123',
            ltr: true,
          ),
          const SizedBox(height: AppSpacing.xl),
          AppGradientButton(
            label: 'بررسی دعوت',
            onPressed: () {
              final token = _tokenController.text.trim();
              if (token.isEmpty) {
                AppSnack.error(context, 'کد دعوت را وارد کنید');
                return;
              }
              setState(() => _token = token);
              _previewToken(token);
            },
          ),
        ],
      ),
    );
  }

  Widget _content() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    final preview = _preview;
    final game = preview?.game;
    if (preview == null || !preview.valid || game == null) {
      return ErrorState(
        title: 'این لینک دعوت معتبر نیست',
        description: 'ممکن است لینک منقضی شده یا بازی لغو شده باشد.',
        onRetry: () => setState(() {
          _token = '';
          _preview = null;
        }),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              children: [
                Text(sportEmoji(game.sport), style: const TextStyle(fontSize: 40)),
                const SizedBox(height: AppSpacing.md),
                Text(game.name, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                Text(
                  '${game.venueName ?? '—'} • ${formatGameDateTime(game.slotDate, game.startTime)}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 6),
                Text(
                  '${formatFaNumber(game.currentPlayers)} از ${formatFaNumber(game.maxPlayers)} بازیکن',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          AppGradientButton(
            label: 'پیوستن به بازی',
            icon: Icons.group_add_rounded,
            loading: _joining,
            onPressed: _join,
          ),
          TextButton(
            onPressed: () => setState(() {
              _token = '';
              _preview = null;
            }),
            child: const Text('استفاده از لینک دیگر'),
          ),
        ],
      ),
    );
  }
}
