import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/team_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class TeamsScreen extends ConsumerStatefulWidget {
  const TeamsScreen({super.key});

  @override
  ConsumerState<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends ConsumerState<TeamsScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _teams = [];

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
      final teams = await TeamService.getMyTeams();
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
      bottomNavigationBar: const AppBottomNavBar(),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('تیم‌های من', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
            actions: [
              IconButton(icon: const Icon(Icons.search), onPressed: () => context.push('/teams/discover')),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: _loading
                ? const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()))
                : _error != null
                    ? SliverFillRemaining(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: AppSpacing.md),
                            ElevatedButton(
                                onPressed: _load, child: const Text('تلاش مجدد')),
                          ],
                        ),
                      )
                    : _teams.isEmpty
                        ? SliverFillRemaining(
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.groups_outlined,
                                    size: 64,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withOpacity(0.3),
                                  ),
                                  const SizedBox(height: AppSpacing.md),
                                  Text(
                                    'هنوز تیمی ندارید',
                                    style: AppTypography.h6.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  ElevatedButton(
                                    onPressed: () => context.push('/teams/discover'),
                                    child: const Text('کشف تیم‌ها'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildTeamCard(
                                context,
                                _teams[index] as Map<String, dynamic>,
                              ),
                              childCount: _teams.length,
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamCard(BuildContext context, Map<String, dynamic> team) {
    final memberCount = (team['member_count'] as num?) ?? 0;
    final isOfficial = team['is_official'] == true;
    return InkWell(
      onTap: () => context.push('/teams/${team['id']}'),
      borderRadius: AppRadius.cardBorderRadius,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
          borderRadius: AppRadius.cardBorderRadius,
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                borderRadius: AppRadius.imageBorderRadius,
              ),
              child: const Icon(Icons.groups, color: Colors.white, size: 28),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          (team['name'] ?? '').toString(),
                          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isOfficial) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.verified, size: 16, color: AppColors.blue),
                      ],
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '${FaFormat.faNum(memberCount)} عضو از ${FaFormat.faNum((team['quota'] as num?) ?? 0)}',
                    style: AppTypography.caption,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}
