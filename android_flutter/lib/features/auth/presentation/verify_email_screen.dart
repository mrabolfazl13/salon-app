import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/state/auth_provider.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    6,
    (_) => FocusNode(),
  );
  bool _verified = false;

  String get _token => _controllers.map((c) => c.text).join();

  Future<void> _handleVerify() async {
    if (_token.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لطفاً کد ۶ رقمی را وارد کنید'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // TODO: Implement verify email API
    setState(() => _verified = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('ایمیل با موفقیت تأیید شد!'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) context.go('/dashboard');
    });
    
    /*
    try {
      await ref.read(authProvider.notifier).verifyEmail(_token);

      if (mounted) {
        setState(() => _verified = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ایمیل با موفقیت تأیید شد!'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) context.go('/dashboard');
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
    */
  }

  void _onChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState is AsyncLoading;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xxl),
              
              // Icon
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: AppRadius.imageBorderRadius,
                    gradient: const LinearGradient(
                      colors: [AppColors.blue, AppColors.blueDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Icon(
                    _verified ? Icons.check_circle : Icons.mark_email_read,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
              ),
              
              const SizedBox(height: AppSpacing.xl),
              
              Text(
                _verified ? 'تأیید موفق!' : 'تأیید ایمیل',
                style: AppTypography.h4.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              Text(
                _verified
                    ? 'حساب کاربری شما با موفقیت تأیید شد'
                    : 'کد ۶ رقمی ارسال شده به ایمیل خود را وارد کنید',
                style: AppTypography.bodyMedium.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.xxl),
              
              if (!_verified) ...[
                // OTP Input fields
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(6, (index) {
                    return SizedBox(
                      width: 45,
                      child: TextFormField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: AppTypography.h4.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark
                              ? AppColors.darkSurface
                              : Colors.grey[50],
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.mediumBorderRadius,
                            borderSide: BorderSide(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: AppRadius.mediumBorderRadius,
                            borderSide: const BorderSide(
                              color: AppColors.blue,
                              width: 2,
                            ),
                          ),
                        ),
                        onChanged: (value) => _onChanged(index, value),
                      ),
                    );
                  }),
                ),
                
                const SizedBox(height: AppSpacing.xl),
                
                // Verify button
                AppButton(
                  text: 'تأیید کد',
                  onPressed: _handleVerify,
                  isLoading: isLoading,
                  gradient: true,
                ),
                
                const SizedBox(height: AppSpacing.md),
                
                // Resend code
                Center(
                  child: TextButton(
                    onPressed: () {
                      // TODO: Implement resend logic
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('کد جدید ارسال شد'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    child: const Text('ارسال مجدد کد'),
                  ),
                ),
              ] else ...[
                // Success state
                Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: AppRadius.cardBorderRadius,
                    border: Border.all(color: AppColors.success.withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle, color: AppColors.success, size: 48),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        'ایمیل شما با موفقیت تأیید شد!',
                        style: AppTypography.h6.copyWith(
                          color: AppColors.success,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'اکنون می‌توانید از تمام امکانات سیستم استفاده کنید',
                        style: AppTypography.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: AppSpacing.lg),
              
              // Back to login
              if (!_verified)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'بازگشت به ',
                      style: AppTypography.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('ورود'),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }
}
