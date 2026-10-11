import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/manager_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

class ManagerTeamsScreen extends ConsumerStatefulWidget {
  const ManagerTeamsScreen({super.key});

  @override
  ConsumerState<ManagerTeamsScreen> createState() => _ManagerTeamsScreenState();
}

class _ManagerTeamsScreenState extends ConsumerState<ManagerTeamsScreen> {
  List<dynamic> _teams = [];
  bool _loading = true;
  String? _error;

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
      final teams = await ManagerService.getManagerTeams();
      if (!mounted) return;
      setState(() {
        _teams = teams;
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
      appBar: AppBar(title: const Text('تیم‌های همکار')),
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
              : _teams.isEmpty
                  ? const Center(
                      child: Text('تیمی در سالن‌های شما فعالیت ندارد'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        itemCount: _teams.length,
                        itemBuilder: (context, index) =>
                            _buildTeamCard(context, _teams[index]),
                      ),
                    ),
    );
  }

  Widget _buildTeamCard(BuildContext context, Map<String, dynamic> team) {
    final members = (team['member_count'] as num?)?.toInt() ??
        (team['members_count'] as num?)?.toInt() ??
        0;
    final totalBookings =
        (team['total_bookings_at_my_venues'] as num?)?.toInt() ?? 0;
    final upcoming =
        (team['upcoming_bookings_at_my_venues'] as num?)?.toInt() ?? 0;
    final spent = (team['spent_at_my_venues'] as num?)?.toInt() ?? 0;
    final lastBooking = team['last_booking_date']?.toString();
    final captain = team['captain_name']?.toString();

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
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor: AppColors.blue.withOpacity(0.1),
                child: const Icon(Icons.groups, color: AppColors.blue),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(team['name']?.toString() ?? 'تیم',
                              style: AppTypography.bodyMedium
                                  .copyWith(fontWeight: FontWeight.w700)),
                        ),
                        if (team['is_official'] == true)
                          const Icon(Icons.verified,
                              size: 16, color: AppColors.success),
                      ],
                    ),
                    Text('${FaFormat.faNum(members)} عضو',
                        style: AppTypography.caption),
                    if (captain != null && captain.isNotEmpty)
                      Text('کاپیتان: $captain',
                          style: AppTypography.caption.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.6))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${FaFormat.faNum(totalBookings)} رزرو در سالن شما',
                  style: AppTypography.caption),
              if (upcoming > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: AppRadius.chipBorderRadius,
                  ),
                  child: Text('${FaFormat.faNum(upcoming)} پیش‌رو',
                      style: AppTypography.caption.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('مجموع خرید: ${FaFormat.toman(spent)}',
                  style: AppTypography.caption
                      .copyWith(color: AppColors.amber, fontWeight: FontWeight.w600)),
              if (lastBooking != null)
                Text('آخرین: ${JalaliDate.formatIsoDate(lastBooking)}',
                    style: AppTypography.caption.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.5))),
            ],
          ),
        ],
      ),
    );
  }
}
