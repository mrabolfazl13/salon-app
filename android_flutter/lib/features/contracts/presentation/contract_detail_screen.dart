import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/contract_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

class ContractDetailScreen extends ConsumerStatefulWidget {
  final String contractId;

  const ContractDetailScreen({super.key, required this.contractId});

  @override
  ConsumerState<ContractDetailScreen> createState() =>
      _ContractDetailScreenState();
}

class _ContractDetailScreenState extends ConsumerState<ContractDetailScreen> {
  Map<String, dynamic>? _contract;
  List<dynamic> _payments = [];
  bool _loading = true;
  bool _acting = false;
  String? _error;

  static const _statusFa = {
    'pending': 'در انتظار تأیید',
    'active': 'فعال',
    'rejected': 'رد شده',
    'expired': 'منقضی',
    'cancelled': 'لغو شده',
    'suspended': 'معلق',
  };

  static const _paymentFa = {
    'pending': 'در انتظار پرداخت',
    'partial': 'پرداخت جزئی',
    'paid': 'تسویه شده',
    'overdue': 'معوق',
  };

  static const _recurrenceFa = {
    'weekly': 'هفتگی',
    'biweekly': 'دو هفته یک‌بار',
    'monthly': 'ماهانه',
  };

  // پایتون: 0=دوشنبه ... 6=یکشنبه
  static const _pyDayNames = [
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه',
    'یکشنبه',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ContractService.getContract(widget.contractId),
        ContractService.getPayments(widget.contractId),
      ]);
      if (!mounted) return;
      setState(() {
        _contract = results[0] as Map<String, dynamic>;
        _payments = results[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  String get _venueName {
    final c = _contract;
    if (c == null) return 'قرارداد';
    final name = c['venue_name']?.toString();
    if (name != null && name.isNotEmpty) return name;
    return 'سالن #${FaFormat.faNum(c['venue_id'] ?? 0)}';
  }

  Future<void> _cancelContract() async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('لغو قرارداد'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('آیا از لغو این قرارداد مطمئن هستید؟'),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'دلیل لغو (اجباری)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().length < 3) return;
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('لغو قرارداد'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _acting = true);
    try {
      await ContractService.cancelContract(
          widget.contractId, reasonController.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('قرارداد لغو شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('جزئیات قرارداد')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(
                            onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              : _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    final c = _contract!;
    final status = c['status']?.toString() ?? '';
    final paymentStatus = c['payment_status']?.toString() ?? '';
    final days = (c['days'] as List?)
            ?.map((d) => _pyDayNames[(d as num).toInt() % 7])
            .join('، ') ??
        '';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(_venueName,
                    style:
                        AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: status == 'active'
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.warning.withOpacity(0.1),
                  borderRadius: AppRadius.chipBorderRadius,
                ),
                child: Text(
                  _statusFa[status] ?? status,
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w600,
                    color: status == 'active' ? AppColors.success : AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
          Text(
            _paymentFa[paymentStatus] ?? paymentStatus,
            style: AppTypography.caption.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (status == 'pending')
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.08),
                borderRadius: AppRadius.cardBorderRadius,
                border: Border.all(color: AppColors.warning.withOpacity(0.3)),
              ),
              child: Text(
                'در انتظار تأیید مدیر سالن — پس از تأیید، سانس‌ها برای شما رزرو می‌شود.',
                style: AppTypography.caption.copyWith(color: AppColors.warning),
              ),
            ),
          if (c['reject_reason'] != null ||
              c['cancel_reason'] != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.08),
                borderRadius: AppRadius.cardBorderRadius,
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Text(
                'دلیل: ${c['reject_reason'] ?? c['cancel_reason']}',
                style: AppTypography.caption.copyWith(color: AppColors.error),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildDetailCard(context, 'اطلاعات کلی', [
            ['بازه قرارداد',
                '${JalaliDate.formatIsoDate(c['start_date']?.toString() ?? '')} تا ${JalaliDate.formatIsoDate(c['end_date']?.toString() ?? '')}'],
            if (days.isNotEmpty) ['روزها', days],
            if (c['start_time'] != null)
              [
                'ساعت',
                c['duration'] != null
                    ? '${FaFormat.time(c['start_time'].toString())} (${FaFormat.faNum((c['duration'] as num).toInt())} دقیقه)'
                    : FaFormat.time(c['start_time'].toString()),
              ],
            ['تکرار', _recurrenceFa[c['recurrence']] ?? c['recurrence']?.toString() ?? '—'],
            if (c['auto_renew'] == true) ['تمدید خودکار', 'فعال'],
          ]),
          const SizedBox(height: AppSpacing.md),
          _buildDetailCard(context, 'شرایط مالی', [
            ['قیمت پایه سانس', FaFormat.price((c['original_price'] as num?)?.toInt() ?? 0)],
            ['قیمت هر جلسه', FaFormat.price((c['discounted_price'] as num?)?.toInt() ?? 0)],
            ['مبلغ کل قرارداد', FaFormat.price((c['total_amount'] as num?)?.toInt() ?? 0)],
            if (c['down_payment_amount'] != null)
              ['پیش‌پرداخت', FaFormat.price((c['down_payment_amount'] as num).toInt())],
          ]),
          if (_payments.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            _buildPaymentsCard(context),
          ],
          const SizedBox(height: AppSpacing.xl),
          if ((status == 'pending' || status == 'active') && !_acting)
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: _cancelContract,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorderRadius),
                ),
                child: const Text('لغو قرارداد',
                    style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _buildPaymentsCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('اقساط و پرداخت‌ها',
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          ..._payments.map((p) {
            final isVoided = p['is_voided'] == true;
            final isPaid = p['is_paid'] == true;
            final label = p['label']?.toString() ??
                (p['record_type']?.toString() == 'down_payment'
                    ? 'پیش‌پرداخت'
                    : 'قسط ${FaFormat.faNum((p['installment_no'] as num?)?.toInt() ?? 0)}');
            final due = p['due_date']?.toString();
            final color = isVoided
                ? Theme.of(context).colorScheme.onSurface.withOpacity(0.5)
                : isPaid
                    ? AppColors.success
                    : AppColors.warning;
            final statusText = isVoided
                ? 'باطل'
                : isPaid
                    ? 'پرداخت شده'
                    : 'پرداخت نشده';
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: AppTypography.bodyMedium),
                        if (due != null)
                          Text(
                            'سررسید: ${JalaliDate.formatIsoDate(due)}',
                            style: AppTypography.caption.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withOpacity(0.5)),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(FaFormat.price((p['amount'] as num?)?.toInt() ?? 0),
                      style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(width: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Text(statusText,
                        style: AppTypography.caption
                            .copyWith(color: color, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildDetailCard(
      BuildContext context, String title, List<List<String>> items) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item[0],
                        style: AppTypography.bodyMedium.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withOpacity(0.6))),
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(
                      child: Text(item[1],
                          textAlign: TextAlign.end,
                          style: AppTypography.bodyMedium
                              .copyWith(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
