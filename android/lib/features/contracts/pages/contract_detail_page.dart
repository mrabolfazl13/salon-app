import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/status.dart';
import '../../venues/providers/venues_providers.dart';
import '../domain/contract.dart';
import '../providers/contracts_provider.dart';

class ContractDetailPage extends ConsumerStatefulWidget {
  const ContractDetailPage({super.key, required this.id});

  final int id;

  @override
  ConsumerState<ContractDetailPage> createState() => _ContractDetailPageState();
}

class _ContractDetailPageState extends ConsumerState<ContractDetailPage> {
  Contract? _contract;
  String? _venueName;
  bool _loading = true;
  bool _notFound = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _notFound = false;
    });
    try {
      final contract =
          await ref.read(contractsServiceProvider).getById(widget.id);
      String? venueName;
      try {
        final venue = await ref
            .read(venuesServiceProvider)
            .getById(contract.venueId);
        venueName = venue.name;
      } catch (_) {
        venueName = 'سالن #${contract.venueId}';
      }
      if (!mounted) return;
      setState(() {
        _contract = contract;
        _venueName = venueName;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _notFound = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final contract = _contract;
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const SingleChildScrollView(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: ListTileSkeleton(count: 3, height: 110),
        ),
      );
    }
    if (_notFound || contract == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('جزئیات قرارداد')),
        body: ErrorState(
          title: 'قرارداد مورد نظر یافت نشد یا دسترسی شما به آن محدود است.',
          onRetry: _load,
        ),
      );
    }
    final sessions = countContractSessions(
      contract.startDate,
      contract.endDate,
      contract.dayOfWeek,
      contract.recurrence,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('قرارداد #${contract.id}'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(left: AppSpacing.lg),
            child: Center(child: StatusChip(contract.status)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          Text(
            _venueName ?? 'قرارداد',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: AppSpacing.xl),
          _card('جزئیات قرارداد', [
            _row('بازه قرارداد',
                '${formatDate(contract.startDate)} تا ${formatDate(contract.endDate)}'),
            _row(
              'روز و ساعت',
              '${Appconstants.pyDayNames[contract.dayOfWeek]} - ${formatTimeFa(contract.startTime)}',
            ),
            _row('نوع تکرار', contract.recurrence.labelFa),
            _row('تعداد جلسات', '${formatFaNumber(sessions)} جلسه (۹۰ دقیقه‌ای)'),
            _row('قیمت اصلی سانس', formatPrice(contract.originalPrice)),
            _row('قیمت هر جلسه (تخفیف‌دار)', formatPrice(contract.discountedPrice)),
            _row('مبلغ کل قرارداد', formatPrice(contract.totalAmcount)),
          ]),
          if (contract.description != null &&
              contract.description!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            _card('توضیحات', [
              Text(
                contract.description!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ]),
          ],
          const SizedBox(height: AppSpacing.lg),
          // Financial summary (gradient)
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  AppColors.gradientPrimarySoftTop,
                  AppColors.gradientPrimarySoftBottom,
                ],
              ),
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('خلاصه مالی', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: Text('قیمت هر جلسه',
                          style: Theme.of(context).textTheme.bodySmall),
                    ),
                    Text(
                      formatPrice(contract.discountedPrice),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text('تعداد جلسات',
                          style: Theme.of(context).textTheme.bodySmall),
                    ),
                    Text(
                      formatFaNumber(sessions),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ],
                ),
                const Divider(height: AppSpacing.xl),
                Row(
                  children: [
                    Expanded(
                      child: Text('مبلغ کل',
                          style: Theme.of(context).textTheme.titleMedium),
                    ),
                    Text(
                      formatPrice(contract.totalAmcount),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.primary,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          AppOutlineButton(
            label: 'بازگشت به لیست قراردادها',
            icon: Icons.arrow_forward_rounded,
            onPressed: () => context.go('/contracts'),
          ),
        ],
      ),
    );
  }

  Widget _card(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: AppSpacing.md),
          ...children,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
