import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/contract_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class ContractsScreen extends ConsumerStatefulWidget {
  const ContractsScreen({super.key});

  @override
  ConsumerState<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends ConsumerState<ContractsScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _contracts = [];

  static const _statusLabels = <String, Color Function()>{
    'pending': _pendingColor,
    'active': _activeColor,
    'rejected': _rejectedColor,
    'expired': _expiredColor,
    'cancelled': _cancelledColor,
    'suspended': _suspendedColor,
  };

  static Color _pendingColor() => AppColors.warning;
  static Color _activeColor() => AppColors.success;
  static Color _rejectedColor() => AppColors.error;
  static Color _expiredColor() => AppColors.blue;
  static Color _cancelledColor() => AppColors.error;
  static Color _suspendedColor() => AppColors.navy;

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
      final contracts = await ContractService.getContracts();
      if (!mounted) return;
      setState(() {
        _contracts = contracts;
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

  String _venueName(Map<String, dynamic> c) {
    final name = c['venue_name']?.toString();
    if (name != null && name.isNotEmpty) return name;
    return 'سالن #${FaFormat.faNum(c['venue_id'] ?? 0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(),
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              pinned: true,
              title: Text('قراردادهای من',
                  style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
            ),
            if (_loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
                ),
              )
            else if (_contracts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.description_outlined, size: 56, color: Colors.grey),
                      SizedBox(height: AppSpacing.md),
                      Text('هنوز قراردادی ندارید'),
                      SizedBox(height: AppSpacing.sm),
                      Text(
                        'از صفحه سالن‌ها می‌توانید درخواست رزرو قراردادی ثبت کنید',
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) =>
                        _buildContractCard(context, _contracts[index]),
                    childCount: _contracts.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContractCard(BuildContext context, Map<String, dynamic> contract) {
    final status = contract['status']?.toString() ?? '';
    final paymentStatus = contract['payment_status']?.toString() ?? '';
    final statusColor = _statusLabels[status]?.call() ?? AppColors.blue;
    final startTime = contract['start_time']?.toString();
    final duration = (contract['duration'] as num?)?.toInt();

    return InkWell(
      onTap: () => context.push('/contracts/${contract['id']}'),
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(_venueName(contract),
                      style: AppTypography.bodyMedium
                          .copyWith(fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text(
                    _statusFa[status] ?? status,
                    style: AppTypography.caption
                        .copyWith(color: statusColor, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: AppColors.blue),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '${JalaliDate.formatIsoDate(contract['start_date']?.toString() ?? '')} تا ${JalaliDate.formatIsoDate(contract['end_date']?.toString() ?? '')}',
                  style: AppTypography.caption,
                ),
              ],
            ),
            if (startTime != null && duration != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Row(
                children: [
                  const Icon(Icons.schedule, size: 14, color: AppColors.amber),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    '${FaFormat.time(startTime)} — ${FaFormat.faNum(duration)} دقیقه',
                    style: AppTypography.caption,
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  FaFormat.price((contract['total_amount'] as num?)?.toInt() ?? 0),
                  style: AppTypography.bodyMedium
                      .copyWith(fontWeight: FontWeight.w700, color: AppColors.amber),
                ),
                Text(
                  _paymentFa[paymentStatus] ?? paymentStatus,
                  style: AppTypography.caption.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
