import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';

class ManagerCrmScreen extends ConsumerStatefulWidget {
  const ManagerCrmScreen({super.key});

  @override
  ConsumerState<ManagerCrmScreen> createState() => _ManagerCrmScreenState();
}

class _ManagerCrmScreenState extends ConsumerState<ManagerCrmScreen> {
  List<dynamic> _venues = [];
  int? _selectedVenueId;
  List<dynamic> _customers = [];
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;
  final _searchController = TextEditingController();

  static const _segments = <String, String>{
    'vip': 'VIP',
    'loyal': 'وفادار',
    'regular': 'معمولی',
    'dormant': 'غیرفعال',
  };

  @override
  void initState() {
    super.initState();
    _loadVenues();
  }

  Future<void> _loadVenues() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final venues = await ManagerService.getMyVenues();
      if (!mounted) return;
      setState(() {
        _venues = venues;
        if (venues.isNotEmpty) {
          _selectedVenueId = (venues.first['id'] as num).toInt();
        }
        _loading = false;
      });
      if (_selectedVenueId != null) await _loadCustomers();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadCustomers() async {
    final venueId = _selectedVenueId;
    if (venueId == null) return;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ManagerService.getCrmCustomers(
            venueId: venueId, search: _searchController.text.trim()),
        ManagerService.getCrmStats(venueId: venueId),
      ]);
      if (!mounted) return;
      setState(() {
        _customers = results[0] as List<dynamic>;
        _stats = results[1] as Map<String, dynamic>;
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
      appBar: AppBar(title: const Text('مشتریان و پرسنل')),
      body: _venues.isEmpty && !_loading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: Text('سالنی به حساب مدیر شما متصل نیست',
                    textAlign: TextAlign.center),
              ),
            )
          : Column(
              children: [
                if (_venues.length > 1)
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: DropdownButtonFormField<int>(
                      value: _selectedVenueId,
                      decoration: const InputDecoration(
                        labelText: 'سالن',
                        border: OutlineInputBorder(),
                      ),
                      items: _venues
                          .map((v) => DropdownMenuItem(
                                value: (v['id'] as num).toInt(),
                                child: Text(v['name']?.toString() ?? 'سالن'),
                              ))
                          .toList(),
                      onChanged: (v) {
                        setState(() => _selectedVenueId = v);
                        _loadCustomers();
                      },
                    ),
                  ),
                if (_stats != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    child: Row(
                      children: [
                        _miniStat('مشتریان', _stats?['total_customers']),
                        const SizedBox(width: AppSpacing.sm),
                        _miniStat('VIP', ((_stats?['segments'] as Map?)?['vip']) ?? 0),
                        const SizedBox(width: AppSpacing.sm),
                        _miniStat('بی‌فعال', _stats?['inactive_count']),
                      ],
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _loadCustomers(),
                    decoration: InputDecoration(
                      hintText: 'جستجوی مشتری...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                          borderRadius: AppRadius.mediumBorderRadius),
                    ),
                  ),
                ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : _error != null
                          ? Center(
                              child: Text(_error!, textAlign: TextAlign.center))
                          : _customers.isEmpty
                              ? const Center(
                                  child: Text('هنوز مشتری‌ای ثبت نشده'))
                              : RefreshIndicator(
                                  onRefresh: _loadCustomers,
                                  child: ListView.builder(
                                    padding:
                                        const EdgeInsets.all(AppSpacing.lg),
                                    itemCount: _customers.length,
                                    itemBuilder: (context, index) =>
                                        _buildCustomerCard(
                                            context, _customers[index]),
                                  ),
                                ),
                ),
              ],
            ),
    );
  }

  Widget _miniStat(String label, dynamic value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.blue.withOpacity(0.06),
          borderRadius: AppRadius.mediumBorderRadius,
        ),
        child: Column(
          children: [
            Text(FaFormat.faNum((value as num?)?.toInt() ?? 0),
                style: AppTypography.h6.copyWith(fontWeight: FontWeight.w800)),
            Text(label, style: AppTypography.caption),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerCard(BuildContext context, Map<String, dynamic> customer) {
    final name = customer['full_name']?.toString() ?? 'مشتری';
    final phone = customer['phone']?.toString() ?? '';
    final isVip = customer['is_vip'] == true;
    final segment = customer['segment']?.toString();
    final bookings = (customer['bookings_count'] as num?)?.toInt() ?? 0;

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
          CircleAvatar(
              radius: 25,
              backgroundColor: AppColors.blue.withOpacity(0.1),
              child: Text(
                  name.isNotEmpty ? name.substring(0, 1) : '؟',
                  style: AppTypography.bodyMedium
                      .copyWith(color: AppColors.blue, fontWeight: FontWeight.w700))),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: AppTypography.bodyMedium
                        .copyWith(fontWeight: FontWeight.w700)),
                if (phone.isNotEmpty) Text(phone, style: AppTypography.caption),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${FaFormat.faNum(bookings)} رزرو',
                  style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600, color: AppColors.blue)),
              if (isVip)
                const Text('VIP',
                    style: TextStyle(
                        color: AppColors.amber,
                        fontSize: 12,
                        fontWeight: FontWeight.w700))
              else if (segment != null && segment.isNotEmpty)
                Text(_segments[segment] ?? segment,
                    style: AppTypography.caption.copyWith(
                        color:
                            Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
