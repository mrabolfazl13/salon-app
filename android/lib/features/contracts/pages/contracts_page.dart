import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../venues/domain/venue.dart';
import '../../venues/providers/venues_providers.dart';
import '../domain/contract.dart';
import '../providers/contracts_provider.dart';

class ContractsPage extends ConsumerStatefulWidget {
  const ContractsPage({super.key});

  @override
  ConsumerState<ContractsPage> createState() => _ContractsPageState();
}

class _ContractsPageState extends ConsumerState<ContractsPage> {
  List<Contract> _contracts = [];
  Map<int, String> _venueNames = {};
  bool _loading = true;
  bool _error = false;
  String _tab = 'all';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final contracts = await ref.read(contractsServiceProvider).getAll();
      List<Venue> venues = [];
      try {
        venues = await ref.read(venuesServiceProvider).getAll();
      } catch (_) {
        venues = [];
      }
      if (!mounted) return;
      setState(() {
        _contracts = contracts;
        _venueNames = {for (final v in venues) v.id: v.name};
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _tab == 'all'
        ? _contracts
        : _contracts.where((c) => c.status == _tab).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('قراردادهای بلندمدت')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(
          'قرارداد جدید',
          style: TextStyle(fontFamily: 'Vazirmatn', fontWeight: FontWeight.w700),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              children: [
                _tabBar('all', 'همه'),
                _tabBar('active', 'فعال'),
                _tabBar('expired', 'منقضی'),
                _tabBar('cancelled', 'لغو شده'),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: ListTileSkeleton(count: 2, height: 140),
                  )
                : _error
                    ? ErrorState(
                        title:
                            'در دریافت قراردادها خطایی رخ داد. لطفاً دوباره تلاش کنید.',
                        onRetry: _fetch,
                      )
                    : filtered.isEmpty
                        ? EmptyState(
                            icon: Icons.folder_off_outlined,
                            title: 'قراردادی یافت نشد',
                            description: 'هنوز قراردادی در این بخش ندارید',
                            actionLabel: 'ایجاد قرارداد جدید',
                            onAction: _openCreate,
                          )
                        : RefreshIndicator(
                            onRefresh: _fetch,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(
                                AppSpacing.xl, AppSpacing.lg, AppSpacing.xl,
                                AppSpacing.xxxl,
                              ),
                              itemCount: filtered.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: AppSpacing.lg),
                              itemBuilder: (context, index) {
                                final contract = filtered[index];
                                return _ContractCard(
                                  contract: contract,
                                  venueName:
                                      _venueNames[contract.venueId] ??
                                          'سالن #${contract.venueId}',
                                  onTap: () =>
                                      context.push('/contracts/${contract.id}'),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _tabBar(String value, String label) {
    final active = _tab == value;
    return GestureDetector(
      onTap: () => setState(() => _tab = value),
      child: Container(
        margin: const EdgeInsets.only(left: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.chip),
          border: Border.all(
            color: active ? AppColors.primary : Theme.of(context).dividerColor,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: active ? Colors.white : null,
          ),
        ),
      ),
    );
  }

  Future<void> _openCreate() async {
    List<Venue> venues;
    try {
      venues = await ref.read(venuesServiceProvider).getAll();
    } catch (_) {
      venues = [];
    }
    if (!mounted) return;
    final created = await showAppSheet<bool>(
      context: context,
      builder: (_) => _ContractFormSheet(venues: venues),
    );
    if (created == true) _fetch();
  }
}

class _ContractCard extends StatelessWidget {
  const _ContractCard({
    required this.contract,
    required this.venueName,
    required this.onTap,
  });

  final Contract contract;
  final String venueName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final sessions = countContractSessions(
      contract.startDate,
      contract.endDate,
      contract.dayOfWeek,
      contract.recurrence,
    );
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.tile),
                    color: AppColors.primary.withValues(alpha: 0.1),
                  ),
                  child: const Icon(Icons.description_outlined,
                      color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        venueName,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Text(
                        '${formatDate(contract.startDate)} تا ${formatDate(contract.endDate)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                StatusChip(contract.status),
              ],
            ),
            const Divider(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('تعداد جلسات',
                          style: Theme.of(context).textTheme.labelSmall),
                      Text(
                        '${formatFaNumber(sessions)} جلسه',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('قیمت هر جلسه',
                          style: Theme.of(context).textTheme.labelSmall),
                      Text(
                        formatPrice(contract.discountedPrice),
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('مبلغ کل',
                          style: Theme.of(context).textTheme.labelSmall),
                      Text(
                        formatPrice(contract.totalAmcount),
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: AppColors.primary,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ContractFormSheet extends ConsumerStatefulWidget {
  const _ContractFormSheet({required this.venues});

  final List<Venue> venues;

  @override
  ConsumerState<_ContractFormSheet> createState() => _ContractFormSheetState();
}

class _ContractFormSheetState extends ConsumerState<_ContractFormSheet> {
  int? _venueId;
  DateTime? _startDate = DateTime.now();
  DateTime? _endDate = DateTime.now().add(const Duration(days: 30));
  int _dayOfWeek = 0;
  TimeOfDay _startTime = const TimeOfDay(hour: 18, minute: 0);
  Recurrence _recurrence = Recurrence.weekly;
  final _price = TextEditingController();
  final _description = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _price.dispose();
    _description.dispose();
    super.dispose();
  }

  String? get _priceError {
    final p = int.tryParse(digitsOnly(_price.text));
    if (p == null || p <= 0) return 'قیمت هر جلسه را وارد کنید';
    return null;
  }

  int get _sessions {
    if (_startDate == null || _endDate == null) return 0;
    return countContractSessions(
      isoDate(_startDate!),
      isoDate(_endDate!),
      _dayOfWeek,
      _recurrence,
    );
  }

  Future<void> _submit() async {
    if (_venueId == null) {
      setState(() => _error = 'لطفاً سالن را انتخاب کنید');
      return;
    }
    if (_startDate == null) {
      setState(() => _error = 'لطفاً تاریخ شروع را انتخاب کنید');
      return;
    }
    if (_endDate == null || _endDate!.isBefore(_startDate!)) {
      setState(() => _error = 'تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }
    if (_priceError != null) {
      setState(() => _error = _priceError);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(contractsServiceProvider).create(
            venueId: _venueId!,
            startDate: isoDate(_startDate!),
            endDate: isoDate(_endDate!),
            dayOfWeek: _dayOfWeek,
            startTime:
                '${_startTime.hour.toString().padLeft(2, '0')}:${_startTime.minute.toString().padLeft(2, '0')}',
            recurrence: _recurrence,
            discountedPrice: int.parse(digitsOnly(_price.text)),
            description: _description.text,
          );
      if (!mounted) return;
      AppSnack.success(context, 'قرارداد با موفقیت ثبت شد!');
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = _translate(e.message);
        _saving = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'خطا در ثبت قرارداد. لطفاً دوباره تلاش کنید.';
        _saving = false;
      });
    }
  }

  String _translate(String detail) {
    const map = {
      'Discounted price must be less than original price':
          'قیمت تخفیف‌دار باید کمتر از قیمت اصلی سالن باشد',
      'Start date must be before end date':
          'تاریخ شروع باید قبل از تاریخ پایان باشد',
      'No sessions found':
          'با این تنظیمات هیچ جلسه‌ای در بازه زمانی انتخابی وجود ندارد',
      'A contract already exists for this venue on the same day/time period':
          'قراردادی با همین روز و ساعت برای این سالن وجود دارد',
      'Venue not found': 'سالن مورد نظر یافت نشد',
    };
    return map[detail] ?? detail;
  }

  @override
  Widget build(BuildContext context) {
    final sessions = _sessions;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('ثبت قرارداد بلندمدت',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'با قرارداد بلندمدت، هر هفته در روز و ساعت مشخص با قیمت تخفیف‌دار تمرین کنید',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.lg),
            _venueDropdown(),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: _dateField('تاریخ شروع', _startDate, (d) {
                    setState(() => _startDate = d);
                  }),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: _dateField('تاریخ پایان', _endDate, (d) {
                    setState(() => _endDate = d);
                  }),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<int>(
                    initialValue: _dayOfWeek,
                    decoration:
                        const InputDecoration(labelText: 'روز هفته'),
                    items: List.generate(
                      AppconstantsPy.days.length,
                      (i) => DropdownMenuItem(
                        value: i,
                        child: Text(
                          AppconstantsPy.days[i],
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ),
                    onChanged: (v) => setState(() => _dayOfWeek = v ?? 0),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: _timeField(),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<Recurrence>(
              initialValue: _recurrence,
              decoration: const InputDecoration(labelText: 'نوع تکرار'),
              items: Recurrence.values
                  .map(
                    (r) => DropdownMenuItem(
                      value: r,
                      child: Text(
                        r.labelFa,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _recurrence = v ?? Recurrence.weekly),
            ),
            const SizedBox(height: AppSpacing.md),
            AppTextField(
              controller: _price,
              label: 'قیمت تخفیف‌دار هر جلسه (تومان)',
              keyboardType: TextInputType.number,
              ltr: true,
            ),
            const SizedBox(height: 4),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                'باید کمتر از قیمت اصلی سانس باشد',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            AppTextField(
              controller: _description,
              label: 'توضیحات (اختیاری)',
              maxLines: 2,
            ),
            if (sessions > 0) ...[
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(AppRadius.image),
                  border:
                      Border.all(color: AppColors.info.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'تعداد جلسات: ${formatFaNumber(sessions)} جلسه',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ),
                    Text(
                      'مبلغ کل: ${formatPrice(sessions * (int.tryParse(digitsOnly(_price.text)) ?? 0))}',
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.lg),
              Text(
                _error!,
                style: const TextStyle(
                  fontFamily: 'Vazirmatn',
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.error,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
            AppGradientButton(
              label: 'ثبت قرارداد',
              icon: Icons.check_rounded,
              loading: _saving,
              onPressed: _submit,
            ),
            TextButton(
              onPressed: _saving ? null : () => Navigator.of(context).pop(),
              child: const Text('انصراف'),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  Widget _venueDropdown() {
    if (widget.venues.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.warning.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(AppRadius.image),
        ),
        child: const Text(
          'سالنی برای انتخاب وجود ندارد',
          style: TextStyle(fontFamily: 'Vazirmatn', fontSize: 12.5),
        ),
      );
    }
    return DropdownButtonFormField<int>(
      initialValue: _venueId,
      decoration: const InputDecoration(labelText: 'انتخاب سالن'),
      items: widget.venues
          .map(
            (v) => DropdownMenuItem(
              value: v.id,
              child: Text(
                v.name,
                style: Theme.of(context).textTheme.bodyMedium,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          )
          .toList(),
      onChanged: (v) => setState(() => _venueId = v),
    );
  }

  Widget _dateField(String label, DateTime? value, ValueChanged<DateTime> onPick) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.button),
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime.now().subtract(const Duration(days: 365)),
          lastDate: DateTime.now().add(const Duration(days: 730)),
          locale: const Locale('fa', 'IR'),
        );
        if (picked != null) onPick(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(labelText: label),
        child: Text(
          value == null ? 'انتخاب کنید' : formatDate(value),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }

  Widget _timeField() {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.button),
      onTap: () async {
        final picked = await showTimePicker(
          context: context,
          initialTime: _startTime,
        );
        if (picked != null) setState(() => _startTime = picked);
      },
      child: InputDecorator(
        decoration: const InputDecoration(labelText: 'ساعت شروع'),
        child: Text(
          formatTimeFa(
            '${_startTime.hour.toString().padLeft(2, '0')}:${_startTime.minute.toString().padLeft(2, '0')}',
          ),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }
}

/// Python weekday names for the contract form (0 = دوشنبه).
class AppconstantsPy {
  static const days = [
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
    'شنبه',
    'یکشنبه',
  ];
}
