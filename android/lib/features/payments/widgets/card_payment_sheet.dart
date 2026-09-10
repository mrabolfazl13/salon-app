import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../auth/pages/login_page.dart' show FilteringTextFormatter;
import '../../bookings/domain/booking.dart' show Payment;

class CardData {
  const CardData({
    required this.cardNumber,
    required this.cvv,
    required this.month,
    required this.year,
  });

  final String cardNumber;
  final String cvv;
  final int month;
  final int year;
}

/// Opens the mock payment gateway bottom sheet.
///
/// [createInvoice] runs on open (invoice → form → processing → success).
/// [pay] executes the gateway call and must resolve with a [Payment]-like
/// object; here we acept a generic id/amount/result tuple.
Future<void> showCardPaymentSheet(
  BuildContext context, {
  required String title,
  required List<(String, String)> summaryRows,
  required int amount,
  required Future<({int id, int amount})> Function() createInvoice,
  required Future<dynamic> Function(int id, CardData card) pay,
  required ValueChanged<dynamic> onSuccess,
}) {
  return showAppSheet(
    context: context,
    builder: (_) => _CardPaymentSheet(
      title: title,
      summaryRows: summaryRows,
      amount: amount,
      createInvoice: createInvoice,
      pay: pay,
      onSuccess: onSuccess,
    ),
  );
}

class _CardPaymentSheet extends ConsumerStatefulWidget {
  const _CardPaymentSheet({
    required this.title,
    required this.summaryRows,
    required this.amount,
    required this.createInvoice,
    required this.pay,
    required this.onSuccess,
  });

  final String title;
  final List<(String, String)> summaryRows;
  final int amount;
  final Future<({int id, int amount})> Function() createInvoice;
  final Future<dynamic> Function(int id, CardData card) pay;
  final ValueChanged<dynamic> onSuccess;

  @override
  ConsumerState<_CardPaymentSheet> createState() => _CardPaymentSheetState();
}

class _CardPaymentSheetState extends ConsumerState<_CardPaymentSheet> {
  final _card = TextEditingController();
  final _cvv = TextEditingController();
  final _month = TextEditingController();
  final _year = TextEditingController();

  _Step _step = _Step.invoice;
  String? _error;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_issueInvoice);
  }

  @override
  void dispose() {
    _card.dispose();
    _cvv.dispose();
    _month.dispose();
    _year.dispose();
    super.dispose();
  }

  Future<void> _issueInvoice() async {
    try {
      final invoice = await widget.createInvoice();
      if (!mounted) return;
      setState(() => _step = _Step.form);
      _invoiceId = invoice.id;
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _step = _Step.form;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'خطا در ایجاد فاکتور پرداخت';
        _step = _Step.form;
      });
    }
  }

  int? _invoiceId;

  Future<void> _submit() async {
    final cardDigits = digitsOnly(_card.text);
    final cvvDigits = digitsOnly(_cvv.text);
    final monthDigits = digitsOnly(_month.text);
    final yearDigits = digitsOnly(_year.text);

    final error = Validators.cardNumber(cardDigits) ??
        Validators.cvv(cvvDigits) ??
        Validators.expiryMonth(monthDigits) ??
        Validators.expiryYear(yearDigits);
    if (error != null) {
      setState(() => _error = error);
      return;
    }
    setState(() {
      _error = null;
      _processing = true;
    });
    try {
      final result = await widget.pay(
        _invoiceId!,
        CardData(
          cardNumber: cardDigits,
          cvv: cvvDigits,
          month: int.parse(monthDigits),
          year: int.parse(yearDigits),
        ),
      );
      if (!mounted) return;
      setState(() => _step = _Step.success);
      AppSnack.success(context, 'پرداخت با موفقیت انجام شد!');
      widget.onSuccess(result);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _processing = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'پرداخت ناموفق بود، دوباره تلاش کنید';
        _processing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Bank-style header
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                gradient: AppColors.gradientBank,
                borderRadius: BorderRadius.circular(AppRadius.image),
              ),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_rounded,
                      color: Colors.white, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(AppRadius.chip),
                    ),
                    child: const Text(
                      'شبیه‌سازی‌شده',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            // Summary
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(AppRadius.image),
              ),
              child: Column(
                children: [
                  ...widget.summaryRows.map(
                    (row) => _row(row.$1, row.$2),
                  ),
                  _row('مبلغ قابل پرداخت', '${formatPriceOnly(widget.amount)} تومان',
                      bold: true),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (_step == _Step.invoice)
              const Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_step == _Step.success)
              _successView()
            else ...[
              AppTextField(
                controller: _card,
                label: 'شماره کارت',
                hint: '6037 9971 0000 0000',
                prefixIcon: Icons.credit_card_rounded,
                keyboardType: TextInputType.number,
                ltr: true,
                enabled: !_processing,
                inputFormatters: [
                  LengthLimitingTextInputFormatter(19),
                  _CardNumberFormatter(),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _cvv,
                      label: 'CVV2',
                      hint: '123',
                      keyboardType: TextInputType.number,
                      ltr: true,
                      enabled: !_processing,
                      inputFormatters: [
                        FilteringTextFormatter.digitsOnly(4),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: AppTextField(
                      controller: _month,
                      label: 'ماه',
                      hint: '01',
                      keyboardType: TextInputType.number,
                      ltr: true,
                      enabled: !_processing,
                      inputFormatters: [
                        FilteringTextFormatter.digitsOnly(2),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: AppTextField(
                      controller: _year,
                      label: 'سال',
                      hint: '1405',
                      keyboardType: TextInputType.number,
                      ltr: true,
                      enabled: !_processing,
                      inputFormatters: [
                        FilteringTextFormatter.digitsOnly(4),
                      ],
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  _error!,
                  style: const TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              _processing
                  ? const AppGradientButton(
                      label: 'در حال پرداخت...',
                      onPressed: null,
                      loading: true,
                    )
                  : AppGradientButton(
                      label: 'پرداخت ${formatPriceOnly(widget.amount)} تومان',
                      icon: Icons.lock_rounded,
                      onPressed: _submit,
                    ),
              TextButton(
                onPressed: _processing
                    ? null
                    : () => Navigator.of(context).pop(),
                child: const Text('انصراف'),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  Widget _successView() => Column(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0x1F10B981),
            ),
            child: const Icon(Icons.check_rounded,
                color: AppColors.success, size: 34),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'پرداخت موفق',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'تراکنش شما با موفقیت انجام شد',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.lg),
          AppGradientButton(
            label: 'بستن',
            gradient: AppColors.gradientSuccess,
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      );

  Widget _row(String label, String value, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 12.5,
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            ),
            const Spacer(),
            Text(
              value,
              style: TextStyle(
                fontFamily: 'Vazirmatn',
                fontSize: 12.5,
                fontWeight: bold ? FontWeight.w900 : FontWeight.w600,
                color: bold ? AppColors.primary : null,
              ),
            ),
          ],
        ),
      );
}

enum _Step { invoice, form, success }

/// Groups card digits with a space every 4 digits.
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = digitsOnly(newValue.text);
    final limited = digits.length > 16 ? digits.substring(0, 16) : digits;
    final buffer = StringBuffer();
    for (var i = 0; i < limited.length; i++) {
      buffer.write(limited[i]);
      if ((i + 1) % 4 == 0 && i + 1 < limited.length) buffer.write(' ');
    }
    final text = buffer.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
