import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ManagerCheckinScreen extends ConsumerStatefulWidget {
  const ManagerCheckinScreen({super.key});

  @override
  ConsumerState<ManagerCheckinScreen> createState() => _ManagerCheckinScreenState();
}

class _ManagerCheckinScreenState extends ConsumerState<ManagerCheckinScreen> {
  final _codeController = TextEditingController();
  bool _checkedIn = false;

  void _handleCheckin() {
    if (_codeController.text.isEmpty) return;
    setState(() => _checkedIn = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('مدیریت چک‌این')),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            if (!_checkedIn) ...[
              AppTextField(
                controller: _codeController,
                label: 'کد رزرو',
                hintText: 'کد را وارد کنید یا اسکن کنید',
                prefixIcon: Icons.qr_code,
              ),
              const SizedBox(height: AppSpacing.md),
              AppButton(text: 'اسکن QR', onPressed: () {}, outlined: true),
              const SizedBox(height: AppSpacing.md),
              AppButton(text: 'تأیید چک‌این', onPressed: _handleCheckin, gradient: true),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(AppSpacing.xl),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.1),
                  borderRadius: AppRadius.cardBorderRadius,
                  border: Border.all(color: AppColors.success.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, size: 64, color: AppColors.success),
                    const SizedBox(height: AppSpacing.md),
                    Text('چک‌این موفق!', style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700, color: AppColors.success)),
                    const SizedBox(height: AppSpacing.sm),
                    Text('رزرو با موفقیت تأیید شد', style: AppTypography.bodyMedium),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              AppButton(text: 'چک‌این جدید', onPressed: () => setState(() { _checkedIn = false; _codeController.clear(); }), gradient: true),
            ],
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }
}
