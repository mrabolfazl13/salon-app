import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';

class ManagerPricingScreen extends ConsumerStatefulWidget {
  const ManagerPricingScreen({super.key});

  @override
  ConsumerState<ManagerPricingScreen> createState() =>
      _ManagerPricingScreenState();
}

class _ManagerPricingScreenState extends ConsumerState<ManagerPricingScreen> {
  List<dynamic> _rules = [];
  bool _loading = true;
  String? _error;

  static const _modifierTypes = <String, String>{
    'percent': 'درصد',
    'fixed': 'مبلغ ثابت',
    'absolute': 'قیمت نهایی',
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
      final rules = await ManagerService.getPricingRules();
      if (!mounted) return;
      setState(() {
        _rules = rules;
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

  Future<void> _deleteRule(Map<String, dynamic> rule) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف قانون'),
        content: Text('قانون «${rule['label'] ?? ''}» حذف شود؟'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ManagerService.deletePricingRule(rule['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('قانون حذف شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _showCreateDialog() async {
    final valueController = TextEditingController();
    final labelController = TextEditingController();
    String modifierType = 'percent';
    int? dayOfWeek;

    final created = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('قانون قیمت‌گذاری جدید'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: labelController,
                  decoration: const InputDecoration(labelText: 'عنوان قانون'),
                ),
                const SizedBox(height: AppSpacing.sm),
                DropdownButtonFormField<String>(
                  value: modifierType,
                  decoration: const InputDecoration(labelText: 'نوع تعدیل'),
                  items: _modifierTypes.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => modifierType = v ?? 'percent'),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: valueController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: modifierType == 'percent' ? 'درصد (مثلاً -۱۰)' : 'مبلغ (ریال)',
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                DropdownButtonFormField<int>(
                  value: dayOfWeek,
                  decoration: const InputDecoration(labelText: 'روز هفته (اختیاری)'),
                  items: List.generate(7,
                      (i) => DropdownMenuItem(value: i, child: Text(_pyDay(i)))),
                  onChanged: (v) => setDialogState(() => dayOfWeek = v),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('انصراف')),
            ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('ایجاد')),
          ],
        ),
      ),
    );
    if (created != true) return;
    final value = int.tryParse(valueController.text.trim());
    if (value == null) return;
    try {
      await ManagerService.createPricingRule({
        if (labelController.text.trim().isNotEmpty)
          'label': labelController.text.trim(),
        'modifier_type': modifierType,
        'value': value,
        'holiday_applies': false,
        'priority': 10,
        'is_active': true,
        if (dayOfWeek != null) 'day_of_week': dayOfWeek,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('قانون ایجاد شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مدیریت قیمت‌گذاری')),
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
              : _rules.isEmpty
                  ? const Center(child: Text('هنوز قانونی تعریف نشده'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        itemCount: _rules.length,
                        itemBuilder: (context, index) =>
                            _buildRuleCard(context, _rules[index]),
                      ),
                    ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        icon: const Icon(Icons.add),
        label: const Text('قانون جدید'),
        backgroundColor: AppColors.blue,
      ),
    );
  }

  Widget _buildRuleCard(BuildContext context, Map<String, dynamic> rule) {
    final modifier = rule['modifier_type']?.toString() ?? '';
    final value = (rule['value'] as num?)?.toInt() ?? 0;
    final dayIdx = (rule['day_of_week'] as num?)?.toInt();
    final start = rule['start_time']?.toString();
    final end = rule['end_time']?.toString();

    String valueText;
    if (modifier == 'percent') {
      valueText = '${value > 0 ? '+' : ''}${FaFormat.faNum(value)}٪';
    } else if (modifier == 'absolute') {
      valueText = FaFormat.price(value);
    } else {
      valueText = value > 0
          ? '+${FaFormat.price(value)}'
          : '−${FaFormat.price(-value)}';
    }

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(rule['label']?.toString() ?? 'قانون',
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w700)),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                onPressed: () => _deleteRule(rule),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: AppColors.amber),
              const SizedBox(width: AppSpacing.xs),
              Text(
                [
                  if (dayIdx != null && dayIdx >= 0 && dayIdx <= 6) _pyDay(dayIdx),
                  if (start != null && end != null)
                    '${FaFormat.time(start)} - ${FaFormat.time(end)}'
                  else if (start != null)
                    'از ${FaFormat.time(start)}',
                  if (start == null) 'همه ساعتها',
                ].where((s) => s.isNotEmpty).join(' • '),
                style: AppTypography.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(valueText,
                  style: AppTypography.h6.copyWith(
                      fontWeight: FontWeight.w700,
                      color: value >= 0 || modifier == 'absolute'
                          ? AppColors.success
                          : AppColors.error)),
              if (rule['is_active'] == false)
                Text('غیرفعال',
                    style: AppTypography.caption.copyWith(
                        color:
                            Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
            ],
          ),
        ],
      ),
    );
  }

  String _pyDay(int idx) {
    const days = ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه', 'یکشنبه'];
    return days[idx % 7];
  }
}
