import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/network/checkin_service.dart';

class ManagerCheckinScreen extends ConsumerStatefulWidget {
  const ManagerCheckinScreen({super.key});

  @override
  ConsumerState<ManagerCheckinScreen> createState() => _ManagerCheckinScreenState();
}

class _ManagerCheckinScreenState extends ConsumerState<ManagerCheckinScreen> {
  final _codeController = TextEditingController();
  bool _checkedIn = false;
  String? _checkinMessage;
  bool _scanning = false;
  MobileScannerController? _scannerController;

  void _handleCheckin() async {
    final code = _codeController.text.trim().toUpperCase();
    if (code.isEmpty) return;

    try {
      final result = await CheckinService.verify(code);
      if (mounted) {
        setState(() {
          _checkedIn = true;
          _checkinMessage = result['message'] ?? 'چک‌این موفق!';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطا: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _startScan() {
    setState(() => _scanning = true);
    _scannerController = MobileScannerController();
  }

  void _stopScan() {
    _scannerController?.dispose();
    _scannerController = null;
    setState(() => _scanning = false);
  }

  void _onDetect(BarcodeCapture capture) {
    final barcode = capture.barcodes.firstOrNull;
    if (barcode != null && barcode.rawValue != null) {
      _stopScan();
      // Extract code from "SALON-CHECKIN:ABC123" format or raw code
      String code = barcode.rawValue!;
      if (code.contains(':')) {
        code = code.split(':').last;
      }
      _codeController.text = code.toUpperCase();
      _handleCheckin();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مدیریت چک‌این')),
      body: _scanning ? _buildScanner() : _buildForm(),
    );
  }

  Widget _buildScanner() {
    return Stack(
      children: [
        MobileScanner(controller: _scannerController!, onDetect: _onDetect),
        Positioned(
          top: 16,
          right: 16,
          child: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: _stopScan,
            style: IconButton.styleFrom(backgroundColor: Colors.black54),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Padding(
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
            AppButton(text: '📷 اسکن QR', onPressed: _startScan, outlined: true),
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
                  Text(
                    _checkinMessage ?? 'چک‌این موفق!',
                    style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700, color: AppColors.success),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text('رزرو با موفقیت تأیید شد', style: AppTypography.bodyMedium),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            AppButton(
              text: 'چک‌این جدید',
              onPressed: () => setState(() {
                _checkedIn = false;
                _checkinMessage = null;
                _codeController.clear();
              }),
              gradient: true,
            ),
          ],
        ],
      ),
    );
  }

  @override
  void dispose() {
    _codeController.dispose();
    _scannerController?.dispose();
    super.dispose();
  }
}
