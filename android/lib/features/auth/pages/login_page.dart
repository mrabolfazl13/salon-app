import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../domain/user.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key, this.from});

  final String? from;

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await ref
          .read(authProvider.notifier)
          .login(_phone.text.trim(), _password.text);
      if (!mounted) return;
      AppSnack.success(context, 'ورود موفقیت‌آمیز! 🎉');
      // Role-based redirect (mirrors the original).
      final fallback = user.role.isManager ? '/manager-dashboard' : '/venues';
      if (widget.from != null && widget.from!.isNotEmpty) {
        context.go(widget.from!);
      } else {
        context.go(fallback);
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'شماره موبایل یا رمز عبور اشتباه است.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.gradientHero,
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _BrandHeader(),
                      const SizedBox(height: AppSpacing.xxl),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: (isDark
                                  ? AppColors.darkSurface
                                  : Colors.white)
                              .withValues(alpha: 0.96),
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(color: Theme.of(context).dividerColor),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryDeep.withValues(alpha: 0.35),
                              blurRadius: 32,
                              offset: const Offset(0, 16),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            AppTextField(
                              controller: _phone,
                              label: 'شماره موبایل',
                              hint: '09xxxxxxxxx',
                              prefixIcon: Icons.phone_iphone_rounded,
                              keyboardType: TextInputType.phone,
                              ltr: true,
                              inputFormatters: [
                                FilteringTextFormatter.digitsOnly(11),
                              ],
                              validator: Validators.phone,
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            AppTextField(
                              controller: _password,
                              label: 'رمز عبور',
                              hint: 'رمز عبور',
                              prefixIcon: Icons.lock_outline_rounded,
                              obscure: true,
                              validator: Validators.password,
                              onFieldSubmitted: (_) => _submit(),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Align(
                              alignment: AlignmentDirectional.centerStart,
                              child: TextButton(
                                onPressed: () => context.push('/forgot-password'),
                                child: const Text('رمز عبور را فراموش کردید؟'),
                              ),
                            ),
                            if (_error != null) ...[
                              const SizedBox(height: AppSpacing.xs),
                              _InlineError(message: _error!),
                              const SizedBox(height: AppSpacing.sm),
                            ],
                            const SizedBox(height: AppSpacing.md),
                            AppGradientButton(
                              label: 'ورود',
                              icon: Icons.login_rounded,
                              loading: _loading,
                              onPressed: _submit,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text.rich(
                        TextSpan(
                          text: 'حساب ندارید؟ ',
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 13.5,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                          children: [
                            TextSpan(
                              text: 'ثبت‌نام کنید',
                              style: const TextStyle(
                                fontFamily: 'Vazirmatn',
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () => context.push('/register'),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            gradient: AppColors.gradientPrimary,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 26,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(Icons.sports_soccer_rounded,
              color: Colors.white, size: 38),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'خوش آمدید 👋',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'برای رزرو سالن فوتسال وارد شوید',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 13,
                color: Colors.white.withValues(alpha: 0.85),
              ),
        ),
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.tile),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 19),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.error,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Keeps digit-only input with max length (used by phone/code fields).
class FilteringTextFormatter extends TextInputFormatter {
  FilteringTextFormatter.digitsOnly(this.maxLen);

  final int? maxLen;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var digits = digitsOnly(newValue.text);
    if (maxLen != null && digits.length > maxLen!) {
      digits = digits.substring(0, maxLen);
    }
    return TextEditingValue(
      text: digits,
      selection: TextSelection.collapsed(offset: digits.length),
    );
  }
}
