import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/state/auth_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _requestSent = false;

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    // TODO: Implement forgot password API
    setState(() => _requestSent = true);
    
    /*
    try {
      await ref.read(authProvider.notifier).forgotPassword(
            _phoneController.text.trim(),
          );

      if (mounted) {
        setState(() => _requestSent = true);
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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState is AsyncLoading;

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
                  _requestSent ? 'درخواست ارسال شد' : 'بازیابی رمز عبور',
                  style: AppTypography.h4.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: AppSpacing.sm),
                
                Text(
                  _requestSent
                      ? 'رمز عبور جدید به شماره موبایل شما ارسال شد'
                      : 'شماره موبایل خود را وارد کنید تا رمز عبور جدید برایتان ارسال شود',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: AppSpacing.xxl),
                
                if (_requestSent) ...[
                  // Success message
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
                            'رمز عبور جدید با موفقیت ارسال شد. لطفاً پیامک خود را بررسی کنید.',
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
                    text: 'ورود به حساب',
                    onPressed: () => context.go('/login'),
                    gradient: true,
                  ),
                ] else ...[
                  // Phone field
                  AppTextField(
                    controller: _phoneController,
                    label: 'شماره موبایل',
                    hintText: '۰۹۱۲۳۴۵۶۷۸۹',
                    keyboardType: TextInputType.phone,
                    prefixIcon: Icons.phone_outlined,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'لطفاً شماره موبایل را وارد کنید';
                      }
                      if (!RegExp(r'^09[0-9]{9}$').hasMatch(value)) {
                        return 'شماره موبایل معتبر وارد کنید';
                      }
                      return null;
                    },
                  ),
                  
                  const SizedBox(height: AppSpacing.xl),
                  
                  // Submit button
                  AppButton(
                    text: 'ارسال رمز عبور جدید',
                    onPressed: _handleResetPassword,
                    isLoading: isLoading,
                    gradient: true,
                  ),
                ],
                
                const SizedBox(height: AppSpacing.lg),
                
                // Back to login link
                if (!_requestSent)
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
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }
}
