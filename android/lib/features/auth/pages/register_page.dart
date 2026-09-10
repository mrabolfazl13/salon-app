import 'package:flutter/gestures.dart';
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
import '../providers/auth_provider.dart';
import 'login_page.dart' show FilteringTextFormatter;

/// 3-step register wizard: account type+identity → passwords → terms.
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isManager = false;
  bool _aceptedTerms = false;
  int _step = 1;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  bool _validateStep(int step) {
    switch (step) {
      case 1:
        return Validators.fullName(_fullName.text) == null &&
            Validators.phone(_phone.text) == null;
      case 2:
        return Validators.password(_password.text) == null &&
            _password.text == _confirm.text;
      default:
        return _aceptedTerms;
    }
  }

  void _next() {
    final ok = _validateStep(_step);
    if (!ok) {
      _formKey.currentState?.validate();
      if (_step == 3 && !_aceptedTerms) {
        setState(() => _error = 'پذیرش قوانین الزامی است');
      } else if (_step == 2 && _password.text != _confirm.text) {
        setState(() => _error = 'رمز عبور و تکرار آن مطابقت ندارند');
      }
      return;
    }
    setState(() {
      _error = null;
      if (_step < 3) _step++;
    });
  }

  Future<void> _submit() async {
    if (!_aceptedTerms) {
      setState(() => _error = 'پذیرش قوانین الزامی است');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).register(
            phone: _phone.text.trim(),
            fullName: _fullName.text.trim(),
            password: _password.text,
            role: _isManager ? 'venue_manager' : 'user',
          );
      if (!mounted) return;
      if (_isManager) {
        AppSnack.success(
          context,
          'ثبت‌نام موفق! حساب شما در انتظار تایید مدیر نرم‌افزار است',
        );
        context.go('/login');
      } else {
        AppSnack.success(
          context,
          'ثبت‌نام موفقیت‌آمیز! حالا ایمیل خود را تایید کنید',
        );
        context.go('/verify?phone=${Uri.encodeComponent(_phone.text.trim())}');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.gradientHero,
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Form(
                  key: _formKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: AppSpacing.xl),
                      _Header(step: _step),
                      const SizedBox(height: AppSpacing.xl),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: (isDark ? AppColors.darkSurface : Colors.white)
                              .withValues(alpha: 0.96),
                          borderRadius: BorderRadius.circular(28),
                          border:
                              Border.all(color: Theme.of(context).dividerColor),
                          boxShadow: [
                            BoxShadow(
                              color:
                                  AppColors.primaryDeep.withValues(alpha: 0.35),
                              blurRadius: 32,
                              offset: const Offset(0, 16),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (_error != null) ...[
                              _ErrorBanner(message: _error!),
                              const SizedBox(height: AppSpacing.lg),
                            ],
                            AnimatedSwitcher(
                              duration: AppDurations.normal,
                              child: _buildStep(),
                            ),
                            const SizedBox(height: AppSpacing.xl),
                            _buildNavButtons(),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text.rich(
                        TextSpan(
                          text: 'قبلاً ثبت‌نام کردید؟ ',
                          children: [
                            TextSpan(
                              text: 'وارد شوید',
                              style: const TextStyle(
                                fontFamily: 'Vazirmatn',
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () => context.go('/login'),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Vazirmatn',
                          fontSize: 13.5,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
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

  Widget _buildStep() {
    switch (_step) {
      case 1:
        return _StepOne(
          key: const ValueKey('step1'),
          fullName: _fullName,
          phone: _phone,
          isManager: _isManager,
          onRoleChanged: (v) => setState(() => _isManager = v),
        );
      case 2:
        return _StepTwo(
          key: const ValueKey('step2'),
          password: _password,
          confirm: _confirm,
        );
      default:
        return _StepThree(
          key: const ValueKey('step3'),
          isManager: _isManager,
          acepted: _aceptedTerms,
          onChanged: (v) => setState(() {
            _aceptedTerms = v;
            _error = null;
          }),
        );
    }
  }

  Widget _buildNavButtons() {
    return Row(
      children: [
        if (_step > 1) ...[
          SizedBox(
            width: 110,
            child: AppOutlineButton(
              label: 'قبلی',
              icon: Icons.arrow_forward_rounded,
              onPressed: () => setState(() => _step--),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
        ],
        Expanded(
          child: _step < 3
              ? AppGradientButton(
                  label: 'بعدی',
                  icon: Icons.arrow_back_rounded,
                  onPressed: _next,
                )
              : AppGradientButton(
                  label: _isManager ? 'ثبت‌نام (مدیر سالن)' : 'ثبت‌نام (کاربر)',
                  icon: Icons.check_rounded,
                  loading: _loading,
                  onPressed: _submit,
                ),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.step});

  final int step;

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
          'ثبت‌نام',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'حساب کاربری خود را بسازید',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.85),
              ),
        ),
        const SizedBox(height: AppSpacing.xl),
        _StepIndicator(current: step),
      ],
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current});

  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 1; i <= 3; i++) ...[
          if (i > 1) _connector(i <= current),
          _circle(i),
        ],
      ],
    );
  }

  Widget _circle(int i) {
    final active = i <= current;
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: active ? Colors.white : Colors.white.withValues(alpha: 0.18),
        boxShadow: active
            ? [
                const BoxShadow(
                  color: Colors.black26,
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ]
            : null,
      ),
      alignment: Alignment.center,
      child: i < current
          ? const Icon(Icons.check, color: AppColors.primaryDark, size: 18)
          : Text(
              toPersianDigits('$i'),
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: active
                    ? AppColors.primaryDark
                    : Colors.white.withValues(alpha: 0.85),
              ),
            ),
    );
  }

  Widget _connector(bool active) => Expanded(
        child: Container(
          height: 2,
          margin: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            color: active
                ? Colors.white
                : Colors.white.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      );
}

class _StepOne extends StatelessWidget {
  const _StepOne({
    super.key,
    required this.fullName,
    required this.phone,
    required this.isManager,
    required this.onRoleChanged,
  });

  final TextEditingController fullName;
  final TextEditingController phone;
  final bool isManager;
  final ValueChanged<bool> onRoleChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('نوع حساب', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: _roleTile(context, false)),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _roleTile(context, true)),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        AppTextField(
          controller: fullName,
          label: 'نام و نام خانوادگی',
          prefixIcon: Icons.person_outline_rounded,
          validator: Validators.fullName,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppTextField(
          controller: phone,
          label: 'شماره موبایل',
          hint: '09xxxxxxxxx',
          prefixIcon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
          ltr: true,
          inputFormatters: [FilteringTextFormatter.digitsOnly(11)],
          validator: Validators.phone,
        ),
      ],
    );
  }

  Widget _roleTile(BuildContext context, bool manager) {
    final selected = isManager == manager;
    return GestureDetector(
      onTap: () => onRoleChanged(manager),
      child: AnimatedContainer(
        duration: AppDurations.fast,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.07)
              : Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.button),
          border: Border.all(
            color: selected
                ? AppColors.primary
                : Theme.of(context).dividerColor,
            width: selected ? 1.8 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              manager ? Icons.store_outlined : Icons.account_circle_outlined,
              size: 26,
              color: selected ? AppColors.primary : AppColors.lightTextSecondary,
            ),
            const SizedBox(height: 6),
            Text(
              manager ? 'مدیر سالن' : 'کاربر عادی',
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.primary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepTwo extends StatelessWidget {
  const _StepTwo({
    super.key,
    required this.password,
    required this.confirm,
  });

  final TextEditingController password;
  final TextEditingController confirm;

  String? _confirmValidator(String? v) {
    if (v != password.text) return 'رمز عبور و تکرار آن مطابقت ندارند';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: password,
      builder: (context, value, _) {
        final len = value.text.length;
        final color = len == 0
            ? Colors.transparent
            : len < 6
                ? AppColors.error
                : len < 10
                    ? AppColors.warning
                    : AppColors.success;
        final label = len < 6 ? 'ضعیف' : len < 10 ? 'متوسط' : 'قوی';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppTextField(
              controller: password,
              label: 'رمز عبور',
              prefixIcon: Icons.lock_outline_rounded,
              obscure: true,
              validator: Validators.password,
              textInputAction: TextInputAction.next,
            ),
            if (value.text.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 5,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            AppTextField(
              controller: confirm,
              label: 'تکرار رمز عبور',
              prefixIcon: Icons.lock_reset_outlined,
              obscure: true,
              validator: _confirmValidator,
            ),
          ],
        );
      },
    );
  }
}

class _StepThree extends StatelessWidget {
  const _StepThree({
    super.key,
    required this.isManager,
    required this.acepted,
    required this.onChanged,
  });

  final bool isManager;
  final bool acepted;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: () => onChanged(!acepted),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(AppRadius.image),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Checkbox(value: acepted, onChanged: (v) => onChanged(v ?? false)),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'قوانین و مقررات را می‌پذیرم',
                        style: TextStyle(
                          fontFamily: 'Vazirmatn',
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'با ثبت‌نام، اطلاعات شما نزد ما محفوظ است',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                AppColors.gradientPrimarySoftTop,
                AppColors.gradientPrimarySoftBottom,
              ],
            ),
            borderRadius: BorderRadius.circular(AppRadius.image),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: AppColors.primary, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isManager
                      ? 'به عنوان مدیر سالن می‌توانید سالن خود را مدیریت و قیمت‌گذاری کنید'
                      : 'اطلاعات شما برای ارسال پیام‌های مربوط به رزرو استفاده می‌شود',
                  style: const TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 12,
                    height: 1.8,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
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
  }
}
