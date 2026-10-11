import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

class ManagerContractsScreen extends ConsumerStatefulWidget {
  const ManagerContractsScreen({super.key});

  @override
  ConsumerState<ManagerContractsScreen> createState() =>
      _ManagerContractsScreenState();
}

class _ManagerContractsScreenState extends ConsumerState<ManagerContractsScreen> {
  List<dynamic> _pending = [];
  List<dynamic> _all = [];
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
        ManagerService.getPendingContracts(),
        ManagerService.getContracts(),
      ]);
      if (!mounted) return;
      setState(() {
        _pending = results[0] as List<dynamic>;
        _all = results[1] as List<dynamic>;
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

  String _userName(Map<String, dynamic> row) {
    final n = row['user_name']?.toString() ??
        row['user_full_name']?.toString() ??
        row['customer_name']?.toString();
    if (n != null && n.isNotEmpty) return n;
    return 'کاربر #${FaFormat.faNum(row['user_id'] ?? 0)}';
  }

  String _venueName(Map<String, dynamic> row) {
    final n = row['venue_name']?.toString();
    if (n != null && n.isNotEmpty) return n;
    return 'سالن #${FaFormat.faNum(row['venue_id'] ?? 0)}';
  }

  Future<void> _approve(Map<String, dynamic> row) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأیید قرارداد'),
        content: Text(
            'قرارداد ${_userName(row)} برای ${_venueName(row)} تأیید شود؟ سانس‌ها فعال می‌شود.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success, foregroundColor: Colors.white),
            child: const Text('تأیید'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _acting = true);
    try {
      await ManagerService.approveContract(row['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('قرارداد تأیید شد'),
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

  Future<void> _reject(Map<String, dynamic> row) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('رد قرارداد'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('قرارداد ${_userName(row)} رد شود؟'),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'دلیل رد (اجباری)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().length < 3) return;
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('رد'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _acting = true);
    try {
      await ManagerService.rejectContract(
          row['id'].toString(), reasonController.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('قرارداد رد شد'),
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
      appBar: AppBar(title: const Text('مدیریت قراردادها')),
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
                      if (_pending.isNotEmpty) ...[
                        Text('در انتظار تأیید شما',
                            style: AppTypography.h6
                                .copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: AppSpacing.md),
                        ..._pending.map((row) =>
                            _buildPendingCard(context, row as Map<String, dynamic>)),
                        const SizedBox(height: AppSpacing.lg),
                      ],
                      Text('همه قراردادها',
                          style: AppTypography.h6
                              .copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: AppSpacing.md),
                      if (_all.isEmpty)
                        const Center(child: Text('قراردادی وجود ندارد'))
                      else
                        ..._all.map((row) =>
                            _buildRowCard(context, row as Map<String, dynamic>)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildPendingCard(BuildContext context, Map<String, dynamic> row) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warning.withOpacity(0.06),
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: AppColors.warning.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${_userName(row)} — ${_venueName(row)}',
              style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${JalaliDate.formatIsoDate(row['start_date']?.toString() ?? '')} تا ${JalaliDate.formatIsoDate(row['end_date']?.toString() ?? '')} • ${FaFormat.time(row['start_time']?.toString() ?? '')}',
            style: AppTypography.caption,
          ),
          Text(FaFormat.price((row['discounted_price'] as num?)?.toInt() ?? 0),
              style: AppTypography.caption
                  .copyWith(color: AppColors.amber, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _acting ? null : () => _approve(row),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('تأیید'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: OutlinedButton(
                  onPressed: _acting ? null : () => _reject(row),
                  style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error)),
                  child: const Text('رد'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRowCard(BuildContext context, Map<String, dynamic> row) {
    final status = row['status']?.toString() ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${_userName(row)} — ${_venueName(row)}',
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: AppSpacing.xs),
                Text(FaFormat.price((row['total_amount'] as num?)?.toInt() ?? 0),
                    style: AppTypography.caption
                        .copyWith(color: AppColors.amber, fontWeight: FontWeight.w600)),
              ],
            ),
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
            child: Text(_statusFa[status] ?? status,
                style: AppTypography.caption.copyWith(
                    color: status == 'active'
                        ? AppColors.success
                        : AppColors.warning,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
