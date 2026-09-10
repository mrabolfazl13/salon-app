import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../providers/admin_provider.dart';

/// Pending venues list with approve action.
class AdminVenuesPage extends ConsumerStatefulWidget {
  const AdminVenuesPage({super.key});

  @override
  ConsumerState<AdminVenuesPage> createState() => _AdminVenuesPageState();
}

class _AdminVenuesPageState extends ConsumerState<AdminVenuesPage> {
  List<Map<String, dynamic>> _venues = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final venues = await ref.read(adminServiceProvider).getPendingVenues();
      if (!mounted) return;
      setState(() {
        _venues = venues;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _approve(int venueId) async {
    try {
      await ref.read(adminServiceProvider).verifyVenue(venueId);
      if (!mounted) return;
      AppSnack.success(context, 'سالن تایید شد ✅');
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سالن‌های در انتظار تایید')),
      body: _loading
          ? const SingleChildScrollView(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: ListTileSkeleton(count: 3, height: 80),
            )
          : _venues.isEmpty
              ? const EmptyState(
                  emoji: '✅',
                  title: 'سالنی در انتظار تایید نیست',
                  description: 'همه سالن‌ها بررسی شده‌اند.',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    itemCount: _venues.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (context, index) {
                      final venue = _venues[index];
                      final id = (venue['id'] as num?)?.toInt() ?? 0;
                      return ListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppRadius.image),
                          side: BorderSide(
                            color: Theme.of(context).dividerColor,
                          ),
                        ),
                        tileColor: Theme.of(context).cardTheme.color,
                        leading: const Icon(Icons.stadium_outlined,
                            color: AppColors.warningDeep),
                        title: Text(
                          '${venue['name'] ?? 'سالن'}',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        subtitle: Text(
                          '${venue['address'] ?? ''}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: FilledButton(
                          onPressed: () => _approve(id),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.success,
                            minimumSize: const Size(70, 38),
                          ),
                          child: const Text(
                            'تایید',
                            style: TextStyle(
                              fontFamily: 'Vazirmatn',
                              fontSize: 12,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
