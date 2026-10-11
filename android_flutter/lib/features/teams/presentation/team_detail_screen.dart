import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/team_service.dart';
import '../../../core/utils/fa_format.dart';

class TeamDetailScreen extends ConsumerStatefulWidget {
  final String teamId;

  const TeamDetailScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamDetailScreen> createState() => _TeamDetailScreenState();
}

class _TeamDetailScreenState extends ConsumerState<TeamDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _team;
  List<dynamic> _members = [];

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
        TeamService.getTeam(widget.teamId),
        TeamService.getMembers(widget.teamId),
      ]);
      if (!mounted) return;
      setState(() {
        _team = results[0] as Map<String, dynamic>;
        _members = results[1] as List<dynamic>;
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
    final team = _team;
    final name = (team?['name'] ?? 'تیم').toString();
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 150,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.navy, AppColors.blue])),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.groups, size: 48, color: Colors.white),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        name,
                        style: AppTypography.h6.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: _loading
                  ? const Center(
                      child: Padding(
                      padding: EdgeInsets.all(48),
                      child: CircularProgressIndicator(),
                    ))
                  : _error != null
                      ? Column(
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: AppSpacing.md),
                            ElevatedButton(
                                onPressed: _load, child: const Text('تلاش مجدد')),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if ((team?['description'] ?? '')
                                .toString()
                                .isNotEmpty) ...[
                              Text((team!['description']).toString(),
                                  style: AppTypography.bodyMedium
                                      .copyWith(height: 1.7)),
                              const SizedBox(height: AppSpacing.lg),
                            ],
                            _buildStatsCard(context),
                            const SizedBox(height: AppSpacing.md),
                            _buildMembersCard(context),
                            const SizedBox(height: AppSpacing.lg),
                          ],
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard(BuildContext context) {
    final memberCount = ( _team?['member_count'] as num?) ?? _members.length;
    final quota = (_team?['quota'] as num?) ?? 0;
    final isOfficial = _team?['is_official'] == true;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('اطلاعات تیم', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('عضو', FaFormat.faNum(memberCount)),
              _buildStatItem('ظرفیت', FaFormat.faNum(quota)),
              _buildStatItem(
                'وضعیت',
                isOfficial ? 'رسمی' : 'عادی',
                color: isOfficial ? AppColors.success : AppColors.darkTextSecondary,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              const Icon(Icons.sports_soccer, size: 14, color: AppColors.blue),
              const SizedBox(width: AppSpacing.xs),
              Text('کاپیتان: ${_team?['captain_name'] ?? '—'}',
                  style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, {Color? color}) {
    return Column(
      children: [
        Text(value, style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700, color: color)),
        const SizedBox(height: AppSpacing.xs),
        Text(label, style: AppTypography.caption),
      ],
    );
  }

  Widget _buildMembersCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('اعضای تیم', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          const Divider(height: AppSpacing.xl),
          if (_members.isEmpty)
            Text('عضوی ثبت نشده است',
                style: AppTypography.bodyMedium
                    .copyWith(color: AppColors.darkTextSecondary))
          else
            ..._members.map((m) {
              final member = m as Map<String, dynamic>;
              final name = (member['full_name'] ??
                      member['user_name'] ??
                      member['name'] ??
                      'عضو')
                  .toString();
              final role = (member['role'] ?? '').toString();
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppColors.blue.withOpacity(0.1),
                      child: const Icon(Icons.person, size: 20, color: AppColors.blue),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(child: Text(name, style: AppTypography.bodyMedium)),
                    if (role.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.blue.withOpacity(0.1),
                          borderRadius: AppRadius.chipBorderRadius,
                        ),
                        child: Text(
                          role == 'captain' ? 'کاپیتان' : role,
                          style: AppTypography.caption
                              .copyWith(color: AppColors.blue),
                        ),
                      ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
