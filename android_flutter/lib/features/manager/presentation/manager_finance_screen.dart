import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

class ManagerFinanceScreen extends ConsumerStatefulWidget {
  const ManagerFinanceScreen({super.key});

  @override
  ConsumerState<ManagerFinanceScreen> createState() =>
      _ManagerFinanceScreenState();
}

class _ManagerFinanceScreenState extends ConsumerState<ManagerFinanceScreen> {
  Map<String, dynamic>? _dashboard;
  List<dynamic> _transactions = [];
  bool _loading = true;
  String? _error;

  static const _typeFa = {
    'payment': 'پرداخت',
    'receivable': 'دریافتنی',
    'refund': 'استرداد',
    'discount': 'تخفیف',
    'expense': 'هزینه',
    'credit': 'اعتبار',
    'transfer': 'انتقال',
    'adjustment': 'تعدیل',
  };

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
        ManagerService.getFinanceDashboard(),
        ManagerService.getTransactions(),
      ]);
      if (!mounted) return;
      setState(() {
        _dashboard = results[0] as Map<String, dynamic>;
        _transactions = results[1] as List<dynamic>;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('کنسول مالی')),
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
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    children: [
                      _buildSummaryCard(context),
                      const SizedBox(height: AppSpacing.md),
                      _buildTransactionsCard(context),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue]),
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('خلاصه مالی',
              style: AppTypography.h6
                  .copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('درآمد امروز',
                  FaFormat.toman((_dashboard?['today_revenue'] as num?)?.toInt() ?? 0),
                  Colors.white),
              _statItem('درآمد ماه',
                  FaFormat.toman((_dashboard?['month_revenue'] as num?)?.toInt() ?? 0),
                  Colors.white),
              _statItem('سود خالص',
                  FaFormat.toman((_dashboard?['gross_profit'] as num?)?.toInt() ?? 0),
                  AppColors.success),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('هزینه‌ها',
                  FaFormat.toman((_dashboard?['expenses'] as num?)?.toInt() ?? 0),
                  Colors.white.withOpacity(0.75)),
              _statItem('دریافتنی باز',
                  FaFormat.toman((_dashboard?['open_receivables'] as num?)?.toInt() ?? 0),
                  Colors.white.withOpacity(0.75)),
              _statItem('در انتظار پرداخت',
                  FaFormat.faNum(
                      (_dashboard?['pending_payment_bookings'] as num?)?.toInt() ?? 0),
                  Colors.white.withOpacity(0.75)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption
                  .copyWith(fontWeight: FontWeight.w800, color: color, fontSize: 14)),
          const SizedBox(height: AppSpacing.xs),
          Text(label,
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(color: color.withOpacity(0.8))),
        ],
      ),
    );
  }

  Widget _buildTransactionsCard(BuildContext context) {
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
          Text('تراکنش‌های اخیر',
              style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          if (_transactions.isEmpty)
            Text('تراکنشی ثبت نشده',
                style: AppTypography.bodyMedium.copyWith(
                    color:
                        Theme.of(context).colorScheme.onSurface.withOpacity(0.6)))
          else
            ..._transactions.map((t) => _buildTxRow(context, t)),
        ],
      ),
    );
  }

  Widget _buildTxRow(BuildContext context, Map<String, dynamic> t) {
    final direction = t['direction']?.toString() ?? '';
    final isIncome = direction == 'income';
    final amount = (t['amount'] as num?)?.toInt() ?? 0;
    final occurred = t['occurred_at']?.toString();
    final type = t['type']?.toString() ?? '';
    final description = t['description']?.toString() ?? '';
    final counterparty = t['counterparty_name']?.toString();
    final title = [
      if (counterparty != null && counterparty.isNotEmpty) counterparty,
      if (description.isNotEmpty) description,
      _typeFa[type] ?? type,
    ].where((s) => s.isNotEmpty).join(' — ');

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w600)),
                Text(occurred != null ? JalaliDate.formatIsoDateTime(occurred) : '',
                    style: AppTypography.caption),
              ],
            ),
          ),
          Text(
            '${isIncome ? '+' : '−'}${FaFormat.price(amount)}',
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w700,
              color: isIncome ? AppColors.success : AppColors.error,
            ),
          ),
        ],
      ),
    );
  }
}
