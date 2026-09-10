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
import '../pages/login_page.dart' show FilteringTextFormatter;
import '../providers/auth_provider.dart';

/// Two-step password reccovery: request code → reset password.
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  int _step = 1;
  bool _loading = false;
  String? _error;
  String? _devCode;
  bool _success = false;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final phone = _phone.text.trim();
    if (Validators.phone(phone) != null) {
      setState(() =>
          _error = 'شماره موبایل معتبر وارد کنید (مثال 09123456789)');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final devCode = await ref
          .read(authProvider.notifier)
          .devPasswordReset(phone);
      if (!mounted) return;
      AppSnack.success(context, 'کد بازیابی ارسال شد');
      setState(() {
        _devCode = devCode;
        _step = 2;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(
        () => _error = 'خطا در ارسال کد بازیابی. لطفاً بعداً تلاش کنید.',
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reset() async {
    if (Validators.verificationCode(_code.text) != null) {
      setState(() => _error = 'کد ۶ رقمی را وارد کنید');
      return;
    }
    if (_password.text.length < 4) {
      setState(() => _error = 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = 'رمز عبور جدید و تکرار آن یکسان نیستند');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).resetPassword(
            phone: _phone.text.trim(),
            code: _code.text,
            newPassword: _password.text,
          );
      if (!mounted) return;
      AppSnack.success(context, 'رمز عبور با موفقیت تغییر کرد');
      setState(() => _success = true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'خطا در بازیابی رمز عبور');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtitle = _success
        ? 'رمز عبور شما با موفقیت بازنشانی شد'
        : _step == 1
            ? 'شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود'
            : 'کد ۶ رقمی و رمز عبور جدید را وارد کنید';
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppSpacing.xl),
                  _AuthHeader(
                    icon: Icons.lock_reset_rounded,
                    title: 'بازیابی رمز عبور',
                    subtitle: subtitle,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  AnimatedSwitcher(
                    duration: AppDurations.normal,
                    child: _success
                        ? _buildSucess()
                        : _step == 1
                            ? _buildStep1()
                            : _buildStep2(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  if (!_success && _step == 1)
                    TextButton.icon(
                      onPressed: () => context.go('/login'),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 17),
                      label: const Text('بازگشت به صفحه ورود'),
                    ),
                  if (!_success && _step == 2)
                    TextButton.icon(
                      onPressed: () => setState(() {
                        _step = 1;
                        _code.clear();
                        _error = null;
                      }),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 17),
                      label: const Text('تغییر شماره موبایل'),
                    ),
                  const SizedBox(height: AppSpacing.xl),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSucess() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 46),
          const SizedBox(height: AppSpacing.md),
          const Text(
            'رمز عبور تغییر کرد!',
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'اکنون می‌توانید با رمز عبور جدید وارد شوید.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.lg),
          AppGradientButton(
            label: 'بازگشت به صفحه ورود',
            icon: Icons.arrow_forward_rounded,
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppTextField(
          controller: _phone,
          label: 'شماره موبایل',
          hint: '09123456789',
          prefixIcon: Icons.phone_iphone_rounded,
          keyboardType: TextInputType.phone,
          ltr: true,
          inputFormatters: [FilteringTextFormatter.digitsOnly(11)],
        ),
        const SizedBox(height: AppSpacing.lg),
        _infoBox('کد بازیابی ۶ رقمی به شماره موبایل شما ارسال می‌شود. این کد تا ۱۰ دقیقه معتبر است.'),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.lg),
          _errorBox(_error!),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppGradientButton(
          label: 'ارسال کد بازیابی',
          icon: Icons.mark_email_read_outlined,
          loading: _loading,
          onPressed: _sendCode,
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_devCode != null) _devCodeBox(_devCode!),
        AppTextField(
          controller: _code,
          label: 'کد بازیابی',
          hint: '000000',
          keyboardType: TextInputType.number,
          ltr: true,
          textAlign: TextAlign.center,
          inputFormatters: [FilteringTextFormatter.digitsOnly(6)],
        ),
        const SizedBox(height: AppSpacing.lg),
        AppTextField(
          controller: _password,
          label: 'رمز عبور جدید (حداقل ۴ کاراکتر)',
          prefixIcon: Icons.lock_outline_rounded,
          obscure: true,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppTextField(
          controller: _confirm,
          label: 'تکرار رمز عبور جدید',
          prefixIcon: Icons.lock_reset_outlined,
          obscure: true,
        ),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.lg),
          _errorBox(_error!),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppGradientButton(
          label: 'بازنشانی رمز عبور',
          icon: Icons.check_circle_outline_rounded,
          loading: _loading,
          onPressed: _reset,
        ),
      ],
    );
  }

  Widget _infoBox(String text) => Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.primary, size: 19),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontSize: 12,
                  height: 1.8,
                ),
              ),
            ),
          ],
        ),
      );

  Widget _errorBox(String text) => Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 19),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontSize: 12.5,
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );

  Widget _devCodeBox(String code) => Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.lg),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.warning.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.lightbulb_outline_rounded,
                color: AppColors.warningDeep, size: 19),
            const SizedBox(width: 10),
            Expanded(
              child: Text.rich(
                TextSpan(
                  text: 'حالت توسعه — کد بازیابی شما: ',
                  children: [
                    TextSpan(
                      text: toPersianDigits(code),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3,
                      ),
                    ),
                  ],
                ),
                style: const TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontSize: 12.5,
                  color: AppColors.warningDeep,
                ),
              ),
            ),
          ],
        ),
      );
}

/// Reusable header for standalone auth pages.
class _AuthHeader extends StatelessWidget {
  const _AuthHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppColors.gradientPrimary,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 34),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
