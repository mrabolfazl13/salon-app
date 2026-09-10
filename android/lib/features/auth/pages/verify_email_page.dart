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

/// Email/phone verification required before booking — 2 steps.
class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({super.key, this.initialPhone});

  final String? initialPhone;

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  late final _phone = TextEditingController(text: widget.initialPhone ?? '');
  final _email = TextEditingController();
  final _code = TextEditingController();

  int _step = 1;
  bool _loading = false;
  String? _devCode;
  bool _success = false;

  @override
  void dispose() {
    _phone.dispose();
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    if (Validators.phone(_phone.text.trim()) != null) {
      AppSnack.error(context, 'شماره موبایل معتبر وارد کنید');
      return;
    }
    if (_email.text.trim().isEmpty) {
      AppSnack.error(context, 'ایمیل خود را وارد کنید');
      return;
    }
    setState(() => _loading = true);
    try {
      final devCode = await ref.read(authProvider.notifier).devEmailVerify(
            phone: _phone.text.trim(),
            email: _email.text.trim(),
          );
      if (!mounted) return;
      AppSnack.success(context, 'کد تایید ارسال شد');
      setState(() {
        _devCode = devCode;
        _step = 2;
      });
    } on ApiException catch (e) {
      AppSnack.error(context, e.message);
    } catch (_) {
      AppSnack.error(context, 'خطا در ارسال کد');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirm() async {
    if (Validators.verificationCode(_code.text) != null) {
      AppSnack.error(context, 'کد ۶ رقمی را وارد کنید');
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).confirmEmailVerify(
            phone: _phone.text.trim(),
            code: _code.text,
          );
      if (!mounted) return;
      AppSnack.success(context, 'ایمیل شما با موفقیت تایید شد. حالا می‌توانید رزرو کنید. 🎉');
      setState(() => _success = true);
    } on ApiException catch (e) {
      AppSnack.error(context, e.message);
    } catch (_) {
      AppSnack.error(context, 'خطا در تایید کد');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تایید شماره و ایمیل')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: _success ? _successView() : _form(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _successView() => Column(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 56),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'ایمیل شما با موفقیت تایید شد. حالا می‌توانید رزرو کنید. 🎉',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          AppGradientButton(
            label: 'مشاهده سالن‌ها',
            onPressed: () => context.go('/venues'),
          ),
        ],
      );

  Widget _form() => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: AppColors.gradientPrimary,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.mark_email_read_outlined,
                color: Colors.white, size: 30),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'تایید شماره و ایمیل',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 6),
          Text(
            'برای انجام رزرو، باید ایمیل یا شماره موبایل خود را تایید کنید',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.xl),
          if (_step == 1) ...[
            AppTextField(
              controller: _phone,
              label: 'شماره موبایل',
              hint: '09xxxxxxxxx',
              keyboardType: TextInputType.phone,
              ltr: true,
              inputFormatters: [FilteringTextFormatter.digitsOnly(11)],
            ),
            const SizedBox(height: AppSpacing.lg),
            AppTextField(
              controller: _email,
              label: 'ایمیل',
              hint: 'you@example.com',
              keyboardType: TextInputType.emailAddress,
              ltr: true,
            ),
            const SizedBox(height: AppSpacing.xl),
            AppGradientButton(
              label: 'ارسال کد تایید',
              loading: _loading,
              onPressed: _requestCode,
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(AppRadius.image),
                border:
                    Border.all(color: AppColors.info.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      text: 'کد ۶ رقمی را که به ایمیل ',
                      children: [
                        TextSpan(
                          text: _email.text.trim(),
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                        const TextSpan(text: ' ارسال شد وارد کنید'),
                      ],
                    ),
                    style: const TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 12.5,
                      height: 1.8,
                      color: AppColors.info,
                    ),
                  ),
                  if (_devCode != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      '(حالت توسعه — کد: ${toPersianDigits(_devCode!)})',
                      style: const TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.info,
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            AppTextField(
              controller: _code,
              label: 'کد تایید',
              hint: '000000',
              keyboardType: TextInputType.number,
              ltr: true,
              textAlign: TextAlign.center,
              inputFormatters: [FilteringTextFormatter.digitsOnly(6)],
            ),
            const SizedBox(height: AppSpacing.xl),
            AppGradientButton(
              label: 'تایید کد',
              loading: _loading,
              onPressed: _confirm,
            ),
            const SizedBox(height: AppSpacing.md),
            AppGhostButton(
              label: 'تغییر ایمیل یا شماره',
              icon: Icons.arrow_forward_rounded,
              color: AppColors.lightTextSecondary,
              onPressed: () => setState(() {
                _step = 1;
                _code.clear();
              }),
            ),
          ],
        ],
      );
}
