import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/team_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class TeamDiscoverScreen extends ConsumerStatefulWidget {
  const TeamDiscoverScreen({super.key});

  @override
  ConsumerState<TeamDiscoverScreen> createState() => _TeamDiscoverScreenState();
}

class _TeamDiscoverScreenState extends ConsumerState<TeamDiscoverScreen> {
  final _searchController = TextEditingController();
  bool _loading = true;
  String? _error;
  List<dynamic> _teams = [];
  final Set<String> _requesting = {};

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
      final teams = await TeamService.discoverTeams(search: _searchController.text);
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

  Future<void> _requestJoin(Map<String, dynamic> team) async {
    final teamId = team['id'].toString();
    setState(() => _requesting.add(teamId));
    try {
      await TeamService.requestJoin(teamId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('درخواست عضویت در «${team['name']}» ثبت شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _requesting.remove(teamId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('یافتن تیم')),
      bottomNavigationBar: const AppBottomNavBar(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _load(),
              decoration: InputDecoration(
                hintText: 'جستجوی تیم...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkSurface
                    : Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: AppRadius.buttonBorderRadius,
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
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
                        ? const Center(child: Text('تیمی یافت نشد'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(AppSpacing.lg),
                              itemCount: _teams.length,
                              itemBuilder: (context, index) => _buildTeamCard(
                                context,
                                _teams[index] as Map<String, dynamic>,
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamCard(BuildContext context, Map<String, dynamic> team) {
    final teamId = team['id'].toString();
    final memberCount = (team['member_count'] as num?) ?? 0;
    final quota = (team['quota'] as num?) ?? 0;
    final description = (team['description'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.navy, AppColors.blue]),
                  borderRadius: AppRadius.imageBorderRadius,
                ),
                child: const Icon(Icons.groups, color: Colors.white),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text((team['name'] ?? '').toString(),
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w700)),
                    Text('${FaFormat.faNum(memberCount)} از ${FaFormat.faNum(quota)} عضو • کاپیتان: ${team['captain_name'] ?? '—'}',
                        style: AppTypography.caption),
                  ],
                ),
              ),
            ],
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(description,
                style: AppTypography.caption
                    .copyWith(color: AppColors.darkTextSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: AppSpacing.md),
          AppButton(
            text: _requesting.contains(teamId) ? 'در حال ثبت...' : 'درخواست عضویت',
            onPressed: _requesting.contains(teamId) ? null : () => _requestJoin(team),
            outlined: true,
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
