import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/network/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _step2 = false;
  bool _success = false;
  bool _loading = false;
  String? _error;

  String _latinDigits(String value) {
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    const ar = '٠١٢٣٤٥٦٧٨٩';
    return value
        .split('')
        .map((ch) {
          final fi = fa.indexOf(ch);
          if (fi >= 0) return '$fi';
          final ai = ar.indexOf(ch);
          if (ai >= 0) return '$ai';
          return ch;
        })
        .join();
  }

  Future<void> _sendCode() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await AuthService.forgotPassword(_latinDigits(_phoneController.text).trim());
      if (!mounted) return;
      setState(() {
        _step2 = true;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await AuthService.resetPassword(
        phone: _latinDigits(_phoneController.text).trim(),
        code: _latinDigits(_codeController.text).trim(),
        newPassword: _passwordController.text,
      );
      if (!mounted) return;
      setState(() {
        _success = true;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  String? _phoneValidator(String? value) {
    final phone = _latinDigits(value ?? '').trim();
    if (phone.isEmpty) return 'لطفاً شماره موبایل را وارد کنید';
    if (!RegExp(r'^09[0-9]{9}$').hasMatch(phone)) return 'شماره موبایل معتبر وارد کنید';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSpacing.xxl),

                // Back button
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                  style: IconButton.styleFrom(
                    backgroundColor: Theme.of(context).brightness == Brightness.dark
                        ? AppColors.darkSurface
                        : Colors.grey[100],
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // Icon
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      borderRadius: AppRadius.imageBorderRadius,
                      gradient: const LinearGradient(
                        colors: [AppColors.amber, AppColors.amberDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.lock_reset,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                Text(
                  _success
                      ? 'رمز عبور تغییر کرد'
                      : _step2
                          ? 'کد بازیابی را وارد کنید'
                          : 'بازیابی رمز عبور',
                  style: AppTypography.h4.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: AppSpacing.sm),

                Text(
                  _success
                      ? 'رمز عبور شما با موفقیت بازنشانی شد'
                      : _step2
                          ? 'کد ۶ رقمی پیامک‌شده و رمز عبور جدید را وارد کنید'
                          : 'شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: AppSpacing.xxl),

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: AppRadius.cardBorderRadius,
                      border: Border.all(color: AppColors.error.withOpacity(0.3)),
                    ),
                    child: Text(
                      _error!,
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.error),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],

                if (_success) ...[
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: AppRadius.cardBorderRadius,
                      border: Border.all(color: AppColors.success.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.success, size: 24),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text(
                            'اکنون می‌توانید با رمز عبور جدید وارد شوید.',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  AppButton(
                    text: 'بازگشت به صفحه ورود',
                    onPressed: () => context.go('/login'),
                    gradient: true,
                  ),
                ] else ...[
                  if (!_step2) ...[
                    AppTextField(
                      controller: _phoneController,
                      label: 'شماره موبایل',
                      hintText: '۰۹۱۲۳۴۵۶۷۸۹',
                      keyboardType: TextInputType.phone,
                      prefixIcon: Icons.phone_outlined,
                      validator: _phoneValidator,
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    AppButton(
                      text: 'ارسال کد بازیابی',
                      onPressed: _sendCode,
                      isLoading: _loading,
                      gradient: true,
                    ),
                  ] else ...[
                    AppTextField(
                      controller: _codeController,
                      label: 'کد بازیابی ۶ رقمی',
                      hintText: '۰۰۰۰۰۰',
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 6,
                      prefixIcon: Icons.pin_outlined,
                      validator: (value) {
                        final code = _latinDigits(value ?? '').trim();
                        if (code.length != 6) return 'کد ۶ رقمی را وارد کنید';
                        return null;
                      },
                    ),

                    const SizedBox(height: AppSpacing.md),

                    AppTextField(
                      controller: _passwordController,
                      label: 'رمز عبور جدید',
                      hintText: 'حداقل ۴ کاراکتر',
                      obscureText: true,
                      prefixIcon: Icons.lock_outline,
                      validator: (value) {
                        if ((value ?? '').length < 4) return 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد';
                        return null;
                      },
                    ),

                    const SizedBox(height: AppSpacing.md),

                    AppTextField(
                      controller: _confirmController,
                      label: 'تکرار رمز عبور جدید',
                      obscureText: true,
                      prefixIcon: Icons.lock_outline,
                      validator: (value) {
                        if (value != _passwordController.text) {
                          return 'رمز عبور جدید و تکرار آن یکسان نیستند';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: AppSpacing.xl),

                    AppButton(
                      text: 'بازنشانی رمز عبور',
                      onPressed: _resetPassword,
                      isLoading: _loading,
                      gradient: true,
                    ),

                    const SizedBox(height: AppSpacing.lg),

                    Center(
                      child: TextButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _step2 = false;
                                  _codeController.clear();
                                  _error = null;
                                }),
                        child: const Text('تغییر شماره موبایل'),
                      ),
                    ),
                  ],

                  const SizedBox(height: AppSpacing.lg),

                  if (!_step2)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'رمز عبور خود را به یاد دارید؟ ',
                          style: AppTypography.bodyMedium,
                        ),
                        TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('وارد شوید'),
                        ),
                      ],
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }
}
